import { test, expect, type Page } from "@playwright/test";
import { setupCamera, readyCamera } from "./camera-fixture";
import { poseFor } from "../fixtures/poses";
import type { ExerciseType } from "../../src/constants/exercises";

const viewports = [
  { width: 844, height: 390 },
  { width: 667, height: 375 },
  { width: 390, height: 844 },
  { width: 375, height: 667 },
];
const exercises = ["sit-up", "plank", "chair-stand", "push-up"] as const;

async function assertLayout(page: Page, safe = { top: 0, right: 0, bottom: 0, left: 0 }) {
  const elements = await page
    .locator(
      ".camera-stage-header button, .camera-stage-header > div > div, .camera-stage-metrics output, .camera-stage-metrics p, .camera-stage-view img, .camera-stage-view p, .camera-stage-view svg, .camera-stage-footer button",
    )
    .evaluateAll((nodes) =>
      nodes.map((node) => ({
        name: node.textContent || node.tagName,
        rect: node.getBoundingClientRect().toJSON() as {
          x: number;
          y: number;
          width: number;
          height: number;
          right: number;
          bottom: number;
        },
        scrollWidth: node.scrollWidth,
        clientWidth: node.clientWidth,
      })),
    );
  expect(elements.length).toBeGreaterThanOrEqual(3);
  const viewport = page.viewportSize()!;
  for (const { name, rect, scrollWidth, clientWidth } of elements) {
    expect(rect.width, name).toBeGreaterThan(0);
    expect(rect.height, name).toBeGreaterThan(0);
    expect(rect.x, name).toBeGreaterThanOrEqual(safe.left - 1);
    expect(rect.y, name).toBeGreaterThanOrEqual(safe.top - 1);
    expect(rect.right, name).toBeLessThanOrEqual(viewport.width - safe.right + 1);
    expect(rect.bottom, name).toBeLessThanOrEqual(viewport.height - safe.bottom + 1);
    if (clientWidth) expect(scrollWidth, name).toBeLessThanOrEqual(clientWidth + 1);
  }
  for (let i = 0; i < elements.length; i++) {
    for (let j = i + 1; j < elements.length; j++) {
      const a = elements[i].rect;
      const b = elements[j].rect;
      const overlap =
        Math.min(a.right, b.right) - Math.max(a.x, b.x) > 1 &&
        Math.min(a.bottom, b.bottom) - Math.max(a.y, b.y) > 1;
      expect(overlap, `${elements[i].name} overlaps ${elements[j].name}`).toBe(false);
    }
  }
}

async function assertFrameAlignment(page: Page) {
  const result = await page.evaluate(() => {
    const video = document.querySelector("video")!;
    const canvas = document.querySelector("canvas")!;
    const style = (element: Element) => {
      const css = getComputedStyle(element);
      return {
        fit: css.objectFit,
        position: css.objectPosition,
        transform: css.transform,
        scale: css.scale,
        rect: element.getBoundingClientRect().toJSON(),
      };
    };
    return {
      video: style(video),
      canvas: style(canvas),
      videoSize: [video.videoWidth, video.videoHeight],
      canvasSize: [canvas.width, canvas.height],
    };
  });
  expect(result.videoSize).toEqual(result.canvasSize);
  expect(result.video).toEqual(result.canvas);
  // Both crop the source identically to fill the viewport without letterboxing.
  expect(result.video.fit).toBe("cover");
  expect(result.video.scale).toBe("-1 1");
}

async function setPose(page: Page, type: ExerciseType, portrait: boolean) {
  const size = portrait ? { width: 720, height: 1280 } : { width: 1280, height: 720 };
  await page.evaluate(
    ({ size, landmarks }) => Object.assign(window.cameraFixture, size, { landmarks }),
    {
      size,
      landmarks: poseFor(type, size.width, size.height),
    },
  );
  await expect
    .poll(() => page.locator("video").evaluate((video) => video.videoWidth))
    .toBe(size.width);
  await expect
    .poll(() => page.locator("canvas").evaluate((canvas) => canvas.width))
    .toBe(size.width);
}

async function cameraIdentity(page: Page) {
  return page.evaluate(() => {
    const { acquisitions, stops, models, modelCloses } = window.cameraFixture;
    const stream = document.querySelector("video")!.srcObject as MediaStream;
    return {
      acquisitions,
      stops,
      models,
      modelCloses,
      stream: stream.id,
      track: stream.getVideoTracks()[0].id,
    };
  });
}

for (const type of exercises) {
  for (const viewport of viewports) {
    test(`${type} ${viewport.width}×${viewport.height}: guide, active, warnings, rotation`, async ({
      page,
    }, testInfo) => {
      const errors: string[] = [];
      page.on("pageerror", (error) => errors.push(error.message));
      await page.setViewportSize(viewport);
      const fixture = await setupCamera(page);
      await readyCamera(page, type);
      await assertLayout(page);
      await page.screenshot({ path: testInfo.outputPath("guide.png") });
      const initialIdentity = await cameraIdentity(page);
      const portrait = viewport.height > viewport.width;
      await setPose(page, type, portrait);
      await expect.poll(() => fixture.counts().connections).toBe(1);
      fixture.analysis();
      const value = () =>
        page.getByRole("status", { name: type === "plank" ? "운동 시간 01:05" : "운동 횟수 7" });
      await expect(value()).toBeVisible();
      await assertLayout(page);
      await assertFrameAlignment(page);
      fixture.analysis(7, 65000, true);
      await expect(page.getByRole("alert")).toBeVisible();
      await assertLayout(page);
      await page.screenshot({ path: testInfo.outputPath("warning.png") });
      // Body loss must not discard the server record or disconnect the session.
      await page.evaluate(() => {
        window.cameraFixture.landmarks = [];
      });
      await expect(page.getByText("몸 전체가 화면에 보이도록 조정해 주세요.")).toBeVisible();
      await assertLayout(page);
      await setPose(page, type, portrait);
      await expect(value()).toBeVisible();
      fixture.analysis();
      await expect(page.getByRole("alert")).toHaveCount(0);
      const frameCount = fixture.frames.length;
      for (const rotated of [{ width: viewport.height, height: viewport.width }, viewport]) {
        await page.setViewportSize(rotated);
        await page.evaluate(() => window.dispatchEvent(new Event("orientationchange")));
        // Some devices retain the source size on rotation; others renegotiate it.
        await assertLayout(page);
        await assertFrameAlignment(page);
        await setPose(page, type, rotated.height > rotated.width);
        await expect(value()).toBeVisible();
        await assertLayout(page);
        await assertFrameAlignment(page);
        expect(await cameraIdentity(page)).toEqual(initialIdentity);
      }
      await expect.poll(() => fixture.frames.length).toBeGreaterThan(frameCount);
      expect(fixture.counts()).toMatchObject({ sessions: 1, connections: 1, closed: 0 });
      expect(
        fixture.frames.every(
          (frame, index) => frame.sessionId === 78 && frame.sequence === index + 1,
        ),
      ).toBe(true);
      const sourceSize = portrait ? [720, 1280] : [1280, 720];
      await expect
        .poll(() => fixture.frames.at(-1)?.landmarks)
        .toEqual(poseFor(type, sourceSize[0], sourceSize[1]));
      fixture.analysis(8, 66000);
      await expect(
        page.getByRole("status", { name: type === "plank" ? "운동 시간 01:06" : "운동 횟수 8" }),
      ).toBeVisible();
      // Trial click checks hit testing without saving a fixture workout.
      await page.getByRole("button", { name: "운동 종료" }).click({ trial: true });
      expect(errors).toEqual([]);
    });
  }
}

for (const type of ["sit-up", "plank"] as const) {
  for (const viewport of [viewports[0], viewports[1]]) {
    test(`${type} ${viewport.width}×${viewport.height}: safe area`, async ({ page, context }) => {
      await page.setViewportSize(viewport);
      const cdp = await context.newCDPSession(page);
      const safe = { top: 0, left: 44, right: 44, bottom: 21 };
      await cdp.send("Emulation.setSafeAreaInsetsOverride", { insets: safe });
      const fixture = await setupCamera(page);
      await readyCamera(page, type);
      expect(
        await page.locator(".camera-stage").evaluate((el) => getComputedStyle(el).paddingLeft),
      ).toBe("44px");
      await assertLayout(page, safe);
      await setPose(page, type, false);
      await expect.poll(() => fixture.counts().connections).toBe(1);
      fixture.analysis(123, 754000, true);
      await expect(page.getByRole("alert")).toBeVisible();
      await assertLayout(page, safe);
      await page.getByRole("button", { name: "운동 종료" }).click({ trial: true });
      const portraitSafe = { top: 47, left: 0, right: 0, bottom: 34 };
      await page.setViewportSize({ width: viewport.height, height: viewport.width });
      await cdp.send("Emulation.setSafeAreaInsetsOverride", { insets: portraitSafe });
      await assertLayout(page, portraitSafe);
    });
  }
}
