import { useCallback, useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import {
  completeWorkoutSession,
  createExerciseWebSocketUrl,
  createWorkoutSession,
  EXERCISE_API_TYPE,
  getWorkoutSessionResult,
  resumeMeasurementSession,
} from "@/apis/exerciseSessions";
import { POSE_TRANSMISSION_FPS, POSE_TRANSMISSION_INTERVAL_MS } from "@/constants/poseTransmission";
import type { ExerciseType } from "@/constants/exercises";
import type {
  ExerciseAnalysisResult,
  ExerciseSessionCreateResponse,
  ExerciseSessionResult,
  ExerciseSocketError,
  PoseLandmarkPayload,
} from "@/types/exercise";

import {
  CompletionPendingError,
  SessionResultMismatchError,
  readCompletion,
  reportSessionError,
} from "@/utils/completionVerification";
import { withMinimumDuration } from "@/utils/minimumDuration";

type WorkoutConnectionState = "idle" | "connecting" | "active" | "completing" | "error";
type RetryAction = "start" | "verify";

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
  // null means progress changed before creation; return to the refreshed guide.
  createSession?: () => Promise<ExerciseSessionCreateResponse | null>;
  verifyCompletion?: (result: ExerciseSessionResult) => Promise<void>;
  minimumPendingMs?: number;
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
  verifyCompletion,
  minimumPendingMs = 0,
}: UseWorkoutSessionOptions) {
  const queryClient = useQueryClient();
  const socketRef = useRef<WebSocket | null>(null);
  const sessionRef = useRef<ExerciseSessionCreateResponse | null>(null);
  const connectionStateRef = useRef<WorkoutConnectionState>("idle");
  const attemptRef = useRef(0);
  const socketGenerationRef = useRef(0);
  const sequenceRef = useRef(0);
  const lastTimestampRef = useRef(0);
  const nextSendAtRef = useRef<number | null>(null);
  const completedRef = useRef(false);
  const completionRequestedRef = useRef(false);
  const completionSignalledRef = useRef(false);
  const verificationRef = useRef<AbortController | null>(null);
  const shouldResumeRef = useRef(false);
  const measurementTimedOutRef = useRef(false);
  const onCompletedRef = useRef(onCompleted);
  const verifyCompletionRef = useRef(verifyCompletion);
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
    verifyCompletionRef.current = verifyCompletion;
  }, [onCompleted, verifyCompletion]);

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
      // The backend expires abandoned sessions only on a non-normal close.
      socket.close(4000, "client cleanup");
    }
  }, []);

  const moveToCompleted = useCallback(
    (sessionId: number) => {
      if (completedRef.current || sessionRef.current?.sessionId !== sessionId) return;
      shouldResumeRef.current = false;
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

  const validateStoredResult = useCallback((result: ExerciseSessionResult, sessionId: number) => {
    const session = sessionRef.current;
    if (
      !session ||
      result.sessionId !== sessionId ||
      result.mode !== session.mode ||
      result.exerciseType !== session.exerciseType ||
      result.measurementGroupId !== session.measurementGroupId
    ) {
      throw new SessionResultMismatchError("현재 운동 세션의 저장 결과가 아니에요.");
    }
  }, []);

  const verifyCompletedResult = useCallback(
    async (sessionId: number, storedResult?: ExerciseSessionResult) => {
      if (connectionStateRef.current === "completing" || completedRef.current) return;
      const attempt = attemptRef.current;
      const controller = new AbortController();
      verificationRef.current?.abort();
      verificationRef.current = controller;
      let resumed = false;
      setConnectionError(null);
      updateConnectionState("completing");
      try {
        await withMinimumDuration(
          () =>
            readCompletion(async () => {
              const result = storedResult ?? (await getWorkoutSessionResult(sessionId));
              storedResult = undefined;
              if (attempt !== attemptRef.current || sessionRef.current?.sessionId !== sessionId)
                return;
              validateStoredResult(result, sessionId);
              if (result.status === "EXPIRED" || result.status === "CANCELLED") {
                closeSocket();
                sessionRef.current = null;
                throw new Error(
                  mode === "MEASUREMENT"
                    ? "측정 연결이 종료됐어요. 이전 운동 기록을 유지하고 시작 자세를 다시 잡아 주세요."
                    : "운동 연결이 종료됐어요. 시작 자세를 다시 잡아 주세요.",
                );
              }
              if (result.status !== "COMPLETED") {
                // A recoverable read failure is not the end of a live measurement.
                if (
                  mode === "MEASUREMENT" &&
                  !completionSignalledRef.current &&
                  !measurementTimedOutRef.current &&
                  socketRef.current?.readyState === WebSocket.OPEN
                ) {
                  resumed = true;
                  return;
                }
                throw new CompletionPendingError(
                  "서버에서 운동 기록 완료를 확인하지 못했어요. 잠시 후 다시 확인해 주세요.",
                );
              }
              completionSignalledRef.current = true;
              // Socket events and polling must both verify the measurement's persisted progress.
              await verifyCompletionRef.current?.(result);
            }, controller.signal),
          minimumPendingMs,
        );
        if (attempt !== attemptRef.current || controller.signal.aborted) return;
        if (resumed) updateConnectionState("active");
        else moveToCompleted(sessionId);
      } catch (error) {
        if (attempt !== attemptRef.current || completedRef.current || controller.signal.aborted)
          return;
        reportSessionError("verify-completion", sessionId, error);
        setConnectionError(errorMessage(error, "완료된 운동 기록을 확인하지 못했어요."));
        setRetryAction(sessionRef.current ? "verify" : "start");
        updateConnectionState("error");
      }
    },
    [
      closeSocket,
      minimumPendingMs,
      mode,
      moveToCompleted,
      updateConnectionState,
      validateStoredResult,
    ],
  );

  // Reconcile saved results even when the final socket event is lost.
  useEffect(() => {
    if (mode !== "MEASUREMENT" || connectionState !== "active") return;
    const sessionId = sessionRef.current?.sessionId;
    if (!sessionId) return;
    const attempt = attemptRef.current;
    let cancelled = false;
    let failures = 0;
    let pendingAfterTimeout = 0;
    let timer: ReturnType<typeof setTimeout>;
    const isCurrent = () =>
      !cancelled &&
      attempt === attemptRef.current &&
      sessionRef.current?.sessionId === sessionId &&
      connectionStateRef.current === "active";
    const poll = async () => {
      try {
        const result = await getWorkoutSessionResult(sessionId);
        if (!isCurrent()) return;
        validateStoredResult(result, sessionId);
        if (["COMPLETED", "EXPIRED", "CANCELLED"].includes(result.status)) {
          void verifyCompletedResult(sessionId, result);
          return;
        }
        failures = 0;
        pendingAfterTimeout = measurementTimedOutRef.current ? pendingAfterTimeout + 1 : 0;
        if (pendingAfterTimeout >= 4) {
          throw new Error("측정 시간이 끝났지만 서버의 기록 저장을 확인하지 못했어요.");
        }
      } catch (error) {
        if (!isCurrent()) return;
        failures += 1;
        if (
          failures >= 3 ||
          pendingAfterTimeout >= 4 ||
          error instanceof SessionResultMismatchError
        ) {
          reportSessionError("poll-result", sessionId, error);
          setConnectionError(errorMessage(error, "측정 결과를 확인하지 못했어요."));
          // Result API outages must not stop a healthy socket's pose stream.
          // Keep polling until the server finishes or the connection closes.
          if (
            pendingAfterTimeout >= 4 ||
            error instanceof SessionResultMismatchError ||
            socketRef.current?.readyState !== WebSocket.OPEN
          ) {
            setRetryAction("verify");
            updateConnectionState("error");
            return;
          }
        }
      }
      if (isCurrent()) timer = setTimeout(() => void poll(), 3_000);
    };
    timer = setTimeout(() => void poll(), 3_000);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [connectionState, mode, updateConnectionState, validateStoredResult, verifyCompletedResult]);

  const handleMessage = useCallback(
    (event: MessageEvent<string>, sessionId: number) => {
      let message: unknown;
      try {
        message = JSON.parse(event.data) as unknown;
      } catch {
        setConnectionError("서버가 보낸 판정값을 읽지 못했어요.");
        return;
      }

      // Completion is a control event; optional analysis fields must not block it.
      if (
        message &&
        typeof message === "object" &&
        "type" in message &&
        message.type === "SESSION_COMPLETED" &&
        "sessionId" in message &&
        message.sessionId === sessionId
      ) {
        completionSignalledRef.current = true;
        void verifyCompletedResult(sessionId);
        return;
      }
      if (!isSocketMessage(message)) return;
      setDiagnostics((current) => ({ ...current, lastReceivedAt: Date.now() }));

      if (message.type === "ERROR") {
        setConnectionError(message.message || "자세 판정 중 오류가 발생했어요.");
        // The server keeps the socket open on frame-processing errors. Keep
        // sending fresh frames; the existing result poll reconciles persisted
        // completion without turning a transient frame failure into a deadlock.
        reportSessionError("socket-frame", sessionId, message);
        return;
      }

      if (message.sessionId !== sessionId || connectionStateRef.current !== "active") return;
      setAnalysis(message);
      setConnectionError(null);

      measurementTimedOutRef.current = mode === "MEASUREMENT" && message.remainingTimeMs === 0;
    },
    [mode, verifyCompletedResult],
  );

  const connectSocket = useCallback(
    (session: ExerciseSessionCreateResponse, attempt: number) => {
      closeSocket();
      const socketGeneration = socketGenerationRef.current;
      const socket = new WebSocket(
        createExerciseWebSocketUrl(
          session.webSocketPath || `/ws/v1/exercise-sessions/${session.sessionId}`,
          session.socketTicket,
        ),
      );
      socketRef.current = socket;
      socket.addEventListener("open", () => {
        if (attempt !== attemptRef.current || socketGeneration !== socketGenerationRef.current) {
          return;
        }
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

        if (mode === "MEASUREMENT") {
          void verifyCompletedResult(session.sessionId);
        } else {
          setConnectionError("운동 판정 연결이 끊겼어요. 새 세션으로 다시 시작해 주세요.");
          setRetryAction("start");
          updateConnectionState("error");
        }
      });
    },
    [closeSocket, handleMessage, mode, updateConnectionState, verifyCompletedResult],
  );

  const start = useCallback(async () => {
    if (connectionStateRef.current !== "idle") {
      return;
    }

    const attempt = attemptRef.current + 1;
    attemptRef.current = attempt;
    closeSocket();
    sessionRef.current = null;
    sequenceRef.current = 0;
    lastTimestampRef.current = 0;
    nextSendAtRef.current = null;
    completedRef.current = false;
    completionRequestedRef.current = false;
    completionSignalledRef.current = false;
    verificationRef.current?.abort();
    measurementTimedOutRef.current = false;
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
      const session = await withMinimumDuration(
        () =>
          createSession
            ? createSession()
            : mode === "MEASUREMENT" && shouldResumeRef.current
              ? resumeMeasurementSession()
              : createWorkoutSession(
                  EXERCISE_API_TYPE[exerciseType],
                  measurementGroupId ?? undefined,
                  mode,
                ),
        minimumPendingMs,
      );
      if (attempt !== attemptRef.current) return;
      if (!session) {
        updateConnectionState("idle");
        return;
      }
      sessionRef.current = session;
      shouldResumeRef.current = mode === "MEASUREMENT";
      setDiagnostics((current) => ({
        ...current,
        sessionId: session.sessionId,
        webSocketPath: session.webSocketPath,
        transmissionFps: POSE_TRANSMISSION_FPS,
      }));

      connectSocket(session, attempt);
    } catch (error) {
      if (attempt !== attemptRef.current) return;
      reportSessionError("create-session", null, error);
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
    minimumPendingMs,
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
    const deadline = nextSendAtRef.current ?? now;
    if (now + 0.001 < deadline || socket.bufferedAmount > 65_536) {
      return;
    }

    // Keep the schedule anchored: rounding each 66.7ms interval to a 50ms
    // inference tick would otherwise reduce 15fps to 10fps. Skip missed slots,
    // and send only this new frame (no timer, backlog or repeated landmarks).
    const elapsedSlots = Math.max(
      0,
      Math.floor((now - deadline + 0.001) / POSE_TRANSMISSION_INTERVAL_MS),
    );
    nextSendAtRef.current = deadline + (elapsedSlots + 1) * POSE_TRANSMISSION_INTERVAL_MS;
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

    if (completionRequestedRef.current) {
      void verifyCompletedResult(sessionId);
      return;
    }
    const attempt = attemptRef.current;
    completionRequestedRef.current = true;
    updateConnectionState("completing");
    setConnectionError(null);
    try {
      const result = await completeWorkoutSession(sessionId);
      if (attempt !== attemptRef.current) return;
      validateStoredResult(result, sessionId);
      if (result.status === "COMPLETED") {
        moveToCompleted(sessionId);
        return;
      }
    } catch (error) {
      if (attempt !== attemptRef.current) return;
      reportSessionError("complete-request", sessionId, error);
    }
    // A lost response may hide a successful POST. Reconcile via GET only;
    // neither repeated clicks nor a result-read failure may resubmit completion.
    updateConnectionState("error");
    setRetryAction("verify");
    await verifyCompletedResult(sessionId);
  }, [mode, moveToCompleted, updateConnectionState, validateStoredResult, verifyCompletedResult]);

  const retry = useCallback(() => {
    if (connectionStateRef.current !== "error") return;
    const sessionId = sessionRef.current?.sessionId;
    if (retryAction === "verify" && sessionId) {
      void verifyCompletedResult(sessionId);
      return;
    }
    attemptRef.current += 1;
    verificationRef.current?.abort();
    closeSocket();
    sessionRef.current = null;
    completedRef.current = false;
    setAnalysis(null);
    setConnectionError(null);
    updateConnectionState("idle");
  }, [closeSocket, retryAction, updateConnectionState, verifyCompletedResult]);

  const cancel = useCallback(() => {
    attemptRef.current += 1;
    verificationRef.current?.abort();
    closeSocket();
    sessionRef.current = null;
    updateConnectionState("idle");
  }, [closeSocket, updateConnectionState]);

  useEffect(
    () => () => {
      attemptRef.current += 1;
      verificationRef.current?.abort();
      closeSocket();
    },
    [closeSocket],
  );

  return {
    connectionState,
    analysis,
    connectionError,
    retryLabel: retryAction === "start" ? "세션 다시 시작" : "완료 상태 다시 확인",
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
