import { axiosInstance } from "@/apis/axiosInstance";
import type { CommonResponse } from "@/types/api";
import type {
  MeasurementAnalysis,
  MeasurementHistory,
  MeasurementInsight,
  MeasurementResults,
  WorkoutAnalysis,
} from "@/types/exercise";

export { getMeasurementProgress } from "@/apis/exerciseSessions";

/** 누적 측정 기록 */
export async function getMeasurementHistory() {
  const { data } = await axiosInstance.get<CommonResponse<MeasurementHistory>>(
    "/api/v1/exercise-records/measurement-history",
  );

  return data.data;
}

/** 자유 운동(WORKOUT) 완료 세션 결과·동연령대 평균 분석 */
export async function getWorkoutAnalysis(sessionId: string) {
  const { data } = await axiosInstance.get<CommonResponse<WorkoutAnalysis>>(
    `/api/v1/exercise-records/workouts/${sessionId}/analysis`,
  );

  return data.data;
}

/** 측정 그룹의 종합 분석(동연령대 비교·종합점수·백분위·운동 수행력) */
export async function getMeasurementAnalysis(measurementGroupId: string) {
  const { data } = await axiosInstance.get<CommonResponse<MeasurementAnalysis>>(
    `/api/v1/exercise-records/measurements/${measurementGroupId}/analysis`,
  );

  return data.data;
}

/** 측정 그룹의 원 측정값만 조회. 평균·비교·백분위는 포함하지 않는다 */
export async function getMeasurementResults(measurementGroupId: string) {
  const { data } = await axiosInstance.get<CommonResponse<MeasurementResults>>(
    `/api/v1/exercise-records/measurements/${measurementGroupId}/results`,
  );

  return data.data;
}

/**
 * 측정 그룹의 맞춤 추천 운동 생성. 그룹당 한 번만 만들고 다시 부르면 저장된 결과를 준다.
 * 409 는 측정 미완료 또는 생성 중, 400 은 프로필 나이·성별 누락, 502 는 AI 생성 실패
 */
export async function createMeasurementInsights(measurementGroupId: string) {
  const { data } = await axiosInstance.post<CommonResponse<MeasurementInsight>>(
    `/api/v1/exercise-records/measurements/${measurementGroupId}/insights`,
  );

  return data.data;
}

/** 측정 그룹에 저장된 맞춤 추천 운동. 아직 생성되지 않았으면 404 */
export async function getMeasurementInsights(measurementGroupId: string) {
  const { data } = await axiosInstance.get<CommonResponse<MeasurementInsight>>(
    `/api/v1/exercise-records/measurements/${measurementGroupId}/insights`,
  );

  return data.data;
}
