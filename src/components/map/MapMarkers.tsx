import { House } from "lucide-react";
import { useEffect, useRef } from "react";
import { createRoot, type Root } from "react-dom/client";
import type { FacilityMarker } from "@/apis/facility";
import {
  CLUSTER_CALCULATOR,
  CLUSTER_STYLES,
  RADIUS_LABEL,
  SEARCH_RADIUS_METERS,
} from "@/constants/map";
import type { Coordinates } from "@/types/map";
import { FACILITY_MARKER_SIZE, FACILITY_MARKER_SRC } from "@/utils/markerImage";

interface MapMarkersProps {
  map: kakao.maps.Map | null;
  home: Coordinates | null;
  facilities: FacilityMarker[];
  selectedId: number | null;
  onSelect: (facilityId: number) => void;
}

/** 이 확대 수준보다 넓게 보면 마커를 묶는다 */
const CLUSTER_MIN_LEVEL = 5;

// 지도 위 마커. 집·공공시설 2종만 쓰고, 시설은 많아질 수 있어 클러스터로 묶는다
function MapMarkers({ map, home, facilities, selectedId, onSelect }: MapMarkersProps) {
  const markersRef = useRef(new Map<number, kakao.maps.Marker>());

  // 집 마커와 반경 라벨은 묶이면 안 되므로 오버레이로 따로 둔다
  useEffect(() => {
    const sdk = window.kakao;
    if (!map || !home || !sdk) return;

    const overlays: kakao.maps.CustomOverlay[] = [];
    const roots: Root[] = [];

    const attach = (position: Coordinates, node: React.ReactNode) => {
      const element = document.createElement("div");
      const root = createRoot(element);

      root.render(node);
      roots.push(root);
      overlays.push(
        new sdk.maps.CustomOverlay({
          map,
          position: new sdk.maps.LatLng(position.lat, position.lng),
          content: element,
        }),
      );
    };

    attach(home, <HomeMarker />);

    // 반경 라벨은 원의 북쪽 끝에 둔다
    const latDelta = SEARCH_RADIUS_METERS / 111_320;
    attach({ lat: home.lat + latDelta, lng: home.lng }, <RadiusLabel />);

    return () => {
      for (const overlay of overlays) overlay.setMap(null);
      for (const root of roots) queueMicrotask(() => root.unmount());
    };
  }, [map, home]);

  // 시설 마커. 클러스터러는 CustomOverlay 를 받지 못해 Marker 로 만든다
  useEffect(() => {
    const sdk = window.kakao;
    if (!map || !sdk) return;

    const size = new sdk.maps.Size(FACILITY_MARKER_SIZE, FACILITY_MARKER_SIZE);
    const offset = new sdk.maps.Point(FACILITY_MARKER_SIZE / 2, FACILITY_MARKER_SIZE / 2);
    const defaultImage = new sdk.maps.MarkerImage(FACILITY_MARKER_SRC.default, size, { offset });
    const markerById = markersRef.current;

    const markers = facilities.map((facility) => {
      const marker = new sdk.maps.Marker({
        position: new sdk.maps.LatLng(facility.lat, facility.lng),
        image: defaultImage,
        title: facility.name,
      });

      sdk.maps.event.addListener(marker, "click", () => onSelect(facility.id));
      markerById.set(facility.id, marker);

      return marker;
    });

    const clusterer = new sdk.maps.MarkerClusterer({
      map,
      markers,
      averageCenter: true,
      minLevel: CLUSTER_MIN_LEVEL,
      calculator: [...CLUSTER_CALCULATOR],
      styles: CLUSTER_STYLES.map(({ size, background }) => ({
        width: `${size}px`,
        height: `${size}px`,
        background,
        borderRadius: `${size / 2}px`,
        color: "#fff",
        textAlign: "center",
        lineHeight: `${size}px`,
        fontSize: "14px",
        fontWeight: "700",
      })),
    });

    return () => {
      clusterer.clear();
      for (const marker of markers) marker.setMap(null);
      markerById.clear();
    };
  }, [map, facilities, onSelect]);

  // 선택 상태가 바뀌면 마커 이미지만 교체한다
  useEffect(() => {
    const sdk = window.kakao;
    if (!sdk) return;

    const size = new sdk.maps.Size(FACILITY_MARKER_SIZE, FACILITY_MARKER_SIZE);
    const offset = new sdk.maps.Point(FACILITY_MARKER_SIZE / 2, FACILITY_MARKER_SIZE / 2);

    for (const [id, marker] of markersRef.current) {
      const src = id === selectedId ? FACILITY_MARKER_SRC.selected : FACILITY_MARKER_SRC.default;

      marker.setImage(new sdk.maps.MarkerImage(src, size, { offset }));
    }
  }, [selectedId, facilities]);

  return null;
}

function HomeMarker() {
  return (
    <div
      role="img"
      aria-label="집"
      className="bg-brand-teal-strong border-brand-teal-strong flex size-9 items-center justify-center rounded-full border"
    >
      <House size={18} className="text-action-primary-fg" aria-hidden />
    </div>
  );
}

function RadiusLabel() {
  return (
    <span className="text-brand-teal-strong text-[11px] leading-none font-semibold">
      {RADIUS_LABEL}
    </span>
  );
}

export default MapMarkers;
