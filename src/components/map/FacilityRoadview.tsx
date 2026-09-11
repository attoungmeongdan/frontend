import { LoaderCircle, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import type { FacilityMarker } from "@/apis/facility";
import {
  ROADVIEW_LABEL,
  ROADVIEW_MESSAGES,
  ROADVIEW_SEARCH_RADIUS_METERS,
  SHEET_CLOSE_LABEL,
} from "@/constants/map";
import { FACILITY_MARKER_SIZE, FACILITY_MARKER_SRC } from "@/utils/markerImage";

interface FacilityRoadviewProps {
  map: kakao.maps.Map | null;
  facility: FacilityMarker | null;
  onClose: () => void;
}

/** 카드 아래쪽 여백. 마커 위에 카드가 걸치지 않게 마커 반지름보다 조금 넓게 둔다 */
const CARD_TAIL_GAP = FACILITY_MARKER_SIZE / 2 + 8;

// 선택한 시설 마커 위에 띄우는 거리뷰 카드. 바텀시트와 같이 쓰며 닫기는 시트와 함께 처리한다
function FacilityRoadview({ map, facility, onClose }: FacilityRoadviewProps) {
  useEffect(() => {
    const sdk = window.kakao;
    if (!map || !facility || !sdk) return;

    const position = new sdk.maps.LatLng(facility.lat, facility.lng);
    const element = document.createElement("div");
    const root = createRoot(element);

    root.render(<RoadviewCard facility={facility} position={position} onClose={onClose} />);

    const overlay = new sdk.maps.CustomOverlay({
      map,
      position,
      content: element,
      yAnchor: 1,
      // 카드 안 터치가 지도 드래그·클릭으로 새지 않게 한다
      clickable: true,
      zIndex: 3,
    });

    // 카드가 바텀시트에 가려지지 않게 마커를 화면 가운데로 옮긴다
    map.panTo(position);

    return () => {
      overlay.setMap(null);
      queueMicrotask(() => root.unmount());
    };
  }, [map, facility, onClose]);

  return null;
}

type RoadviewStatus = "loading" | "ready" | "unavailable";

interface RoadviewCardProps {
  facility: FacilityMarker;
  position: kakao.maps.LatLng;
  onClose: () => void;
}

function RoadviewCard({ facility, position, onClose }: RoadviewCardProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<RoadviewStatus>("loading");

  useEffect(() => {
    const sdk = window.kakao;
    const container = containerRef.current;
    if (!sdk || !container) return;

    let isCancelled = false;

    // 로드뷰는 좌표로 바로 열 수 없어 가장 가까운 파노라마 ID 를 먼저 찾는다
    new sdk.maps.RoadviewClient().getNearestPanoId(
      position,
      ROADVIEW_SEARCH_RADIUS_METERS,
      (panoId) => {
        if (isCancelled) return;

        if (panoId === null) {
          setStatus("unavailable");
          return;
        }

        const roadview = new sdk.maps.Roadview(container);
        roadview.setPanoId(panoId, position);

        sdk.maps.event.addListener(roadview, "init", () => {
          if (isCancelled) return;

          const size = new sdk.maps.Size(FACILITY_MARKER_SIZE, FACILITY_MARKER_SIZE);
          const offset = new sdk.maps.Point(FACILITY_MARKER_SIZE / 2, FACILITY_MARKER_SIZE / 2);
          const marker = new sdk.maps.Marker({
            position,
            image: new sdk.maps.MarkerImage(FACILITY_MARKER_SRC.selected, size, { offset }),
            title: facility.name,
            map: roadview,
          });

          // 시설 마커가 화면 가운데 오도록 시점을 맞춘다
          const viewpoint = roadview
            .getProjection()
            .viewpointFromCoords(marker.getPosition(), marker.getAltitude());
          roadview.setViewpoint(viewpoint);
          setStatus("ready");
        });
      },
    );

    return () => {
      isCancelled = true;
    };
  }, [facility.name, position]);

  return (
    <section
      aria-label={`${facility.name} ${ROADVIEW_LABEL}`}
      style={{ marginBottom: CARD_TAIL_GAP }}
      className="bg-surface-default shadow-sheet w-[280px] overflow-hidden rounded-2xl"
    >
      <div className="flex items-center justify-between py-1 pr-2 pl-4">
        <h2 className="text-text-primary text-note-title truncate">{facility.name}</h2>
        <button
          type="button"
          onClick={onClose}
          aria-label={SHEET_CLOSE_LABEL}
          className="text-text-primary flex size-9 shrink-0 items-center justify-center rounded-full"
        >
          <X size={20} aria-hidden />
        </button>
      </div>

      <div className="relative h-[180px] w-full">
        <div ref={containerRef} className="size-full" hidden={status === "unavailable"} />

        {status !== "ready" && (
          <p
            role="status"
            className="bg-surface-default text-text-secondary text-note-title absolute inset-0 flex flex-col items-center justify-center gap-2"
          >
            {status === "loading" && (
              <LoaderCircle size={20} className="text-brand-teal-strong animate-spin" aria-hidden />
            )}
            {ROADVIEW_MESSAGES[status === "loading" ? "loading" : "unavailable"]}
          </p>
        )}
      </div>
    </section>
  );
}

export default FacilityRoadview;
