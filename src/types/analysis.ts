import type { ExerciseType } from "@/constants/exercises";
import type { ResultComparison } from "@/types/result";

// 측정 분석 화면 표시용 모델이다. 서버 응답 DTO 가 아니며,
// 실제 조회 API·응답 필드·측정 ID 계약은 API 연동(#15)에서 확인해 이 형태로 옮긴다.

export interface AnalysisResultItem {
  exercise: ExerciseType;
  /** 사용자 수행값. 횟수 종목은 회, 플랭크는 초 */
  value: number;
  /** 동연령대 평균. 비교 데이터가 없으면 null 이며 0 으로 대체하지 않는다 */
  average: number | null;
  /** 동연령대 평균 대비 비교 상태. 비교 데이터가 없으면 null */
  comparison: ResultComparison | null;
}

export interface AnalysisDistributionView {
  /** 비교 대상 집단. 예: "30대 여성" */
  groupLabel: string;
  source: string;
  /** 백분위 0→100 순서의 구간별 막대 상대 높이 */
  bins: number[];
  /** 사용자가 속한 구간 index */
  highlightIndex: number;
  percentile: number;
}

export interface AnalysisView {
  /** 비어 있으면 결과 없음 상태 */
  results: AnalysisResultItem[];
  /** 비교 데이터가 없으면 null */
  distribution: AnalysisDistributionView | null;
  /** 운동능력 나이 표시 문구. 예: "40대". 비교 데이터가 없으면 null */
  fitnessAgeLabel: string | null;
}
