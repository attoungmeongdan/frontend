import type { CalendarStatus, DailyExercise, MonthlyActivity } from "@/types/calendar";
import { getSeoulToday } from "@/utils/date";

// API 연동 전 임시 데이터. 연동 시 이 파일을 제거하고 쿼리 훅으로 교체한다.
// 디자인 08_Calendar 의 상태별 화면을 확인하려면 CALENDAR_STATUS 값을 바꾼다.
export const CALENDAR_STATUS: CalendarStatus = "success";

/**
 * 오늘 기준 상대 간격과 그날 수행한 종목 수.
 * 색 4단계가 모두 보이도록 1~4개를 하나씩 섞었고, 어제(offset 1)는 수행한 상태로 둔다.
 */
const EXERCISED_DAY_SEEDS = [
  { offset: 1, count: 2 },
  { offset: 4, count: 4 },
  { offset: 7, count: 1 },
  { offset: 10, count: 3 },
];

/**
 * 오늘 날짜(KST)에 맞춘 목데이터.
 * 고정 날짜를 쓰면 날이 바뀔 때마다 어제를 오늘로 표시하게 되므로 매번 생성한다.
 */
function createCalendarMock(): MonthlyActivity {
  const { year, month, date } = getSeoulToday();

  const exercisedDays: DailyExercise[] = EXERCISED_DAY_SEEDS.map(({ offset, count }) => ({
    day: date - offset,
    count,
  }))
    .filter(({ day }) => day >= 1)
    .sort((a, b) => a.day - b.day);

  return { year, month, today: date, exercisedDays };
}

export const CALENDAR_MOCK: MonthlyActivity = createCalendarMock();
