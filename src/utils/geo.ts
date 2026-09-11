/** 거리 표기. 1km 미만은 m, 이상은 소수 첫째 자리까지 km */
export function formatDistance(kilometers: number): string {
  if (kilometers < 1) return `${Math.round(kilometers * 1000)}m`;

  return `${kilometers.toFixed(1)}km`;
}
