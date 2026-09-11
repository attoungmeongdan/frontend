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

export interface DailyRecord {
  /** YYYY-MM-DD */
  date: string;
  /** 그날 완료한 서로 다른 운동 종류 수 (0~4) */
  exerciseCount: number;
}

/** GET /api/v1/calendars */
export interface MonthlyCalendarResponse {
  year: number;
  month: number;
  /** 실행률 분모. 당월이면 오늘까지, 과거·미래 월이면 그 달 전체 일수 */
  totalTargetDays: number;
  completedDays: number;
  achievementRate: number;
  /** 조회 대상 날짜를 모두 담는다. 운동 안 한 날은 exerciseCount 가 0 */
  dailyRecords: DailyRecord[];
}

export async function getMonthlyCalendar(year: number, month: number) {
  const { data } = await axiosInstance.get<CommonResponse<MonthlyCalendarResponse>>(
    "/api/v1/calendars",
    { params: { year, month } },
  );

  return data.data;
}
