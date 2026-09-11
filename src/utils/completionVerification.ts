import { isAxiosError } from "axios";

export class CompletionPendingError extends Error {}
export class SessionResultMismatchError extends Error {}

/** Retry reads only. A socket event can arrive before result/progress is visible. */
export async function readCompletion<T>(
  read: (signal: AbortSignal) => Promise<T>,
  signal: AbortSignal,
): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    signal.throwIfAborted();
    try {
      const result = await read(signal);
      signal.throwIfAborted();
      return result;
    } catch (error) {
      signal.throwIfAborted();
      const status = isAxiosError(error) ? error.response?.status : undefined;
      const transient =
        error instanceof CompletionPendingError ||
        (isAxiosError(error) && (!status || status >= 500 || status === 429));
      if (!transient || attempt >= 3) throw error;
      await new Promise<void>((resolve, reject) => {
        const abort = () => {
          clearTimeout(timer);
          reject(signal.reason);
        };
        const timer = setTimeout(() => {
          signal.removeEventListener("abort", abort);
          resolve();
        }, 1000);
        signal.addEventListener("abort", abort, { once: true });
      });
    }
  }
}

/** Never log Axios configs, auth headers, socket tickets or landmark payloads. */
export function reportSessionError(operation: string, sessionId: number | null, error: unknown) {
  if (!import.meta.env.DEV) return;
  const data = isAxiosError(error) ? error.response?.data : undefined;
  console.warn("[exercise-session]", {
    operation,
    sessionId,
    status: isAxiosError(error) ? error.response?.status : undefined,
    code:
      data?.code ??
      (error && typeof error === "object" && "code" in error ? error.code : undefined),
    message:
      data?.message ??
      (error && typeof error === "object" && "message" in error ? error.message : String(error)),
  });
}
