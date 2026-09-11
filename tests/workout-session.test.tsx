import { act, cleanup, renderHook } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useWorkoutSession } from "@/hooks/useWorkoutSession";
import * as api from "@/apis/exerciseSessions";
import type { ExerciseSessionCreateResponse, ExerciseSessionResult } from "@/types/exercise";
import { poseFor } from "./fixtures/poses";

vi.mock("@/apis/exerciseSessions", () => ({
  EXERCISE_API_TYPE: { "chair-stand": "CHAIR_STAND", "push-up": "PUSH_UP", plank: "PLANK" },
  createWorkoutSession: vi.fn(),
  resumeMeasurementSession: vi.fn(),
  completeWorkoutSession: vi.fn(),
  getWorkoutSessionResult: vi.fn(),
  createExerciseWebSocketUrl: (path: string, ticket: string) =>
    `wss://example.test${path}?ticket=${ticket}`,
}));

class Socket extends EventTarget {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSED = 3;
  static instances: Socket[] = [];
  readyState = Socket.CONNECTING;
  bufferedAmount = 0;
  send = vi.fn();
  constructor(public url: string) {
    super();
    Socket.instances.push(this);
  }
  open() {
    this.readyState = Socket.OPEN;
    this.dispatchEvent(new Event("open"));
  }
  close() {
    this.readyState = Socket.CLOSED;
    this.dispatchEvent(new CloseEvent("close", { code: 1000 }));
  }
  message(value: unknown) {
    this.dispatchEvent(new MessageEvent("message", { data: JSON.stringify(value) }));
  }
}
const session = (id = 1): ExerciseSessionCreateResponse => ({
  sessionId: id,
  mode: "MEASUREMENT",
  measurementGroupId: "group-1",
  exerciseType: "CHAIR_STAND",
  measurementType: "REPETITION",
  timeLimitSeconds: 30,
  cameraOrientation: "SIDE",
  calibrationSeconds: 0,
  transmissionFps: 10,
  webSocketPath: `/ws/v1/exercise-sessions/${id}`,
  socketTicket: `ticket-${id}`,
  ruleVersion: "V3",
});
const stored = (status: ExerciseSessionResult["status"], id = 1): ExerciseSessionResult => ({
  ...session(id),
  status,
  evaluationStandard: "FITPLE",
  validCount: 5,
  invalidCount: 0,
  validDurationMs: 0,
  measurementStartedAt: null,
  completedAt: null,
});
const analysis = (remainingTimeMs = 0) => ({
  type: "ANALYSIS_RESULT",
  sessionId: 1,
  validCount: 5,
  validDurationMs: 0,
  remainingTimeMs,
  feedback: [],
});
function setup(mode: "MEASUREMENT" | "WORKOUT" = "MEASUREMENT") {
  const onCompleted = vi.fn();
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const hook = renderHook(
    () => useWorkoutSession({ exerciseType: "chair-stand", mode, onCompleted }),
    {
      wrapper: ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={client}>{children}</QueryClientProvider>
      ),
    },
  );
  return { ...hook, onCompleted };
}
async function start(hook: ReturnType<typeof setup>, open = true) {
  await act(async () => {
    await hook.result.current.start();
  });
  const socket = Socket.instances.at(-1)!;
  if (open) act(() => socket.open());
  return socket;
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.stubGlobal("WebSocket", Socket);
  Socket.instances = [];
  vi.mocked(api.createWorkoutSession).mockResolvedValue(session());
  vi.mocked(api.resumeMeasurementSession).mockResolvedValue(session(2));
  vi.mocked(api.getWorkoutSessionResult).mockResolvedValue(stored("MEASURING"));
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.resetAllMocks();
});

describe("measurement completion and recovery", () => {
  it("advances from saved results when the final event is missing", async () => {
    const hook = setup();
    const socket = await start(hook);
    act(() => socket.message(analysis()));
    vi.mocked(api.getWorkoutSessionResult).mockResolvedValue(stored("COMPLETED"));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(3000);
    });
    expect(hook.onCompleted).toHaveBeenCalledExactlyOnceWith(1, "group-1");
    expect(api.completeWorkoutSession).not.toHaveBeenCalled();
    expect(socket.readyState).toBe(Socket.CLOSED);
  });

  it("accepts completion without optional analysis fields and ignores a different session", async () => {
    const hook = setup();
    const socket = await start(hook);
    act(() => socket.message({ type: "SESSION_COMPLETED", sessionId: 99 }));
    expect(hook.onCompleted).not.toHaveBeenCalled();
    vi.mocked(api.getWorkoutSessionResult).mockResolvedValue(stored("COMPLETED"));
    await act(async () => socket.message({ type: "SESSION_COMPLETED", sessionId: 1 }));
    expect(hook.onCompleted).toHaveBeenCalledExactlyOnceWith(1, "group-1");
  });

  it("recovers a saved result on socket close", async () => {
    const hook = setup();
    const socket = await start(hook);
    vi.mocked(api.getWorkoutSessionResult).mockResolvedValue(stored("COMPLETED"));
    await act(async () => socket.close());
    expect(hook.onCompleted).toHaveBeenCalledExactlyOnceWith(1, "group-1");
  });

  it("does not advance on zero alone and exposes a result retry after saving stalls", async () => {
    const hook = setup();
    const socket = await start(hook);
    act(() => socket.message(analysis()));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(12000);
    });
    expect(hook.onCompleted).not.toHaveBeenCalled();
    expect(hook.result.current.connectionState).toBe("error");
    expect(hook.result.current.retryLabel).toBe("완료 상태 다시 확인");
    vi.mocked(api.getWorkoutSessionResult).mockResolvedValue(stored("COMPLETED"));
    await act(async () => hook.result.current.retry());
    expect(hook.onCompleted).toHaveBeenCalledExactlyOnceWith(1, "group-1");
  });

  it.each([true, false])(
    "resumes with a new session and ticket after expiry (opened=%s)",
    async (opened) => {
      const hook = setup();
      const first = await start(hook, opened);
      vi.mocked(api.getWorkoutSessionResult).mockResolvedValue(stored("EXPIRED"));
      await act(async () => first.close());
      expect(hook.result.current.shouldReacquireStartPose).toBe(true);
      act(() => hook.result.current.retry());
      expect(hook.result.current.connectionState).toBe("idle");
      const next = await start(hook);
      expect(api.resumeMeasurementSession).toHaveBeenCalledExactlyOnceWith();
      expect(api.createWorkoutSession).toHaveBeenCalledTimes(1);
      expect(next.url).toBe("wss://example.test/ws/v1/exercise-sessions/2?ticket=ticket-2");
      expect(hook.result.current.analysis).toBeNull();
      await act(async () => {
        await vi.advanceTimersByTimeAsync(200);
      });
      act(() => hook.result.current.sendPoseFrame(poseFor("chair-stand", 1280, 720)));
      expect(JSON.parse(next.send.mock.calls[0][0])).toMatchObject({ sessionId: 2, sequence: 1 });
      vi.mocked(api.getWorkoutSessionResult).mockResolvedValue(stored("COMPLETED", 2));
      await act(async () => next.message({ type: "SESSION_COMPLETED", sessionId: 2 }));
      expect(hook.onCompleted).toHaveBeenCalledExactlyOnceWith(2, "group-1");
    },
  );

  it("uses regular creation for the next exercise after successful completion", async () => {
    const hook = setup();
    const socket = await start(hook);
    vi.mocked(api.getWorkoutSessionResult).mockResolvedValue(stored("COMPLETED"));
    await act(async () => socket.message({ type: "SESSION_COMPLETED", sessionId: 1 }));
    vi.mocked(api.createWorkoutSession).mockResolvedValue(session(3));
    await start(hook);
    expect(api.createWorkoutSession).toHaveBeenCalledTimes(2);
    expect(api.resumeMeasurementSession).not.toHaveBeenCalled();
  });

  it("ignores delayed result responses after leaving the session", async () => {
    let resolve!: (value: ExerciseSessionResult) => void;
    vi.mocked(api.getWorkoutSessionResult).mockReturnValue(
      new Promise((done) => {
        resolve = done;
      }),
    );
    const hook = setup();
    await start(hook);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(3000);
    });
    act(() => hook.result.current.cancel());
    await act(async () => resolve(stored("COMPLETED")));
    expect(hook.onCompleted).not.toHaveBeenCalled();
    expect(hook.result.current.connectionState).toBe("idle");
  });

  it("does not double-complete when the socket event wins a pending result request", async () => {
    let resolve!: (value: ExerciseSessionResult) => void;
    vi.mocked(api.getWorkoutSessionResult).mockReturnValue(
      new Promise((done) => {
        resolve = done;
      }),
    );
    const hook = setup();
    const socket = await start(hook);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(3000);
    });
    act(() => socket.message({ type: "SESSION_COMPLETED", sessionId: 1 }));
    await act(async () => resolve(stored("COMPLETED")));
    expect(hook.onCompleted).toHaveBeenCalledTimes(1);
  });

  it("creates a new WORKOUT instead of resuming or reusing an unopened ticket", async () => {
    const hook = setup("WORKOUT");
    const socket = await start(hook, false);
    act(() => socket.close());
    act(() => hook.result.current.retry());
    vi.mocked(api.createWorkoutSession).mockResolvedValue({
      ...session(2),
      mode: "WORKOUT",
      measurementGroupId: null,
    });
    const next = await start(hook);
    expect(api.createWorkoutSession).toHaveBeenCalledTimes(2);
    expect(api.resumeMeasurementSession).not.toHaveBeenCalled();
    expect(next.url).toContain("ticket-2");
  });
});
