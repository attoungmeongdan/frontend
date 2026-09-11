import { isAxiosError } from "axios";
import { GROUP_ERROR_MESSAGES, GROUP_FALLBACK_ERROR } from "@/constants/group";

export function toGroupErrorMessage(error: unknown) {
  if (!isAxiosError(error)) return GROUP_FALLBACK_ERROR;

  const body = error.response?.data as { code?: unknown; message?: unknown } | undefined;
  const code = typeof body?.code === "string" ? body.code : null;

  if (code && GROUP_ERROR_MESSAGES[code]) return GROUP_ERROR_MESSAGES[code];
  if (typeof body?.message === "string" && body.message) return body.message;

  return GROUP_FALLBACK_ERROR;
}
