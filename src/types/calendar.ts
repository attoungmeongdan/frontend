// 08_Calendar — /calendar

/** 캘린더 데이터 로딩 상태 */
export type CalendarStatus = "loading" | "error" | "success";

/** 당월 운동 기록. 월 이동이 없으므로 항상 오늘이 속한 달만 다룬다 */
export interface MonthlyActivity {
  year: number;
  /** 1-12 */
  month: number;
  /** 오늘 날짜(일). 해당 월에 속한 값 */
  today: number;
  /** 운동한 날짜(일) 목록 */
  exercisedDays: number[];
}

/** 달력 한 칸. 빈 칸은 date 가 null */
export interface DayCell {
  date: number | null;
  isToday: boolean;
  isExercised: boolean;
  isFuture: boolean;
}

/** 이번 달 운동 실행률. 미래 날짜는 분모에서 제외한다 */
export interface MonthlyRate {
  /** 오늘까지 경과일 */
  elapsedDays: number;
  /** 운동한 날 수 */
  exercisedCount: number;
  /** 0-100. 월초(1일)에는 산출하지 않아 null */
  percent: number | null;
}
