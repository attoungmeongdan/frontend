import { LoaderCircle, MapPin, TriangleAlert } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence } from "motion/react";
import FacilityBottomSheet from "@/components/map/FacilityBottomSheet";
import MapCenterMessage from "@/components/map/MapCenterMessage";
import MapMarkers from "@/components/map/MapMarkers";
import { FOCUS_ZOOM_LEVEL, MAP_MESSAGES } from "@/constants/map";
import { useFacilityMap } from "@/hooks/useFacilityMap";

// 09_Map — /map (집 주소 기준 반경 5km 공공 체육시설)
function MapPage() {
  const { status, home, facilities, map, containerRef, retry } = useFacilityMap();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  // 진입 시 랜덤으로 고른 시설. 이 시설을 보는 동안만 추천 말풍선을 띄운다
  const [recommendedId, setRecommendedId] = useState<number | null>(null);
  const hasAutoSelectedRef = useRef(false);

  // 지도 탭에 들어올 때마다 시설 하나를 랜덤으로 골라 보여준다.
  // 페이지가 라우트 단위로 다시 마운트되므로 마운트당 한 번만 고르면 진입마다 바뀐다.
  // 닫은 뒤 시설 목록이 갱신돼도 다시 고르지 않도록 ref 로 막는다
  useEffect(() => {
    if (status !== "ready" || !map || facilities.length === 0 || hasAutoSelectedRef.current) {
      return;
    }

    hasAutoSelectedRef.current = true;

    const picked = facilities[Math.floor(Math.random() * facilities.length)];

    // 5km 원 전체 보기 레벨에선 마커가 클러스터에 묶이므로 개별 마커가 보이게 확대한다.
    // 중앙 이동은 MapMarkers 의 선택 effect 가 panTo 로 처리한다
    map.setLevel(FOCUS_ZOOM_LEVEL);
    setRecommendedId(picked.id);
    setSelectedId(picked.id);
  }, [status, map, facilities]);

  const handleSelect = useCallback((facilityId: number) => setSelectedId(facilityId), []);
  const closeSheet = () => setSelectedId(null);

  const selectedFacility = facilities.find((facility) => facility.id === selectedId) ?? null;
  const isEmpty = status === "ready" && facilities.length === 0;

  return (
    <div className="relative h-full w-full overflow-hidden">
      <div ref={containerRef} className="size-full bg-[#E8EFEA]" />

      <MapMarkers
        map={map}
        home={home}
        facilities={facilities}
        selectedId={selectedId}
        onSelect={handleSelect}
      />

      {status === "loading" && (
        <MapCenterMessage
          icon={LoaderCircle}
          iconClassName="text-brand-teal-strong animate-spin"
          title={MAP_MESSAGES.loading.title}
          description={MAP_MESSAGES.loading.description}
        />
      )}

      {status === "addressUnavailable" && (
        <MapCenterMessage
          icon={TriangleAlert}
          iconClassName="text-feedback-error"
          title={MAP_MESSAGES.addressUnavailable.title}
          description={MAP_MESSAGES.addressUnavailable.description}
          action={{ label: MAP_MESSAGES.addressUnavailable.action, onClick: retry }}
        />
      )}

      {status === "mapFailed" && (
        <MapCenterMessage
          icon={TriangleAlert}
          iconClassName="text-feedback-error"
          title={MAP_MESSAGES.mapFailed.title}
          description={MAP_MESSAGES.mapFailed.description}
          action={{ label: MAP_MESSAGES.mapFailed.action, onClick: retry }}
        />
      )}

      {isEmpty && (
        <MapCenterMessage
          icon={MapPin}
          title={MAP_MESSAGES.empty.title}
          description={MAP_MESSAGES.empty.description}
        />
      )}

      {/* 시트가 내려가는 모션까지 보이도록 AnimatePresence 로 감싼다.
          시설을 바꿀 때는 key 가 같아 시트가 유지되고 내용만 슬라이드된다 */}
      <AnimatePresence>
        {selectedFacility && (
          <FacilityBottomSheet
            key="facility-sheet"
            facility={selectedFacility}
            isRecommended={selectedFacility.id === recommendedId}
            onClose={closeSheet}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default MapPage;
