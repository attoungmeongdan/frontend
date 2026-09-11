import { MEASURE_STEPS, getResumeStepIndex } from "@/constants/measure";
import { isExerciseCameraState } from "@/mocks/exercise";
import type { ExerciseCameraState } from "@/types/exercise";
import type { MeasurePhase } from "@/types/measure";

// Issue #10 퍼블리싱 전용 목데이터다. 실제 측정 ID·종목 식별자·저장/복원 API 계약과 무관하다.

export const MOCK_MEASUREMENT_ID = "mock-measurement";

/** 홈에서 `/measure?resume=true` 로 들어올 때 가정하는 저장 완료 단계 수(1단계까지 저장 → 2단계부터 재개) */
export const MOCK_SAVED_STEP_COUNT = 1;

export const MEASURE_VALUE_MOCK = {
  count: "18",
  remainingTime: "00:42",
  plankTime: "00:47",
};

/** 실제 자세 인식·60초 종료 대신 흐름 확인용으로 넘기는 시간. 실제 판정은 연동 이슈에서 처리한다 */
export const MOCK_PHASE_DURATION_MS: Partial<Record<MeasurePhase, number>> = {
  "pose-waiting": 3500,
  measuring: 2000,
  saving: 1200,
};

const MEASURE_PHASES: MeasurePhase[] = [
  "intro",
  "ready",
  "pose-waiting",
  "measuring",
  "saving",
  "save-error",
  "complete",
];

function isMeasurePhase(value: string | null): value is MeasurePhase {
  return MEASURE_PHASES.some((phase) => phase === value);
}

export interface MeasureMockParams {
  stepIndex: number;
  phase: MeasurePhase;
  cameraState: ExerciseCameraState;
  /** 자동 전환을 멈추고 현재 상태를 유지한다 */
  hold: boolean;
  /** 종목마다 첫 저장을 실패시켜 재시도 흐름을 확인한다 */
  failFirstSave: boolean;
}

/**
 * 상태 확인용 URL 쿼리
 * - step=1~4, phase=MeasurePhase: 해당 단계·상태로 바로 진입. 없으면 1단계 전 안내 모달부터
 * - resume: 이어서 하기 진입. step 이 있으면 그 단계부터, 없으면 목 저장 단계 수 기준으로 준비 모달부터 시작한다.
 *   재개할 기록이 없는 경우(step=1)는 처음부터 시작한다
 * - camera=ExerciseCameraState, save=error, hold=1
 */
export function readMeasureMockParams(params: URLSearchParams): MeasureMockParams {
  const stepNumber = Number(params.get("step"));
  const hasStep =
    Number.isInteger(stepNumber) && stepNumber >= 1 && stepNumber <= MEASURE_STEPS.length;
  const requestedPhase = params.get("phase");
  const requestedCamera = params.get("camera");
  const cameraState = isExerciseCameraState(requestedCamera) ? requestedCamera : "normal";
  const hold = params.get("hold") === "1";
  const failFirstSave = params.get("save") === "error";

  if (params.has("resume")) {
    const resumeStepIndex = getResumeStepIndex(hasStep ? stepNumber - 1 : MOCK_SAVED_STEP_COUNT);

    return resumeStepIndex === null
      ? { stepIndex: 0, phase: "intro", cameraState, hold, failFirstSave }
      : { stepIndex: resumeStepIndex, phase: "ready", cameraState, hold, failFirstSave };
  }

  const phase = isMeasurePhase(requestedPhase) ? requestedPhase : hasStep ? "ready" : "intro";

  return {
    // 안내 모달은 1단계 전에만 뜬다
    stepIndex: hasStep && phase !== "intro" ? stepNumber - 1 : 0,
    phase,
    cameraState,
    hold,
    failFirstSave,
  };
}
