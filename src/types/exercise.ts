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

export interface MeasurementExerciseValue {
  value: number;
  unit: "COUNT" | "SECOND";
}

export interface MeasurementRecord {
  measurementGroupId: string;
  measuredAt: string;
  totalScore: number;
  exercises: Partial<Record<ApiExerciseType, MeasurementExerciseValue>>;
}

export interface MeasurementHistory {
  today: MeasurementRecord | null;
  previousMeasurements: MeasurementRecord[];
}

/** 동연령대 평균 대비 서버 비교 코드 */
export type WorkoutComparison = "LOW" | "SIMILAR" | "HIGH";

/** 자유 운동(WORKOUT) 완료 세션의 결과·동연령대 평균 분석 */
export interface WorkoutAnalysis {
  sessionId: number;
  exerciseType: ApiExerciseType;
  measuredAt: string;
  measuredValue: number;
  /** 비교 기준 평균. 없으면 null 이며 0 으로 대체하지 않는다 */
  averageValue: number | null;
  unit: "COUNT" | "SECOND";
  achievementRate: number | null;
  comparison: WorkoutComparison | null;
  comparisonMessage: string | null;
}
