import { axiosInstance } from "@/apis/axiosInstance";
import type { CommonResponse } from "@/types/api";
import type { MeasurementHistory, MeasurementInsight, MeasurementProgress } from "@/types/exercise";

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

/** 측정 그룹에 저장된 맞춤 추천 운동. 생성은 측정 완료 흐름에서 하므로 여기서는 읽기만 한다 */
export async function getMeasurementInsights(measurementGroupId: string) {
  const { data } = await axiosInstance.get<CommonResponse<MeasurementInsight>>(
    `/api/v1/exercise-records/measurements/${measurementGroupId}/insights`,
  );

  return data.data;
}
