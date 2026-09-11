import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import HomePage from "@/pages/HomePage";
import { getMeasurementProgress } from "@/apis/exerciseSessions";
import { MEASUREMENT_ORDER, MEASUREMENT_PROGRESS_KEY } from "@/utils/measurementProgress";
import type { MeasurementProgress } from "@/types/exercise";

vi.mock("@/apis/exerciseSessions", () => ({ getMeasurementProgress: vi.fn() }));
vi.mock("@/apis/calendar", () => ({ getRecentSevenDays: async () => [] }));
vi.mock("@/apis/exercise", () => ({
  getMeasurementProgress: () => getMeasurementProgress(),
  getMeasurementHistory: async () => ({}),
}));
const tick = (ms = 500) =>
  act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });
function setup(count: number, query = "", group = "test-group") {
  const progress: MeasurementProgress = {
    measurementGroupId: group,
    completedExercises: MEASUREMENT_ORDER.slice(0, count),
    nextExerciseType: MEASUREMENT_ORDER[count] ?? null,
    completed: count === 4,
  };
  vi.mocked(getMeasurementProgress).mockResolvedValue(progress);
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const router = createMemoryRouter(
    [
      { path: "/", element: <HomePage /> },
      { path: "/measure", element: <div>Measurement</div> },
    ],
    { initialEntries: [`/${query}`] },
  );
  render(
    <QueryClientProvider client={client}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
  return { client, router, progress };
}
beforeEach(() => vi.useFakeTimers());
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});
it("ignores ?state=resume and starts new when a group exists with no saved exercise", async () => {
  const { router } = setup(0, "?state=resume");
  await tick();
  fireEvent.click(screen.getByRole("button", { name: /측정해보기/ }));
  await tick();
  expect(router.state.location.pathname).toBe("/measure");
  expect(screen.queryByRole("dialog")).toBeNull();
});
it.each([1, 2, 3])(
  "saved %i shows a choice; restart carries only the original group intent",
  async (count) => {
    const { router } = setup(count);
    await tick();
    fireEvent.click(screen.getByRole("button", { name: /측정해보기/ }));
    await tick();
    fireEvent.click(screen.getByRole("button", { name: "처음부터 측정하기" }));
    expect(router.state.location.state).toEqual({ restartGroupId: "test-group" });
  },
);
it("refetches before entering and ignores stale cached new state and duplicate clicks", async () => {
  const { router, progress, client } = setup(0);
  await tick();
  vi.mocked(getMeasurementProgress).mockResolvedValue({
    ...progress,
    completedExercises: [...MEASUREMENT_ORDER],
    nextExerciseType: null,
    completed: true,
  });
  const button = screen.getByRole("button", { name: /측정해보기/ });
  fireEvent.click(button);
  fireEvent.click(button);
  await tick(499);
  expect(screen.queryByRole("dialog")).toBeNull();
  await tick(1);
  expect(screen.getByRole("dialog").textContent).toContain("오늘 측정은 끝났어요");
  expect(router.state.location.pathname).toBe("/");
  expect(getMeasurementProgress).toHaveBeenCalledTimes(2);
  expect(client.getQueryData<MeasurementProgress>(MEASUREMENT_PROGRESS_KEY)?.completed).toBe(true);
});
it("an unavailable progress endpoint cannot create a new measurement", async () => {
  const { router } = setup(0);
  await tick();
  vi.mocked(getMeasurementProgress).mockRejectedValue(new Error("offline"));
  fireEvent.click(screen.getByRole("button", { name: /측정해보기/ }));
  await tick();
  expect(screen.getByRole("alert")).toBeTruthy();
  expect(router.state.location.pathname).toBe("/");
});
