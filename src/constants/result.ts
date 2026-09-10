import type { ExerciseType } from "@/constants/exercises";
import type { ResultValueKind } from "@/types/result";

export interface MeasurementResultExercise {
  type: ExerciseType;
  /** 결과 화면 종목명. 체력 측정 화면·디자인 표기를 따른다 */
  name: string;
  valueKind: ResultValueKind;
}

// 체력 측정 4종목 결과 표시 순서. 체력 측정 진행 순서와 같다
export const MEASUREMENT_RESULT_EXERCISES: MeasurementResultExercise[] = [
  { type: "chair-stand", name: "의자앉았다일어나기", valueKind: "count" },
  { type: "sit-up", name: "윗몸일으키기", valueKind: "count" },
  { type: "push-up", name: "팔굽혀펴기", valueKind: "count" },
  { type: "plank", name: "플랭크", valueKind: "time" },
];

/** 값 옆 단위. 플랭크는 디자인 표기대로 `1:00 분` 형식이다 */
export const RESULT_VALUE_UNIT: Record<ResultValueKind, string> = {
  count: "회",
  time: "분",
};
