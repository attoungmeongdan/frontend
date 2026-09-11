import type { Gender } from "@/apis/auth";
import { axiosInstance, invalidatePendingRefresh } from "@/apis/axiosInstance";
import { clearAccessToken } from "@/apis/tokenStore";
import type { CommonResponse } from "@/types/api";

export interface UserAddress {
  id: number;
  roadNameAddress: string;
  lotNumberAddress: string;
  /** 미입력 시 null */
  detailAddress: string | null;
  /** 카카오 주소 변환 실패 시 null */
  lat: number | null;
  lng: number | null;
}

/** 온보딩에서 받지 않았거나 건너뛴 항목은 null 로 온다 */
export interface UserProfile {
  id: number;
  email: string;
  nickname: string;
  /** KAKAO | GOOGLE */
  provider: string;
  age: number | null;
  gender: Gender | null;
  /** cm */
  height: number | null;
  /** kg */
  weight: number | null;
  /** 키·몸무게가 모두 있을 때만 값이 있다. 추천 운동 연동에서 쓴다 */
  bmi: number | null;
  /** 기존 가입자 중 미등록이면 null */
  address: UserAddress | null;
  /** 가입 일시(ISO date-time). 캘린더에서 가입일 이전 날짜를 가리는 데 쓴다 */
  createdAt: string;
}

// 내 프로필 조회
export async function getMyProfile() {
  const { data } = await axiosInstance.get<CommonResponse<UserProfile>>("/api/v1/users/me");

  return data.data;
}

/**
 * 프로필 수정 요청.
 * 서버가 age·height·weight 를 null 로 받으면 값을 지우므로,
 * 고치지 않는 필드도 기존 값을 그대로 실어 보낸다.
 */
export interface UserProfileUpdate {
  nickname: string;
  age: number | null;
  gender: Gender | null;
  height: number | null;
  weight: number | null;
}

// 내 프로필 수정. 주소는 MVP 에서 수정 대상이 아니다
export async function updateMyProfile(payload: UserProfileUpdate) {
  const { data } = await axiosInstance.patch<CommonResponse<UserProfile>>(
    "/api/v1/users/me",
    payload,
  );

  return data.data;
}

// 회원탈퇴. 토큰이 있어야 요청이 나가므로 성공한 뒤에 세션을 끊는다
export async function withdraw() {
  await axiosInstance.delete<CommonResponse<void>>("/api/v1/users/me");

  clearAccessToken();
  invalidatePendingRefresh();
}
