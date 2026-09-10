import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";
import { clearAccessToken, getAccessToken, setAccessToken } from "@/apis/tokenStore";
import type { CommonResponse } from "@/types/api";

const baseURL = import.meta.env.VITE_API_BASE_URL;
const REFRESH_PATH = "/api/v1/auth/refresh";

export const axiosInstance = axios.create({
  baseURL,
  withCredentials: true,
});

axiosInstance.interceptors.request.use((config) => {
  const token = getAccessToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

let refreshing: Promise<string> | null = null;

function requestNewAccessToken() {
  if (!refreshing) {
    refreshing = axios
      .post<CommonResponse<{ accessToken: string }>>(`${baseURL}${REFRESH_PATH}`, null, {
        withCredentials: true,
      })
      .then((response) => response.data.data.accessToken)
      .finally(() => {
        refreshing = null;
      });
  }

  return refreshing;
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

    try {
      const accessToken = await requestNewAccessToken();
      setAccessToken(accessToken);
      config.headers.Authorization = `Bearer ${accessToken}`;

      return await axiosInstance(config);
    } catch (refreshError) {
      clearAccessToken();

      return Promise.reject(refreshError);
    }
  },
);
