import { MASCOT_MESSAGES } from "@/constants/calendar";
import type { DayCell, MonthlyActivity, MonthlyRate } from "@/types/calendar";

const DAYS_IN_WEEK = 7;

/** 해당 월의 마지막 날짜 */
function getLastDate(year: number, month: number) {
  return new Date(year, month, 0).getDate();
}

/** 해당 월 1일의 요일. 0=일 */
function getFirstWeekday(year: number, month: number) {
  return new Date(year, month - 1, 1).getDay();
}

/**
 * 당월 달력 그리드를 주 단위로 만든다.
 * 앞뒤 빈 칸은 date 가 null 이며, 전월·익월 날짜는 표시하지 않는다.
 */
export function buildMonthGrid({
  year,
  month,
  today,
  exercisedDays,
}: MonthlyActivity): DayCell[][] {
  const lastDate = getLastDate(year, month);
  const leadingBlanks = getFirstWeekday(year, month);
  const exercised = new Set(exercisedDays);
  const weekCount = Math.ceil((leadingBlanks + lastDate) / DAYS_IN_WEEK);

  return Array.from({ length: weekCount }, (_, week) =>
    Array.from({ length: DAYS_IN_WEEK }, (_, weekday): DayCell => {
      const date = week * DAYS_IN_WEEK + weekday - leadingBlanks + 1;
      const isInMonth = date >= 1 && date <= lastDate;

      return {
        date: isInMonth ? date : null,
        isToday: isInMonth && date === today,
        isExercised: isInMonth && exercised.has(date),
        isFuture: isInMonth && date > today,
      };
    }),
  );
}

/** 이번 달 운동 실행률. 미래 날짜는 분모에서 제외하고, 1일에는 산출하지 않는다 */
export function calculateMonthlyRate({ today, exercisedDays }: MonthlyActivity): MonthlyRate {
  const exercisedCount = exercisedDays.filter((day) => day <= today).length;
  const isMonthStart = today === 1;

  return {
    elapsedDays: today,
    exercisedCount,
    percent: isMonthStart ? null : Math.round((exercisedCount / today) * 100),
  };
}

/** 어제·오늘 운동 여부 조합에 맞는 마스코트 멘트 */
export function selectMascotMessage({ today, exercisedDays }: MonthlyActivity): string {
  if (today === 1) return MASCOT_MESSAGES.monthStart;

  const exercised = new Set(exercisedDays);
  const didToday = exercised.has(today);
  const didYesterday = exercised.has(today - 1);

  if (didYesterday && didToday) return MASCOT_MESSAGES.both;
  if (didYesterday) return MASCOT_MESSAGES.yesterdayOnly;
  if (didToday) return MASCOT_MESSAGES.todayOnly;
  return MASCOT_MESSAGES.neither;
}
