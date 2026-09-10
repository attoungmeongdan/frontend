import type { AnalysisView } from "@/types/analysis";

// Issue #11 퍼블리싱 전용 목데이터다.
// 평균·비교 상태·백분위·분포·운동능력 나이는 화면 확인용 임의 값이며 실제 국민체육진흥공단(국민체력100) 통계가 아니다.
// 비교 상태와 백분위·나이는 계산하지 않고 값으로 명시한다. 실제 조회 API·측정 ID 계약과 무관하다(#15).

export const ANALYSIS_MOCK: AnalysisView = {
  results: [
    { exercise: "chair-stand", value: 1, average: 10, comparison: "low" },
    { exercise: "sit-up", value: 10, average: 10, comparison: "similar" },
    { exercise: "push-up", value: 15, average: 10, comparison: "high" },
    { exercise: "plank", value: 60, average: 60, comparison: "similar" },
  ],
  distribution: {
    groupLabel: "30대 여성",
    source: "국민체육진흥공단",
    bins: [18, 30, 46, 64, 58, 42, 28, 16],
    highlightIndex: 4,
    percentile: 62,
  },
  fitnessAgeLabel: "40대",
};

export const ANALYSIS_NO_COMPARISON_MOCK: AnalysisView = {
  results: ANALYSIS_MOCK.results.map((result) => ({
    ...result,
    average: null,
    comparison: null,
  })),
  distribution: null,
  fitnessAgeLabel: null,
};

export const ANALYSIS_EMPTY_MOCK: AnalysisView = {
  results: [],
  distribution: null,
  fitnessAgeLabel: null,
};

/** 다시 불러오기를 누른 뒤 목 로딩을 보여 주는 시간 */
export const MOCK_RETRY_DELAY_MS = 1200;

const ANALYSIS_MOCK_STATES = ["default", "loading", "error", "empty", "no-comparison"] as const;

export type AnalysisMockState = (typeof ANALYSIS_MOCK_STATES)[number];

/**
 * 상태 확인용 URL 쿼리 `?state=loading|error|empty|no-comparison`.
 * 없거나 알 수 없는 값이면 default 다
 */
export function readAnalysisMockState(value: string | null): AnalysisMockState {
  return ANALYSIS_MOCK_STATES.find((state) => state === value) ?? "default";
}
