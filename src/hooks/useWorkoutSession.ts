import { useCallback, useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import {
  completeWorkoutSession,
  createExerciseWebSocketUrl,
  createWorkoutSession,
  EXERCISE_API_TYPE,
  getWorkoutSessionResult,
} from "@/apis/exerciseSessions";
import type { ExerciseType } from "@/constants/exercises";
import type {
  ExerciseAnalysisResult,
  ExerciseSessionCreateResponse,
  ExerciseSessionResult,
  ExerciseSocketError,
  PoseLandmarkPayload,
} from "@/types/exercise";

type WorkoutConnectionState = "idle" | "connecting" | "active" | "completing" | "error";
type RetryAction = "start" | "socket" | "complete" | "verify";

interface WorkoutDiagnostics {
  sessionId: number | null;
  webSocketPath: string | null;
  sentFrames: number;
  transmissionFps: number;
  lastReceivedAt: number | null;
  socketCloseCode: number | null;
  socketCloseReason: string | null;
}

interface UseWorkoutSessionOptions {
  exerciseType: ExerciseType;
  onCompleted: (sessionId: number, measurementGroupId?: string | null) => void;
  mode?: "WORKOUT" | "MEASUREMENT";
  measurementGroupId?: string | null;
  createSession?: () => Promise<ExerciseSessionCreateResponse>;
}

function isSocketMessage(value: unknown): value is ExerciseAnalysisResult | ExerciseSocketError {
  if (!value || typeof value !== "object" || !("type" in value)) return false;
  const type = (value as { type?: unknown }).type;
  if (type === "ERROR") {
    return "message" in value && typeof value.message === "string";
  }
  return (
    (type === "ANALYSIS_RESULT" || type === "SESSION_COMPLETED") &&
    "sessionId" in value &&
    typeof value.sessionId === "number" &&
    "validCount" in value &&
    typeof value.validCount === "number" &&
    "validDurationMs" in value &&
    typeof value.validDurationMs === "number" &&
    "feedback" in value &&
    Array.isArray(value.feedback)
  );
}

function errorMessage(error: unknown, fallback: string) {
  if (isAxiosError(error)) {
    const response = error.response?.data as { message?: unknown } | undefined;
    if (typeof response?.message === "string" && response.message) return response.message;
  }
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

export function useWorkoutSession({
  exerciseType,
  onCompleted,
  mode = "WORKOUT",
  measurementGroupId,
  createSession,
}: UseWorkoutSessionOptions) {
  const queryClient = useQueryClient();
  const socketRef = useRef<WebSocket | null>(null);
  const sessionRef = useRef<ExerciseSessionCreateResponse | null>(null);
  const connectionStateRef = useRef<WorkoutConnectionState>("idle");
  const attemptRef = useRef(0);
  const socketGenerationRef = useRef(0);
  const sequenceRef = useRef(0);
  const lastTimestampRef = useRef(0);
  const lastSentAtRef = useRef(0);
  const completedRef = useRef(false);
  const onCompletedRef = useRef(onCompleted);
  const [connectionState, setConnectionState] = useState<WorkoutConnectionState>("idle");
  const [analysis, setAnalysis] = useState<ExerciseAnalysisResult | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [retryAction, setRetryAction] = useState<RetryAction>("start");
  const [diagnostics, setDiagnostics] = useState<WorkoutDiagnostics>({
    sessionId: null,
    webSocketPath: null,
    sentFrames: 0,
    transmissionFps: 0,
    lastReceivedAt: null,
    socketCloseCode: null,
    socketCloseReason: null,
  });

  useEffect(() => {
    onCompletedRef.current = onCompleted;
  }, [onCompleted]);

  const updateConnectionState = useCallback((state: WorkoutConnectionState) => {
    connectionStateRef.current = state;
    setConnectionState(state);
  }, []);

  const closeSocket = useCallback(() => {
    socketGenerationRef.current += 1;
    const socket = socketRef.current;
    socketRef.current = null;
    if (
      socket &&
      (socket.readyState === WebSocket.CONNECTING || socket.readyState === WebSocket.OPEN)
    ) {
      socket.close(1000, "client cleanup");
    }
  }, []);

  const moveToCompleted = useCallback(
    (sessionId: number) => {
      if (completedRef.current) return;
      const completedMeasurementGroupId = sessionRef.current?.measurementGroupId;
      completedRef.current = true;
      closeSocket();
      sessionRef.current = null;
      setAnalysis(null);
      setConnectionError(null);
      setRetryAction("start");
      updateConnectionState("idle");
      void queryClient.invalidateQueries({ queryKey: ["recent-seven-days"] });
      onCompletedRef.current(sessionId, completedMeasurementGroupId);
    },
    [closeSocket, queryClient, updateConnectionState],
  );

  const verifyCompletedResult = useCallback(
    async (sessionId: number) => {
      const result = await getWorkoutSessionResult(sessionId);
      if (result.status !== "COMPLETED") {
        throw new Error("서버에서 운동 기록 완료를 확인하지 못했어요.");
      }
      moveToCompleted(sessionId);
    },
    [moveToCompleted],
  );

  const handleMessage = useCallback(
    (event: MessageEvent<string>, sessionId: number) => {
      let message: unknown;
      try {
        message = JSON.parse(event.data) as unknown;
      } catch {
        setConnectionError("서버가 보낸 판정값을 읽지 못했어요.");
        return;
      }

      if (!isSocketMessage(message)) return;
      setDiagnostics((current) => ({ ...current, lastReceivedAt: Date.now() }));

      if (message.type === "ERROR") {
        setConnectionError(message.message || "자세 판정 중 오류가 발생했어요.");
        return;
      }

      if (message.sessionId !== sessionId) return;
      setAnalysis(message);
      setConnectionError(null);

      if (message.type === "SESSION_COMPLETED") {
        updateConnectionState("completing");
        if (mode === "MEASUREMENT") {
          moveToCompleted(sessionId);
          return;
        }
        void verifyCompletedResult(sessionId).catch((error: unknown) => {
          setConnectionError(errorMessage(error, "완료된 운동 기록을 확인하지 못했어요."));
          setRetryAction("verify");
          updateConnectionState("error");
        });
      }
    },
    [mode, moveToCompleted, updateConnectionState, verifyCompletedResult],
  );

  const connectSocket = useCallback(
    (session: ExerciseSessionCreateResponse, attempt: number) => {
      closeSocket();
      const socketGeneration = socketGenerationRef.current;
      let opened = false;
      const socket = new WebSocket(
        createExerciseWebSocketUrl(session.webSocketPath, session.socketTicket),
      );
      socketRef.current = socket;
      socket.addEventListener("open", () => {
        if (attempt !== attemptRef.current || socketGeneration !== socketGenerationRef.current) {
          return;
        }
        opened = true;
        updateConnectionState("active");
      });
      socket.addEventListener("message", (event: MessageEvent<string>) => {
        if (attempt === attemptRef.current && socketGeneration === socketGenerationRef.current) {
          handleMessage(event, session.sessionId);
        }
      });
      socket.addEventListener("error", () => {
        if (attempt !== attemptRef.current || socketGeneration !== socketGenerationRef.current) {
          return;
        }
        setConnectionError("운동 판정 서버에 연결하지 못했어요.");
      });
      socket.addEventListener("close", (event) => {
        if (attempt !== attemptRef.current || socketGeneration !== socketGenerationRef.current) {
          return;
        }
        setDiagnostics((current) => ({
          ...current,
          socketCloseCode: event.code,
          socketCloseReason: event.reason || null,
        }));
        if (completedRef.current || connectionStateRef.current === "completing") return;

        if (!opened) {
          setConnectionError("WebSocket 연결을 열지 못했어요. 같은 티켓으로 다시 시도해 주세요.");
          setRetryAction("socket");
        } else {
          setConnectionError("운동 판정 연결이 끊겼어요. 새 세션으로 다시 시작해 주세요.");
          setRetryAction("start");
        }
        updateConnectionState("error");
      });
    },
    [closeSocket, handleMessage, updateConnectionState],
  );

  const start = useCallback(async () => {
    if (
      connectionStateRef.current === "connecting" ||
      connectionStateRef.current === "completing"
    ) {
      return;
    }

    const attempt = attemptRef.current + 1;
    attemptRef.current = attempt;
    closeSocket();
    sessionRef.current = null;
    sequenceRef.current = 0;
    lastTimestampRef.current = 0;
    lastSentAtRef.current = 0;
    completedRef.current = false;
    setAnalysis(null);
    setConnectionError(null);
    setRetryAction("start");
    setDiagnostics({
      sessionId: null,
      webSocketPath: null,
      sentFrames: 0,
      transmissionFps: 0,
      lastReceivedAt: null,
      socketCloseCode: null,
      socketCloseReason: null,
    });
    updateConnectionState("connecting");

    try {
      const session = createSession
        ? await createSession()
        : await createWorkoutSession(
            EXERCISE_API_TYPE[exerciseType],
            measurementGroupId ?? undefined,
            mode,
          );
      if (attempt !== attemptRef.current) return;
      sessionRef.current = session;
      setDiagnostics((current) => ({
        ...current,
        sessionId: session.sessionId,
        webSocketPath: session.webSocketPath,
        transmissionFps: Math.max(1, session.transmissionFps || 10),
      }));

      connectSocket(session, attempt);
    } catch (error) {
      if (attempt !== attemptRef.current) return;
      setConnectionError(errorMessage(error, "운동 세션을 시작하지 못했어요."));
      setRetryAction("start");
      updateConnectionState("error");
    }
  }, [
    closeSocket,
    connectSocket,
    createSession,
    exerciseType,
    measurementGroupId,
    mode,
    updateConnectionState,
  ]);

  const sendPoseFrame = useCallback((landmarks: PoseLandmarkPayload[]) => {
    const socket = socketRef.current;
    const session = sessionRef.current;
    if (
      connectionStateRef.current !== "active" ||
      !socket ||
      socket.readyState !== WebSocket.OPEN ||
      !session ||
      landmarks.length !== 33
    ) {
      return;
    }

    const now = performance.now();
    const transmissionFps = Math.max(1, session.transmissionFps || 10);
    if (now - lastSentAtRef.current < 1_000 / transmissionFps || socket.bufferedAmount > 65_536) {
      return;
    }

    lastSentAtRef.current = now;
    const timestamp = Math.max(Date.now(), lastTimestampRef.current + 1);
    const sequence = sequenceRef.current + 1;
    lastTimestampRef.current = timestamp;
    sequenceRef.current = sequence;
    socket.send(
      JSON.stringify({
        type: "POSE_FRAME",
        sessionId: session.sessionId,
        exerciseType: session.exerciseType,
        sequence,
        timestamp,
        mirrored: false,
        landmarks,
        worldLandmarks: null,
      }),
    );
    setDiagnostics((current) => ({ ...current, sentFrames: sequence }));
  }, []);

  const complete = useCallback(async () => {
    if (mode === "MEASUREMENT") return;
    const sessionId = sessionRef.current?.sessionId;
    if (!sessionId || connectionStateRef.current === "completing" || completedRef.current) return;

    updateConnectionState("completing");
    setConnectionError(null);
    try {
      const result: ExerciseSessionResult = await completeWorkoutSession(sessionId);
      if (result.status !== "COMPLETED") {
        throw new Error("운동 기록 저장이 아직 완료되지 않았어요.");
      }
      moveToCompleted(sessionId);
    } catch (error) {
      try {
        const result = await getWorkoutSessionResult(sessionId);
        if (result.status === "COMPLETED") {
          moveToCompleted(sessionId);
          return;
        }
        if (result.status === "EXPIRED" || result.status === "CANCELLED") {
          closeSocket();
          sessionRef.current = null;
          setConnectionError(
            "자세 인식이 오래 끊겨 세션이 종료됐어요. 새 세션으로 다시 시작해 주세요.",
          );
          setRetryAction("start");
          updateConnectionState("error");
          return;
        }
        throw new Error("운동 기록 저장이 아직 완료되지 않았어요.");
      } catch {
        setConnectionError(errorMessage(error, "운동 기록을 저장하지 못했어요."));
        setRetryAction("complete");
        updateConnectionState("error");
      }
    }
  }, [closeSocket, mode, moveToCompleted, updateConnectionState]);

  const retry = useCallback(() => {
    const sessionId = sessionRef.current?.sessionId;
    if (retryAction === "socket" && sessionRef.current) {
      setConnectionError(null);
      setDiagnostics((current) => ({
        ...current,
        socketCloseCode: null,
        socketCloseReason: null,
      }));
      updateConnectionState("connecting");
      connectSocket(sessionRef.current, attemptRef.current);
      return;
    }
    if (retryAction === "verify" && sessionId) {
      updateConnectionState("completing");
      setConnectionError(null);
      void verifyCompletedResult(sessionId).catch((error: unknown) => {
        setConnectionError(errorMessage(error, "완료된 운동 기록을 확인하지 못했어요."));
        setRetryAction("verify");
        updateConnectionState("error");
      });
      return;
    }
    if (retryAction === "complete") {
      void complete();
      return;
    }
    attemptRef.current += 1;
    closeSocket();
    sessionRef.current = null;
    completedRef.current = false;
    setAnalysis(null);
    setConnectionError(null);
    updateConnectionState("idle");
  }, [
    closeSocket,
    complete,
    connectSocket,
    retryAction,
    updateConnectionState,
    verifyCompletedResult,
  ]);

  const cancel = useCallback(() => {
    attemptRef.current += 1;
    closeSocket();
    sessionRef.current = null;
    updateConnectionState("idle");
  }, [closeSocket, updateConnectionState]);

  useEffect(
    () => () => {
      attemptRef.current += 1;
      closeSocket();
    },
    [closeSocket],
  );

  return {
    connectionState,
    analysis,
    connectionError,
    retryLabel:
      retryAction === "start"
        ? "시작 자세 다시 잡기"
        : retryAction === "socket"
          ? "WebSocket 다시 연결"
          : "저장 다시 시도",
    shouldReacquireStartPose: retryAction === "start",
    diagnostics,
    socketTicketLength: sessionRef.current?.socketTicket?.length ?? 0,
    start,
    sendPoseFrame,
    complete,
    retry,
    cancel,
  };
}
