import type { ExerciseType } from "@/constants/exercises";
import type { PoseLandmarkPayload } from "@/types/exercise";

const MIN_VISIBILITY = 0.55;

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
  return indexes.every((index) => (landmarks[index]?.visibility ?? 0) >= MIN_VISIBILITY);
}

function isHorizontal(first: PoseLandmarkPayload, second: PoseLandmarkPayload) {
  return Math.abs(first.x - second.x) > Math.abs(first.y - second.y) * 1.15;
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
        kneeAngle >= 155 &&
        hipAngle >= 145 &&
        Math.abs(shoulder.y - ankle.y) > Math.abs(shoulder.x - ankle.x)
      );
    case "push-up":
      return (
        angle(shoulder, elbow, wrist) >= 150 &&
        angle(shoulder, hip, ankle) >= 150 &&
        isHorizontal(shoulder, ankle)
      );
    case "sit-up":
      return hipAngle >= 140 && kneeAngle <= 125 && isHorizontal(shoulder, hip);
    case "plank": {
      const elbowAngle = angle(shoulder, elbow, wrist);
      return (
        angle(shoulder, hip, ankle) >= 150 &&
        kneeAngle >= 150 &&
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
) {
  if (landmarks.length !== 33) return false;
  return (
    matchesSide(exerciseType, landmarks, "left") || matchesSide(exerciseType, landmarks, "right")
  );
}
