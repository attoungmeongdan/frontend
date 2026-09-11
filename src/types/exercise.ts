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

/** 측정 결과 기반 AI 추천 운동 한 건. 서버가 이모지까지 정해서 준다 */
export interface AiInsight {
  emoji: string;
  exerciseName: string;
  description: string;
}

/** 측정 그룹에 저장된 맞춤 추천. 그룹당 한 번 생성되며 insights 는 3개다 */
export interface MeasurementInsight {
  measurementGroupId: string;
  insights: AiInsight[];
  generatedAt: string;
}
