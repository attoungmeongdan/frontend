import turtleChairStand from "@/assets/mascots/turtle-exercise-chair-stand.png";
import turtlePlank from "@/assets/mascots/turtle-exercise-plank.png";
import turtlePushUp from "@/assets/mascots/turtle-exercise-push-up.png";
import turtleSitUp from "@/assets/mascots/turtle-exercise-sit-up.png";
import { getExerciseContent } from "@/constants/exerciseContent";
import { MEASUREMENT_EXERCISES } from "@/constants/measurementOrder";
import type { ExerciseType } from "@/constants/exercises";
import type { MeasureStep } from "@/types/measure";

// 체력 측정 4단계. 순서가 곧 진행 순서다
const STEP_DETAILS: Record<ExerciseType, Omit<MeasureStep, "exercise">> = {
  "chair-stand": {
    name: getExerciseContent("chair-stand", "MEASUREMENT").name,
    flow: "timed",
    valueKind: "count",
    mascot: turtleChairStand,
    readyBody: "의자를 준비해 주세요.\n준비되시면 천천히 시작해 볼까요?",
  },
  "push-up": {
    name: "팔굽혀펴기",
    flow: "timed",
    valueKind: "count",
    mascot: turtlePushUp,
    readyBody: "이번에는 팔굽혀펴기예요.\n의자를 치우고 잠시 숨을 골라 주세요.",
  },
  "sit-up": {
    name: "윗몸일으키기",
    flow: "timed",
    valueKind: "count",
    mascot: turtleSitUp,
    readyBody: "이번에는 윗몸일으키기예요.\n다시 한 번 힘내봐요!",
  },
  plank: {
    name: "플랭크",
    flow: "plank",
    valueKind: "timer",
    mascot: turtlePlank,
    readyBody: "마지막은 플랭크예요.\n준비된 자세가 보이면 자동으로 측정이 시작돼요.",
  },
};

export const MEASURE_STEPS: MeasureStep[] = MEASUREMENT_EXERCISES.map(({ exercise }) => ({
  exercise,
  ...STEP_DETAILS[exercise],
}));

/**
 * 중단 후 재개 지점. 저장을 마친 단계 수를 받아 다음 미완료 단계의 index 를 돌려준다.
 * 1단계 저장 전(0)은 이어서 할 기록이 없어 처음부터, 4단계까지 저장(4)은 측정 완료라 재개 대상이 아니다.
 */
export function getResumeStepIndex(savedStepCount: number): number | null {
  return savedStepCount >= 1 && savedStepCount < MEASURE_STEPS.length ? savedStepCount : null;
}
