import type { ExerciseType } from "../../src/constants/exercises";
import type { PoseLandmarkPayload } from "../../src/types/exercise";

// Coordinates use equal-length x/y units before normalization, as in a source image.
// Slightly oblique side views exercise the angle distortion of non-square frames.
export function poseFor(type: ExerciseType, width = 1280, height = 720) {
  const points: Record<number, [number, number]> =
    type === "chair-stand"
      ? { 11: [-0.05, -0.3], 23: [0, 0], 25: [0.03, 0.2], 27: [0.06, 0.4] }
      : type === "sit-up"
        ? { 11: [-0.3, -0.3], 23: [0, 0], 25: [0.16, -0.22], 27: [0.3, 0] }
        : {
            11: [-0.3, -0.12],
            23: [0, 0],
            25: [0.2, 0.08],
            27: [0.4, 0.16],
            13: type === "plank" ? [-0.4, 0.08] : [-0.32, 0.08],
            15: type === "plank" ? [-0.2, 0.23] : [-0.34, 0.28],
          };
  const landmarks: PoseLandmarkPayload[] = Array.from({ length: 33 }, (_, index) => ({
    index,
    x: 0.5,
    y: 0.5,
    z: 0,
    visibility: 0,
    presence: 1,
  }));
  for (const [index, [x, y]] of Object.entries(points)) {
    for (const side of [0, 1]) {
      const joint = landmarks[Number(index) + side];
      joint.x = 0.5 + (x * Math.min(width, height)) / width;
      joint.y = 0.5 + (y * Math.min(width, height)) / height;
      joint.visibility = 0.99;
    }
  }
  return landmarks;
}
