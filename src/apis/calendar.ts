import { axiosInstance } from "@/apis/axiosInstance";
import type { CommonResponse } from "@/types/api";

export interface RecentExerciseStatus {
  date: string;
  dayOfWeek: string;
  isCompleted: boolean;
}

export async function getRecentSevenDays() {
  const { data } = await axiosInstance.get<CommonResponse<RecentExerciseStatus[]>>(
    "/api/v1/calendars/recent-7days",
  );

  return data.data;
}
