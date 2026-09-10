import { axiosInstance, invalidatePendingRefresh } from "@/apis/axiosInstance";
import { clearAccessToken } from "@/apis/tokenStore";
import type { CommonResponse } from "@/types/api";

export type SocialProvider = "kakao" | "google";
export type OAuthResultType = "REGISTERED" | "SIGNUP_REQUIRED";
export type Gender = "MALE" | "FEMALE";

export interface AuthToken {
  accessToken: string;
  tokenType: string;
}

export interface OAuthSignupRequest {
  nickname: string;
  age?: number;
  gender?: Gender;
  height?: number;
  weight?: number;
  address?: {
    roadNameAddress?: string;
    lotNumberAddress?: string;
    detailAddress?: string;
  };
}

export async function getAuthorizeUrl(provider: SocialProvider) {
  const { data } = await axiosInstance.get<CommonResponse<{ authorizeUrl: string }>>(
    `/api/v1/auth/oauth2/${provider}/authorize`,
  );

  return data.data.authorizeUrl;
}

// 콜백
export async function handleOAuthCallback(provider: SocialProvider, code: string, state: string) {
  const { data } = await axiosInstance.get<CommonResponse<{ resultType: OAuthResultType }>>(
    `/api/v1/auth/oauth2/${provider}/callback`,
    { params: { code, state } },
  );

  return data.data.resultType;
}

// 회원가입
export async function oauthSignup(payload: OAuthSignupRequest) {
  const { data } = await axiosInstance.post<CommonResponse<AuthToken>>(
    "/api/v1/auth/oauth2/signup",
    payload,
  );

  return data.data;
}

// 재발급
export async function refreshAccessToken() {
  const { data } = await axiosInstance.post<CommonResponse<AuthToken>>("/api/v1/auth/refresh");

  return data.data;
}

// 로그아웃
export async function logout() {
  // 서버 응답을 기다리지 않고 먼저 끊는다.
  // 진행 중인 갱신이 있어도 세대 번호가 올라가 그 결과는 저장되지 않는다.
  clearAccessToken();
  invalidatePendingRefresh();

  await axiosInstance.post<CommonResponse<void>>("/api/v1/auth/logout");
}
