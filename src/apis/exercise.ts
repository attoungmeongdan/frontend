import { axiosInstance } from "@/apis/axiosInstance";
import type { CommonResponse } from "@/types/api";
import type { MeasurementHistory, MeasurementProgress } from "@/types/exercise";

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
