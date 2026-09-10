import chairStand from "@/assets/exercises/exercise-chair-stand.png";
import plank from "@/assets/exercises/exercise-plank.png";
import pushUp from "@/assets/exercises/exercise-push-up.png";
import sitUp from "@/assets/exercises/exercise-sit-up.png";

import type { ApiExerciseType } from "@/types/exercise";

export type ExerciseType = "sit-up" | "chair-stand" | "push-up" | "plank";

export interface Exercise {
  type: ExerciseType;
  apiType: ApiExerciseType;
  label: string;
  cardLabel: string;
  icon: string;
}

// 운동 4종
export const EXERCISES: Exercise[] = [
  {
    type: "sit-up",
    apiType: "SIT_UP",
    label: "윗몸일으키기",
    cardLabel: "윗몸일으키기",
    icon: sitUp,
  },
  {
    type: "chair-stand",
    apiType: "CHAIR_STAND",
    label: "의자 앉았다 일어나기",
    cardLabel: "의자 앉았다 일어나기",
    icon: chairStand,
  },
  {
    type: "push-up",
    apiType: "PUSH_UP",
    label: "팔굽혀펴기",
    cardLabel: "팔굽혀펴기",
    icon: pushUp,
  },
  { type: "plank", apiType: "PLANK", label: "플랭크", cardLabel: "플랭크", icon: plank },
];
