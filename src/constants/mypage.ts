// 10_Mypage 문구 — Fittle-v2.1.pen 10_Mypage 프레임 기준

export const ACCOUNT_ACTIONS = {
  logout: "로그아웃",
  withdraw: "탈퇴하기",
} as const;

export const RECOMMENDATION_TITLE = "지금 몸에 맞는 추천 운동 3가지예요";

export const RECOMMENDATION_MESSAGES = {
  loading: "추천을 불러오고 있어요…",
  empty: {
    title: "맞는 추천 정보가 아직 없어요",
  },
  error: {
    title: "추천을 불러오지 못했어요",
    action: "다시 불러오기",
  },
} as const;

/** 프로필 조회 실패. 시안에 정의가 없어 추천 실패 문구를 따랐다 */
export const PROFILE_ERROR = {
  title: "내 정보를 불러오지 못했어요",
  action: "다시 불러오기",
} as const;

/** 개인정보 수정 안내. 시안에 정의가 없어 임시 문구다 */
export const PERSONAL_INFO_ERROR = {
  invalid: "숫자만 입력해 주세요.",
  save: "저장하지 못했어요.\n잠시 후 다시 시도해 주세요.",
} as const;

/** 저장 중 스피너 최소 표시 시간(ms). 응답이 빨라도 한 바퀴는 돌고 체크로 넘어간다 */
export const PERSONAL_INFO_SAVING_MIN_MS = 1000;
/** 저장 성공 체크 표시 시간(ms). 지나면 다시 연필로 돌아간다 */
export const PERSONAL_INFO_SAVED_CHECK_MS = 1000;

export const PERSONAL_INFO_SAVING_LABEL = "저장 중";
export const PERSONAL_INFO_SAVED_LABEL = "수정 완료";

/** 로그아웃·탈퇴 실패 안내. 시안에 정의가 없어 임시로 토스트를 쓴다 */
export const ACCOUNT_ACTION_ERROR = {
  logout: "로그아웃하지 못했어요.\n잠시 후 다시 시도해 주세요.",
  withdraw: "탈퇴하지 못했어요.\n잠시 후 다시 시도해 주세요.",
} as const;

/** 탈퇴 확인 모달. 시안에 없어 새로 작성한 문구 */
export const WITHDRAW_CONFIRM = {
  title: "정말 탈퇴하시겠어요?",
  body: "그동안 쌓은 운동 기록이 모두 사라져요.\n되돌릴 수 없어요.",
  confirm: "탈퇴하기",
  cancel: "그대로 둘게요",
} as const;
