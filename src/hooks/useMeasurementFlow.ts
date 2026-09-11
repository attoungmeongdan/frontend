import { useCallback, useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useLocation } from "react-router-dom";
import {
  createWorkoutSession,
  getMeasurementProgress,
  restartMeasurementSession,
  resumeMeasurementSession,
} from "@/apis/exerciseSessions";
import type { ExerciseSessionResult, MeasurementProgress } from "@/types/exercise";
import {
  getMeasurementPosition,
  MEASUREMENT_ORDER,
  MEASUREMENT_PROGRESS_KEY,
} from "@/utils/measurementProgress";
import { withMinimumDuration } from "@/utils/minimumDuration";

export type MeasurementPhase =
  "loading" | "load-error" | "intro" | "guide" | "pose-waiting" | "measuring" | "complete";

export function useMeasurementFlow() {
  const queryClient = useQueryClient();
  const location = useLocation();
  const restartGroupRef = useRef<string | null>(
    (location.state as { restartGroupId?: string } | null)?.restartGroupId ?? null,
  );
  const generationRef = useRef(0);
  const verifiedRef = useRef<MeasurementProgress | null>(null);
  const [phase, setPhase] = useState<MeasurementPhase>("loading");
  const [stepIndex, setStepIndex] = useState(0);
  const [groupId, setGroupId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const cacheProgress = useCallback(
    (progress: MeasurementProgress) => {
      queryClient.setQueryData(MEASUREMENT_PROGRESS_KEY, progress);
    },
    [queryClient],
  );

  const applyProgress = useCallback(
    (progress: MeasurementProgress) => {
      const position = getMeasurementPosition(progress);
      cacheProgress(progress);
      setGroupId(progress.measurementGroupId);
      setStepIndex(position.stepIndex);
      setPhase(
        position.state === "complete" ? "complete" : position.state === "new" ? "intro" : "guide",
      );
    },
    [cacheProgress],
  );

  const load = useCallback(async () => {
    const generation = ++generationRef.current;
    setPhase("loading");
    setError(null);
    try {
      const progress = await withMinimumDuration(getMeasurementProgress);
      if (generation !== generationRef.current) return;
      cacheProgress(progress);
      // A restart intent survives refresh in this history entry, but never applies to another group.
      if (
        !progress.completed &&
        restartGroupRef.current &&
        restartGroupRef.current === progress.measurementGroupId
      ) {
        setStepIndex(0);
        setGroupId(progress.measurementGroupId);
        setPhase("intro");
      } else {
        restartGroupRef.current = null;
        applyProgress(progress);
      }
    } catch (cause) {
      if (generation !== generationRef.current) return;
      setError(cause instanceof Error ? cause.message : "측정 진행 상태를 불러오지 못했어요.");
      setPhase("load-error");
    }
  }, [applyProgress, cacheProgress]);

  useEffect(() => {
    void load();
    return () => {
      generationRef.current += 1;
    };
  }, [load]);

  const createSession = useCallback(async () => {
    const generation = generationRef.current;
    const progress = await getMeasurementProgress();
    if (generation !== generationRef.current) throw new Error("측정 화면을 벗어났어요.");
    cacheProgress(progress);
    if (progress.completed) {
      applyProgress(progress);
      throw new Error("오늘 측정이 이미 완료됐어요.");
    }
    const restarting =
      restartGroupRef.current !== null && restartGroupRef.current === progress.measurementGroupId;
    if (!restarting) {
      const position = getMeasurementPosition(progress);
      if (position.stepIndex !== stepIndex) {
        applyProgress(progress);
        throw new Error("저장된 진행 상태가 변경됐어요. 안내를 다시 확인해 주세요.");
      }
    }
    // Both endpoints create a session/ticket immediately. Call only after start-pose detection.
    const session = restarting
      ? await restartMeasurementSession()
      : progress.measurementGroupId
        ? await resumeMeasurementSession()
        : await createWorkoutSession(MEASUREMENT_ORDER[stepIndex], undefined, "MEASUREMENT");
    if (generation !== generationRef.current) return session;
    restartGroupRef.current = null;
    const currentProgress: MeasurementProgress = {
      measurementGroupId: session.measurementGroupId,
      completedExercises: restarting ? [] : progress.completedExercises,
      nextExerciseType: session.exerciseType,
      completed: false,
    };
    cacheProgress(currentProgress);
    setGroupId(session.measurementGroupId);
    void queryClient.invalidateQueries({ queryKey: MEASUREMENT_PROGRESS_KEY });
    if (
      session.mode !== "MEASUREMENT" ||
      session.exerciseType !== MEASUREMENT_ORDER[stepIndex] ||
      !session.measurementGroupId
    ) {
      throw new Error("서버가 다른 종목의 세션을 반환했어요. 진행 상태를 다시 확인해 주세요.");
    }
    return session;
  }, [applyProgress, cacheProgress, queryClient, stepIndex]);

  const verifyCompletion = useCallback(
    async (result: ExerciseSessionResult) => {
      const generation = generationRef.current;
      if (
        result.mode !== "MEASUREMENT" ||
        result.exerciseType !== MEASUREMENT_ORDER[stepIndex] ||
        !result.measurementGroupId
      ) {
        throw new Error("현재 종목의 저장 결과가 아니에요.");
      }
      const progress = await getMeasurementProgress();
      if (generation !== generationRef.current) return;
      cacheProgress(progress);
      if (
        progress.measurementGroupId !== result.measurementGroupId ||
        !progress.completedExercises.includes(result.exerciseType)
      ) {
        throw new Error("현재 종목의 저장을 확인하지 못했어요. 저장 확인을 다시 시도해 주세요.");
      }
      getMeasurementPosition(progress);
      verifiedRef.current = progress;
    },
    [cacheProgress, stepIndex],
  );

  const onCompleted = useCallback(() => {
    const progress = verifiedRef.current;
    if (!progress) return;
    verifiedRef.current = null;
    applyProgress(progress);
    void queryClient.invalidateQueries({ queryKey: ["measurement-history"] });
  }, [applyProgress, queryClient]);

  return {
    phase,
    setPhase,
    stepIndex,
    groupId,
    error,
    load,
    createSession,
    verifyCompletion,
    onCompleted,
  };
}
