import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { withMinimumDuration } from "@/utils/minimumDuration";
import { getMeasurementPosition } from "@/utils/measurementProgress";
beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());
it.each([20, 500, 1300])("finishes a %ims request at max(request, 500)", async (duration) => {
  const done = vi.fn();
  const promise = withMinimumDuration(
    () => new Promise((resolve) => setTimeout(() => resolve("saved"), duration)),
  ).then(done);
  await vi.advanceTimersByTimeAsync(Math.max(500, duration) - 1);
  expect(done).not.toHaveBeenCalled();
  await vi.advanceTimersByTimeAsync(1);
  await promise;
  expect(done).toHaveBeenCalledWith("saved");
});
it("failure also keeps the minimum exposure", async () => {
  const done = vi.fn();
  const promise = withMinimumDuration(async () => {
    throw new Error("offline");
  }).catch(done);
  await vi.advanceTimersByTimeAsync(499);
  expect(done).not.toHaveBeenCalled();
  await vi.advanceTimersByTimeAsync(1);
  await promise;
  expect(done).toHaveBeenCalledOnce();
});
it("rejects holes in saved exercise records", () => {
  expect(() =>
    getMeasurementPosition({
      measurementGroupId: "group",
      completedExercises: ["SIT_UP"],
      nextExerciseType: "CHAIR_STAND",
      completed: false,
    }),
  ).toThrow();
});
