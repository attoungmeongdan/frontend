import { useCallback, useEffect, useState } from "react";
import { LoaderCircle, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import turtleGuide from "@/assets/mascots/turtle-guide.png";
import CameraStage, { type CameraWarning } from "@/components/exercise/CameraStage";
import CameraStatusScreen from "@/components/exercise/CameraStatusScreen";
import PoseCameraFeed from "@/components/exercise/PoseCameraFeed";
import Button from "@/components/ui/Button";
import MascotModal from "@/components/ui/MascotModal";
import { getMeasurementProgress, resumeMeasurementSession } from "@/apis/exerciseSessions";
import { EXERCISES, type ExerciseType } from "@/constants/exercises";
import { MEASURE_STEPS } from "@/constants/measure";
import { usePoseCamera } from "@/hooks/usePoseCamera";
import { useWorkoutSession } from "@/hooks/useWorkoutSession";
import type { ApiExerciseType, ExerciseCameraState } from "@/types/exercise";

const INTRO_BODY = "의자 앉았다 일어나기, 윗몸일으키기,\n팔굽혀펴기, 플랭크\n총 4단계로 진행돼요!";
const formatTime = (ms: number) => {
  const seconds = Math.max(0, Math.ceil(ms / 1000));
  return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
};
const toExercise = (type: ApiExerciseType): ExerciseType =>
  EXERCISES.find((item) => item.apiType === type)?.type ?? "chair-stand";

function MeasurePage() {
  const navigate = useNavigate();
  const [stepIndex, setStepIndex] = useState(0);
  const [phase, setPhase] = useState<"loading" | "intro" | "ready" | "measuring">("loading");
  const [groupId, setGroupId] = useState<string | null>(null);
  const [resume, setResume] = useState(false);
  const step = MEASURE_STEPS[stepIndex];
  const handleCompleted = useCallback(
    (_: number, nextGroupId?: string | null) => {
      setGroupId(nextGroupId ?? null);
      setResume(false);
      if (stepIndex === MEASURE_STEPS.length - 1 && nextGroupId)
        navigate(`/measurements/${nextGroupId}/analysis`, { replace: true });
      else {
        setStepIndex((index) => index + 1);
        setPhase("ready");
      }
    },
    [navigate, stepIndex],
  );
  const session = useWorkoutSession({
    exerciseType: step?.exercise ?? "chair-stand",
    mode: "MEASUREMENT",
    measurementGroupId: groupId,
    createSession: resume ? resumeMeasurementSession : undefined,
    onCompleted: handleCompleted,
  });
  const camera = usePoseCamera({ onPoseFrame: session.sendPoseFrame });
  const cameraReady =
    camera.state === "normal" || camera.state === "no-body" || camera.state === "bad-pose";

  useEffect(() => {
    let cancelled = false;
    void getMeasurementProgress()
      .then((value) => {
        if (cancelled) return;
        setGroupId(value.measurementGroupId);
        if (value.completed && value.measurementGroupId) {
          navigate(`/measurements/${value.measurementGroupId}/analysis`, { replace: true });
          return;
        }
        const index = MEASURE_STEPS.findIndex(
          (item) => item.exercise === toExercise(value.nextExerciseType),
        );
        setStepIndex(index >= 0 ? index : 0);
        setResume(value.completedExercises.length > 0);
        setPhase(value.completedExercises.length ? "ready" : "intro");
      })
      .catch(() => setPhase("intro"));
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  const moveHome = () => {
    session.cancel();
    camera.stop();
    navigate("/");
  };
  const startStep = () => {
    setPhase("measuring");
    void camera.start();
    void session.start();
  };
  if (phase === "loading" || !step)
    return (
      <div className="flex h-full items-center justify-center">
        <LoaderCircle className="animate-spin" />
      </div>
    );

  const feedback = session.analysis?.feedback.find((item) => item.severity !== "INFO");
  const warning: CameraWarning | undefined =
    camera.state === "no-body" ? "no-body" : feedback ? "bad-pose" : undefined;
  const value = cameraReady
    ? step.valueKind === "timer"
      ? formatTime(session.analysis?.validDurationMs ?? 0)
      : String(session.analysis?.validCount ?? 0)
    : "—";
  let overlay = null;
  if (!cameraReady)
    overlay = (
      <div className="absolute inset-0 z-70">
        <CameraStatusScreen
          state={camera.state as Exclude<ExerciseCameraState, "normal" | "no-body" | "bad-pose">}
          onPrimary={camera.start}
          onHome={moveHome}
        />
      </div>
    );
  else if (session.connectionState === "connecting" || session.connectionState === "completing")
    overlay = (
      <div className="bg-camera-overlay absolute inset-0 z-30 flex items-center justify-center">
        <p
          role="status"
          className="rounded-pill text-brand-teal-strong flex items-center gap-2 bg-white px-5 py-3 font-semibold"
        >
          <LoaderCircle size={20} className="animate-spin" />
          기록을 저장하고 있어요…
        </p>
      </div>
    );
  else if (session.connectionState === "error")
    overlay = (
      <div className="bg-camera-overlay absolute inset-0 z-30 flex items-center justify-center px-6">
        <div className="rounded-card flex max-w-84 flex-col gap-4 bg-white p-5 text-center">
          <p role="alert">{session.connectionError}</p>
          <Button type="button" onClick={session.retry} leadingIcon={RefreshCw}>
            {session.retryLabel}
          </Button>
        </div>
      </div>
    );

  return (
    <>
      <CameraStage
        exerciseName={step.name}
        stageLabel={`체력 측정 ${stepIndex + 1}/${MEASURE_STEPS.length} · ${step.name}`}
        value={value}
        valueKind={step.valueKind}
        subInfo={
          session.analysis && step.flow === "timed"
            ? `남은 시간 ${formatTime(session.analysis.remainingTimeMs)}`
            : feedback?.message
        }
        warning={warning}
        cameraFeed={<PoseCameraFeed videoRef={camera.videoRef} canvasRef={camera.canvasRef} />}
        overlay={overlay}
        cancelDisabled={session.connectionState === "completing"}
        onCancel={moveHome}
      />
      {phase === "intro" && (
        <MascotModal
          mascot={turtleGuide}
          title="같이 운동 수행 능력을 측정해볼까요?"
          body={INTRO_BODY}
          primaryAction={{ label: "알겠어요", onClick: () => setPhase("ready") }}
          cameraLayout
        />
      )}
      {phase === "ready" && (
        <MascotModal
          key={step.exercise}
          mascot={step.mascot}
          title={`${stepIndex + 1}단계 · ${step.name}`}
          body={step.readyBody}
          primaryAction={{ label: "준비됐어요", onClick: startStep }}
          cameraLayout
        />
      )}
    </>
  );
}
export default MeasurePage;
