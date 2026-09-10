// 10_Mypage — /mypage

/** 추천 운동 조회 상태. 디자인 10_Mypage 의 화면 4종에 대응한다 */
export type RecommendationStatus = "loading" | "error" | "success";

/** 수정할 수 있는 개인정보 항목. 주소는 MVP 에서 수정 대상이 아니다 */
export type EditableField = "age" | "gender" | "bodySize";

/** 개인정보 목록 한 줄. 값은 이미 표시용으로 조합된 문자열이다 */
export interface PersonalInfoItem {
  label: string;
  value: string;
  /** 수정 가능한 항목만 값이 있다 */
  field: EditableField | null;
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
