import { useCallback, useEffect, useRef } from "react";
import { LoaderCircle, RefreshCw } from "lucide-react";
import { useBlocker, useNavigate } from "react-router-dom";
import turtleGuide from "@/assets/mascots/turtle-guide.png";
import CameraStage, { type CameraWarning } from "@/components/exercise/CameraStage";
import CameraStatusScreen from "@/components/exercise/CameraStatusScreen";
import PoseCameraFeed from "@/components/exercise/PoseCameraFeed";
import StartPoseGuide from "@/components/exercise/StartPoseGuide";
import Button from "@/components/ui/Button";
import MascotModal from "@/components/ui/MascotModal";
import { MEASURE_STEPS } from "@/constants/measure";
import { useMeasurementFlow } from "@/hooks/useMeasurementFlow";
import turtleComplete from "@/assets/mascots/turtle-today-complete.png";
import { usePoseCamera } from "@/hooks/usePoseCamera";
import { useStartPoseDetection } from "@/hooks/useStartPoseDetection";
import { useWorkoutSession } from "@/hooks/useWorkoutSession";
import type { ExerciseCameraState, PoseLandmarkPayload } from "@/types/exercise";

const INTRO_BODY = "의자 앉았다 일어나기, 윗몸일으키기,\n팔굽혀펴기, 플랭크\n총 4단계로 진행돼요!";
const formatTime = (ms: number) => {
  const seconds = Math.max(0, Math.ceil(ms / 1000));
  return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
};
function MeasurePage() {
  const navigate = useNavigate();
  const flow = useMeasurementFlow();
  const { phase, setPhase, stepIndex, groupId } = flow;
  const navigatingRef = useRef(false);
  const step = MEASURE_STEPS[stepIndex];
  const session = useWorkoutSession({
    exerciseType: step.exercise,
    mode: "MEASUREMENT",
    createSession: flow.createSession,
    verifyCompletion: flow.verifyCompletion,
    minimumPendingMs: 500,
    onCompleted: flow.onCompleted,
  });
  const startSession = session.start;
  const sendPoseFrame = session.sendPoseFrame;
  const handleStartPoseDetected = useCallback(() => {
    setPhase("measuring");
    void startSession();
  }, [setPhase, startSession]);
  const startPose = useStartPoseDetection({
    exerciseType: step?.exercise ?? "chair-stand",
    enabled: phase === "pose-waiting" && session.connectionState === "idle",
    onDetected: handleStartPoseDetected,
  });
  const observeStartPose = startPose.observe;
  const handlePoseFrame = useCallback(
    (landmarks: PoseLandmarkPayload[]) => {
      observeStartPose(landmarks);
      sendPoseFrame(landmarks);
    },
    [observeStartPose, sendPoseFrame],
  );
  const camera = usePoseCamera({ onPoseFrame: handlePoseFrame });
  const startCamera = camera.start;
  const stopCamera = camera.stop;
  const cameraReady =
    camera.state === "normal" || camera.state === "no-body" || camera.state === "bad-pose";
  const shouldStartCamera = phase !== "loading" && phase !== "load-error" && phase !== "complete";
  const busy =
    phase === "loading" ||
    session.connectionState === "connecting" ||
    session.connectionState === "completing";
  const analysisPath = groupId ? `/measurements/${groupId}/analysis` : null;
  const blocker = useBlocker(({ nextLocation }) =>
    phase === "complete" ? nextLocation.pathname !== analysisPath : busy,
  );
  useEffect(() => {
    if (blocker.state === "blocked") blocker.reset();
  }, [blocker]);
  const moveToAnalysis = () => {
    if (!analysisPath || navigatingRef.current) return;
    navigatingRef.current = true;
    navigate(analysisPath, { replace: true });
  };

  useEffect(() => {
    if (!shouldStartCamera) return;
    void startCamera();
    return stopCamera;
  }, [shouldStartCamera, startCamera, stopCamera]);

  const moveHome = () => {
    if (busy || phase === "complete" || navigatingRef.current) return;
    navigatingRef.current = true;
    session.cancel();
    camera.stop();
    navigate("/");
  };
  const retrySession = () => {
    if (session.shouldReacquireStartPose) setPhase("pose-waiting");
    session.retry();
  };
  if (phase === "loading" || phase === "load-error")
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 px-6 text-center">
        {phase === "loading" ? (
          <p role="status" className="flex items-center gap-2">
            <LoaderCircle className="animate-spin" />
            측정 준비 중이에요…
          </p>
        ) : (
          <>
            <p role="alert">{flow.error}</p>
            <Button onClick={() => void flow.load()}>진행 상태 다시 확인</Button>
            <Button variant="secondary" onClick={moveHome}>
              홈으로 돌아가기
            </Button>
          </>
        )}
      </div>
    );

  const feedback = session.analysis?.feedback.find((item) => item.severity !== "INFO");
  const warning: CameraWarning | undefined =
    phase !== "measuring" || session.connectionState !== "active"
      ? undefined
      : camera.state === "no-body"
        ? "no-body"
        : feedback
          ? "bad-pose"
          : undefined;
  const value = cameraReady
    ? phase !== "measuring" || session.connectionState === "idle"
      ? "—"
      : step.valueKind === "timer"
        ? formatTime(session.analysis?.validDurationMs ?? 0)
        : String(session.analysis?.validCount ?? 0)
    : "—";
  let overlay = null;
  if (phase === "complete" || phase === "intro" || phase === "guide") overlay = null;
  else if (!cameraReady)
    overlay = (
      <div className="absolute inset-0 z-70">
        <CameraStatusScreen
          state={camera.state as Exclude<ExerciseCameraState, "normal" | "no-body" | "bad-pose">}
          onPrimary={camera.start}
          onHome={moveHome}
        />
      </div>
    );
  else if (phase === "pose-waiting" && session.connectionState === "idle")
    overlay = <StartPoseGuide exerciseType={step.exercise} isMatching={startPose.isMatching} />;
  else if (session.connectionState === "connecting" || session.connectionState === "completing")
    overlay = (
      <div className="bg-camera-overlay absolute inset-0 z-30 flex items-center justify-center">
        <p
          role="status"
          className="rounded-pill text-brand-teal-strong flex items-center gap-2 bg-white px-5 py-3 font-semibold"
        >
          <LoaderCircle size={20} className="animate-spin" />
          {session.connectionState === "connecting"
            ? "측정을 연결하고 있어요…"
            : "기록을 저장하고 있어요…"}
        </p>
      </div>
    );
  else if (session.connectionState === "error")
    overlay = (
      <div className="bg-camera-overlay absolute inset-0 z-30 flex items-center justify-center px-6">
        <div className="rounded-card flex max-w-84 flex-col gap-4 bg-white p-5 text-center">
          <p role="alert">{session.connectionError}</p>
          <Button type="button" onClick={retrySession} leadingIcon={RefreshCw}>
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
            ? session.analysis.remainingTimeMs < 0
              ? "시간제한 없음"
              : `남은 시간 ${formatTime(session.analysis.remainingTimeMs)}`
            : feedback?.message
        }
        warning={warning}
        cameraFeed={<PoseCameraFeed videoRef={camera.videoRef} canvasRef={camera.canvasRef} />}
        overlay={overlay}
        cancelDisabled={busy || phase === "complete"}
        onCancel={moveHome}
      >
        {import.meta.env.DEV && (
          <output className="bg-camera-scrim text-caption absolute right-2 bottom-2 z-20 rounded-sm px-2 py-1 text-white/80">
            start:{startPose.isMatching ? "match" : "wait"} · ws:{session.connectionState} · phase:
            {session.analysis?.phase ?? "-"} · send:{session.diagnostics.sentFrames}/
            {session.diagnostics.transmissionFps}fps · sid:{session.diagnostics.sessionId ?? "-"}
          </output>
        )}
      </CameraStage>
      {phase === "intro" && (
        <MascotModal
          mascot={turtleGuide}
          title="같이 운동 수행 능력을 측정해볼까요?"
          body={INTRO_BODY}
          primaryAction={{
            label: "알겠어요",
            onClick: () => setPhase((current) => (current === "intro" ? "guide" : current)),
          }}
          cameraLayout
        />
      )}
      {phase === "guide" && (
        <MascotModal
          key={step.exercise}
          mascot={step.mascot}
          title={step.name}
          body={`${step.readyBody}\n${stepIndex === 0 ? "30초 동안 측정해요." : step.flow === "timed" ? "1분 동안 측정해요." : "시간제한 없이 자세를 유지해요. 자세가 무너지면 측정이 끝나요."}`}
          primaryAction={{
            label: "준비됐어요",
            onClick: () => setPhase((current) => (current === "guide" ? "pose-waiting" : current)),
          }}
          cameraLayout
        />
      )}
      {phase === "complete" && (
        <MascotModal
          mascot={turtleComplete}
          title="모든 측정을 마쳤어요!"
          body={"네 종목의 기록이 모두 저장됐어요.\n측정 분석을 확인해 볼까요?"}
          primaryAction={{ label: "측정 분석 보기", onClick: moveToAnalysis }}
          cameraLayout
        />
      )}
    </>
  );
}
export default MeasurePage;
