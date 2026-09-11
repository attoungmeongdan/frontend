import squatGuide from "@/assets/exercises/guide-chair-stand.png";
import chairGuide from "@/assets/exercises/guide-chair-stand-measurement.png";
import plankGuide from "@/assets/exercises/guide-plank.png";
import pushUpGuide from "@/assets/exercises/guide-push-up.png";
import sitUpGuide from "@/assets/exercises/guide-sit-up.png";
import type { ExerciseType } from "@/constants/exercises";

type ExerciseContent = { name: string; image: string; startMessage: string };

// The backend still calls both variants CHAIR_STAND. Keep presentation separate
// from the API identifier: WORKOUT uses squat, MEASUREMENT uses the chair test.
export const EXERCISE_CONTENT = {
  squat: {
    name: "스쿼트",
    image: squatGuide,
    startMessage: "카메라를 향해 서서 기다려 주세요",
  },
  "chair-stand": {
    name: "의자 앉았다 일어나기",
    image: chairGuide,
    startMessage: "의자 앞에 서서 기다려 주세요",
  },
  "push-up": {
    name: "팔굽혀펴기",
    image: pushUpGuide,
    startMessage: "엎드려 팔을 편 자세를 잡아 주세요",
  },
  "sit-up": {
    name: "윗몸일으키기",
    image: sitUpGuide,
    startMessage: "무릎을 접고 바닥에 누워 주세요",
  },
  plank: {
    name: "플랭크",
    image: plankGuide,
    startMessage: "팔꿈치를 접은 플랭크 자세를 잡아 주세요",
  },
} satisfies Record<ExerciseType | "squat", ExerciseContent>;

export function getExerciseContent(type: ExerciseType, mode: "WORKOUT" | "MEASUREMENT") {
  return EXERCISE_CONTENT[type === "chair-stand" && mode === "WORKOUT" ? "squat" : type];
}
