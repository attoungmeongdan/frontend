// 09_Map — /map

/** 지도 화면 상태. 디자인 09_Map 의 화면 6종에 대응한다 */
export type MapStatus =
  | "loading"
  /** 주소 좌표 변환 실패 */
  | "geocodeFailed"
  /** 지도 SDK 로드 실패 */
  | "mapFailed"
  | "ready";

export interface Coordinates {
  lat: number;
  lng: number;
}

/** 공공 체육시설. 공공데이터가 제공하는 항목만 담는다 */
export interface Facility {
  id: string;
  name: string;
  /** 도로명 주소 */
  address: string;
  /** 시설 유형 (예: 공공 체육시설 · 체육관) */
  category: string;
  coordinates: Coordinates;
}

/** 집에서의 거리를 붙인 시설 */
export interface FacilityWithDistance extends Facility {
  /** 집에서의 직선거리(m) */
  distance: number;
}
