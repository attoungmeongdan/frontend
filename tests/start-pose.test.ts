import { afterEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, renderHook } from "@testing-library/react";
import { matchesExerciseStartPose } from "../src/utils/startPose";
import { useStartPoseDetection } from "../src/hooks/useStartPoseDetection";
import { poseFor } from "./fixtures/poses";

afterEach(cleanup);

const sizes = [
  { width: 1280, height: 720 },
  { width: 720, height: 1280 },
  { width: 844, height: 390 },
  { width: 667, height: 375 },
  { width: 640, height: 480 },
  { width: 1000, height: 1000 },
];
for (const type of ["sit-up", "plank", "chair-stand", "push-up"] as const) {
  describe(type, () => {
    for (const size of sizes) {
      it(`accepts side views at ${size.width}×${size.height} without changing the payload`, () => {
        const landmarks = poseFor(type, size.width, size.height);
        const original = structuredClone(landmarks);
        expect(matchesExerciseStartPose(type, landmarks, size)).toBe(true);
        expect(landmarks).toEqual(original);
        const mirrored = landmarks.map((point) => ({ ...point, x: 1 - point.x }));
        expect(matchesExerciseStartPose(type, mirrored, size)).toBe(true);
      });
    }
    it("accepts either visible side, rejects low confidence and missing landmarks", () => {
      const landmarks = poseFor(type);
      for (const index of [11, 13, 15, 23, 25, 27]) landmarks[index].visibility = 0;
      expect(matchesExerciseStartPose(type, landmarks, sizes[0])).toBe(true);
      landmarks[24].visibility = 0.59;
      expect(matchesExerciseStartPose(type, landmarks, sizes[0])).toBe(false);
      expect(matchesExerciseStartPose(type, [], sizes[0])).toBe(false);
    });
    it("rejects invalid source dimensions and non-finite joints", () => {
      const landmarks = poseFor(type);
      for (const width of [0, -1, NaN, Infinity]) {
        expect(matchesExerciseStartPose(type, landmarks, { width, height: 720 })).toBe(false);
      }
      landmarks[23].x = NaN;
      landmarks[24].y = Infinity;
      expect(matchesExerciseStartPose(type, landmarks, sizes[0])).toBe(false);
    });
  });
}

it("keeps bent-arm plank distinct from straight-arm push-up", () => {
  for (const size of sizes) {
    expect(
      matchesExerciseStartPose("plank", poseFor("push-up", size.width, size.height), size),
    ).toBe(false);
    expect(
      matchesExerciseStartPose("push-up", poseFor("plank", size.width, size.height), size),
    ).toBe(false);
    expect(
      matchesExerciseStartPose("sit-up", poseFor("chair-stand", size.width, size.height), size),
    ).toBe(false);
    expect(
      matchesExerciseStartPose("chair-stand", poseFor("sit-up", size.width, size.height), size),
    ).toBe(false);
  }
});

it("rejects a straight-legged sit-up and bent-knee plank", () => {
  for (const size of sizes) {
    const sitUp = poseFor("sit-up", size.width, size.height);
    const plank = poseFor("plank", size.width, size.height);
    for (const side of [0, 1]) {
      sitUp[25 + side].x = (sitUp[23 + side].x + sitUp[27 + side].x) / 2;
      sitUp[25 + side].y = (sitUp[23 + side].y + sitUp[27 + side].y) / 2;
      plank[25 + side].y -= 0.25;
    }
    expect(matchesExerciseStartPose("sit-up", sitUp, size)).toBe(false);
    expect(matchesExerciseStartPose("plank", plank, size)).toBe(false);
  }
});

for (const exerciseType of ["sit-up", "plank"] as const) {
  it(`${exerciseType}: requires three consecutive frames, resets on lost body, starts once across rotations`, () => {
    const onDetected = vi.fn();
    const { result, rerender } = renderHook(
      ({ enabled }) => useStartPoseDetection({ exerciseType, enabled, onDetected }),
      { initialProps: { enabled: true } },
    );
    const observe = (size = sizes[0]) =>
      act(() => result.current.observe(poseFor(exerciseType, size.width, size.height), size));
    observe();
    observe();
    expect(onDetected).not.toHaveBeenCalled();
    act(() => result.current.observe([], sizes[0]));
    expect(result.current.isMatching).toBe(false);
    observe();
    observe(sizes[1]);
    expect(onDetected).not.toHaveBeenCalled();
    observe(sizes[1]);
    expect(onDetected).toHaveBeenCalledTimes(1);
    rerender({ enabled: true });
    observe();
    observe();
    expect(onDetected).toHaveBeenCalledTimes(1);
    rerender({ enabled: false });
    observe();
    expect(onDetected).toHaveBeenCalledTimes(1);
    rerender({ enabled: true });
    observe();
    observe();
    observe();
    expect(onDetected).toHaveBeenCalledTimes(2);
  });
}
