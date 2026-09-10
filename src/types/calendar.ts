// 08_Calendar — /calendar

/** 캘린더 데이터 로딩 상태 */
export type CalendarStatus = "loading" | "error" | "success";

/** 자유 운동 종목 수. 4종목이 전부라 1~4 사이 값만 나온다 */
export const MAX_EXERCISE_COUNT = 4;

/** 하루치 운동 기록. 체력 측정은 집계하지 않고 자유 운동만 센다 */
export interface DailyExercise {
  /** 날짜(일) */
  day: number;
  /** 그날 수행한 자유 운동 종목 수 (1~4) */
  count: number;
}

/** 당월 운동 기록. 월 이동이 없으므로 항상 오늘이 속한 달만 다룬다 */
export interface MonthlyActivity {
  year: number;
  /** 1-12 */
  month: number;
  /** 오늘 날짜(일). 해당 월에 속한 값 */
  today: number;
  /** 운동한 날 목록 */
  exercisedDays: DailyExercise[];
}

/** 달력 한 칸. 빈 칸은 date 가 null */
export interface DayCell {
  date: number | null;
  isToday: boolean;
  isFuture: boolean;
  /** 수행한 종목 수. 0 이면 그날 운동하지 않았다 */
  exerciseCount: number;
}

/** 이번 달 운동 실행률. 미래 날짜는 분모에서 제외한다 */
export interface MonthlyRate {
  /** 오늘까지 경과일 */
  elapsedDays: number;
  /** 운동한 날 수 */
  exercisedCount: number;
  /** 0-100. 월초(1일)에 아직 운동하지 않았으면 null */
  percent: number | null;
}
