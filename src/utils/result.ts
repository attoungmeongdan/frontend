import type { WorkoutComparison } from "@/types/exercise";
import type { ResultComparison } from "@/types/result";

const WORKOUT_COMPARISON_MAP: Record<WorkoutComparison, ResultComparison> = {
  LOW: "low",
  SIMILAR: "similar",
  HIGH: "high",
};

/** 서버 비교 코드(LOW/SIMILAR/HIGH)를 카드 표시용 값으로 바꾼다. 없으면 비교 정보 없음 */
export function toResultComparison(value: WorkoutComparison | null): ResultComparison | undefined {
  return value ? WORKOUT_COMPARISON_MAP[value] : undefined;
}

/** 초를 `m:ss` 로 표시한다. 예: 60 → "1:00" */
export function formatDurationClock(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

/** 초를 문장용으로 표시한다. 예: 60 → "1분", 70 → "1분 10초", 45 → "45초" */
export function formatDurationText(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  if (minutes === 0) return `${seconds}초`;
  return seconds === 0 ? `${minutes}분` : `${minutes}분 ${seconds}초`;
}
