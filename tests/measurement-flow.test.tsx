import { StrictMode, useEffect, useRef } from "react";
import { act, cleanup, fireEvent, render, renderHook, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useWorkoutSession } from "@/hooks/useWorkoutSession";
import { MEASURE_STEPS } from "@/constants/measure";
import { MEASUREMENT_RESULT_EXERCISES } from "@/constants/result";
import { poseFor } from "./fixtures/poses";
import MeasurePage from "@/pages/MeasurePage";
import * as api from "@/apis/exerciseSessions";
import { MEASUREMENT_ORDER, MEASUREMENT_PROGRESS_KEY } from "@/utils/measurementProgress";
import type {
  ExerciseSessionCreateResponse,
  MeasurementProgress,
  PoseLandmarkPayload,
  PoseFrameSize,
} from "@/types/exercise";

const camera = vi.hoisted(() => ({
  start: vi.fn(),
  stop: vi.fn(),
  frame: (points: PoseLandmarkPayload[], frameSize: PoseFrameSize) => {
    void points;
    void frameSize;
  },
}));
vi.mock("@/hooks/usePoseCamera", () => ({
  usePoseCamera: ({ onPoseFrame }: { onPoseFrame: typeof camera.frame }) => {
    useEffect(() => {
      camera.frame = onPoseFrame;
    }, [onPoseFrame]);
    return {
      state: "normal",
      start: camera.start,
      stop: camera.stop,
      videoRef: useRef(null),
      canvasRef: useRef(null),
    };
  },
}));
vi.mock("@/apis/exerciseSessions", async (importOriginal) => ({
  ...(await importOriginal<typeof api>()),
  getMeasurementProgress: vi.fn(),
  createWorkoutSession: vi.fn(),
  resumeMeasurementSession: vi.fn(),
  restartMeasurementSession: vi.fn(),
  getWorkoutSessionResult: vi.fn(),
  completeWorkoutSession: vi.fn(),
  createExerciseWebSocketUrl: () => "ws://localhost/session",
}));

class Socket extends EventTarget {
  static OPEN = 1;
  static CONNECTING = 0;
  static sockets: Socket[] = [];
  readyState = 0;
  bufferedAmount = 0;
  send = vi.fn();
  constructor() {
    super();
    Socket.sockets.push(this);
  }
  open() {
    this.readyState = 1;
    this.dispatchEvent(new Event("open"));
  }
  closeCode: number | undefined;
  close(code = 1000, reason = "") {
    this.closeCode = code;
    this.readyState = 3;
    this.dispatchEvent(new CloseEvent("close", { code, reason }));
  }
  message(data: unknown) {
    this.dispatchEvent(new MessageEvent("message", { data: JSON.stringify(data) }));
  }
}
let saved = 0;
let group: string | null = null;
let lastSession: ExerciseSessionCreateResponse;
let nextSessionId = 1;
function progress(): MeasurementProgress {
  return {
    measurementGroupId: group,
    completedExercises: MEASUREMENT_ORDER.slice(0, saved),
    nextExerciseType: MEASUREMENT_ORDER[saved] ?? null,
    completed: saved === 4,
  };
}
function createSession() {
  group ??= "group-1";
  lastSession = {
    sessionId: nextSessionId++,
    mode: "MEASUREMENT",
    measurementGroupId: group,
    exerciseType: MEASUREMENT_ORDER[saved],
    timeLimitSeconds: saved === 0 ? 30 : saved === 3 ? 0 : 60,
    measurementType: saved === 3 ? "VALID_DURATION" : "REPETITION",
    cameraOrientation: "SIDE",
    calibrationSeconds: 0,
    transmissionFps: 10,
    webSocketPath: "/ws/session",
    socketTicket: "test-ticket",
    ruleVersion: "test",
  };
  return Promise.resolve(lastSession);
}
function pose(index: number) {
  return poseFor(MEASURE_STEPS[index].exercise, 1280, 720);
}
const tick = (ms = 500) =>
  act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });
function mount(state?: object) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const router = createMemoryRouter(
    [
      { path: "/", element: <div>Home</div> },
      { path: "/measure", element: <MeasurePage /> },
      { path: "/measurements/:measurementGroupId/analysis", element: <div>Analysis</div> },
    ],
    { initialEntries: ["/", { pathname: "/measure", state }], initialIndex: 1 },
  );
  const rendered = render(
    <StrictMode>
      <QueryClientProvider client={client}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </StrictMode>,
  );
  return { ...rendered, router, client };
}
async function start(index: number) {
  if (screen.queryByRole("button", { name: "알겠어요" }))
    fireEvent.click(screen.getByRole("button", { name: "알겠어요" }));
  fireEvent.click(screen.getByRole("button", { name: "준비됐어요" }));
  act(() => {
    for (let i = 0; i < 12; i++) camera.frame(pose(index), { width: 1280, height: 720 });
  });
  await tick();
  act(() => Socket.sockets.at(-1)!.open());
}
function completeEvent() {
  return {
    type: "SESSION_COMPLETED",
    sessionId: lastSession.sessionId,
    sequence: 42,
    phase: saved === 4 ? "BROKEN" : "UP",
    validCount: 8,
    invalidCount: 1,
    remainingTimeMs: saved === 4 ? -1 : 0,
    validDurationMs: 23000,
    metrics: {},
    feedback: [],
  };
}
function complete() {
  saved++;
  const socket = Socket.sockets.at(-1)!;
  act(() => {
    socket.message(completeEvent());
    socket.message(completeEvent());
  });
}
beforeEach(() => {
  vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue();
  vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => {});
  vi.useFakeTimers();
  vi.stubGlobal("WebSocket", Socket);
  saved = 0;
  group = null;
  nextSessionId = 1;
  Socket.sockets = [];
  vi.mocked(api.getMeasurementProgress).mockImplementation(async () => progress());
  vi.mocked(api.createWorkoutSession).mockImplementation(createSession);
  vi.mocked(api.resumeMeasurementSession).mockImplementation(createSession);
  vi.mocked(api.restartMeasurementSession).mockImplementation(() => {
    saved = 0;
    group = "restarted-group";
    return createSession();
  });
  vi.mocked(api.getWorkoutSessionResult).mockImplementation(async () => ({
    ...lastSession,
    status:
      saved > MEASUREMENT_ORDER.indexOf(lastSession.exerciseType) || lastSession.mode === "WORKOUT"
        ? "COMPLETED"
        : "MEASURING",
    evaluationStandard: "KSPO",
    validCount: 8,
    invalidCount: 1,
    validDurationMs: 23000,
    measurementStartedAt: null,
    completedAt: "2026-09-11T12:00:00",
  }));
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("measurement page with shared session + start-pose hooks", () => {
  it("completes 1→11 once, preserves camera across guides, blocks final back/home", async () => {
    const { router, client } = mount();
    await tick(499);
    expect(screen.queryByRole("dialog")).toBeNull();
    await tick(1);
    expect(screen.getByRole("dialog").textContent).toContain("같이 운동");
    expect(api.createWorkoutSession).not.toHaveBeenCalled();
    const expectedApi = ["CHAIR_STAND", "PUSH_UP", "SIT_UP", "PLANK"];
    const expectedNames = ["의자 앉았다 일어나기", "팔굽혀펴기", "윗몸일으키기", "플랭크"];
    expect(MEASUREMENT_ORDER).toEqual(expectedApi);
    expect(MEASURE_STEPS.map((step) => step.name)).toEqual(expectedNames);
    expect(MEASUREMENT_RESULT_EXERCISES.map((step) => step.name)).toEqual(expectedNames);
    expect(screen.getByRole("dialog").textContent).toContain(
      "의자 앉았다 일어나기, 팔굽혀펴기,\n윗몸일으키기, 플랭크",
    );
    for (let index = 0; index < 4; index++) {
      if (index > 0) expect(screen.getByRole("dialog").textContent).toContain(expectedNames[index]);
      await start(index);
      expect(lastSession.exerciseType).toBe(expectedApi[index]);
      expect(
        screen.getByLabelText(`체력 측정 ${index + 1}/4 · ${expectedNames[index]} 카메라`),
      ).toBeTruthy();
      expect(Socket.sockets).toHaveLength(index + 1);
      complete();
      await tick(499);
      expect(screen.queryByRole("dialog")).toBeNull();
      await tick(1);
      expect(screen.getByRole("dialog")).toBeTruthy();
    }
    expect(api.getWorkoutSessionResult).toHaveBeenCalledTimes(4);
    expect(api.completeWorkoutSession).not.toHaveBeenCalled();
    expect(camera.start).toHaveBeenCalledTimes(1);
    expect(client.getQueryData(MEASUREMENT_PROGRESS_KEY)).toEqual(progress());
    expect(
      screen
        .getByRole("button", { name: "운동을 취소하고 홈으로 돌아가기" })
        .hasAttribute("disabled"),
    ).toBe(true);
    await act(async () => {
      await router.navigate(-1);
    });
    expect(router.state.location.pathname).toBe("/measure");
    fireEvent.click(screen.getByRole("button", { name: "측정 분석 보기" }));
    expect(router.state.location.pathname).toBe("/measurements/group-1/analysis");
  });
  it.each([0, 1, 2, 3])(
    "restores saved %i after exit/refresh, including abandoned first session",
    async (count) => {
      saved = count;
      group = "existing-group";
      const first = mount();
      await tick();
      expect(api.resumeMeasurementSession).not.toHaveBeenCalled();
      await start(count);
      await act(async () => {
        await first.router.navigate("/");
      });
      first.unmount();
      mount();
      await tick();
      const dialog = screen.getByRole("dialog");
      expect(dialog.textContent).toContain(
        count === 0 ? "같이 운동" : ["", "팔굽혀펴기", "윗몸일으키기", "플랭크"][count],
      );
      expect(api.restartMeasurementSession).not.toHaveBeenCalled();
    },
  );
  it.each([1, 2, 3])(
    "defers restart of saved %i until pose; consumes restart only once",
    async (count) => {
      saved = count;
      group = "existing-group";
      mount({ restartGroupId: group });
      await tick();
      expect(screen.getByRole("dialog").textContent).toContain("같이 운동");
      expect(api.restartMeasurementSession).not.toHaveBeenCalled();
      await start(0);
      expect(api.restartMeasurementSession).toHaveBeenCalledTimes(1);
      complete();
      await tick();
      await start(1);
      expect(api.restartMeasurementSession).toHaveBeenCalledTimes(1);
      expect(api.resumeMeasurementSession).not.toHaveBeenCalled();
      expect(api.createWorkoutSession).toHaveBeenCalledWith(
        "PUSH_UP",
        "restarted-group",
        "MEASUREMENT",
      );
    },
  );
  it("does not move to next guide before persisted result is confirmed; supports retry", async () => {
    mount();
    await tick();
    await start(0);
    vi.mocked(api.getWorkoutSessionResult).mockRejectedValueOnce(new Error("save unavailable"));
    complete();
    await tick();
    expect(screen.getByRole("alert").textContent).toContain("save unavailable");
    expect(screen.queryByRole("dialog")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "완료 상태 다시 확인" }));
    await tick();
    expect(screen.getByRole("dialog").textContent).toContain("팔굽혀펴기");
    expect(Socket.sockets).toHaveLength(1);
  });
  it("slow saving ends at request completion without another 500ms", async () => {
    mount();
    await tick();
    await start(0);
    const original = vi.mocked(api.getWorkoutSessionResult).getMockImplementation()!;
    vi.mocked(api.getWorkoutSessionResult).mockImplementation(async (id) => {
      await new Promise((r) => setTimeout(r, 1200));
      return original(id);
    });
    complete();
    await tick(1199);
    expect(screen.queryByRole("dialog")).toBeNull();
    await tick(1);
    expect(screen.getByRole("dialog").textContent).toContain("팔굽혀펴기");
  });
  it("load failure never silently starts a new measurement", async () => {
    vi.mocked(api.getMeasurementProgress).mockRejectedValue(new Error("offline"));
    mount();
    await tick();
    expect(screen.getByRole("alert").textContent).toContain("offline");
    expect(api.createWorkoutSession).not.toHaveBeenCalled();
  });
  it("rejects a next exercise inconsistent with the backend sequence", async () => {
    saved = 1;
    group = "existing-group";
    vi.mocked(api.getMeasurementProgress).mockResolvedValue({
      ...progress(),
      nextExerciseType: "SIT_UP",
    });
    mount();
    await tick();
    expect(screen.getByRole("alert").textContent).toContain("서버의 측정 순서");
    expect(api.resumeMeasurementSession).not.toHaveBeenCalled();
  });
  it("completed refresh shows completion even without camera; old restart cannot reset it", async () => {
    saved = 4;
    group = "completed-group";
    mount({ restartGroupId: group });
    await tick();
    expect(screen.getByRole("dialog").textContent).toContain("모든 측정을 마쳤어요");
    expect(camera.start).not.toHaveBeenCalled();
    expect(api.restartMeasurementSession).not.toHaveBeenCalled();
  });
});

it.each(["cancel", "complete", "automatic"])(
  "WORKOUT %s preserves measurement progress and cache",
  async (action) => {
    saved = 2;
    group = "measurement-group";
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const initial = progress();
    client.setQueryData(MEASUREMENT_PROGRESS_KEY, initial);
    const completed = vi.fn();
    vi.mocked(api.createWorkoutSession).mockImplementation(async () => {
      await createSession();
      lastSession = { ...lastSession, mode: "WORKOUT", measurementGroupId: null };
      return lastSession;
    });
    vi.mocked(api.completeWorkoutSession).mockImplementation(async () => ({
      ...lastSession,
      mode: "WORKOUT",
      measurementGroupId: null,
      status: "COMPLETED",
      evaluationStandard: "KSPO",
      validCount: 8,
      invalidCount: 0,
      validDurationMs: 0,
      measurementStartedAt: null,
      completedAt: null,
    }));
    const { result } = renderHook(
      () => useWorkoutSession({ exerciseType: "chair-stand", onCompleted: completed }),
      {
        wrapper: ({ children }) => (
          <QueryClientProvider client={client}>{children}</QueryClientProvider>
        ),
      },
    );
    act(() => {
      void result.current.start();
      void result.current.start();
    });
    await tick(0);
    expect(api.createWorkoutSession).toHaveBeenCalledTimes(1);
    act(() => Socket.sockets.at(-1)!.open());
    act(() => {
      void result.current.start();
    });
    expect(api.createWorkoutSession).toHaveBeenCalledTimes(1);
    if (action === "complete")
      await act(async () => {
        await result.current.complete();
      });
    else if (action === "automatic") {
      act(() => Socket.sockets.at(-1)!.message(completeEvent()));
      await tick(0);
    } else {
      act(() => result.current.cancel());
      expect(Socket.sockets.at(-1)!.closeCode).toBe(4000);
    }
    expect(client.getQueryData(MEASUREMENT_PROGRESS_KEY)).toEqual(initial);
    expect(client.getQueryState(MEASUREMENT_PROGRESS_KEY)?.isInvalidated).toBe(false);
    expect(api.getMeasurementProgress).not.toHaveBeenCalled();
    expect(api.restartMeasurementSession).not.toHaveBeenCalled();
    expect(api.resumeMeasurementSession).not.toHaveBeenCalled();
    expect(completed).toHaveBeenCalledTimes(action === "cancel" ? 0 : 1);
  },
);
it("expired measurement recovers via a fresh start pose, without skipping guide order", async () => {
  mount();
  await tick();
  await start(0);
  vi.mocked(api.getWorkoutSessionResult).mockResolvedValueOnce({
    ...lastSession,
    status: "EXPIRED",
    evaluationStandard: "KSPO",
    validCount: 0,
    invalidCount: 0,
    validDurationMs: 0,
    measurementStartedAt: null,
    completedAt: null,
  });
  act(() =>
    Socket.sockets
      .at(-1)!
      .message({ type: "ERROR", code: "EXERCISE_PROCESSING_FAILED", message: "expired" }),
  );
  await tick(3500);
  expect(screen.getByRole("alert").textContent).toContain("시작 자세");
  fireEvent.click(screen.getByRole("button", { name: "세션 다시 시작" }));
  act(() => {
    for (let i = 0; i < 5; i++) camera.frame(pose(0), { width: 1280, height: 720 });
  });
  await tick();
  expect(Socket.sockets).toHaveLength(2);
  expect(saved).toBe(0);
});
it("unmounted page ignores a late save response", async () => {
  const page = mount();
  await tick();
  await start(0);
  const original = vi.mocked(api.getWorkoutSessionResult).getMockImplementation()!;
  vi.mocked(api.getWorkoutSessionResult).mockImplementation(async (id) => {
    await new Promise((r) => setTimeout(r, 1000));
    return original(id);
  });
  complete();
  await tick(10);
  page.unmount();
  await tick(1000);
  expect(
    page.client.getQueryData<MeasurementProgress>(MEASUREMENT_PROGRESS_KEY)?.completedExercises,
  ).toHaveLength(0);
});

it("uses remainingTimeMs and never ends a timed measurement from the frontend clock", async () => {
  mount();
  await tick();
  await start(0);
  act(() =>
    Socket.sockets.at(-1)!.message({
      ...completeEvent(),
      type: "ANALYSIS_RESULT",
      remainingTimeMs: 5200,
      validCount: 7,
    }),
  );
  expect(screen.getByText("남은 시간 00:06")).toBeTruthy();
  expect(screen.getByLabelText("운동 횟수 7")).toBeTruthy();
  await tick(90000);
  expect(screen.queryByRole("dialog")).toBeNull();
  expect(api.completeWorkoutSession).not.toHaveBeenCalled();
  act(() =>
    Socket.sockets
      .at(-1)!
      .message({ ...completeEvent(), type: "ANALYSIS_RESULT", remainingTimeMs: 0 }),
  );
  expect(screen.getByText("남은 시간 00:00")).toBeTruthy();
  expect(api.completeWorkoutSession).not.toHaveBeenCalled();
});
it("plank has no frontend timeout and finishes only on backend completion", async () => {
  saved = 3;
  group = "plank-group";
  mount();
  await tick();
  await start(3);
  act(() =>
    Socket.sockets.at(-1)!.message({
      ...completeEvent(),
      type: "ANALYSIS_RESULT",
      remainingTimeMs: -1,
      validDurationMs: 25000,
    }),
  );
  expect(screen.getByLabelText("운동 시간 00:25")).toBeTruthy();
  await tick(180000);
  expect(screen.queryByRole("dialog")).toBeNull();
  complete();
  await tick();
  expect(screen.getByRole("dialog").textContent).toContain("모든 측정을 마쳤어요");
});

it("polling a completed result still waits for matching persisted progress", async () => {
  mount();
  await tick();
  await start(0);
  const result = vi.mocked(api.getWorkoutSessionResult).getMockImplementation()!;
  vi.mocked(api.getWorkoutSessionResult).mockImplementation(async (id) => ({
    ...(await result(id)),
    status: "COMPLETED",
  }));
  await tick(6500);
  expect(screen.queryByRole("dialog")).toBeNull();
  expect(screen.getByRole("alert").textContent).toContain("저장 확인");
  expect(api.resumeMeasurementSession).not.toHaveBeenCalled();
  saved = 1;
  fireEvent.click(screen.getByRole("button", { name: "완료 상태 다시 확인" }));
  await tick();
  expect(screen.getByRole("dialog").textContent).toContain("팔굽혀펴기");
});

it("a lost completion event advances once through verified progress and keeps the camera", async () => {
  mount();
  await tick();
  await start(0);
  saved = 1;
  await tick(3500);
  expect(screen.getByRole("dialog").textContent).toContain("팔굽혀펴기");
  expect(camera.start).toHaveBeenCalledTimes(1);
  await start(1);
  expect(api.createWorkoutSession).toHaveBeenLastCalledWith("PUSH_UP", "group-1", "MEASUREMENT");
  expect(api.resumeMeasurementSession).not.toHaveBeenCalled();
});

it("an expired session reuses the flow creator so its group and exercise are revalidated", async () => {
  mount();
  await tick();
  await start(0);
  const result = vi.mocked(api.getWorkoutSessionResult).getMockImplementation()!;
  vi.mocked(api.getWorkoutSessionResult).mockImplementationOnce(async (id) => ({
    ...(await result(id)),
    status: "EXPIRED",
  }));
  await tick(3500);
  fireEvent.click(screen.getByRole("button", { name: "세션 다시 시작" }));
  // A different response must not bypass the measurement flow's session validation.
  vi.mocked(api.resumeMeasurementSession).mockResolvedValueOnce({
    ...lastSession,
    sessionId: 99,
    exerciseType: "PLANK",
    measurementGroupId: "wrong-group",
  });
  act(() => {
    for (let i = 0; i < 5; i++) camera.frame(pose(0), { width: 1280, height: 720 });
  });
  await tick();
  expect(screen.getByRole("alert").textContent).toContain("다른 종목이나 그룹");
  expect(Socket.sockets).toHaveLength(1);
});

it("invalid session responses never replace the progress cache", async () => {
  const { client } = mount();
  await tick();
  vi.mocked(api.createWorkoutSession).mockResolvedValueOnce({
    sessionId: 999,
    mode: "WORKOUT",
    exerciseType: "PLANK",
    measurementGroupId: "wrong-group",
  } as ExerciseSessionCreateResponse);
  fireEvent.click(screen.getByRole("button", { name: "알겠어요" }));
  fireEvent.click(screen.getByRole("button", { name: "준비됐어요" }));
  act(() => {
    for (let i = 0; i < 5; i++) camera.frame(pose(0), { width: 1280, height: 720 });
  });
  await tick();
  expect(screen.getByRole("alert").textContent).toContain("다른 종목이나 그룹");
  expect(client.getQueryData(MEASUREMENT_PROGRESS_KEY)).toEqual(progress());
  expect(Socket.sockets).toHaveLength(0);
});

it.each([1, 4])("rejects duplicate progress entries with %i saved exercises", async (count) => {
  saved = count;
  group = "existing-group";
  vi.mocked(api.getMeasurementProgress).mockResolvedValue({
    ...progress(),
    completedExercises: [...progress().completedExercises, "CHAIR_STAND"],
  });
  mount();
  await tick();
  expect(screen.getByRole("alert").textContent).toContain("중복");
});

async function detectPose(index: number) {
  act(() => {
    for (let i = 0; i < 5; i++) camera.frame(pose(index), { width: 1280, height: 720 });
  });
  await tick();
}

it("refreshes the guide and can start again when progress advances before session creation", async () => {
  group = "existing-group";
  mount();
  await tick();
  fireEvent.click(screen.getByRole("button", { name: "알겠어요" }));
  fireEvent.click(screen.getByRole("button", { name: "준비됐어요" }));
  saved = 1;
  await detectPose(0);
  expect(api.resumeMeasurementSession).not.toHaveBeenCalled();
  expect(Socket.sockets).toHaveLength(0);
  expect(screen.getByRole("dialog").textContent).toContain("팔굽혀펴기");
  await start(1);
  expect(lastSession.exerciseType).toBe("PUSH_UP");
  expect(Socket.sockets).toHaveLength(1);
  expect(screen.queryByRole("alert")).toBeNull();
});

it("shows completion if all exercises were saved before the next creation request", async () => {
  saved = 3;
  group = "existing-group";
  mount();
  await tick();
  fireEvent.click(screen.getByRole("button", { name: "준비됐어요" }));
  saved = 4;
  await detectPose(3);
  expect(screen.getByRole("dialog").textContent).toContain("모든 측정을 마쳤어요");
  expect(api.resumeMeasurementSession).not.toHaveBeenCalled();
  expect(Socket.sockets).toHaveLength(0);
});

it.each(["FITNESS_409_7", "FITNESS_409_4", "FITNESS_409_5"])(
  "resyncs persisted progress after %s without leaving the next guide stuck",
  async (code) => {
    group = "existing-group";
    mount();
    await tick();
    vi.mocked(api.resumeMeasurementSession).mockImplementationOnce(async () => {
      saved = 1;
      throw {
        isAxiosError: true,
        response: {
          status: 409,
          data: { code, message: "체력측정 운동 순서가 올바르지 않습니다." },
        },
      };
    });
    fireEvent.click(screen.getByRole("button", { name: "알겠어요" }));
    fireEvent.click(screen.getByRole("button", { name: "준비됐어요" }));
    await detectPose(0);
    expect(screen.getByRole("dialog").textContent).toContain("팔굽혀펴기");
    expect(Socket.sockets).toHaveLength(0);
    await start(1);
    expect(lastSession.exerciseType).toBe("PUSH_UP");
    expect(Socket.sockets).toHaveLength(1);
    expect(api.resumeMeasurementSession).toHaveBeenCalledTimes(2);
  },
);

it("keeps the error when the server rejects the order but reports no saved progress", async () => {
  mount();
  await tick();
  vi.mocked(api.createWorkoutSession).mockRejectedValueOnce({
    isAxiosError: true,
    response: {
      status: 409,
      data: { code: "FITNESS_409_7", message: "체력측정 운동 순서가 올바르지 않습니다." },
    },
  });
  fireEvent.click(screen.getByRole("button", { name: "알겠어요" }));
  fireEvent.click(screen.getByRole("button", { name: "준비됐어요" }));
  await detectPose(0);
  expect(screen.getByRole("alert").textContent).toContain("체력측정 운동 순서");
  expect(screen.queryByRole("dialog")).toBeNull();
  expect(api.createWorkoutSession).toHaveBeenCalledTimes(1);
  expect(Socket.sockets).toHaveLength(0);
  fireEvent.click(screen.getByRole("button", { name: "세션 다시 시작" }));
  await detectPose(0);
  expect(lastSession.exerciseType).toBe("CHAIR_STAND");
  expect(Socket.sockets).toHaveLength(1);
});

it("recovers SIT_UP processing errors and delayed progress, then finishes PLANK under StrictMode", async () => {
  saved = 2;
  group = "group-1";
  mount();
  await tick();
  await start(2);
  const socket = Socket.sockets.at(-1)!;
  act(() => {
    socket.message({ ...completeEvent(), type: "ANALYSIS_RESULT", remainingTimeMs: 40000 });
    socket.message({ type: "ERROR", code: "EXERCISE_PROCESSING_FAILED", message: "frame failed" });
    camera.frame(pose(2), { width: 1280, height: 720 });
  });
  expect(screen.queryByRole("button", { name: "완료 상태 다시 확인" })).toBeNull();
  expect(socket.send).toHaveBeenCalled();
  const read = vi.mocked(api.getWorkoutSessionResult).getMockImplementation()!;
  vi.mocked(api.getWorkoutSessionResult).mockImplementation(async (id) => ({
    ...(await read(id)),
    status: "COMPLETED",
  }));
  act(() => socket.message(completeEvent()));
  await tick();
  expect(screen.queryByRole("dialog")).toBeNull();
  saved = 3;
  await tick(1000);
  expect(screen.getByRole("dialog").textContent).toContain("플랭크");
  await start(3);
  complete();
  await tick();
  expect(screen.getByRole("dialog").textContent).toContain("모든 측정을 마쳤어요");
  expect(api.resumeMeasurementSession).toHaveBeenCalledOnce();
  expect(api.createWorkoutSession).toHaveBeenCalledExactlyOnceWith(
    "PLANK",
    "group-1",
    "MEASUREMENT",
  );
  expect(api.completeWorkoutSession).not.toHaveBeenCalled();
});
