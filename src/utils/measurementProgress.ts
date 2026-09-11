import type { MeasurementProgress } from "@/types/exercise";

export const MEASUREMENT_PROGRESS_KEY = ["measurement-progress"] as const;
export const MEASUREMENT_ORDER = ["CHAIR_STAND", "PUSH_UP", "SIT_UP", "PLANK"] as const;

/** Only persisted, consecutive results establish a resume point. Never silently reorder exercises. */
export function getMeasurementPosition(progress: MeasurementProgress) {
  const saved = new Set(progress.completedExercises);
  const index = MEASUREMENT_ORDER.findIndex((type) => !saved.has(type));
  if (index === -1) {
    if (!progress.completed || !progress.measurementGroupId) {
      throw new Error("측정 완료 상태를 확인하지 못했어요. 진행 상태를 다시 확인해 주세요.");
    }
    return { state: "complete" as const, stepIndex: 3 };
  }
  if (progress.completed || saved.size !== index || (index > 0 && !progress.measurementGroupId)) {
    throw new Error("저장된 측정 순서가 올바르지 않아요. 진행 상태를 다시 확인해 주세요.");
  }
  if (progress.nextExerciseType !== MEASUREMENT_ORDER[index]) {
    throw new Error(
      "서버의 측정 순서가 안내 순서와 달라요. 측정 순서 업데이트 후 다시 시도해 주세요.",
    );
  }
  return { state: index === 0 ? ("new" as const) : ("resume" as const), stepIndex: index };
}
