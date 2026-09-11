import { expect, test, type Page } from "@playwright/test";

const firstGroup = "550e8400-e29b-41d4-a716-446655440000";
const secondGroup = "550e8400-e29b-41d4-a716-446655440001";
async function setupCalendar(page: Page) {
  await page.clock.setFixedTime(new Date("2026-09-12T00:00:00+09:00"));
  const analysisRequests: string[] = [];
  const monthRequests: string[] = [];
  const unexpected: string[] = [];
  let failure: number | null = null;
  await page.route("**/api/v1/**", (route) => {
    const url = new URL(route.request().url());
    if (url.pathname === "/api/v1/auth/refresh")
      return route.fulfill({ json: { data: { accessToken: "test" } } });
    if (url.pathname === "/api/v1/users/me")
      return route.fulfill({ json: { data: { createdAt: "2026-07-01T00:00:00" } } });
    if (url.pathname === "/api/v1/calendars") {
      monthRequests.push(url.search);
      const year = Number(url.searchParams.get("year"));
      const month = Number(url.searchParams.get("month"));
      const prefix = `${year}-${String(month).padStart(2, "0")}`;
      return route.fulfill({
        json: {
          data: {
            year,
            month,
            totalTargetDays: 31,
            completedDays: 2,
            achievementRate: 6.5,
            dailyRecords: [
              { date: `${prefix}-01`, exerciseCount: 0, measurementGroupId: firstGroup },
              { date: `${prefix}-02`, exerciseCount: 2, measurementGroupId: secondGroup },
              { date: `${prefix}-03`, exerciseCount: 0, measurementGroupId: null },
              { date: `${prefix}-04`, exerciseCount: 1, measurementGroupId: null },
              { date: `${prefix}-05`, exerciseCount: 1 },
            ],
          },
        },
      });
    }
    const matched = url.pathname.match(
      /^\/api\/v1\/exercise-records\/measurements\/([^/]+)\/analysis$/,
    );
    if (matched) {
      const id = matched[1];
      analysisRequests.push(id);
      if (failure) return route.fulfill({ status: failure, json: { message: "조회 실패" } });
      return route.fulfill({
        json: {
          data: {
            measurementGroupId: id,
            exerciseComparisons: ["CHAIR_STAND", "PUSH_UP", "SIT_UP", "PLANK"].map(
              (exerciseType) => ({
                exerciseType,
                measuredValue: id === firstGroup ? 11 : 22,
                averageValue: 10,
                unit: exerciseType === "PLANK" ? "SECOND" : "COUNT",
                level: "HIGH",
                message: "",
              }),
            ),
            percentile: { available: false },
            fitnessPerformance: { label: "30대" },
          },
        },
      });
    }
    unexpected.push(url.pathname);
    return route.fulfill({ status: 404, json: { message: "Unexpected API" } });
  });
  return {
    analysisRequests,
    monthRequests,
    unexpected,
    fail: (status: number | null) => {
      failure = status;
    },
  };
}

for (const viewport of [
  { width: 375, height: 667 },
  { width: 393, height: 852 },
]) {
  test(`calendar report touch, refresh and back ${viewport.width}×${viewport.height}`, async ({
    page,
    context,
  }, testInfo) => {
    await page.setViewportSize(viewport);
    const cdp = await context.newCDPSession(page);
    await cdp.send("Emulation.setSafeAreaInsetsOverride", {
      insets: { top: 59, bottom: 34, left: 0, right: 0 },
    });
    const fixture = await setupCalendar(page);
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto("/calendar");
    await page.getByRole("button", { name: "이전 달 보기" }).click();
    await expect(page.getByRole("heading", { name: "2026년 8월" })).toBeVisible();
    for (const label of ["3일", "4일 운동 1개", "5일 운동 1개"]) {
      const day = page.getByLabel(label, { exact: true });
      await expect(day).not.toHaveAttribute("role", "button");
      await day.tap();
      await expect(page).toHaveURL(/\/calendar\?year=2026&month=8$/);
    }
    await expect(page.getByText("6.5%", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: /측정 분석 보기/ })).toHaveCount(2);
    const first = page.getByRole("button", { name: /^1일.*측정 분석 보기/ });
    const rect = await first.boundingBox();
    expect(rect!.height).toBeGreaterThanOrEqual(44);
    expect(rect!.width).toBeGreaterThanOrEqual(36);
    await page.screenshot({ path: testInfo.outputPath("calendar-reports.png") });
    await first.tap();
    await expect(page).toHaveURL(`/measurements/${firstGroup}/analysis`);
    await expect(
      page.getByRole("list", { name: "종목별 측정 결과" }).getByText("11", { exact: true }),
    ).toHaveCount(3);
    await page.reload();
    await expect(
      page.getByRole("list", { name: "종목별 측정 결과" }).getByText("11", { exact: true }),
    ).toHaveCount(3);
    expect(fixture.analysisRequests).toEqual([firstGroup, firstGroup]);
    await page.getByRole("button", { name: "뒤로 가기", exact: true }).tap();
    await expect(page.getByRole("heading", { name: "2026년 8월" })).toBeVisible();
    const second = page.getByRole("button", { name: /^2일.*측정 분석 보기/ });
    await second.locator("span.bg-action-orange").tap();
    await expect(page).toHaveURL(`/measurements/${secondGroup}/analysis`);
    await expect(
      page.getByRole("list", { name: "종목별 측정 결과" }).getByText("22", { exact: true }),
    ).toHaveCount(3);
    await page.goBack();
    await expect(page).toHaveURL(/\/calendar\?year=2026&month=8$/);
    expect(fixture.unexpected).toEqual([]);
    expect(errors).toEqual([]);
  });
}

test("native report buttons support Tab, Enter and Space", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await setupCalendar(page);
  await page.goto("/calendar?year=2026&month=8");
  const first = page.getByRole("button", { name: /^1일.*측정 분석 보기/ });
  await expect(first).toBeVisible();
  await page.getByRole("button", { name: "다음 달 보기" }).focus();
  await page.keyboard.press("Tab");
  await expect(first).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(`/measurements/${firstGroup}/analysis`);
  await page.goBack();
  await first.focus();
  await page.keyboard.press("Tab");
  await expect(page.getByRole("button", { name: /^2일.*측정 분석 보기/ })).toBeFocused();
  await page.keyboard.press("Space");
  await expect(page).toHaveURL(`/measurements/${secondGroup}/analysis`);
});

for (const status of [404, 409]) {
  test(`direct analysis URL uses existing empty response for ${status}`, async ({ page }) => {
    const fixture = await setupCalendar(page);
    fixture.fail(status);
    await page.goto(`/measurements/${firstGroup}/analysis`);
    await expect(page.getByText("측정 결과가 없어요", { exact: true })).toBeVisible();
    expect(fixture.monthRequests).toEqual([]);
    expect(fixture.analysisRequests).toEqual([firstGroup]);
    expect(fixture.unexpected).toEqual([]);
  });
}
