/**
 * 시설 마커 이미지.
 * 클러스터러는 CustomOverlay 를 받지 못해 Marker 를 써야 하고,
 * Marker 는 이미지가 필요하다. 시안 색을 그대로 쓰려고 SVG 를 인라인으로 만든다.
 */

const MARKER_SIZE = 36;
const BRAND_TEAL_STRONG = "#136b6b";
const SURFACE_DEFAULT = "#ffffff";

/** lucide building-2 아이콘 경로. 24x24 기준이라 마커 안에서 축소해 쓴다 */
const BUILDING_PATHS = [
  "M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z",
  "M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2",
  "M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2",
  "M10 6h4",
  "M10 10h4",
  "M10 14h4",
  "M10 18h4",
];

function toDataUri(svg: string) {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

/** 선택 여부에 따라 배경과 아이콘 색이 뒤집힌다 */
function createFacilitySvg(isSelected: boolean) {
  const background = isSelected ? BRAND_TEAL_STRONG : SURFACE_DEFAULT;
  const foreground = isSelected ? SURFACE_DEFAULT : BRAND_TEAL_STRONG;
  const icon = BUILDING_PATHS.map((path) => `<path d="${path}" />`).join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${MARKER_SIZE}" height="${MARKER_SIZE}" viewBox="0 0 36 36">
    <circle cx="18" cy="18" r="17" fill="${background}" stroke="${BRAND_TEAL_STRONG}" />
    <g transform="translate(9 9) scale(0.75)" fill="none" stroke="${foreground}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${icon}</g>
  </svg>`;
}

export const FACILITY_MARKER_SIZE = MARKER_SIZE;

export const FACILITY_MARKER_SRC = {
  default: toDataUri(createFacilitySvg(false)),
  selected: toDataUri(createFacilitySvg(true)),
} as const;
