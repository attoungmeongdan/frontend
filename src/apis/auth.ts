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
  // 토큰을 먼저 지우면 Authorization 헤더 없이 요청이 나가 서버가 500 을 준다.
  // 요청을 먼저 보내고, 성공 여부와 무관하게 세션을 끊는다.
  // 진행 중인 갱신이 있어도 세대 번호가 올라가 그 결과는 저장되지 않는다.
  try {
    await axiosInstance.post<CommonResponse<void>>("/api/v1/auth/logout");
  } finally {
    clearAccessToken();
    invalidatePendingRefresh();
  }
}
