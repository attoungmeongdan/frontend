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

/** 동연령대 평균 대비 비교 등급. 프론트에서 계산하지 않고 서버 값을 그대로 쓴다 */
export type ComparisonLevel = "LOW" | "SIMILAR" | "HIGH";

export type ApiGender = "MALE" | "FEMALE";

export interface ExercisePeerComparison {
  exerciseType: ApiExerciseType;
  /** 사용자의 유효 횟수 또는 플랭크 유지 시간 */
  measuredValue: number;
  /** 사용자 성별·연령에 해당하는 운동 기준 평균 */
  averageValue: number;
  unit: "COUNT" | "SECOND";
  level: ComparisonLevel;
  message: string;
}

export interface PercentileBucket {
  minimum: number;
  maximum: number;
  count: number;
  percentage: number;
}

export interface MeasurementPercentile {
  /** 백분위·분포 제공 가능 여부. 동일 성별·연령대 비교 표본이 30건 미만이면 false */
  available: boolean;
  value: number | null;
  topPercent: number | null;
  comparisonGender: ApiGender;
  comparisonAgeGroup: string;
  sampleSize: number;
  message: string;
  userScore: number;
  userBucketIndex: number | null;
  maximumBucketCount: number | null;
  buckets: PercentileBucket[];
}

export interface PerformanceGroupComparison {
  gender: ApiGender;
  ageGroup: string;
  label: string;
  similarityRate: number;
}

/** 유사도가 가장 높은 운동 수행력 그룹. 임의로 나이를 계산하지 않고 서버가 준 그룹을 그대로 쓴다 */
export interface FitnessPerformance {
  gender: ApiGender;
  ageGroup: string;
  label: string;
  message: string;
}

export interface MeasurementAnalysis {
  measurementGroupId: string;
  exerciseComparisons: ExercisePeerComparison[];
  overallScore: number;
  percentile: MeasurementPercentile;
  performanceGroupComparisons: PerformanceGroupComparison[];
  fitnessPerformance: FitnessPerformance;
}

export interface MeasuredExercise {
  exerciseType: ApiExerciseType;
  value: number;
  unit: "COUNT" | "SECOND";
}

/** 측정값만 있고 비교·백분위는 없는 조회 결과 */
export interface MeasurementResults {
  measurementGroupId: string;
  measuredAt: string;
  exercises: MeasuredExercise[];
}
