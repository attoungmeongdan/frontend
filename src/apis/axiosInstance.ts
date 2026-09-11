import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";
import {
  expireSession,
  getAccessToken,
  getSessionId,
  updateTokenForSession,
} from "@/apis/tokenStore";
import type { CommonResponse } from "@/types/api";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const REFRESH_PATH = "/api/v1/auth/refresh";
// 응답이 끝내 오지 않으면 화면이 스플래시에 갇힌다. 실패로 떨어뜨려 오류 화면으로 넘긴다
const TIMEOUT_MS = 10_000;

export const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: TIMEOUT_MS,
  // 서버가 refresh_token / signup_token 을 HttpOnly 쿠키로 내려주므로 필요하다
  withCredentials: true,
});

axiosInstance.interceptors.request.use((config) => {
  const token = getAccessToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// 동시에 401 이 여러 개 떠도 갱신은 한 번만 요청한다
let refreshing: Promise<string> | null = null;

function requestNewAccessToken() {
  if (!refreshing) {
    // axiosInstance 를 쓰면 이 인터셉터를 다시 타므로 순수 axios 로 호출한다
    refreshing = axios
      .post<CommonResponse<{ accessToken: string }>>(`${API_BASE_URL}${REFRESH_PATH}`, null, {
        withCredentials: true,
        timeout: TIMEOUT_MS,
      })
      .then((response) => response.data.data.accessToken)
      .finally(() => {
        refreshing = null;
      });
  }

  return refreshing;
}

/** 로그아웃 시 호출. 새 세션이 이전 세션의 갱신 요청을 이어받지 않게 한다. */
export function invalidatePendingRefresh() {
  refreshing = null;
}

type RetriableConfig = InternalAxiosRequestConfig & { isRetried?: boolean };

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const config = error.config as RetriableConfig | undefined;

    const shouldRefresh =
      error.response?.status === 401 &&
      config &&
      !config.isRetried &&
      !config.url?.includes(REFRESH_PATH);

    if (!shouldRefresh) {
      return Promise.reject(error);
    }

    config.isRetried = true;

    // 갱신을 시작한 세션을 기억해 둔다
    const sessionId = getSessionId();

    let accessToken: string;

    try {
      accessToken = await requestNewAccessToken();
    } catch (refreshError) {
      expireSession();

      return Promise.reject(refreshError);
    }

    // 기다리는 사이 로그아웃·재로그인이 있었다면 이 토큰은 버린다
    if (!updateTokenForSession(accessToken, sessionId)) {
      return Promise.reject(error);
    }

    config.headers.Authorization = `Bearer ${accessToken}`;

    return axiosInstance(config);
  },
);
