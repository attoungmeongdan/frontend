import { axiosInstance } from "@/apis/axiosInstance";
import type { CommonResponse } from "@/types/api";
import type {
  MeasurementAnalysis,
  MeasurementHistory,
  MeasurementProgress,
  MeasurementResults,
} from "@/types/exercise";

/** 오늘 측정이 어디까지 진행됐는지 */
export async function getMeasurementProgress() {
  const { data } = await axiosInstance.get<CommonResponse<MeasurementProgress>>(
    "/api/v1/exercise-sessions/measurement/progress",
  );

  return data.data;
}

/** 누적 측정 기록 */
export async function getMeasurementHistory() {
  const { data } = await axiosInstance.get<CommonResponse<MeasurementHistory>>(
    "/api/v1/exercise-records/measurement-history",
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
