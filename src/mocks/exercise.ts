import type { ExerciseSessionMock } from "@/types/exercise";

// Issue #9 퍼블리싱 전용 목 상태다. 실제 카메라·판정·저장 API 계약과 무관하다.
export const DEFAULT_EXERCISE_SESSION_MOCK: ExerciseSessionMock = {
  state: "normal",
  count: 12,
  elapsedSeconds: 84,
};

export const EXERCISE_CAMERA_STATES: ExerciseSessionMock["state"][] = [
  "loading",
  "normal",
  "no-body",
  "bad-pose",
  "permission-request",
  "permission-denied",
  "camera-unavailable",
  "camera-busy",
  "disconnected",
];

export function isExerciseCameraState(value: string | null): value is ExerciseSessionMock["state"] {
  return EXERCISE_CAMERA_STATES.some((state) => state === value);
}
