import type { UserProfile } from "@/apis/user";
import type { PersonalInfoItem } from "@/types/mypage";

const GENDER_LABEL: Record<string, string> = {
  MALE: "남성",
  FEMALE: "여성",
};

/** 서버가 값을 주지 않은 항목 자리. 시안에 정의가 없어 임시 문구다 */
const UNREGISTERED = "미등록";

/** 키·몸무게는 한 줄로 합쳐 보여준다. 한쪽만 있으면 있는 값만 쓴다 */
function formatBodySize(height: number | null, weight: number | null) {
  const parts = [
    height === null ? null : `${height}cm`,
    weight === null ? null : `${weight}kg`,
  ].filter((part) => part !== null);

  return parts.length === 0 ? UNREGISTERED : parts.join(" · ");
}

/** 개인정보 목록에 쓸 표기 문자열을 만든다. 온보딩을 건너뛴 항목은 null 로 온다 */
export function toPersonalInfoItems(profile: UserProfile): PersonalInfoItem[] {
  return [
    {
      label: "나이",
      value: profile.age === null ? UNREGISTERED : `${profile.age}세`,
      field: "age",
    },
    {
      label: "성별",
      value: (profile.gender && GENDER_LABEL[profile.gender]) ?? UNREGISTERED,
      field: "gender",
    },
    {
      label: "키 · 몸무게",
      value: formatBodySize(profile.height, profile.weight),
      field: "bodySize",
    },
    { label: "주소", value: profile.address?.roadNameAddress ?? UNREGISTERED, field: null },
  ];
}
