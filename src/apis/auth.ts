import { axiosInstance } from "@/apis/axiosInstance";
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
  await axiosInstance.post<CommonResponse<void>>("/api/v1/auth/logout");
}
