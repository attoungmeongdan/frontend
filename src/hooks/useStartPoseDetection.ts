import { useCallback, useEffect, useRef, useState } from "react";
import type { ExerciseType } from "@/constants/exercises";
import type { PoseFrameSize, PoseLandmarkPayload } from "@/types/exercise";
import { matchesExerciseStartPose } from "@/utils/startPose";

const REQUIRED_CONSECUTIVE_FRAMES = 3;

interface UseStartPoseDetectionOptions {
  exerciseType: ExerciseType;
  enabled: boolean;
  onDetected: () => void;
}

export function useStartPoseDetection({
  exerciseType,
  enabled,
  onDetected,
}: UseStartPoseDetectionOptions) {
  const streakRef = useRef(0);
  const detectedRef = useRef(false);
  const onDetectedRef = useRef(onDetected);
  const [isMatching, setIsMatching] = useState(false);

  useEffect(() => {
    onDetectedRef.current = onDetected;
  }, [onDetected]);

  useEffect(() => {
    streakRef.current = 0;
    detectedRef.current = false;
    setIsMatching(false);
  }, [enabled, exerciseType]);

  const observe = useCallback(
    (landmarks: PoseLandmarkPayload[], frameSize: PoseFrameSize) => {
      if (!enabled || detectedRef.current) return;

      const matches = matchesExerciseStartPose(exerciseType, landmarks, frameSize);
      setIsMatching((current) => (current === matches ? current : matches));
      streakRef.current = matches ? streakRef.current + 1 : 0;

      if (streakRef.current < REQUIRED_CONSECUTIVE_FRAMES) return;
      detectedRef.current = true;
      onDetectedRef.current();
    },
    [enabled, exerciseType],
  );

  return { isMatching, observe };
}
