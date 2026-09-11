import { expect, test, type Page, type WebSocketRoute } from "@playwright/test";
import { setupCamera } from "./camera-fixture";
import { poseFor } from "../fixtures/poses";
import type { ExerciseType } from "../../src/constants/exercises";

async function setupMeasurement(page: Page, interrupted = false) {
  await setupCamera(page);
  const requests: { mode: string; exerciseType: string; measurementGroupId?: string }[] = [];
  let resumeCalls = 0;
  let rejectNextResume = false;
  let id = 100;
  let saved = 0;
  let exercise = "CHAIR_STAND";
  const order = ["CHAIR_STAND", "PUSH_UP", "SIT_UP", "PLANK"];
  let status = "MEASURING";
  let resultFailures = 0;
  let completeRequests = 0;
  await page.route("**/api/v1/exercise-sessions/*/complete", (route) => {
    completeRequests++;
    return route.fulfill({
      status: 409,
      json: { message: "Measurement cannot be manually completed" },
    });
  });
  let socket: WebSocketRoute;
  const connections: string[] = [];
  const response = (exerciseType: string) => ({
    sessionId: ++id,
    mode: "MEASUREMENT",
    measurementGroupId: "group-1",
    exerciseType,
    transmissionFps: 10,
    timeLimitSeconds: exerciseType === "PLANK" ? 0 : 30,
    webSocketPath: `/ws/v1/exercise-sessions/${id}`,
    socketTicket: `ticket-${id}`,
  });
  await page.route("**/api/v1/exercise-sessions/measurement/progress", (route) =>
    route.fulfill({
      json: {
        data: {
          measurementGroupId: interrupted || id > 100 ? "group-1" : null,
          completedExercises: order.slice(0, saved),
          nextExerciseType: order[saved] ?? null,
          completed: saved === 4,
        },
      },
    }),
  );
  await page.route("**/api/v1/exercise-sessions", (route) => {
    const body = route.request().postDataJSON();
    requests.push(body);
    exercise = body.exerciseType;
    status = "MEASURING";
    return route.fulfill({ json: { data: response(body.exerciseType) } });
  });
  await page.route("**/api/v1/exercise-sessions/measurement/resume", (route) => {
    resumeCalls++;
    status = "MEASURING";
    expect(route.request().method()).toBe("POST");
    expect(route.request().postData()).toBeNull();
    if (rejectNextResume) {
      rejectNextResume = false;
      saved = 1;
      return route.fulfill({
        status: 409,
        json: { code: "FITNESS_409_7", message: "체력측정 운동 순서가 올바르지 않습니다." },
      });
    }
    exercise = order[saved];
    return route.fulfill({ json: { data: response(exercise) } });
  });
  await page.route("**/api/v1/exercise-sessions/*/result", (route) => {
    if (resultFailures > 0) {
      resultFailures--;
      return route.fulfill({
        status: 503,
        json: { message: "측정 결과 서버에 잠시 연결할 수 없어요." },
      });
    }
    return route.fulfill({
      json: {
        data: {
          sessionId: id,
          mode: "MEASUREMENT",
          exerciseType: exercise,
          measurementGroupId: "group-1",
          status,
        },
      },
    });
  });
  await page.routeWebSocket("**/ws/v1/exercise-sessions/*", (ws) => {
    socket = ws;
    connections.push(ws.url());
  });
  return {
    requests,
    connections,
    failResultReads: (count: number) => {
      resultFailures = count;
    },
    completeRequests: () => completeRequests,
    resumeCalls: () => resumeCalls,
    rejectStaleResume: () => {
      rejectNextResume = true;
    },
    complete: (event = true) => {
      status = "COMPLETED";
      saved++;
      socket.send(
        JSON.stringify(
          event
            ? { type: "SESSION_COMPLETED", sessionId: id }
            : {
                type: "ANALYSIS_RESULT",
                sessionId: id,
                remainingTimeMs: 0,
                validCount: 5,
                validDurationMs: 0,
                feedback: [],
              },
        ),
      );
    },
    processingError: () => {
      socket.send(
        JSON.stringify({
          type: "ANALYSIS_RESULT",
          sessionId: id,
          remainingTimeMs: 40000,
          validCount: 8,
          validDurationMs: 0,
          feedback: [],
        }),
      );
      socket.send(
        JSON.stringify({
          type: "ERROR",
          code: "EXERCISE_PROCESSING_FAILED",
          message: "관절 프레임을 처리하지 못했습니다.",
        }),
      );
    },
    expire: () => {
      status = "EXPIRED";
      socket.close({ code: 1000 });
    },
  };
}
async function setPose(page: Page, type: ExerciseType) {
  await page.evaluate(
    (landmarks) => {
      window.cameraFixture.landmarks = landmarks;
    },
    poseFor(type, 1280, 720),
  );
}
async function enter(page: Page) {
  await page.setViewportSize({ width: 844, height: 390 });
  await page.goto("/measure");
  await page.getByRole("button", { name: "알겠어요" }).click();
  await page.getByRole("button", { name: "준비됐어요" }).click();
  await expect(page.getByText("자세를 취하고 운동하면 자동으로 측정이 시작돼요")).toBeVisible();
}

test("measurement advances through all exercises when the first completion event is lost", async ({
  page,
}) => {
  const fixture = await setupMeasurement(page);
  await enter(page);
  const steps = ["chair-stand", "push-up", "sit-up", "plank"] as const;
  for (const [index, type] of steps.entries()) {
    await setPose(page, type);
    await expect.poll(() => fixture.connections.length).toBe(index + 1);
    if (type === "sit-up") {
      fixture.processingError();
      await expect(page.getByText("남은 시간 00:40")).toBeVisible();
      await expect(page.getByRole("button", { name: "완료 상태 다시 확인" })).toHaveCount(0);
    }
    fixture.complete(index > 0);
    if (index < 3) {
      await page.getByRole("button", { name: "준비됐어요" }).click();
      await expect(page.getByText("자세를 취하고 운동하면 자동으로 측정이 시작돼요")).toBeVisible();
    }
  }
  await page.getByRole("button", { name: "측정 분석 보기" }).click();
  await expect(page).toHaveURL(/\/measurements\/group-1\/analysis/);
  expect(fixture.requests).toEqual([
    { mode: "MEASUREMENT", exerciseType: "CHAIR_STAND" },
    { mode: "MEASUREMENT", exerciseType: "PUSH_UP", measurementGroupId: "group-1" },
    { mode: "MEASUREMENT", exerciseType: "SIT_UP", measurementGroupId: "group-1" },
    { mode: "MEASUREMENT", exerciseType: "PLANK", measurementGroupId: "group-1" },
  ]);
  expect(fixture.resumeCalls()).toBe(0);
  expect(fixture.completeRequests()).toBe(0);
});

test("an interrupted first exercise resumes on entry and restarts with fresh credentials after expiry", async ({
  page,
}) => {
  const fixture = await setupMeasurement(page, true);
  await enter(page);
  await setPose(page, "chair-stand");
  await expect.poll(() => fixture.connections.length).toBe(1);
  expect(fixture.resumeCalls()).toBe(1);
  fixture.expire();
  await expect(page.getByRole("button", { name: "세션 다시 시작" })).toBeVisible();
  // Reacquire the pose after selecting restart.
  await page.evaluate(() => {
    window.cameraFixture.landmarks = [];
  });
  await page.getByRole("button", { name: "세션 다시 시작" }).click();
  await expect(page.getByText("자세를 취하고 운동하면 자동으로 측정이 시작돼요")).toBeVisible();
  await setPose(page, "chair-stand");
  await expect.poll(() => fixture.connections.length).toBe(2);
  expect(fixture.resumeCalls()).toBe(2);
  expect(fixture.requests).toEqual([]);
  expect(fixture.connections[0]).toContain("/101?ticket=ticket-101");
  expect(fixture.connections[1]).toContain("/102?ticket=ticket-102");
});

test("order rejection refreshes the guide and starts the backend's next exercise", async ({
  page,
}) => {
  const fixture = await setupMeasurement(page, true);
  await enter(page);
  fixture.rejectStaleResume();
  await setPose(page, "chair-stand");
  await expect(page.getByRole("dialog")).toContainText("팔굽혀펴기");
  expect(fixture.connections).toHaveLength(0);
  await page.getByRole("button", { name: "준비됐어요" }).click();
  await setPose(page, "push-up");
  await expect.poll(() => fixture.connections.length).toBe(1);
  expect(fixture.resumeCalls()).toBe(2);
  await expect(page.getByRole("alert")).toHaveCount(0);
});

test("failed result reads show readable recovery text and retry only verification", async ({
  page,
}, testInfo) => {
  const fixture = await setupMeasurement(page);
  await enter(page);
  await setPose(page, "chair-stand");
  await expect.poll(() => fixture.connections.length).toBe(1);
  fixture.failResultReads(4);
  fixture.complete();
  const retry = page.getByRole("button", { name: "완료 상태 다시 확인" });
  await expect(retry).toBeVisible({ timeout: 10000 });
  const message = page.getByRole("alert");
  await expect(message).toHaveText("측정 결과 서버에 잠시 연결할 수 없어요.");
  await expect(message).toHaveCSS("color", "rgb(37, 49, 49)");
  await page.screenshot({ path: testInfo.outputPath("measurement-recovery.png") });
  await retry.click();
  await expect(page.getByRole("dialog")).toContainText("팔굽혀펴기");
  expect(fixture.completeRequests()).toBe(0);
  expect(fixture.requests).toHaveLength(1);
  expect(fixture.connections).toHaveLength(1);
});
