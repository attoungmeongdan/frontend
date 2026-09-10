import type { Coordinates } from "@/types/map";

const EARTH_RADIUS_METERS = 6_371_000;
/** 위도 1도당 거리(m). 경도는 위도에 따라 줄어들어 별도 보정한다 */
const METERS_PER_LAT_DEGREE = 111_320;

const toRadians = (degree: number) => (degree * Math.PI) / 180;

/** 두 좌표 사이 직선거리(m) */
export function getDistanceInMeters(from: Coordinates, to: Coordinates): number {
  const latDiff = toRadians(to.lat - from.lat);
  const lngDiff = toRadians(to.lng - from.lng);

  const a =
    Math.sin(latDiff / 2) ** 2 +
    Math.cos(toRadians(from.lat)) * Math.cos(toRadians(to.lat)) * Math.sin(lngDiff / 2) ** 2;

  return Math.round(EARTH_RADIUS_METERS * 2 * Math.asin(Math.sqrt(a)));
}

/** 기준 좌표에서 북쪽·동쪽으로 이동한 좌표. 목데이터를 집 주변에 배치할 때 쓴다 */
export function offsetCoordinates(
  origin: Coordinates,
  northMeters: number,
  eastMeters: number,
): Coordinates {
  const lat = origin.lat + northMeters / METERS_PER_LAT_DEGREE;
  const lng = origin.lng + eastMeters / (METERS_PER_LAT_DEGREE * Math.cos(toRadians(origin.lat)));

  return { lat, lng };
}

/** 거리 표기. 1km 미만은 m, 이상은 소수 첫째 자리까지 km */
export function formatDistance(meters: number): string {
  if (meters < 1000) return `${meters}m`;
  return `${(meters / 1000).toFixed(1)}km`;
}
