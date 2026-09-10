import type {
  PersonalInfoItem,
  Recommendation,
  RecommendationStatus,
  UserProfile,
} from "@/types/mypage";

// API 연동 전 임시 데이터. 연동 시 이 파일을 제거하고 쿼리 훅으로 교체한다.
// 디자인 10_Mypage 의 상태별 화면을 확인하려면 RECOMMENDATION_STATUS 값을 바꾼다.
export const RECOMMENDATION_STATUS: RecommendationStatus = "success";

export const PROFILE_MOCK: UserProfile = {
  name: "김핏틀",
  email: "fittle@kakao.com",
};

export const PERSONAL_INFO_MOCK: PersonalInfoItem[] = [
  { label: "나이", value: "34세" },
  { label: "성별", value: "여성" },
  { label: "키 · 몸무게", value: "165cm · 58kg" },
  { label: "주소", value: "서울 성북구 서경로 124" },
];

/** 국민연령별추천운동정보 매칭 상위 3개 자리. 자체 순위 계산 없이 그대로 노출한다 */
export const RECOMMENDATIONS_MOCK: Recommendation[] = [
  { id: "rec-1", name: "가볍게 걷기", description: "무릎 부담이 적은 유산소", icon: "walk" },
  { id: "rec-2", name: "수영·아쿠아로빅", description: "관절에 편한 전신 운동", icon: "swim" },
  { id: "rec-3", name: "전신 스트레칭", description: "하루를 여는 부드러운 이완", icon: "stretch" },
];
