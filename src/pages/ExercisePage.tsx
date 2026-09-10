import { useCallback } from "react";
import { LoaderCircle, Play, RefreshCw } from "lucide-react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import CameraStage, { type CameraWarning } from "@/components/exercise/CameraStage";
import CameraStatusScreen from "@/components/exercise/CameraStatusScreen";
import PoseCameraFeed from "@/components/exercise/PoseCameraFeed";
import Button from "@/components/ui/Button";
import { EXERCISES, type Exercise, type ExerciseType } from "@/constants/exercises";
import { usePoseCamera } from "@/hooks/usePoseCamera";
import { useWorkoutSession } from "@/hooks/useWorkoutSession";

function formatElapsedTime(milliseconds: number) {
  const totalSeconds = Math.floor(milliseconds / 1_000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function ExerciseSessionPage({ exercise }: { exercise: Exercise }) {
  const navigate = useNavigate();
  const handleCompleted = useCallback(
    (sessionId: number) => {
      navigate(`/exercise/${exercise.type}/complete?sessionId=${sessionId}`, { replace: true });
    },
    [exercise.type, navigate],
  );
  const workout = useWorkoutSession({
    exerciseType: exercise.type,
    onCompleted: handleCompleted,
  });
  const camera = usePoseCamera({ onPoseFrame: workout.sendPoseFrame });

  const moveHome = () => {
    workout.cancel();
    camera.stop();
    navigate("/");
  };

  const isCameraReady =
    camera.state === "normal" || camera.state === "no-body" || camera.state === "bad-pose";

  const serverFeedback = workout.analysis?.feedback.find(
    (feedback) => feedback.severity === "WARNING" || feedback.severity === "ERROR",
  );
  const warning: CameraWarning | undefined =
    camera.state === "no-body"
      ? "no-body"
      : serverFeedback || workout.connectionError
        ? "bad-pose"
        : undefined;
  const displayValue =
    camera.state === "no-body"
      ? "—"
      : exercise.type === "plank"
        ? formatElapsedTime(workout.analysis?.validDurationMs ?? 0)
        : String(workout.analysis?.validCount ?? 0);

  let overlay;
  if (camera.state !== "normal" && camera.state !== "no-body" && camera.state !== "bad-pose") {
    overlay = (
      <div className="absolute inset-0 z-70">
        <CameraStatusScreen state={camera.state} onPrimary={camera.start} onHome={moveHome} />
      </div>
    );
  } else if (workout.connectionState === "idle") {
    overlay = (
      <div className="absolute inset-x-0 bottom-[max(2.25rem,env(safe-area-inset-bottom))] z-30 flex justify-center landscape:bottom-[max(1.25rem,env(safe-area-inset-bottom))]">
        <Button type="button" onClick={workout.start} leadingIcon={Play} className="w-60">
          운동 판정 시작
        </Button>
      </div>
    );
  } else if (workout.connectionState === "connecting") {
    overlay = (
      <div className="bg-camera-overlay absolute inset-0 z-30 flex items-center justify-center px-6">
        <p
          role="status"
          className="rounded-pill text-body text-brand-teal-strong flex items-center gap-2 bg-white px-5 py-3 font-semibold"
        >
          <LoaderCircle size={20} className="motion-safe:animate-spin" aria-hidden />
          운동 판정을 연결하고 있어요…
        </p>
      </div>
    );
  } else if (workout.connectionState === "completing") {
    overlay = (
      <div className="bg-camera-overlay absolute inset-0 z-30 flex items-center justify-center px-6">
        <p
          role="status"
          className="rounded-pill text-body text-brand-teal-strong flex items-center gap-2 bg-white px-5 py-3 font-semibold"
        >
          <LoaderCircle size={20} className="motion-safe:animate-spin" aria-hidden />
          기록을 저장하고 있어요…
        </p>
      </div>
    );
  } else if (workout.connectionState === "error") {
    overlay = (
      <div className="bg-camera-overlay absolute inset-0 z-30 flex items-center justify-center px-6">
        <div
          role="alert"
          className="rounded-card flex max-w-84 flex-col gap-4 bg-white p-5 text-center"
        >
          <p className="text-body text-text-primary break-keep">
            {workout.connectionError ?? "운동 판정을 이어갈 수 없어요."}
          </p>
          <Button type="button" onClick={workout.retry} leadingIcon={RefreshCw}>
            {workout.retryLabel}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <CameraStage
      exerciseName={exercise.label}
      value={displayValue}
      valueKind={exercise.type === "plank" ? "timer" : "count"}
      subInfo={
        workout.connectionState === "active"
          ? (serverFeedback?.message ?? workout.connectionError ?? undefined)
          : workout.connectionState === "idle"
            ? "카메라 확인 후 판정을 시작해 주세요"
            : undefined
      }
      warning={warning}
      cameraFeed={<PoseCameraFeed videoRef={camera.videoRef} canvasRef={camera.canvasRef} />}
      overlay={overlay}
      cancelDisabled={!isCameraReady || workout.connectionState === "completing"}
      onCancel={moveHome}
      onEnd={isCameraReady && workout.connectionState === "active" ? workout.complete : undefined}
    >
      {import.meta.env.DEV && (
        <output className="bg-camera-scrim text-caption absolute right-2 bottom-2 z-20 rounded-sm px-2 py-1 text-white/80">
          camera:{camera.diagnostics.cameraReady ? "ok" : "wait"} · model:
          {camera.diagnostics.modelReady ? "ok" : "wait"} · joints:
          {camera.diagnostics.landmarkCount} · infer:{camera.diagnostics.inferenceFps}fps · ws:
          {workout.connectionState} · send:{workout.diagnostics.sentFrames}/
          {workout.diagnostics.transmissionFps}fps · recv:
          {workout.diagnostics.lastReceivedAt
            ? new Date(workout.diagnostics.lastReceivedAt).toLocaleTimeString()
            : "-"}
          {` · sid:${workout.diagnostics.sessionId ?? "-"} · path:${workout.diagnostics.webSocketPath ?? "-"} · ticket-len:${workout.socketTicketLength} · close:${workout.diagnostics.socketCloseCode ?? "-"}${workout.diagnostics.socketCloseReason ? `(${workout.diagnostics.socketCloseReason})` : ""}`}
        </output>
      )}
    </CameraStage>
  );
}

// 운동 수행 화면. 종목은 URL 파라미터로 갈린다.
function ExercisePage() {
  const { type } = useParams<{ type: ExerciseType }>();
  const exercise = EXERCISES.find((item) => item.type === type);

  if (!exercise) return <Navigate to="/not-found" replace />;
  return <ExerciseSessionPage exercise={exercise} />;
}

export default ExercisePage;
