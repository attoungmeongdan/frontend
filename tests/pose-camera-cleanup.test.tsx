import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { usePoseCamera } from "@/hooks/usePoseCamera";

const model = vi.hoisted(() => ({ create: vi.fn(), close: vi.fn(), detect: vi.fn() }));
vi.mock("@mediapipe/tasks-vision", () => ({
  FilesetResolver: { forVisionTasks: async () => ({}) },
  PoseLandmarker: { createFromOptions: model.create, POSE_CONNECTIONS: [] },
  DrawingUtils: class {},
}));
let stop: ReturnType<typeof vi.fn>;
let video: HTMLVideoElement;
beforeEach(() => {
  stop = vi.fn();
  video = document.createElement("video");
  const track = { stop, addEventListener: vi.fn() };
  vi.stubGlobal("navigator", {
    mediaDevices: {
      getUserMedia: vi
        .fn()
        .mockResolvedValue({ getTracks: () => [track], getVideoTracks: () => [track] }),
    },
  });
  vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue();
  model.create.mockResolvedValue({ close: model.close, detectForVideo: model.detect });
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.resetAllMocks();
});
function mount() {
  const hook = renderHook(() => usePoseCamera({ onPoseFrame: vi.fn() }));
  hook.result.current.videoRef.current = video;
  return hook;
}
it("does not initialize a late model after unmount while video.play is pending", async () => {
  let resolve!: () => void;
  vi.mocked(video.play).mockReturnValue(
    new Promise<void>((done) => {
      resolve = done;
    }),
  );
  const hook = mount();
  let starting!: Promise<void>;
  await act(async () => {
    starting = hook.result.current.start();
  });
  hook.unmount();
  await act(async () => {
    resolve();
    await starting;
  });
  expect(stop).toHaveBeenCalledOnce();
  expect(model.create).not.toHaveBeenCalled();
  expect(video.srcObject).toBeNull();
});
it("releases the camera when playback fails", async () => {
  vi.mocked(video.play).mockRejectedValue(new DOMException("busy", "NotReadableError"));
  const hook = mount();
  await act(async () => hook.result.current.start());
  expect(hook.result.current.state).toBe("camera-busy");
  expect(stop).toHaveBeenCalledOnce();
  expect(video.srcObject).toBeNull();
  expect(model.create).not.toHaveBeenCalled();
});
it("releases the stream after GPU and CPU initialization both fail", async () => {
  model.create.mockRejectedValue(new Error("model unavailable"));
  const hook = mount();
  await act(async () => hook.result.current.start());
  expect(model.create).toHaveBeenCalledTimes(2);
  expect(hook.result.current.state).toBe("model-error");
  expect(stop).toHaveBeenCalledOnce();
  expect(video.srcObject).toBeNull();
});
it("closes a model that resolves after the camera was stopped", async () => {
  let resolve!: (value: unknown) => void;
  model.create.mockReturnValue(
    new Promise((done) => {
      resolve = done;
    }),
  );
  const hook = mount();
  let starting!: Promise<void>;
  await act(async () => {
    starting = hook.result.current.start();
  });
  act(() => hook.result.current.stop());
  await act(async () => {
    resolve({ close: model.close });
    await starting;
  });
  expect(stop).toHaveBeenCalledOnce();
  expect(model.close).toHaveBeenCalledOnce();
});
