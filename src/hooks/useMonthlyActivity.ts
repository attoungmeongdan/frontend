import { useQuery } from "@tanstack/react-query";
import { getMonthlyCalendar, type MonthlyCalendarResponse } from "@/apis/calendar";
import type { CalendarStatus, MonthlyActivity, MonthlyRate } from "@/types/calendar";
import { getSeoulToday, type SeoulDate } from "@/utils/date";

/** "2026-09-03" → 3 */
function toDayOfMonth(date: string) {
  return Number(date.slice(8, 10));
}

function isSameMonth(a: { year: number; month: number }, b: { year: number; month: number }) {
  return a.year === b.year && a.month === b.month;
}

function toMonthlyActivity(
  response: MonthlyCalendarResponse,
  joinedAt: SeoulDate | null,
): MonthlyActivity {
  const seoulToday = getSeoulToday();

  return {
    year: response.year,
    month: response.month,
    // 서버는 오늘 날짜를 주지 않는다. 보고 있는 달이 이번 달일 때만 KST 기준으로 채운다
    today: isSameMonth(response, seoulToday) ? seoulToday.date : null,
    // 가입한 달을 볼 때만 가입일을 넣어 그 전날까지 가린다
    joinedDay: joinedAt && isSameMonth(response, joinedAt) ? joinedAt.date : null,
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

/** @param joinedAt 가입일(KST). 모르면 null 을 넘기면 전체 기록을 그대로 보여 준다 */
export function useMonthlyActivity(year: number, month: number, joinedAt: SeoulDate | null) {
  const { data, isPending, isError, refetch } = useQuery({
    queryKey: ["calendar", year, month],
    queryFn: () => getMonthlyCalendar(year, month),
    // 오늘 운동하면 바로 반영돼야 해서 캐시를 남기지 않는다
    staleTime: 0,
  });

  const status: CalendarStatus = isPending ? "loading" : isError ? "error" : "success";

  return {
    status,
    activity: data ? toMonthlyActivity(data, joinedAt) : null,
    rate: data ? toMonthlyRate(data) : null,
    retry: refetch,
  };
}
