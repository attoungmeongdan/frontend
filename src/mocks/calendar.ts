import type { CalendarStatus, MonthlyActivity } from "@/types/calendar";
import { getSeoulToday } from "@/utils/date";

// API 연동 전 임시 데이터. 연동 시 이 파일을 제거하고 쿼리 훅으로 교체한다.
// 디자인 08_Calendar 의 상태별 화면을 확인하려면 CALENDAR_STATUS 값을 바꾼다.
export const CALENDAR_STATUS: CalendarStatus = "success";

/** 오늘 기준 상대 간격으로 운동한 날을 만든다. 디자인과 같은 어제 O · 오늘 X 배치 */
const EXERCISED_DAY_OFFSETS = [1, 4, 7];

/**
 * 오늘 날짜(KST)에 맞춘 목데이터.
 * 고정 날짜를 쓰면 날이 바뀔 때마다 어제를 오늘로 표시하게 되므로 매번 생성한다.
 */
function createCalendarMock(): MonthlyActivity {
  const { year, month, date } = getSeoulToday();

  const exercisedDays = EXERCISED_DAY_OFFSETS.map((offset) => date - offset)
    .filter((day) => day >= 1)
    .sort((a, b) => a - b);

  return { year, month, today: date, exercisedDays };
}

export const CALENDAR_MOCK: MonthlyActivity = createCalendarMock();
