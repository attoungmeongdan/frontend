import { expect, test, type Page, type WebSocketRoute } from "@playwright/test";
import { setupCamera } from "./camera-fixture";
import { poseFor } from "../fixtures/poses";
import type { ExerciseType } from "../../src/constants/exercises";

async function setupMeasurement(page: Page, interrupted = false) {
  await setupCamera(page);
  const requests: { mode: string; exerciseType: string; measurementGroupId?: string }[] = [];
  let resumeCalls = 0;
  let id = 100;
  let saved = 0;
  let exercise = "CHAIR_STAND";
  const order = ["CHAIR_STAND", "PUSH_UP", "SIT_UP", "PLANK"];
  let status = "MEASURING";
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
    return route.fulfill({ json: { data: response("CHAIR_STAND") } });
  });
  await page.route("**/api/v1/exercise-sessions/*/result", (route) =>
    route.fulfill({
      json: {
        data: {
          sessionId: id,
          mode: "MEASUREMENT",
          exerciseType: exercise,
          measurementGroupId: "group-1",
          status,
        },
      },
    }),
  );
  await page.routeWebSocket("**/ws/v1/exercise-sessions/*", (ws) => {
    socket = ws;
    connections.push(ws.url());
  });
  return {
    requests,
    connections,
    resumeCalls: () => resumeCalls,
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
