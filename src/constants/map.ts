// 09_Map 문구·수치 — FitPle-v2.1.pen 09_Map 프레임 기준

/** 집 주변 표시 반경(m). 이 범위 밖 시설은 표시하지 않는다 */
export const SEARCH_RADIUS_METERS = 5000;

/** 지도 생성 시 초기 확대 레벨. 생성 직후 setBounds 로 반경 5km 원에 맞춘다 */
export const MAP_ZOOM_LEVEL = 8;

export const RADIUS_LABEL = "반경 5km";

export const MAP_MESSAGES = {
  loading: {
    title: "지도를 불러오고 있어요",
    description: "집 주소 주변의 공공 체육시설을 찾고 있어요.",
  },
  empty: {
    title: "5km 안에 공공 체육시설이 없어요",
    description: "제공 데이터 기준이에요.\n범위 밖 시설은 표시하지 않아요.",
  },
  geocodeFailed: {
    title: "주소 위치를 찾지 못했어요",
    description: "온보딩에 저장한 주소를 확인한 뒤\n다시 시도해 주세요.",
    action: "다시 시도하기",
  },
  mapFailed: {
    title: "지도를 불러오지 못했어요",
    description: "네트워크 상태를 확인하고 다시 시도해 주세요.",
    action: "다시 불러오기",
  },
} as const;

export const SHEET_FIELD_LABELS = {
  location: "위치",
  category: "유형",
  info: "제공 정보",
} as const;

/** 공공데이터 미제공 항목(전화·운영시간 등)은 표기하지 않는다는 안내 */
export const SHEET_INFO_VALUE =
  "공공데이터 제공 항목만 표시 — 미제공 전화·운영시간은 표기하지 않음";

export const SHEET_CLOSE_LABEL = "닫기";
