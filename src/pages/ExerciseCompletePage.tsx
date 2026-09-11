import { useEffect, useState } from "react";
import { isAxiosError } from "axios";
import { ClipboardX, LoaderCircle, TriangleAlert } from "lucide-react";
import { Navigate, useNavigate, useParams, useSearchParams } from "react-router-dom";
import turtleCheer from "@/assets/mascots/turtle-cheer.webp";
import ExerciseResultCard from "@/components/result/ExerciseResultCard";
import Button from "@/components/ui/Button";
import MascotSpeech from "@/components/ui/MascotSpeech";
import { EXERCISES } from "@/constants/exercises";
import {
  MEASUREMENT_RESULT_EXERCISES,
  RESULT_VALUE_UNIT,
  type MeasurementResultExercise,
} from "@/constants/result";
import { useWorkoutAnalysis } from "@/hooks/useExerciseComplete";
import {
  EXERCISE_COMPLETE_RETRY_DELAY_MS,
  getExerciseCompleteMock,
  readExerciseCompleteMockState,
  type ExerciseCompleteMockState,
} from "@/mocks/exerciseComplete";
import type { ApiExerciseType } from "@/types/exercise";
import type { ResultComparison } from "@/types/result";
import { formatDurationClock, toResultComparison } from "@/utils/result";

const CALENDAR_GUIDE_MESSAGE = "오늘도 몸을 움직여 주셨네요.\n캘린더에 기록을 보러 갈까요?";

// 400(나이/성별 없음)·403(다른 사용자 세션)·404(세션 없음)·409(WORKOUT 완료 세션 아님)는
// 재시도해도 같은 결과라 "결과 없음"으로 보여준다. 그 외(네트워크·5xx)만 재시도를 안내한다.
const NO_RESULT_STATUSES = new Set([400, 403, 404, 409]);

function isNoResultError(error: unknown) {
  return isAxiosError(error) && NO_RESULT_STATUSES.has(error.response?.status ?? 0);
}

function findResultExercise(apiType: ApiExerciseType): MeasurementResultExercise | undefined {
  const type = EXERCISES.find((exercise) => exercise.apiType === apiType)?.type;
  return MEASUREMENT_RESULT_EXERCISES.find((exercise) => exercise.type === type);
}

function ExerciseCompleteLoading() {
  return (
    <div className="flex flex-col gap-6 pt-2.5 pb-3">
      <div aria-hidden className="bg-surface-subtle rounded-card h-56 motion-safe:animate-pulse" />
      <p
        role="status"
        className="text-body text-brand-teal-strong flex items-center justify-center gap-2"
      >
        <LoaderCircle size={20} aria-hidden className="shrink-0 motion-safe:animate-spin" />
        운동 결과를 불러오고 있어요…
      </p>
    </div>
  );
}

function ExerciseCompleteMessage({
  variant,
  onAction,
}: {
  variant: "error" | "empty";
  onAction: () => void;
}) {
  const isError = variant === "error";
  const Icon = isError ? TriangleAlert : ClipboardX;

  return (
    <div className="flex min-h-full flex-col items-center justify-center gap-4 px-3 py-6 text-center">
      <div role={isError ? "alert" : "status"} className="flex flex-col items-center gap-4">
        <Icon size={56} aria-hidden className="text-brand-teal-strong shrink-0" />
        <h2 className="text-title font-bold">
          {isError ? "운동 결과를 불러오지 못했어요" : "운동 결과가 없어요"}
        </h2>
        <p className="text-body text-text-secondary break-keep">
          {isError ? "잠시 후 다시 시도해 주세요." : "홈에서 자유 운동을 시작해 보세요."}
        </p>
      </div>
      <Button type="button" className="w-full" onClick={onAction}>
        {isError ? "다시 불러오기" : "홈으로 돌아가기"}
      </Button>
    </div>
  );
}

function ExerciseCompleteResult({
  exercise,
  value,
  average,
  comparison,
  onNavigateCalendar,
}: {
  exercise: MeasurementResultExercise;
  value: number;
  average: number | null;
  comparison?: ResultComparison;
  onNavigateCalendar: () => void;
}) {
  const formatValue = (v: number) =>
    exercise.valueKind === "time" ? formatDurationClock(v) : String(v);
  const averageLabel =
    average === null
      ? undefined
      : `동연령대 평균 ${formatValue(average)}${exercise.valueKind === "count" ? "회" : ""}`;

  return (
    <div className="flex flex-col gap-6 pt-2.5 pb-3 break-keep">
      <ExerciseResultCard
        variant="complete"
        name={exercise.name}
        value={formatValue(value)}
        unit={RESULT_VALUE_UNIT[exercise.valueKind]}
        averageLabel={averageLabel}
        comparison={comparison}
      />
      <MascotSpeech
        mascot={turtleCheer}
        message={CALENDAR_GUIDE_MESSAGE}
        action={
          <Button type="button" onClick={onNavigateCalendar}>
            캘린더 보기
          </Button>
        }
      />
    </div>
  );
}

function ExerciseCompletePage() {
  const { type } = useParams<{ type: string }>();
  const [searchParams] = useSearchParams();
  const exercise = MEASUREMENT_RESULT_EXERCISES.find((item) => item.type === type);

  if (!exercise) return <Navigate to="/not-found" replace />;

  const stateParam = searchParams.get("state");

  // QA용 ?state= 가 있을 때만 목데이터를 쓰고, 없으면 실제 API로 조회한다.
  if (stateParam !== null) {
    const mockState = readExerciseCompleteMockState(stateParam);

    // 종목·목 상태 변경 시 진행 중인 재시도를 초기화한다 (#11과 동일한 흐름)
    return (
      <ExerciseCompleteMockView
        key={`${type}:${mockState}`}
        exercise={exercise}
        mockState={mockState}
      />
    );
  }

  const sessionId = searchParams.get("sessionId");

  return <ExerciseCompleteApiView key={`${type}:${sessionId}`} sessionId={sessionId} />;
}

function ExerciseCompleteMockView({
  exercise,
  mockState,
}: {
  exercise: MeasurementResultExercise;
  mockState: ExerciseCompleteMockState;
}) {
  const navigate = useNavigate();
  const [retryPhase, setRetryPhase] = useState<"idle" | "loading" | "done">("idle");

  useEffect(() => {
    if (retryPhase !== "loading") return;
    const timer = window.setTimeout(() => setRetryPhase("done"), EXERCISE_COMPLETE_RETRY_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [retryPhase]);

  if (mockState === "loading" || retryPhase === "loading") {
    return <ExerciseCompleteLoading />;
  }

  const isError = mockState === "error" && retryPhase === "idle";
  const result = getExerciseCompleteMock(
    exercise.type,
    retryPhase === "done" ? "default" : mockState,
  );

  if (isError || !result) {
    return (
      <ExerciseCompleteMessage
        variant={isError ? "error" : "empty"}
        onAction={isError ? () => setRetryPhase("loading") : () => navigate("/")}
      />
    );
  }

  return (
    <ExerciseCompleteResult
      exercise={exercise}
      value={result.value}
      average={result.average}
      comparison={result.comparison ?? undefined}
      onNavigateCalendar={() => navigate("/calendar")}
    />
  );
}

function ExerciseCompleteApiView({ sessionId }: { sessionId: string | null }) {
  const navigate = useNavigate();
  const { data, error, isLoading, isError, refetch } = useWorkoutAnalysis(sessionId);

  if (sessionId === null) {
    return <ExerciseCompleteMessage variant="empty" onAction={() => navigate("/")} />;
  }

  if (isLoading) return <ExerciseCompleteLoading />;

  if (isError) {
    const variant = isNoResultError(error) ? "empty" : "error";
    return (
      <ExerciseCompleteMessage
        variant={variant}
        onAction={variant === "error" ? () => void refetch() : () => navigate("/")}
      />
    );
  }

  const resultExercise = data && findResultExercise(data.exerciseType);

  if (!data || !resultExercise) {
    return <ExerciseCompleteMessage variant="empty" onAction={() => navigate("/")} />;
  }

  return (
    <ExerciseCompleteResult
      exercise={resultExercise}
      value={data.measuredValue}
      average={data.averageValue}
      comparison={toResultComparison(data.comparison)}
      onNavigateCalendar={() => navigate("/calendar")}
    />
  );
}

export default ExerciseCompletePage;
