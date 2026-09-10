export type ExerciseCameraState =
  | "loading"
  | "normal"
  | "no-body"
  | "bad-pose"
  | "permission-request"
  | "permission-denied"
  | "camera-unavailable"
  | "camera-busy"
  | "model-error"
  | "disconnected";

export type ExerciseApiType = "CHAIR_STAND" | "SIT_UP" | "PUSH_UP" | "PLANK";

export interface PoseLandmarkPayload {
  index: number;
  x: number;
  y: number;
  z: number;
  visibility: number;
  presence: number;
}

export interface ExerciseSessionCreateResponse {
  sessionId: number;
  mode: "MEASUREMENT" | "WORKOUT";
  measurementGroupId: string | null;
  exerciseType: ExerciseApiType;
  measurementType: "REPETITION" | "VALID_DURATION";
  timeLimitSeconds: number;
  cameraOrientation: string;
  calibrationSeconds: number;
  transmissionFps: number;
  webSocketPath: string;
  socketTicket: string;
  ruleVersion: string;
}

export interface ExerciseFeedback {
  code: string;
  severity: "INFO" | "WARNING" | "ERROR" | string;
  message: string;
}

export interface ExerciseAnalysisResult {
  type: "ANALYSIS_RESULT" | "SESSION_COMPLETED";
  sessionId: number;
  sequence: number;
  phase: string;
  validCount: number;
  invalidCount: number;
  remainingTimeMs: number;
  validDurationMs: number;
  metrics: Record<string, number>;
  feedback: ExerciseFeedback[];
}

export interface ExerciseSocketError {
  type: "ERROR";
  code: string;
  message: string;
}

export interface ExerciseSessionResult {
  sessionId: number;
  mode: "MEASUREMENT" | "WORKOUT";
  measurementGroupId: string | null;
  exerciseType: ExerciseApiType;
  status: "CREATED" | "MEASURING" | "COMPLETED" | "CANCELLED" | "EXPIRED";
  evaluationStandard: "KSPO" | "FITPLE";
  validCount: number;
  invalidCount: number;
  validDurationMs: number;
  timeLimitSeconds: number;
  ruleVersion: string;
  measurementStartedAt: string | null;
  completedAt: string | null;
}

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
