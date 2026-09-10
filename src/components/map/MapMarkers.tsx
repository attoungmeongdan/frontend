import { Building2, House } from "lucide-react";
import { useEffect, useRef } from "react";
import { createRoot, type Root } from "react-dom/client";
import { RADIUS_LABEL, SEARCH_RADIUS_METERS } from "@/constants/map";
import type { FacilityMarker } from "@/apis/facility";
import type { Coordinates } from "@/types/map";

interface MapMarkersProps {
  map: kakao.maps.Map | null;
  home: Coordinates | null;
  facilities: FacilityMarker[];
  selectedId: number | null;
  onSelect: (facilityId: number) => void;
}

// 지도 위 마커. 집·공공시설 2종만 쓴다
function MapMarkers({ map, home, facilities, selectedId, onSelect }: MapMarkersProps) {
  const rootsRef = useRef(new Map<string, Root>());

  useEffect(() => {
    const sdk = window.kakao;
    if (!map || !home || !sdk) return;

    const overlays: kakao.maps.CustomOverlay[] = [];
    const roots = rootsRef.current;

    const attach = (position: Coordinates, element: HTMLElement) => {
      overlays.push(
        new sdk.maps.CustomOverlay({
          map,
          position: new sdk.maps.LatLng(position.lat, position.lng),
          content: element,
          clickable: true,
        }),
      );
    };

    const homeElement = document.createElement("div");
    const homeRoot = createRoot(homeElement);
    homeRoot.render(<HomeMarker />);
    roots.set("home", homeRoot);
    attach(home, homeElement);

    const labelElement = document.createElement("div");
    const labelRoot = createRoot(labelElement);
    labelRoot.render(<RadiusLabel />);
    roots.set("radius-label", labelRoot);
    // 반경 라벨은 원의 북쪽 끝에 둔다
    const latDelta = SEARCH_RADIUS_METERS / 111_320;
    attach({ lat: home.lat + latDelta, lng: home.lng }, labelElement);

    for (const facility of facilities) {
      const element = document.createElement("div");
      const root = createRoot(element);
      root.render(
        <FacilityMarker
          label={facility.name}
          isSelected={false}
          onSelect={() => onSelect(facility.id)}
        />,
      );
      roots.set(String(facility.id), root);
      attach({ lat: facility.lat, lng: facility.lng }, element);
    }

    return () => {
      for (const overlay of overlays) overlay.setMap(null);
      for (const root of roots.values()) queueMicrotask(() => root.unmount());
      roots.clear();
    };
  }, [map, home, facilities, onSelect]);

  // 선택 상태만 바뀔 때는 마커를 다시 만들지 않고 내용만 갱신한다
  useEffect(() => {
    const roots = rootsRef.current;

    for (const facility of facilities) {
      roots
        .get(String(facility.id))
        ?.render(
          <FacilityMarker
            label={facility.name}
            isSelected={facility.id === selectedId}
            onSelect={() => onSelect(facility.id)}
          />,
        );
    }
  }, [facilities, selectedId, onSelect]);

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

function FacilityMarker({
  label,
  isSelected,
  onSelect,
}: {
  label: string;
  isSelected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onSelect}
      aria-pressed={isSelected}
      className={`border-brand-teal-strong flex size-9 items-center justify-center rounded-full border ${
        isSelected ? "bg-brand-teal-strong" : "bg-surface-default"
      }`}
    >
      <Building2
        size={18}
        aria-hidden
        className={isSelected ? "text-action-primary-fg" : "text-brand-teal-strong"}
      />
    </button>
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
