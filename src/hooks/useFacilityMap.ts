import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MAP_ZOOM_LEVEL, SEARCH_RADIUS_METERS } from "@/constants/map";
import { createFacilityMocks, HOME_ADDRESS } from "@/mocks/map";
import type { Coordinates, FacilityWithDistance, MapStatus } from "@/types/map";
import { getDistanceInMeters, offsetCoordinates } from "@/utils/geo";
import { geocodeAddress, loadKakaoMapSdk } from "@/utils/kakaoMap";

const RADIUS_STYLE = {
  strokeWeight: 1,
  strokeColor: "#0F989A",
  strokeOpacity: 1,
  fillColor: "#0F989A",
  fillOpacity: 0.05,
} as const;

interface FacilityMapState {
  status: MapStatus;
  home: Coordinates | null;
  facilities: FacilityWithDistance[];
  map: kakao.maps.Map | null;
}

/**
 * 집 주소를 좌표로 변환해 지도를 띄우고, 반경 5km 안의 공공 체육시설을 추린다.
 * 지도 로드 실패와 주소 변환 실패를 구분해 화면에서 다르게 안내한다.
 */
export function useFacilityMap() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [state, setState] = useState<FacilityMapState>({
    status: "loading",
    home: null,
    facilities: [],
    map: null,
  });

  useEffect(() => {
    let cancelled = false;

    setState((prev) => ({ ...prev, status: "loading" }));

    const initialize = async () => {
      let sdk: typeof kakao;

      try {
        sdk = await loadKakaoMapSdk();
      } catch {
        if (!cancelled) setState((prev) => ({ ...prev, status: "mapFailed" }));
        return;
      }

      let home: Coordinates;

      try {
        home = await geocodeAddress(sdk, HOME_ADDRESS);
      } catch {
        if (!cancelled) setState((prev) => ({ ...prev, status: "geocodeFailed" }));
        return;
      }

      if (cancelled || !containerRef.current) return;

      const center = new sdk.maps.LatLng(home.lat, home.lng);
      const map = new sdk.maps.Map(containerRef.current, { center, level: MAP_ZOOM_LEVEL });

      new sdk.maps.Circle({
        center,
        radius: SEARCH_RADIUS_METERS,
        ...RADIUS_STYLE,
      }).setMap(map);

      // 확대 레벨만으로는 화면 크기에 따라 반경 원이 잘리므로 원의 경계에 맞춘다
      const southWest = offsetCoordinates(home, -SEARCH_RADIUS_METERS, -SEARCH_RADIUS_METERS);
      const northEast = offsetCoordinates(home, SEARCH_RADIUS_METERS, SEARCH_RADIUS_METERS);
      map.setBounds(
        new sdk.maps.LatLngBounds(
          new sdk.maps.LatLng(southWest.lat, southWest.lng),
          new sdk.maps.LatLng(northEast.lat, northEast.lng),
        ),
      );

      const facilities = createFacilityMocks(home)
        .map((facility) => ({
          ...facility,
          distance: getDistanceInMeters(home, facility.coordinates),
        }))
        .filter((facility) => facility.distance <= SEARCH_RADIUS_METERS)
        .sort((a, b) => a.distance - b.distance);

      setState({ status: "ready", home, facilities, map });
    };

    void initialize();

    return () => {
      cancelled = true;
    };
  }, [retryCount]);

  const retry = useCallback(() => setRetryCount((count) => count + 1), []);

  return useMemo(() => ({ ...state, containerRef, retry }), [state, retry]);
}
