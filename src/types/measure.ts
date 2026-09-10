import type { ExerciseType } from "@/constants/exercises";

/**
 * 체력 측정 화면의 UI 단계. 서버의 측정 상태·저장 계약과는 별개다.
 * - intro: 새로 시작할 때 1단계 전에 띄우는 전체 안내 모달
 * - ready: 단계 준비 모달
 * - pose-waiting: 자세 인식 대기. 자세가 인식되면 타이머가 자동으로 시작된다
 * - measuring: 첫 3단계 60초 측정, 플랭크 유지 시간 측정
 * - saving / save-error: 종목 기록 저장 중·실패
 * - complete: 4단계 완료 모달
 */
export type MeasurePhase =
  "intro" | "ready" | "pose-waiting" | "measuring" | "saving" | "save-error" | "complete";

/** timed: 60초 동안 측정 / plank: 자세가 무너질 때까지 경과시간 측정 (제한 없음) */
export type MeasureStepFlow = "timed" | "plank";

export interface MeasureStep {
  exercise: ExerciseType;
  name: string;
  flow: MeasureStepFlow;
  valueKind: "count" | "timer";
  mascot: string;
  readyBody: string;
}
