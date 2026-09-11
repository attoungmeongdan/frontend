import { StrictMode } from "react";
import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { AxiosError } from "axios";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { axiosInstance } from "@/apis/axiosInstance";
import CalendarPage from "@/pages/CalendarPage";
import MeasurementAnalysisPage from "@/pages/MeasurementAnalysisPage";
import AppLayout from "@/components/layout/AppLayout";
import ActivityCalendar from "@/components/calendar/ActivityCalendar";
import { readCalendarMonth } from "@/utils/calendar";
import { measurementAnalysisPath } from "@/utils/measurementRoutes";
import { getMeasurementAnalysis } from "@/apis/exercise";
import type { MonthlyCalendarResponse } from "@/apis/calendar";
import type { MeasurementAnalysis } from "@/types/exercise";

vi.mock("@/apis/axiosInstance", () => ({ axiosInstance: { get: vi.fn() } }));
vi.mock("@/utils/date", async (original) => ({
  ...(await original<typeof import("@/utils/date")>()),
  getSeoulToday: () => ({ year: 2026, month: 9, date: 12 }),
}));
const firstGroup = "550e8400-e29b-41d4-a716-446655440000";
const secondGroup = "550e8400-e29b-41d4-a716-446655440001";
function calendar(year = 2026, month = 8): MonthlyCalendarResponse {
  const date = (day: number) =>
    `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  return {
    year,
    month,
    totalTargetDays: 31,
    completedDays: 2,
    achievementRate: 6.5,
    dailyRecords: [
      { date: date(1), exerciseCount: 0, measurementGroupId: firstGroup },
      { date: date(2), exerciseCount: 2, measurementGroupId: secondGroup },
      { date: date(3), exerciseCount: 0, measurementGroupId: null },
      { date: date(4), exerciseCount: 1, measurementGroupId: null },
      { date: date(5), exerciseCount: 1 },
    ],
  };
}
function analysis(id: string): MeasurementAnalysis {
  return {
    measurementGroupId: id,
    exerciseComparisons: ["CHAIR_STAND", "PUSH_UP", "SIT_UP", "PLANK"].map((exerciseType) => ({
      exerciseType: exerciseType as "CHAIR_STAND" | "PUSH_UP" | "SIT_UP" | "PLANK",
      measuredValue: id === firstGroup ? 11 : 22,
      averageValue: 10,
      unit: exerciseType === "PLANK" ? "SECOND" : "COUNT",
      level: "HIGH",
      message: "잘했어요",
    })),
    overallScore: 50,
    percentile: {
      available: false,
      value: null,
      topPercent: null,
      comparisonGender: "MALE",
      comparisonAgeGroup: "30대",
      sampleSize: 1,
      message: "",
      userScore: 50,
      userBucketIndex: null,
      maximumBucketCount: null,
      buckets: [],
    },
    performanceGroupComparisons: [],
    fitnessPerformance: { gender: "MALE", ageGroup: "30대", label: "30대", message: "" },
  };
}
function mount(path = "/calendar?year=2026&month=8") {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  const router = createMemoryRouter(
    [
      {
        element: <AppLayout />,
        children: [
          { path: "/calendar", element: <CalendarPage />, handle: { header: { title: "캘린더" } } },
          {
            path: "/measurements/:measurementGroupId/analysis",
            element: <MeasurementAnalysisPage />,
            handle: { header: { title: "측정 분석", showBack: true } },
          },
        ],
      },
    ],
    { initialEntries: [path] },
  );
  const view = render(
    <StrictMode>
      <QueryClientProvider client={client}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </StrictMode>,
  );
  return { ...view, router, client };
}
let analysisFailure: number | null = null;
beforeEach(() => {
  analysisFailure = null;
  vi.mocked(axiosInstance.get).mockImplementation(async (url, config) => {
    if (url === "/api/v1/users/me") return { data: { data: { createdAt: "2026-07-01T00:00:00" } } };
    if (url === "/api/v1/calendars")
      return { data: { data: calendar(config?.params.year, config?.params.month) } };
    if (String(url).endsWith("/analysis")) {
      if (analysisFailure)
        throw Object.assign(new AxiosError("analysis unavailable"), {
          response: { status: analysisFailure },
        });
      return {
        data: { data: analysis(String(url).includes(firstGroup) ? firstGroup : secondGroup) },
      };
    }
    throw new Error(`Unexpected API: ${url}`);
  });
});
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

it("keeps empty, workout-only and legacy dates inert; retains count and server achievement rate", async () => {
  const { router } = mount();
  await screen.findByRole("heading", { name: "2026년 8월" });
  for (const label of ["3일", "4일 운동 1개", "5일 운동 1개"]) {
    const day = screen.getByLabelText(label, { exact: true });
    expect(day.tagName).toBe("DIV");
    expect(day.getAttribute("tabindex")).toBeNull();
    fireEvent.click(day);
  }
  expect(router.state.location.pathname).toBe("/calendar");
  expect(screen.queryAllByRole("button", { name: /측정 분석 보기/ })).toHaveLength(2);
  expect(screen.getByText("6.5%", { exact: false })).toBeTruthy();
  expect(
    vi.mocked(axiosInstance.get).mock.calls.some(([url]) => String(url).endsWith("/analysis")),
  ).toBe(false);
});

it.each([
  [1, firstGroup, "11"],
  [2, secondGroup, "22"],
])(
  "opens day %s using its own group, supports fresh direct entry and calendar back",
  async (day, group, value) => {
    const view = mount();
    const button = await screen.findByRole("button", {
      name: new RegExp(`^${day}일.*측정 분석 보기`),
    });
    // Both the number and status dot are descendants of this native button.
    fireEvent.click(button.querySelector("span.bg-action-orange")!);
    await screen.findByRole("list", { name: "종목별 측정 결과" });
    expect(view.router.state.location.pathname).toBe(measurementAnalysisPath(String(group)));
    expect(axiosInstance.get).toHaveBeenCalledWith(
      `/api/v1/exercise-records/measurements/${group}/analysis`,
    );
    expect(
      within(screen.getByRole("list", { name: "종목별 측정 결과" })).getAllByText(String(value)),
    ).toHaveLength(3);
    fireEvent.click(screen.getByRole("button", { name: "뒤로 가기" }));
    await screen.findByRole("heading", { name: "2026년 8월" });
    expect(view.router.state.location.search).toBe("?year=2026&month=8");
    view.unmount();
    vi.mocked(axiosInstance.get).mockClear();
    mount(measurementAnalysisPath(String(group)));
    await screen.findByRole("list", { name: "종목별 측정 결과" });
    expect(axiosInstance.get).toHaveBeenCalledWith(
      `/api/v1/exercise-records/measurements/${group}/analysis`,
    );
    expect(
      vi.mocked(axiosInstance.get).mock.calls.some(([url]) => url === "/api/v1/calendars"),
    ).toBe(false);
  },
);

it("preserves changed month through analysis navigation without extra month history entries", async () => {
  const { router } = mount("/calendar");
  fireEvent.click(await screen.findByRole("button", { name: "이전 달 보기" }));
  await screen.findByRole("heading", { name: "2026년 8월" });
  fireEvent.click(screen.getByRole("button", { name: /^1일.*측정 분석 보기/ }));
  await screen.findByRole("list", { name: "종목별 측정 결과" });
  await act(async () => {
    await router.navigate(-1);
  });
  await screen.findByRole("heading", { name: "2026년 8월" });
  expect(router.state.location.search).toBe("?year=2026&month=8");
  fireEvent.click(screen.getByRole("button", { name: "다음 달 보기" }));
  await screen.findByRole("heading", { name: "2026년 9월" });
  expect(screen.getByRole("button", { name: "다음 달 보기" }).hasAttribute("disabled")).toBe(true);
});

it.each([404, 409])("uses existing empty state for HTTP %s", async (status) => {
  analysisFailure = status;
  mount(measurementAnalysisPath(firstGroup));
  await screen.findByText("측정 결과가 없어요");
  expect(screen.queryByRole("list", { name: "종목별 측정 결과" })).toBeNull();
});
it("uses existing loading, error and retry states for past reports", async () => {
  analysisFailure = 503;
  mount(measurementAnalysisPath(firstGroup));
  await screen.findByRole("alert");
  expect(screen.queryByText(/오늘 측정/)).toBeNull();
  analysisFailure = null;
  fireEvent.click(screen.getByRole("button", { name: "다시 불러오기" }));
  await screen.findByRole("list", { name: "종목별 측정 결과" });
});
it("switches group query keys without showing the previously selected report", async () => {
  const { router } = mount(measurementAnalysisPath(firstGroup));
  await screen.findByRole("list", { name: "종목별 측정 결과" });
  await act(async () => {
    await router.navigate(measurementAnalysisPath(secondGroup));
  });
  await waitFor(() =>
    expect(
      within(screen.getByRole("list", { name: "종목별 측정 결과" })).getAllByText("22"),
    ).toHaveLength(3),
  );
  expect(screen.queryAllByText("11")).toHaveLength(0);
});
it("encodes group IDs in both route and API path segments", async () => {
  const id = "group /?#%";
  expect(measurementAnalysisPath(id)).toBe("/measurements/group%20%2F%3F%23%25/analysis");
  await getMeasurementAnalysis(id);
  expect(axiosInstance.get).toHaveBeenCalledWith(
    "/api/v1/exercise-records/measurements/group%20%2F%3F%23%25/analysis",
  );
});
it("does not expose report buttons in the group calendar variant", () => {
  const router = createMemoryRouter([
    {
      path: "/",
      element: (
        <ActivityCalendar
          activity={{
            year: 2026,
            month: 8,
            today: null,
            joinedDay: null,
            totalTargetDays: 31,
            exercisedDays: [{ day: 1, count: 2, measurementGroupId: firstGroup }],
          }}
          canGoPrev
          canGoNext
          onPrevMonth={() => {}}
          onNextMonth={() => {}}
          variant="group"
        />
      ),
    },
  ]);
  render(<RouterProvider router={router} />);
  expect(screen.queryByRole("button", { name: /측정 분석 보기/ })).toBeNull();
  expect(screen.getByLabelText("1일 운동 2개")).toBeTruthy();
});
it.each(["year=2026&month=13", "year=2026&month=0", "year=oops&month=8", "year=2027&month=1"])(
  "bounds invalid or future month input: %s",
  (search) => {
    expect(readCalendarMonth(new URLSearchParams(search), { year: 2026, month: 9 }, null)).toEqual({
      year: 2026,
      month: 9,
    });
  },
);
