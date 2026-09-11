import type { ExerciseType } from "@/constants/exercises";
import type { PoseFrameSize, PoseLandmarkPayload } from "@/types/exercise";

const MIN_VISIBILITY = 0.6;

function angle(
  first: PoseLandmarkPayload,
  vertex: PoseLandmarkPayload,
  third: PoseLandmarkPayload,
) {
  const firstX = first.x - vertex.x;
  const firstY = first.y - vertex.y;
  const secondX = third.x - vertex.x;
  const secondY = third.y - vertex.y;
  const firstLength = Math.hypot(firstX, firstY);
  const secondLength = Math.hypot(secondX, secondY);

  if (!firstLength || !secondLength) return 0;
  const cosine = (firstX * secondX + firstY * secondY) / (firstLength * secondLength);
  return (Math.acos(Math.max(-1, Math.min(1, cosine))) * 180) / Math.PI;
}

function visible(landmarks: PoseLandmarkPayload[], ...indexes: number[]) {
  return indexes.every((index) => {
    const point = landmarks[index];
    return (
      point &&
      Number.isFinite(point.x) &&
      Number.isFinite(point.y) &&
      point.visibility >= MIN_VISIBILITY
    );
  });
}

function isHorizontal(first: PoseLandmarkPayload, second: PoseLandmarkPayload) {
  return Math.abs(first.x - second.x) > Math.abs(first.y - second.y) * 1.15;
}

function isLyingDown(first: PoseLandmarkPayload, second: PoseLandmarkPayload) {
  return Math.abs(first.x - second.x) > Math.abs(first.y - second.y) * 0.6;
}

function matchesSide(
  exerciseType: ExerciseType,
  landmarks: PoseLandmarkPayload[],
  side: "left" | "right",
) {
  const shoulderIndex = side === "left" ? 11 : 12;
  const elbowIndex = side === "left" ? 13 : 14;
  const wristIndex = side === "left" ? 15 : 16;
  const hipIndex = side === "left" ? 23 : 24;
  const kneeIndex = side === "left" ? 25 : 26;
  const ankleIndex = side === "left" ? 27 : 28;
  const required = [shoulderIndex, hipIndex, kneeIndex, ankleIndex];

  if (exerciseType === "push-up" || exerciseType === "plank") {
    required.push(elbowIndex, wristIndex);
  }
  if (!visible(landmarks, ...required)) return false;

  const shoulder = landmarks[shoulderIndex];
  const elbow = landmarks[elbowIndex];
  const wrist = landmarks[wristIndex];
  const hip = landmarks[hipIndex];
  const knee = landmarks[kneeIndex];
  const ankle = landmarks[ankleIndex];
  const kneeAngle = angle(hip, knee, ankle);
  const hipAngle = angle(shoulder, hip, knee);

  switch (exerciseType) {
    case "chair-stand":
      return (
        kneeAngle >= 150 &&
        hipAngle >= 150 &&
        Math.abs(shoulder.y - ankle.y) > Math.abs(shoulder.x - ankle.x)
      );
    case "push-up":
      return (
        angle(shoulder, elbow, wrist) >= 150 &&
        angle(shoulder, hip, ankle) >= 160 &&
        isHorizontal(shoulder, ankle)
      );
    case "sit-up":
      return kneeAngle <= 145 && isLyingDown(shoulder, hip);
    case "plank": {
      const elbowAngle = angle(shoulder, elbow, wrist);
      return (
        angle(shoulder, hip, ankle) >= 160 &&
        kneeAngle >= 160 &&
        elbowAngle >= 55 &&
        elbowAngle <= 125 &&
        isHorizontal(shoulder, ankle)
      );
    }
  }
}

export function matchesExerciseStartPose(
  exerciseType: ExerciseType,
  landmarks: PoseLandmarkPayload[],
  frameSize: PoseFrameSize,
) {
  const { width, height } = frameSize;
  if (
    landmarks.length !== 33 ||
    !Number.isFinite(width) ||
    !Number.isFinite(height) ||
    width <= 0 ||
    height <= 0
  )
    return false;
  // MediaPipe normalizes x and y by different dimensions. Restore equal axis
  // units for angles/slope checks; do not rotate by screen orientation or mutate
  // the original normalized payload sent to the workout server.
  const points = landmarks.map((point) => ({ ...point, x: (point.x * width) / height }));
  return matchesSide(exerciseType, points, "left") || matchesSide(exerciseType, points, "right");
}
