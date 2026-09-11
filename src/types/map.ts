// 09_Map — /map

/** 지도 화면 상태. 디자인 09_Map 의 화면에 대응한다 */
export type MapStatus =
  | "loading"
  /** 집 주소가 없거나 좌표가 없어 지도를 그릴 수 없다 */
  | "addressUnavailable"
  /** 지도 SDK 로드 또는 시설 조회 실패 */
  | "mapFailed"
  | "ready";

export interface Coordinates {
  lat: number;
  lng: number;
}
