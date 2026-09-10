import { axiosInstance } from "@/apis/axiosInstance";
import type { CommonResponse } from "@/types/api";

/** 서버가 내 주소 기준 5km 이내를 거리순으로 내려준다 */
export interface FacilityMarker {
  id: number;
  name: string;
  category: string;
  roadNameAddress: string;
  lat: number;
  lng: number;
  /** 집에서의 거리(km) */
  distanceKm: number;
}

// 주변 운동시설 마커 목록. 요청 파라미터가 없고 반경·정렬은 서버가 처리한다
export async function getFacilityMarkers() {
  const { data } = await axiosInstance.get<CommonResponse<FacilityMarker[]>>(
    "/api/v1/facilities/markers",
  );

  return data.data;
}
