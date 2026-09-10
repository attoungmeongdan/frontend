import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import turtleCelebrate from "@/assets/mascots/turtle-celebrate.png";
import turtleGuide from "@/assets/mascots/turtle-guide.png";
import CameraStage, { type CameraWarning } from "@/components/exercise/CameraStage";
import CameraStatusScreen from "@/components/exercise/CameraStatusScreen";
import MeasureSaveErrorDialog from "@/components/measure/MeasureSaveErrorDialog";
import MeasureSaving from "@/components/measure/MeasureSaving";
import MeasureStartToast from "@/components/measure/MeasureStartToast";
import MascotModal from "@/components/ui/MascotModal";
import { MEASURE_STEPS } from "@/constants/measure";
import {
  MEASURE_VALUE_MOCK,
  MOCK_MEASUREMENT_ID,
  MOCK_PHASE_DURATION_MS,
  readMeasureMockParams,
} from "@/mocks/measure";
import type { MeasurePhase } from "@/types/measure";

const INTRO_BODY = [
  "의자 앉았다 일어나기, 윗몸일으키기,",
  "팔굽혀펴기, 플랭크",
  "총 4단계로 진행이 돼요!",
  "자세가 인식되면 타이머가 자동으로 시작되니",
  "시간이 끝날 때까지 동작을 계속해주세요!",
].join("\n");

// 체력 측정 화면
// 새로 시작하면 안내 모달 → 단계 준비 → 자세 인식 대기 → 측정 → 저장 → 다음 단계 준비를 반복한다.
// 도중에 나가면 저장을 마친 단계까지만 남고, 이어서 하기는 다음 미완료 단계의 준비 모달부터 시작한다.
// 전환 시간·수치·저장 실패는 목데이터이며 실제 카메라·판정·저장/복원 API는 연동 이슈에서 붙인다.
function MeasurePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [mock] = useState(() => readMeasureMockParams(searchParams));
  const [stepIndex, setStepIndex] = useState(mock.stepIndex);
  const [phase, setPhase] = useState<MeasurePhase>(mock.phase);
  const [cameraState, setCameraState] = useState(mock.cameraState);
  const [hasSaveFailed, setHasSaveFailed] = useState(false);
  const [exitAfterSave, setExitAfterSave] = useState(false);
  // 준비 확인마다 토스트를 새로 띄우기 위한 key. 0이면 띄우지 않는다
  const [startToastKey, setStartToastKey] = useState(mock.phase === "pose-waiting" ? 1 : 0);

  const step = MEASURE_STEPS[stepIndex];
  const isLastStep = stepIndex === MEASURE_STEPS.length - 1;
  const isCameraReady =
    cameraState === "normal" || cameraState === "no-body" || cameraState === "bad-pose";

  useEffect(() => {
    const duration = MOCK_PHASE_DURATION_MS[phase];
    if (mock.hold || !isCameraReady || duration === undefined) return;

    const timeoutId = window.setTimeout(() => {
      if (phase !== "saving") {
        setPhase(phase === "pose-waiting" ? "measuring" : "saving");
        return;
      }

      if (mock.failFirstSave && !hasSaveFailed) {
        setHasSaveFailed(true);
        setPhase("save-error");
        return;
      }

      // 저장이 끝난 종목만 완료로 본다
      if (exitAfterSave) {
        navigate("/");
      } else if (isLastStep) {
        setPhase("complete");
      } else {
        setStepIndex(stepIndex + 1);
        setHasSaveFailed(false);
        setPhase("ready");
      }
    }, duration);

    return () => window.clearTimeout(timeoutId);
  }, [exitAfterSave, hasSaveFailed, isCameraReady, isLastStep, mock, navigate, phase, stepIndex]);

  const moveHome = () => navigate("/");

  if (!isCameraReady) {
    return (
      <CameraStatusScreen
        state={cameraState}
        onPrimary={() => setCameraState("normal")}
        onHome={moveHome}
      />
    );
  }

  const startStep = () => {
    setStartToastKey((key) => key + 1);
    setPhase("pose-waiting");
  };

  const warning: CameraWarning | undefined = cameraState === "normal" ? undefined : cameraState;
  const resultValue =
    step.valueKind === "timer" ? MEASURE_VALUE_MOCK.plankTime : MEASURE_VALUE_MOCK.count;
  const stageValue =
    phase === "intro" || phase === "ready" || phase === "pose-waiting" || warning === "no-body"
      ? "—"
      : resultValue;
  const subInfo =
    phase !== "measuring"
      ? undefined
      : step.flow === "timed"
        ? `남은 시간 ${MEASURE_VALUE_MOCK.remainingTime}`
        : "자세가 무너지면 자동으로 종료돼요";

  return (
    <>
      <CameraStage
        exerciseName={step.name}
        stageLabel={`체력 측정 ${stepIndex + 1}/${MEASURE_STEPS.length} · ${step.name}`}
        value={stageValue}
        valueKind={step.valueKind}
        subInfo={subInfo}
        warning={warning}
        cancelLabel="체력 측정을 중단하고 홈으로 돌아가기"
        cancelDisabled={phase === "saving"}
        onCancel={moveHome}
        overlay={
          <>
            {startToastKey > 0 && <MeasureStartToast key={startToastKey} />}
            {phase === "saving" && <MeasureSaving />}
          </>
        }
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

      {phase === "save-error" && (
        <MeasureSaveErrorDialog
          onRetry={() => setPhase("saving")}
          onSaveAndExit={() => {
            setExitAfterSave(true);
            setPhase("saving");
          }}
        />
      )}

      {phase === "complete" && (
        <MascotModal
          mascot={turtleCelebrate}
          title="정말 잘했어요!"
          body="이제 측정 결과를 같이 살펴볼까요?"
          primaryAction={{
            label: "결과 보러 가기",
            onClick: () => navigate(`/measurements/${MOCK_MEASUREMENT_ID}/analysis`),
          }}
          cameraLayout
        />
      )}
    </>
  );
}

export default MeasurePage;
