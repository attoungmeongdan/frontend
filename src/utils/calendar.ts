import { MASCOT_MESSAGES } from "@/constants/calendar";
import type { DayCell, MonthlyActivity } from "@/types/calendar";

const DAYS_IN_WEEK = 7;

/** 해당 월의 마지막 날짜 */
function getLastDate(year: number, month: number) {
  return new Date(year, month, 0).getDate();
}

/** 해당 월 1일의 요일. 0=일 */
function getFirstWeekday(year: number, month: number) {
  return new Date(year, month - 1, 1).getDay();
}

/** 날짜별 기록을 빠르게 찾기 위한 표 */
function toRecordByDay({ exercisedDays }: MonthlyActivity) {
  return new Map(exercisedDays.map((record) => [record.day, record]));
}

/**
 * 당월 달력 그리드를 주 단위로 만든다.
 * 앞뒤 빈 칸은 date 가 null 이며, 전월·익월 날짜는 표시하지 않는다.
 */
export function buildMonthGrid(activity: MonthlyActivity): DayCell[][] {
  const { year, month, today, joinedDay } = activity;
  const lastDate = getLastDate(year, month);
  const leadingBlanks = getFirstWeekday(year, month);
  const recordByDay = toRecordByDay(activity);
  const weekCount = Math.ceil((leadingBlanks + lastDate) / DAYS_IN_WEEK);

  return Array.from({ length: weekCount }, (_, week) =>
    Array.from({ length: DAYS_IN_WEEK }, (_, weekday): DayCell => {
      const date = week * DAYS_IN_WEEK + weekday - leadingBlanks + 1;
      const isInMonth = date >= 1 && date <= lastDate;
      const isBeforeJoin = isInMonth && joinedDay !== null && date < joinedDay;
      // 가입 전 날짜는 기록이 있어도 그리지 않는다
      const record = isInMonth && !isBeforeJoin ? recordByDay.get(date) : undefined;
      const exerciseCount = record?.count ?? 0;

      return {
        date: isInMonth ? date : null,
        isToday: isInMonth && date === today,
        isFuture: isInMonth && today !== null && date > today,
        isBeforeJoin,
        exerciseCount,
        measurementGroupId: record?.measurementGroupId ?? null,
      };
    }),
  );
}

/** 어제·오늘 운동 여부 조합에 맞는 마스코트 멘트 */
export function selectMascotMessage({ today, exercisedDays }: MonthlyActivity): string {
  // 지난달은 어제·오늘 조합을 따질 수 없다
  if (today === null) return MASCOT_MESSAGES.pastMonth;
  if (today === 1) return MASCOT_MESSAGES.monthStart;

  const exercised = new Set(exercisedDays.filter(({ count }) => count > 0).map(({ day }) => day));
  const didToday = exercised.has(today);
  const didYesterday = exercised.has(today - 1);

  if (didYesterday && didToday) return MASCOT_MESSAGES.both;
  if (didYesterday) return MASCOT_MESSAGES.yesterdayOnly;
  if (didToday) return MASCOT_MESSAGES.todayOnly;
  return MASCOT_MESSAGES.neither;
}

/** Keep the viewed month in the URL so history navigation and reload restore it. */
export function readCalendarMonth(
  params: URLSearchParams,
  today: { year: number; month: number },
  joinedAt: { year: number; month: number } | null,
) {
  const yearText = params.get("year") ?? "";
  const monthText = params.get("month") ?? "";
  const year = Number(yearText);
  const month = Number(monthText);
  const valid =
    /^\d{4}$/.test(yearText) &&
    /^\d{1,2}$/.test(monthText) &&
    year >= 1000 &&
    month >= 1 &&
    month <= 12;
  const requested = valid ? { year, month } : today;
  const index = (value: { year: number; month: number }) => value.year * 12 + value.month;
  if (index(requested) > index(today)) return today;
  if (joinedAt && index(requested) < index(joinedAt)) return joinedAt;
  return requested;
}
