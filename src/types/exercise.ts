export type ExerciseCameraState =
  | "loading"
  | "normal"
  | "no-body"
  | "bad-pose"
  | "permission-request"
  | "permission-denied"
  | "camera-unavailable"
  | "camera-busy"
  | "disconnected";

export interface ExerciseSessionMock {
  state: ExerciseCameraState;
  count: number;
  elapsedSeconds: number;
}

/** 서버가 쓰는 운동 종목 코드 */
export type ApiExerciseType = "CHAIR_STAND" | "SIT_UP" | "PUSH_UP" | "PLANK";

export interface MeasurementProgress {
  measurementGroupId: string;
  completedExercises: ApiExerciseType[];
  nextExerciseType: ApiExerciseType;
  completed: boolean;
}

export type MeasurementHistoryKey = "chairStand" | "sitUp" | "pushUp" | "plank";

export interface MeasurementRecord {
  measurementGroupId: string;
  measuredAt: string;
  value: number;
  unit: "COUNT" | "SECOND";
}

export interface MeasurementSeries {
  /** 오늘 완료 기록이 없으면 null */
  today: MeasurementRecord | null;
  previousMeasurements: MeasurementRecord[];
}

export type MeasurementHistory = Record<MeasurementHistoryKey, MeasurementSeries>;
