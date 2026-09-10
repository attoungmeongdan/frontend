import { useQuery } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { useEffect, useMemo, useRef, useState } from "react";
import { getFacilityMarkers, type FacilityMarker } from "@/apis/facility";
import { getMyProfile } from "@/apis/user";
import { MAP_ZOOM_LEVEL, SEARCH_RADIUS_METERS } from "@/constants/map";
import { MY_PROFILE_QUERY_KEY } from "@/hooks/useMyPage";
import type { Coordinates, MapStatus } from "@/types/map";
import { loadKakaoMapSdk } from "@/utils/kakaoMap";

const FACILITY_MARKERS_QUERY_KEY = ["facilities", "markers"] as const;

/** 서버가 24시간 캐시하므로 화면에서도 자주 다시 부르지 않는다 */
const FACILITY_STALE_TIME = 10 * 60 * 1000;

const RADIUS_STYLE = {
  strokeWeight: 1,
  strokeColor: "#0F989A",
  strokeOpacity: 1,
  fillColor: "#0F989A",
  fillOpacity: 0.05,
} as const;

/** 반경 원이 화면에 다 들어오도록 원의 경계를 계산한다 */
const METERS_PER_LAT_DEGREE = 111_320;

function toRadians(degree: number) {
  return (degree * Math.PI) / 180;
}

function getRadiusBounds(home: Coordinates) {
  const latDelta = SEARCH_RADIUS_METERS / METERS_PER_LAT_DEGREE;
  const lngDelta = SEARCH_RADIUS_METERS / (METERS_PER_LAT_DEGREE * Math.cos(toRadians(home.lat)));

  return {
    southWest: { lat: home.lat - latDelta, lng: home.lng - lngDelta },
    northEast: { lat: home.lat + latDelta, lng: home.lng + lngDelta },
  };
}

/** 집 좌표가 없으면 지도를 그릴 수 없다. 서버도 주소 미등록이면 400 을 준다 */
function isAddressProblem(error: unknown) {
  return isAxiosError(error) && error.response?.status === 400;
}

interface FacilityMapResult {
  status: MapStatus;
  home: Coordinates | null;
  facilities: FacilityMarker[];
  map: kakao.maps.Map | null;
  containerRef: React.RefObject<HTMLDivElement | null>;
  retry: () => void;
}

/**
 * 집 좌표로 지도를 띄우고 주변 시설 마커를 얹는다.
 * 반경 필터·거리 계산·정렬은 서버가 처리하므로 응답을 그대로 쓴다.
 */
export function useFacilityMap(): FacilityMapResult {
  const containerRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<kakao.maps.Map | null>(null);
  const [isSdkFailed, setIsSdkFailed] = useState(false);

  const profileQuery = useQuery({ queryKey: MY_PROFILE_QUERY_KEY, queryFn: getMyProfile });
  const facilityQuery = useQuery({
    queryKey: FACILITY_MARKERS_QUERY_KEY,
    queryFn: getFacilityMarkers,
    staleTime: FACILITY_STALE_TIME,
  });

  const address = profileQuery.data?.address;
  // 매 렌더마다 새 객체가 되면 지도를 다시 그리게 되므로 좌표가 같으면 유지한다
  const home = useMemo<Coordinates | null>(
    () =>
      address && address.lat !== null && address.lng !== null
        ? { lat: address.lat, lng: address.lng }
        : null,
    [address],
  );

  useEffect(() => {
    if (!home || map) return;

    let cancelled = false;

    const drawMap = async () => {
      let sdk: typeof kakao;

      try {
        sdk = await loadKakaoMapSdk();
      } catch {
        if (!cancelled) setIsSdkFailed(true);
        return;
      }

      if (cancelled || !containerRef.current) return;

      const center = new sdk.maps.LatLng(home.lat, home.lng);
      const created = new sdk.maps.Map(containerRef.current, {
        center,
        level: MAP_ZOOM_LEVEL,
      });

      new sdk.maps.Circle({ center, radius: SEARCH_RADIUS_METERS, ...RADIUS_STYLE }).setMap(
        created,
      );

      // 확대 레벨만으로는 화면 크기에 따라 반경 원이 잘리므로 원의 경계에 맞춘다
      const { southWest, northEast } = getRadiusBounds(home);
      created.setBounds(
        new sdk.maps.LatLngBounds(
          new sdk.maps.LatLng(southWest.lat, southWest.lng),
          new sdk.maps.LatLng(northEast.lat, northEast.lng),
        ),
      );

      setMap(created);
    };

    void drawMap();

    return () => {
      cancelled = true;
    };
  }, [home, map]);

  const retry = () => {
    setIsSdkFailed(false);
    void profileQuery.refetch();
    void facilityQuery.refetch();
  };

  return {
    status: resolveStatus({
      isSdkFailed,
      isPending: profileQuery.isPending || facilityQuery.isPending,
      profileError: profileQuery.error,
      facilityError: facilityQuery.error,
      hasHome: home !== null,
      hasMap: map !== null,
    }),
    home,
    facilities: facilityQuery.data ?? [],
    map,
    containerRef,
    retry,
  };
}

interface StatusInput {
  isSdkFailed: boolean;
  isPending: boolean;
  profileError: unknown;
  facilityError: unknown;
  hasHome: boolean;
  hasMap: boolean;
}

function resolveStatus({
  isSdkFailed,
  isPending,
  profileError,
  facilityError,
  hasHome,
  hasMap,
}: StatusInput): MapStatus {
  if (isSdkFailed) return "mapFailed";
  if (isPending) return "loading";

  // 주소 미등록은 좌표가 없다는 뜻이라 지도를 그릴 수 없다
  if (isAddressProblem(facilityError) || (!hasHome && !profileError)) {
    return "addressUnavailable";
  }

  if (profileError || facilityError) return "mapFailed";

  return hasMap ? "ready" : "loading";
}
