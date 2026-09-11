import { expect, test } from "@playwright/test";
import { setupCamera, readyCamera } from "./camera-fixture";

for (const viewport of [
  { width: 393, height: 852 },
  { width: 390, height: 844 },
]) {
  test(`squat fills ${viewport.width}×${viewport.height} with safe areas and no chair instructions`, async ({
    page,
    context,
  }, testInfo) => {
    await page.setViewportSize(viewport);
    const cdp = await context.newCDPSession(page);
    await cdp.send("Emulation.setSafeAreaInsetsOverride", {
      insets: { top: 59, bottom: 34, left: 0, right: 0 },
    });
    await setupCamera(page);
    await readyCamera(page, "chair-stand");
    await expect(page.getByText("카메라를 향해 서서 기다려 주세요")).toBeVisible();
    await expect(page.getByText(/의자/)).toHaveCount(0);
    const layout = await page.evaluate(() => {
      const stage = document.querySelector(".camera-stage")!;
      const video = document.querySelector("video")!;
      const canvas = document.querySelector("canvas")!;
      const rect = (element: Element) => element.getBoundingClientRect().toJSON();
      return {
        stage: rect(stage),
        video: rect(video),
        canvas: rect(canvas),
        topPadding: getComputedStyle(stage).paddingTop,
        bottomPadding: getComputedStyle(stage).paddingBottom,
        videoFit: getComputedStyle(video).objectFit,
        canvasFit: getComputedStyle(canvas).objectFit,
        headers: document.querySelectorAll("header").length,
        nav: document.querySelectorAll("nav").length,
        bodyHeight: document.body.scrollHeight,
      };
    });
    expect(layout.stage).toMatchObject({ x: 0, y: 0, ...viewport });
    expect(layout.video).toEqual(layout.stage);
    expect(layout.canvas).toEqual(layout.video);
    expect(layout).toMatchObject({
      topPadding: "59px",
      bottomPadding: "34px",
      videoFit: "cover",
      canvasFit: "cover",
      headers: 1,
      nav: 0,
      bodyHeight: viewport.height,
    });
    await page.screenshot({ path: testInfo.outputPath("squat-safe-area.png") });
  });
}

test("measurement keeps the chair guide and restores the ordinary header after exit", async ({
  page,
  context,
}) => {
  await page.setViewportSize({ width: 393, height: 852 });
  const cdp = await context.newCDPSession(page);
  await cdp.send("Emulation.setSafeAreaInsetsOverride", {
    insets: { top: 59, bottom: 34, left: 0, right: 0 },
  });
  await setupCamera(page);
  await page.route("**/api/v1/exercise-sessions/measurement/progress", (route) =>
    route.fulfill({
      json: {
        data: {
          measurementGroupId: null,
          completedExercises: [],
          nextExerciseType: "CHAIR_STAND",
          completed: false,
        },
      },
    }),
  );
  await page.goto("/measure");
  await page.getByRole("button", { name: "알겠어요" }).click();
  await page.getByRole("button", { name: "준비됐어요" }).click();
  await expect(page.getByText("카메라를 향해 서서 기다려 주세요")).toBeVisible();
  await expect(page.getByText(/스쿼트/)).toBeVisible();
  await expect(page.locator(".camera-stage")).toHaveCSS("height", "852px");
  await expect(page.locator("video")).toHaveCSS("object-fit", "cover");
  await page.getByRole("button", { name: "운동을 취소하고 홈으로 돌아가기" }).click();
  await expect(page).toHaveURL("/");
  await expect
    .poll(() => page.evaluate(() => window.cameraFixture.acquisitions - window.cameraFixture.stops))
    .toBe(0);
  await expect
    .poll(() => page.evaluate(() => window.cameraFixture.models - window.cameraFixture.modelCloses))
    .toBe(0);
  await expect(page.locator("header")).toHaveCount(1);
  await expect(page.locator("nav")).toHaveCount(1);
  expect(await page.locator("header").evaluate((el) => el.getBoundingClientRect().top)).toBe(59);
  await page.goto("/exercise/plank");
  await expect(page.getByText("팔꿈치를 접은 플랭크 자세를 잡아 주세요")).toBeVisible();
  await expect
    .poll(() => page.evaluate(() => window.cameraFixture.acquisitions - window.cameraFixture.stops))
    .toBe(1);
});
