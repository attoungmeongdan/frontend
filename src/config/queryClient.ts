import { QueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";

const STALE_TIME = 60 * 1000;
const MAX_RETRY = 3;

/**
 * 서버 오류(5xx)와 응답을 받지 못한 경우에만 재시도한다.
 * 401·404 처럼 원인이 분명한 실패는 다시 보내도 같은 결과라 바로 오류 화면으로 넘긴다.
 */
export function shouldRetry(failureCount: number, error: Error) {
  if (failureCount >= MAX_RETRY) return false;
  if (!isAxiosError(error)) return false;

  const status = error.response?.status;

  return status === undefined || status >= 500;
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: STALE_TIME,
      retry: shouldRetry,
    },
  },
});
