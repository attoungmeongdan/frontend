import { expect, type Page, type WebSocketRoute } from "@playwright/test";
import type { PoseLandmarkPayload } from "../../src/types/exercise";

export interface CameraFixture {
  landmarks: PoseLandmarkPayload[];
  width: number;
  height: number;
  acquisitions: number;
  stops: number;
  models: number;
  modelCloses: number;
}
declare global {
  interface Window {
    cameraFixture: CameraFixture;
  }
}

// Only external boundaries are replaced. ExercisePage, camera/detection/session hooks,
// HTMLVideoElement, canvas rendering and browser WebSocket all run normally.
export async function setupCamera(page: Page) {
  await page.addInitScript(() => {
    window.cameraFixture = {
      landmarks: [],
      width: 1280,
      height: 720,
      acquisitions: 0,
      stops: 0,
      models: 0,
      modelCloses: 0,
    };
    Object.defineProperty(navigator.mediaDevices, "getUserMedia", {
      value: async () => {
        const fixture = window.cameraFixture;
        fixture.acquisitions++;
        const source = document.createElement("canvas");
        const context = source.getContext("2d")!;
        source.width = fixture.width;
        source.height = fixture.height;
        const draw = () => {
          source.width = fixture.width;
          source.height = fixture.height;
          context.fillStyle = "#334b50";
          context.fillRect(0, 0, source.width, source.height);
          context.strokeStyle = "white";
          context.lineWidth = 4;
          context.strokeRect(2, 2, source.width - 4, source.height - 4);
          requestAnimationFrame(draw);
        };
        draw();
        const stream = source.captureStream(20);
        for (const track of stream.getTracks()) {
          const stop = track.stop.bind(track);
          track.stop = () => {
            fixture.stops++;
            stop();
          };
        }
        return stream;
      },
    });
  });
  await page.route(/.*mediapipe.*tasks.vision.*\.js.*/, (route) =>
    route.fulfill({
      contentType: "application/javascript",
      body: `
      export const FilesetResolver = { forVisionTasks: async () => ({}) };
      export class PoseLandmarker {
        static POSE_CONNECTIONS = [];
        static async createFromOptions() { window.cameraFixture.models++; return new PoseLandmarker(); }
        detectForVideo() { return { landmarks: [window.cameraFixture.landmarks] }; }
        close() { window.cameraFixture.modelCloses++; }
      }
      export class DrawingUtils {
        constructor(context) { this.context = context; }
        drawConnectors() {}
        drawLandmarks(landmarks) {
          const ctx = this.context; ctx.fillStyle = '#ffc245';
          for (const p of landmarks) {
            ctx.beginPath(); ctx.arc(p.x * ctx.canvas.width, p.y * ctx.canvas.height, 4, 0, Math.PI * 2); ctx.fill();
          }
        }
      }
    `,
    }),
  );
  let sessions = 0;
  let connections = 0;
  let closed = 0;
  const frames: { sequence: number; sessionId: number; landmarks: PoseLandmarkPayload[] }[] = [];
  let socket: WebSocketRoute;
  await page.route("**/api/v1/auth/refresh", (route) =>
    route.fulfill({ json: { data: { accessToken: "test" } } }),
  );
  await page.route("**/api/v1/exercise-sessions", (route) => {
    sessions++;
    return route.fulfill({
      json: {
        data: {
          sessionId: 78,
          mode: "WORKOUT",
          exerciseType: route.request().postDataJSON().exerciseType,
          transmissionFps: 10,
          webSocketPath: "/ws/exercise/78",
          socketTicket: "fixture-ticket",
        },
      },
    });
  });
  await page.routeWebSocket("**/ws/exercise/78*", (ws) => {
    connections++;
    socket = ws;
    ws.onMessage((message) => frames.push(JSON.parse(String(message))));
    ws.onClose(() => closed++);
  });
  return {
    counts: () => ({ sessions, connections, closed, frames: frames.length }),
    frames,
    analysis: (validCount = 7, validDurationMs = 65000, warning = false) =>
      socket.send(
        JSON.stringify({
          type: "ANALYSIS_RESULT",
          sessionId: 78,
          sequence: 1,
          phase: "ACTIVE",
          validCount,
          validDurationMs,
          feedback: warning
            ? [
                {
                  severity: "WARNING",
                  message:
                    "몸 전체가 화면에 보이도록 카메라에서 조금 떨어져 자세를 다시 잡아 주세요.",
                },
              ]
            : [],
        }),
      ),
  };
}

export async function readyCamera(page: Page, type: string) {
  await page.goto(`/exercise/${type}`);
  await expect(page.locator("video")).toBeVisible();
  await expect.poll(() => page.evaluate(() => window.cameraFixture.models)).toBe(1);
  await expect(page.getByText("자세를 취하고 운동하면 자동으로 측정이 시작돼요")).toBeVisible();
}
