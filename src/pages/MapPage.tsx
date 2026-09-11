import { LoaderCircle, MapPin, TriangleAlert } from "lucide-react";
import { useCallback, useState } from "react";
import FacilityBottomSheet from "@/components/map/FacilityBottomSheet";
import MapCenterMessage from "@/components/map/MapCenterMessage";
import MapMarkers from "@/components/map/MapMarkers";
import { MAP_MESSAGES } from "@/constants/map";
import { useFacilityMap } from "@/hooks/useFacilityMap";

// 09_Map — /map (집 주소 기준 반경 5km 공공 체육시설)
function MapPage() {
  const { status, home, facilities, map, containerRef, retry } = useFacilityMap();
  const [selectedId, setSelectedId] = useState<number | null>(null);

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

      {selectedFacility && <FacilityBottomSheet facility={selectedFacility} onClose={closeSheet} />}
    </div>
  );
}

export default MapPage;
