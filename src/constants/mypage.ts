// 10_Mypage 문구 — FitPle-v2.1.pen 10_Mypage 프레임 기준

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

/** 탈퇴 확인 모달. 시안에 없어 새로 작성한 문구 */
export const WITHDRAW_CONFIRM = {
  title: "정말 탈퇴하시겠어요?",
  body: "그동안 쌓은 운동 기록이 모두 사라져요.\n되돌릴 수 없어요.",
  confirm: "탈퇴하기",
  cancel: "그대로 둘게요",
} as const;
