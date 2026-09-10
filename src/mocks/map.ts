import type { Coordinates, Facility } from "@/types/map";
import { offsetCoordinates } from "@/utils/geo";

// API 연동 전 임시 데이터. 연동 시 이 파일을 제거하고 쿼리 훅으로 교체한다.

/** 온보딩에서 받는 집 주소 자리. 좌표는 카카오 Geocoder 로 변환한다 */
export const HOME_ADDRESS = "서울특별시 성북구 서경로 124";

/**
 * 집 기준 상대 위치로 정의한 시설 목데이터.
 * 좌표를 직접 박으면 집 주소가 바뀔 때 반경 밖으로 나가므로 오프셋으로 둔다.
 * 실제 공공데이터가 아니라 화면 확인용 값이다.
 */
const FACILITY_SEEDS = [
  {
    id: "fac-1",
    name: "성북구민 체육센터",
    address: "서울 성북구 화랑로 100",
    category: "공공 체육시설 · 체육관",
    northMeters: 900,
    eastMeters: 700,
  },
  {
    id: "fac-2",
    name: "정릉 국민체육센터",
    address: "서울 성북구 정릉로 220",
    category: "공공 체육시설 · 수영장",
    northMeters: -1200,
    eastMeters: 400,
  },
  {
    id: "fac-3",
    name: "북한산 생활체육공원",
    address: "서울 성북구 보국문로 45",
    category: "공공 체육시설 · 야외 운동시설",
    northMeters: 1800,
    eastMeters: -1500,
  },
  {
    id: "fac-4",
    name: "성북천 체육공원",
    address: "서울 성북구 성북로 12",
    category: "공공 체육시설 · 야외 운동시설",
    northMeters: -600,
    eastMeters: -2200,
  },
] as const;

/** 집 좌표가 정해진 뒤 시설 좌표를 만든다 */
export function createFacilityMocks(home: Coordinates): Facility[] {
  return FACILITY_SEEDS.map(({ northMeters, eastMeters, ...facility }) => ({
    ...facility,
    coordinates: offsetCoordinates(home, northMeters, eastMeters),
  }));
}
