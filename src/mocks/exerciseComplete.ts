import type { ExerciseType } from "@/constants/exercises";
import type { ResultComparison } from "@/types/result";

interface ExerciseCompleteResultMock {
  /** 횟수 종목은 회, 플랭크는 초 */
  value: number;
  average: number | null;
  comparison: ResultComparison | null;
}

// #12 퍼블리싱 전용 임의 값이며 실제 사용자 기록·국민체력100 통계가 아니다.
// 비교 상태는 직접 지정하며 계산하지 않는다. 실제 조회·저장은 #16 범위다.
export const EXERCISE_COMPLETE_MOCK: Record<ExerciseType, ExerciseCompleteResultMock> = {
  "sit-up": { value: 24, average: 18, comparison: "high" },
  "chair-stand": { value: 1, average: 10, comparison: "low" },
  "push-up": { value: 9, average: 10, comparison: "similar" },
  plank: { value: 72, average: 70, comparison: "similar" },
};

export const EXERCISE_COMPLETE_RETRY_DELAY_MS = 1200;

const EXERCISE_COMPLETE_MOCK_STATES = [
  "default",
  "loading",
  "error",
  "empty",
  "no-comparison",
] as const;

export type ExerciseCompleteMockState = (typeof EXERCISE_COMPLETE_MOCK_STATES)[number];

/** #11과 동일하게 state 쿼리가 없거나 알 수 없으면 기본 결과를 표시한다. */
export function readExerciseCompleteMockState(value: string | null): ExerciseCompleteMockState {
  return EXERCISE_COMPLETE_MOCK_STATES.find((state) => state === value) ?? "default";
}

export function getExerciseCompleteMock(type: ExerciseType, state: ExerciseCompleteMockState) {
  if (state === "empty") return null;
  const result = EXERCISE_COMPLETE_MOCK[type];
  return state === "no-comparison" ? { ...result, average: null, comparison: null } : result;
}
