// 08_Calendar 문구 — Fittle-v2.1.pen 08_Calendar 프레임의 텍스트를 그대로 사용

export const WEEKDAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"] as const;

/** 어제·오늘 운동 여부 조합별 마스코트 멘트 */
export const MASCOT_MESSAGES = {
  /** 어제 O · 오늘 X */
  yesterdayOnly: "어제 몸을 움직이셨네요.\n오늘도 편한 때 함께해요.",
  /** 어제 O · 오늘 O */
  both: "이틀 동안 함께 움직였네요.\n오늘도 수고하셨어요.",
  /** 어제 X · 오늘 O */
  todayOnly: "오늘 몸을 움직이셨네요.\n함께해서 반가워요!",
  /** 어제 X · 오늘 X, 이번 달 기록 없음 포함 */
  neither: "편한 때 가볍게 시작해 볼까요?",
  /** 1일. 어제가 전월이라 조합을 따지지 않는다 */
  monthStart: "새 달이 시작됐어요.\n편한 때 함께해요.",
  loading: "기록을 살펴보고 있어요.",
  error: "잠시만요, 다시 한 번 볼게요.",
} as const;

export const RATE_CARD_TITLE = "이번 달 운동 실행률";
export const RATE_EMPTY_DESCRIPTION = "이번 달 기록이 아직 없어요";
/** 월초에는 실행률 대신 표시 */
export const RATE_UNAVAILABLE = "—";

export const LOADING_MESSAGE = "기록을 불러오고 있어요…";
export const ERROR_TITLE = "기록을 불러오지 못했어요";
export const ERROR_DESCRIPTION = "잠시 후 다시 시도해 주세요. 기록 자체는 사라지지 않아요.";
export const ERROR_RETRY_LABEL = "다시 불러오기";

export const LEGEND_EXERCISED_LABEL = "운동 1~4개";
export const LEGEND_TODAY_LABEL = "오늘";
