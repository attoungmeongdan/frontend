import { useCallback, useEffect, useRef, useState } from "react";
import type { NormalizedLandmark, PoseLandmarker } from "@mediapipe/tasks-vision";
import type { ExerciseCameraState, PoseLandmarkPayload } from "@/types/exercise";

const MEDIAPIPE_VERSION = "1.0.1";
const WASM_BASE_URL = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${MEDIAPIPE_VERSION}/wasm`;
const MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_full/float16/1/pose_landmarker_full.task";

interface PoseCameraDiagnostics {
  cameraReady: boolean;
  modelReady: boolean;
  landmarkCount: number;
  inferenceFps: number;
}

interface UsePoseCameraOptions {
  onPoseFrame: (landmarks: PoseLandmarkPayload[]) => void;
}

function cameraErrorState(error: unknown): ExerciseCameraState {
  if (!(error instanceof DOMException)) return "camera-unavailable";
  if (error.name === "NotAllowedError" || error.name === "SecurityError") {
    return "permission-denied";
  }
  if (error.name === "NotReadableError" || error.name === "AbortError") return "camera-busy";
  return "camera-unavailable";
}

function toPayload(landmarks: NormalizedLandmark[]): PoseLandmarkPayload[] {
  return landmarks.map((landmark, index) => ({
    index,
    x: landmark.x,
    y: landmark.y,
    z: landmark.z,
    visibility: landmark.visibility,
    // 일부 MediaPipe 빌드는 presence를 런타임에 제공하지만 타입에는 아직 없다.
    // 없는 값을 높은 신뢰도로 꾸미지 않고 0으로 전달한다.
    presence: (landmark as NormalizedLandmark & { presence?: number }).presence ?? 0,
  }));
}

export function usePoseCamera({ onPoseFrame }: UsePoseCameraOptions) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const landmarkerRef = useRef<PoseLandmarker | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const runIdRef = useRef(0);
  const stateRef = useRef<ExerciseCameraState>("permission-request");
  const onPoseFrameRef = useRef(onPoseFrame);
  const [state, setState] = useState<ExerciseCameraState>("permission-request");
  const [diagnostics, setDiagnostics] = useState<PoseCameraDiagnostics>({
    cameraReady: false,
    modelReady: false,
    landmarkCount: 0,
    inferenceFps: 0,
  });

  useEffect(() => {
    onPoseFrameRef.current = onPoseFrame;
  }, [onPoseFrame]);

  const updateState = useCallback((nextState: ExerciseCameraState) => {
    if (stateRef.current === nextState) return;
    stateRef.current = nextState;
    setState(nextState);
  }, []);

  const stop = useCallback(() => {
    runIdRef.current += 1;
    if (animationFrameRef.current !== null) {
      window.cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    landmarkerRef.current?.close();
    landmarkerRef.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  const start = useCallback(async () => {
    stop();
    const runId = runIdRef.current;
    updateState("loading");
    setDiagnostics({ cameraReady: false, modelReady: false, landmarkCount: 0, inferenceFps: 0 });

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode: "user",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });
    } catch (error) {
      if (runId === runIdRef.current) updateState(cameraErrorState(error));
      return;
    }

    if (runId !== runIdRef.current) {
      stream.getTracks().forEach((track) => track.stop());
      return;
    }

    streamRef.current = stream;
    stream.getVideoTracks()[0]?.addEventListener(
      "ended",
      () => {
        if (runId === runIdRef.current) updateState("disconnected");
      },
      { once: true },
    );

    const video = videoRef.current;
    if (!video) return;
    video.srcObject = stream;

    try {
      await video.play();
      setDiagnostics((current) => ({ ...current, cameraReady: true }));
    } catch (error) {
      if (runId === runIdRef.current) updateState(cameraErrorState(error));
      return;
    }

    let landmarker: PoseLandmarker;
    let DrawingUtilsClass: typeof import("@mediapipe/tasks-vision").DrawingUtils;
    let poseConnections: typeof import("@mediapipe/tasks-vision").PoseLandmarker.POSE_CONNECTIONS;
    try {
      const {
        DrawingUtils,
        FilesetResolver,
        PoseLandmarker: PoseLandmarkerClass,
      } = await import("@mediapipe/tasks-vision");
      const vision = await FilesetResolver.forVisionTasks(WASM_BASE_URL);
      const options = {
        runningMode: "VIDEO",
        numPoses: 1,
        minPoseDetectionConfidence: 0.5,
        minPosePresenceConfidence: 0.5,
        minTrackingConfidence: 0.5,
        outputSegmentationMasks: false,
      } as const;
      try {
        landmarker = await PoseLandmarkerClass.createFromOptions(vision, {
          ...options,
          baseOptions: { modelAssetPath: MODEL_URL, delegate: "GPU" },
        });
      } catch {
        landmarker = await PoseLandmarkerClass.createFromOptions(vision, {
          ...options,
          baseOptions: { modelAssetPath: MODEL_URL, delegate: "CPU" },
        });
      }
      DrawingUtilsClass = DrawingUtils;
      poseConnections = PoseLandmarkerClass.POSE_CONNECTIONS;
    } catch {
      if (runId === runIdRef.current) updateState("model-error");
      return;
    }

    if (runId !== runIdRef.current) {
      landmarker.close();
      return;
    }

    landmarkerRef.current = landmarker;
    setDiagnostics((current) => ({ ...current, modelReady: true }));
    updateState("normal");

    let lastVideoTime = -1;
    let lastInferenceAt = 0;
    let frameCount = 0;
    let fpsWindowStartedAt = performance.now();

    const detect = () => {
      if (runId !== runIdRef.current) return;
      if (video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
        animationFrameRef.current = window.requestAnimationFrame(detect);
        return;
      }

      const inferenceStartedAt = performance.now();
      if (video.currentTime !== lastVideoTime && inferenceStartedAt - lastInferenceAt >= 50) {
        lastVideoTime = video.currentTime;
        lastInferenceAt = inferenceStartedAt;
        let result;
        try {
          result = landmarker.detectForVideo(video, inferenceStartedAt);
        } catch {
          updateState("model-error");
          return;
        }
        const landmarks = result.landmarks[0] ?? [];
        const canvas = canvasRef.current;

        if (canvas) {
          if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
          }
          const context = canvas.getContext("2d");
          context?.clearRect(0, 0, canvas.width, canvas.height);
          if (context && landmarks.length === 33) {
            const drawing = new DrawingUtilsClass(context);
            drawing.drawConnectors(landmarks, poseConnections, {
              color: "#73c6ae",
              lineWidth: 4,
            });
            drawing.drawLandmarks(landmarks, { color: "#ffc245", radius: 4 });
          }
        }

        updateState(landmarks.length === 33 ? "normal" : "no-body");
        if (landmarks.length === 33) onPoseFrameRef.current(toPayload(landmarks));

        frameCount += 1;
        const now = performance.now();
        if (now - fpsWindowStartedAt >= 1_000) {
          const inferenceFps = Math.round((frameCount * 1_000) / (now - fpsWindowStartedAt));
          setDiagnostics((current) => ({
            ...current,
            landmarkCount: landmarks.length,
            inferenceFps,
          }));
          frameCount = 0;
          fpsWindowStartedAt = now;
        }
      }

      animationFrameRef.current = window.requestAnimationFrame(detect);
    };

    animationFrameRef.current = window.requestAnimationFrame(detect);
  }, [stop, updateState]);

  useEffect(() => stop, [stop]);

  return { videoRef, canvasRef, state, diagnostics, start, stop };
}
