import { axiosInstance } from "@/apis/axiosInstance";
import { API_BASE_URL } from "@/config/env";
import type { ExerciseType } from "@/constants/exercises";
import type {
  ExerciseApiType,
  ExerciseSessionCreateResponse,
  ExerciseSessionResult,
  MeasurementProgress,
} from "@/types/exercise";
import type { CommonResponse } from "@/types/api";

export const EXERCISE_API_TYPE: Record<ExerciseType, ExerciseApiType> = {
  "chair-stand": "CHAIR_STAND",
  "push-up": "PUSH_UP",
  "sit-up": "SIT_UP",
  plank: "PLANK",
};

export async function createWorkoutSession(
  exerciseType: ExerciseApiType,
  measurementGroupId?: string,
  mode: "WORKOUT" | "MEASUREMENT" = "WORKOUT",
) {
  const response = await axiosInstance.post<CommonResponse<ExerciseSessionCreateResponse>>(
    "/api/v1/exercise-sessions",
    { mode, exerciseType, ...(measurementGroupId ? { measurementGroupId } : {}) },
  );

  return response.data.data;
}

export async function getMeasurementProgress() {
  const response = await axiosInstance.get<CommonResponse<MeasurementProgress>>(
    "/api/v1/exercise-sessions/measurement/progress",
  );
  return response.data.data;
}

export async function resumeMeasurementSession() {
  const response = await axiosInstance.post<CommonResponse<ExerciseSessionCreateResponse>>(
    "/api/v1/exercise-sessions/measurement/resume",
  );
  return response.data.data;
}

export async function restartMeasurementSession() {
  const response = await axiosInstance.post<CommonResponse<ExerciseSessionCreateResponse>>(
    "/api/v1/exercise-sessions/measurement/restart",
  );
  return response.data.data;
}

export async function completeWorkoutSession(sessionId: number) {
  const response = await axiosInstance.post<CommonResponse<ExerciseSessionResult>>(
    `/api/v1/exercise-sessions/${sessionId}/complete`,
  );

  return response.data.data;
}

export async function getWorkoutSessionResult(sessionId: number) {
  const response = await axiosInstance.get<CommonResponse<ExerciseSessionResult>>(
    `/api/v1/exercise-sessions/${sessionId}/result`,
  );

  return response.data.data;
}

export function createExerciseWebSocketUrl(webSocketPath: string, socketTicket: string) {
  const url = new URL(webSocketPath, `${API_BASE_URL}/`);
  url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
  url.searchParams.set("ticket", socketTicket);

  return url.toString();
}
