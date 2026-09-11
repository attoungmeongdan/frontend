import type { CalendarStatus, DailyExercise, MonthlyActivity } from "@/types/calendar";
import { getSeoulToday } from "@/utils/date";

// API 연동 전 임시 데이터. 연동 시 이 파일을 제거하고 쿼리 훅으로 교체한다.
// 디자인 08_Calendar 의 상태별 화면을 확인하려면 CALENDAR_STATUS 값을 바꾼다.
export const CALENDAR_STATUS: CalendarStatus = "success";

/**
 * 이번 달 표본. 오늘 기준 상대 간격으로 만들어 표시 경우의 수를 모두 담는다.
 *
 * | 자유 운동 | 체력 측정 | 표시                            |
 * |----------|----------|---------------------------------|
 * | 0개      | X        | 없음                            |
 * | 0개      | O        | 없음 (측정만 한 날은 표시 안 함)  |
 * | 1~4개    | X        | 민트 원 + 흰 체크                |
 * | 1~4개    | O        | 민트 원 + 오렌지 테두리·체크      |
 */
const CURRENT_MONTH_SEEDS: { offset: number; count: number; measured: boolean }[] = [
  // 오늘 · 자유 운동 + 측정 — 오늘 표시와 측정 표시가 겹치는 경우
  { offset: 0, count: 2, measured: true },
  // 어제 · 4단계 + 측정
  { offset: 1, count: 4, measured: true },
  // 3단계, 측정 없음
  { offset: 2, count: 3, measured: false },
  // 측정만 한 날 — 게이지 없이 오렌지 점만
  { offset: 3, count: 0, measured: true },
  // 1단계 + 측정
  { offset: 4, count: 1, measured: true },
  // 2단계, 측정 없음
  { offset: 5, count: 2, measured: false },
  // 1단계, 측정 없음
  { offset: 6, count: 1, measured: false },
  // 4단계, 측정 없음
  { offset: 8, count: 4, measured: false },
];

/** 지난달 표본. 날짜를 고정해 두고 그 달 전체를 분모로 쓴다 */
const PAST_MONTH_SEEDS: { day: number; count: number; measured: boolean }[] = [
  { day: 2, count: 1, measured: false },
  { day: 5, count: 3, measured: true },
  { day: 9, count: 2, measured: false },
  { day: 14, count: 4, measured: true },
  { day: 15, count: 0, measured: true },
  { day: 21, count: 1, measured: true },
  { day: 26, count: 2, measured: false },
];

function getLastDate(year: number, month: number) {
  return new Date(year, month, 0).getDate();
}

function toDailyExercise(day: number, count: number, measured: boolean): DailyExercise {
  return {
    day,
    count,
    measurementId: measured ? `mock-measurement-${day}` : null,
  };
}

/**
 * 조회한 달의 목데이터.
 * 이번 달은 오늘 날짜(KST)에 맞춰 만들고, 지난달은 고정 표본을 쓴다.
 */
export function getCalendarMock(year: number, month: number): MonthlyActivity {
  const seoulToday = getSeoulToday();
  const isCurrentMonth = year === seoulToday.year && month === seoulToday.month;

  if (isCurrentMonth) {
    const exercisedDays = CURRENT_MONTH_SEEDS.map(({ offset, count, measured }) =>
      toDailyExercise(seoulToday.date - offset, count, measured),
    )
      .filter(({ day }) => day >= 1)
      .sort((a, b) => a.day - b.day);

    return {
      year,
      month,
      today: seoulToday.date,
      totalTargetDays: seoulToday.date,
      exercisedDays,
    };
  }

  const lastDate = getLastDate(year, month);
  const exercisedDays = PAST_MONTH_SEEDS.filter(({ day }) => day <= lastDate).map(
    ({ day, count, measured }) => toDailyExercise(day, count, measured),
  );

  return { year, month, today: null, totalTargetDays: lastDate, exercisedDays };
}
