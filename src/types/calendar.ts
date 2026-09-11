// 08_Calendar — /calendar

/** 캘린더 데이터 로딩 상태 */
export type CalendarStatus = "loading" | "error" | "success";

/** 자유 운동 종목 수. 4종목이 전부라 1~4 사이 값만 나온다 */
export const MAX_EXERCISE_COUNT = 4;

/** 하루치 운동 기록 */
export interface DailyExercise {
  /** 날짜(일) */
  day: number;
  /** 그날 수행한 자유 운동 종목 수 (0~4) */
  count: number;
  /**
   * 그날 완료한 체력 측정 id. 측정하지 않았으면 null.
   * 측정만 하고 자유 운동을 하지 않은 날은 달력에 표시하지 않는다.
   */
  measurementId: string | null;
}

/** 조회한 달의 운동 기록 */
export interface MonthlyActivity {
  year: number;
  /** 1-12 */
  month: number;
  /** 오늘 날짜(일). 이번 달을 보고 있을 때만 값이 있다 */
  today: number | null;
  /**
   * 가입 날짜(일). 가입한 달을 보고 있을 때만 값이 있다.
   * 그 전날까지는 기록이 있을 수 없어 회색으로 가린다. 가입일을 모르면 null
   */
  joinedDay: number | null;
  /** 실행률 분모. 이번 달이면 오늘까지 경과일, 지난달이면 그 달 전체 일수 */
  totalTargetDays: number;
  /** 운동한 날 목록 */
  exercisedDays: DailyExercise[];
}

/** 달력 한 칸. 빈 칸은 date 가 null */
export interface DayCell {
  date: number | null;
  isToday: boolean;
  isFuture: boolean;
  /** 가입일보다 이른 날. 기록이 없는 게 정상이라 회색으로만 보여 준다 */
  isBeforeJoin: boolean;
  /** 수행한 종목 수. 0 이면 그날 자유 운동을 하지 않았다 */
  exerciseCount: number;
  /** 자유 운동과 체력 측정을 모두 한 날에만 값이 있다. 분석 화면으로 이동할 때 쓴다 */
  measurementId: string | null;
}

/** 이번 달 운동 실행률. 미래 날짜는 분모에서 제외한다 */
export interface MonthlyRate {
  /** 실행률 분모. 이번 달이면 오늘까지 경과일, 지난달이면 그 달 전체 일수 */
  totalTargetDays: number;
  /** 운동한 날 수 */
  exercisedCount: number;
  /** 0-100. 이번 달 1일에 아직 운동하지 않았으면 null */
  percent: number | null;
}
