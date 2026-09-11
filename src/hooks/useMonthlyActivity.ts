import { useQuery } from "@tanstack/react-query";
import { getMonthlyCalendar, type MonthlyCalendarResponse } from "@/apis/calendar";
import type { CalendarStatus, MonthlyActivity, MonthlyRate } from "@/types/calendar";
import { getSeoulToday } from "@/utils/date";

/** "2026-09-03" → 3 */
function toDayOfMonth(date: string) {
  return Number(date.slice(8, 10));
}

function toMonthlyActivity(response: MonthlyCalendarResponse): MonthlyActivity {
  const seoulToday = getSeoulToday();
  const isCurrentMonth = response.year === seoulToday.year && response.month === seoulToday.month;

  return {
    year: response.year,
    month: response.month,
    // 서버는 오늘 날짜를 주지 않는다. 보고 있는 달이 이번 달일 때만 KST 기준으로 채운다
    today: isCurrentMonth ? seoulToday.date : null,
    totalTargetDays: response.totalTargetDays,
    // 응답은 운동 안 한 날(0)도 모두 담고 있어 실제 수행한 날만 남긴다
    exercisedDays: response.dailyRecords
      .filter((record) => record.exerciseCount > 0)
      .map((record) => ({
        day: toDayOfMonth(record.date),
        count: record.exerciseCount,
        // TODO: 응답에 측정 id 가 없어 항상 null 이다.
        //       달력의 측정 표시와 분석 화면 이동은 서버가 내려줘야 붙일 수 있다.
        measurementId: null,
      })),
  };
}

/** 실행률은 서버가 계산해 준 값을 그대로 쓴다 */
function toMonthlyRate(response: MonthlyCalendarResponse): MonthlyRate {
  return {
    totalTargetDays: response.totalTargetDays,
    exercisedCount: response.completedDays,
    percent: response.achievementRate,
  };
}

export function useMonthlyActivity(year: number, month: number) {
  const { data, isPending, isError, refetch } = useQuery({
    queryKey: ["calendar", year, month],
    queryFn: () => getMonthlyCalendar(year, month),
    // 오늘 운동하면 바로 반영돼야 해서 캐시를 남기지 않는다
    staleTime: 0,
  });

  const status: CalendarStatus = isPending ? "loading" : isError ? "error" : "success";

  return {
    status,
    activity: data ? toMonthlyActivity(data) : null,
    rate: data ? toMonthlyRate(data) : null,
    retry: refetch,
  };
}
