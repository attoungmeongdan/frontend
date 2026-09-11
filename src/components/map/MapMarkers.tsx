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

  // 선택한 시설 마커 위에 이름 말풍선을 띄우고 화면 가운데로 옮긴다.
  // 카카오 InfoWindow 는 모양을 못 바꿔 오버레이로 직접 그린다
  useEffect(() => {
    const sdk = window.kakao;
    const marker = selectedId === null ? undefined : markersRef.current.get(selectedId);
    const facility = facilities.find((item) => item.id === selectedId);
    if (!map || !sdk || !marker || !facility) return;

    const element = document.createElement("div");
    const root = createRoot(element);
    root.render(<FacilityLabel name={facility.name} />);

    // 렌더가 비동기라 생성 시점엔 크기가 0 이어서 카카오 앵커가 어긋난다. CSS 로 마커 위 가운데에 맞춘다
    element.style.transform = "translate(-50%, -100%)";

    const position = marker.getPosition();
    const overlay = new sdk.maps.CustomOverlay({
      map,
      position,
      content: element,
      xAnchor: 0,
      yAnchor: 0,
      zIndex: 3,
    });
    map.panTo(position);

    return () => {
      overlay.setMap(null);
      queueMicrotask(() => root.unmount());
    };
  }, [map, selectedId, facilities]);

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

/** 마커 위 이름 말풍선. 아래 꼬리가 마커 위 끝에 닿도록 마커 반지름만큼 띄운다 */
function FacilityLabel({ name }: { name: string }) {
  return (
    <div
      className="flex flex-col items-center"
      style={{ paddingBottom: FACILITY_MARKER_SIZE / 2 + 4 }}
    >
      <div className="bg-brand-teal-strong text-action-primary-fg text-note-title shadow-card rounded-bubble max-w-56 truncate px-3.5 py-2">
        {name}
      </div>
      <span aria-hidden className="bg-brand-teal-strong -mt-1.5 size-3 rotate-45 rounded-[2px]" />
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
