// 10_Mypage — /mypage

/** 추천 운동 조회 상태. 디자인 10_Mypage 의 화면 4종에 대응한다 */
export type RecommendationStatus = "loading" | "error" | "success";

export interface UserProfile {
  name: string;
  email: string;
}

/** 개인정보 목록 한 줄. 값은 이미 표시용으로 조합된 문자열이다 */
export interface PersonalInfoItem {
  label: string;
  value: string;
}

/** 추천 운동에 쓰는 아이콘 종류 */
export type RecommendationIcon = "walk" | "swim" | "stretch";

/** BMI·연령대·성별로 매칭된 추천 운동 */
export interface Recommendation {
  id: string;
  name: string;
  description: string;
  icon: RecommendationIcon;
}
