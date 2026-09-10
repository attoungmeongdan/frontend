import type { CalendarStatus, MonthlyActivity } from "@/types/calendar";

// API 연동 전 임시 데이터. 연동 시 이 파일을 제거하고 쿼리 훅으로 교체한다.
// 디자인 08_Calendar 의 상태별 화면을 확인하려면 CALENDAR_STATUS 값을 바꾼다.
export const CALENDAR_STATUS: CalendarStatus = "success";

/** 어제 O · 오늘 X (디자인 Screen/Cal-yesO-todX 기준) */
export const CALENDAR_MOCK: MonthlyActivity = {
  year: 2026,
  month: 9,
  today: 9,
  exercisedDays: [2, 5, 8],
};
