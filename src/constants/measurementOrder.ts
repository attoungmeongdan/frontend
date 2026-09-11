import type { ExerciseType } from "@/constants/exercises";
import type { ExerciseApiType } from "@/types/exercise";

// Backend MeasurementSequence: chair stand → push-up → sit-up → plank.
// Guides, session requests, resume positions and result cards share this order.
export const MEASUREMENT_EXERCISES = [
  { exercise: "chair-stand", apiType: "CHAIR_STAND", introName: "의자 앉았다 일어나기" },
  { exercise: "push-up", apiType: "PUSH_UP", introName: "팔굽혀펴기" },
  { exercise: "sit-up", apiType: "SIT_UP", introName: "윗몸일으키기" },
  { exercise: "plank", apiType: "PLANK", introName: "플랭크" },
] as const satisfies readonly {
  exercise: ExerciseType;
  apiType: ExerciseApiType;
  introName: string;
}[];

export const MEASUREMENT_ORDER = MEASUREMENT_EXERCISES.map(({ apiType }) => apiType);
export const MEASUREMENT_INTRO_BODY = `${MEASUREMENT_EXERCISES.slice(0, 2)
  .map(({ introName }) => introName)
  .join(", ")},\n${MEASUREMENT_EXERCISES.slice(2)
  .map(({ introName }) => introName)
  .join(", ")}\n총 ${MEASUREMENT_EXERCISES.length}단계로 진행돼요!`;
