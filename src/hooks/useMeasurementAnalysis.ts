import { useQuery } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { getMeasurementAnalysis, getMeasurementResults } from "@/apis/exercise";
import { EXERCISES } from "@/constants/exercises";
import type { AnalysisResultItem, AnalysisView } from "@/types/analysis";
import type {
  ApiExerciseType,
  ApiGender,
  ComparisonLevel,
  ExercisePeerComparison,
  MeasuredExercise,
  MeasurementAnalysis,
} from "@/types/exercise";
import type { ResultComparison } from "@/types/result";

const GENDER_LABEL: Record<ApiGender, string> = { MALE: "남성", FEMALE: "여성" };
const COMPARISON_LEVEL: Record<ComparisonLevel, ResultComparison> = {
  LOW: "low",
  SIMILAR: "similar",
  HIGH: "high",
};

function toExerciseType(apiType: ApiExerciseType) {
  return EXERCISES.find((exercise) => exercise.apiType === apiType)?.type;
}

function toResultItem(comparison: ExercisePeerComparison): AnalysisResultItem | null {
  const exercise = toExerciseType(comparison.exerciseType);
  if (!exercise) return null;

  return {
    exercise,
    value: comparison.measuredValue,
    average: comparison.averageValue,
    comparison: COMPARISON_LEVEL[comparison.level],
  };
}

function toResultItemFromMeasured(measured: MeasuredExercise): AnalysisResultItem | null {
  const exercise = toExerciseType(measured.exerciseType);
  if (!exercise) return null;

  return { exercise, value: measured.value, average: null, comparison: null };
}

// 백분위 표본이 30건 미만이면 available=false 이고 value/userBucketIndex 등이 null 이다.
// 0 이나 임의 값으로 대체하지 않고 분포 자체를 표시하지 않는다
function toDistribution(analysis: MeasurementAnalysis): AnalysisView["distribution"] {
  const { percentile } = analysis;

  if (!percentile.available || percentile.value === null || percentile.userBucketIndex === null) {
    return null;
  }

  return {
    groupLabel: `${percentile.comparisonAgeGroup} ${GENDER_LABEL[percentile.comparisonGender]}`,
    source: "핏틀 사용자 비교",
    bins: percentile.buckets.map((bucket) => bucket.count),
    highlightIndex: percentile.userBucketIndex,
    percentile: percentile.value,
  };
}

// fitnessPerformance 는 표본 수와 무관하게 성별·연령대 그룹 평균과의 유사도로 계산돼 항상 내려온다.
// 임의의 나이를 만들지 않고 서버가 정한 그룹 라벨을 그대로 쓴다
function toAnalysisView(analysis: MeasurementAnalysis): AnalysisView {
  const results = analysis.exerciseComparisons
    .map(toResultItem)
    .filter((item): item is AnalysisResultItem => item !== null);

  return {
    results,
    distribution: toDistribution(analysis),
    fitnessAgeLabel: analysis.fitnessPerformance.label,
  };
}

function toNoComparisonView(exercises: MeasuredExercise[]): AnalysisView {
  const results = exercises
    .map(toResultItemFromMeasured)
    .filter((item): item is AnalysisResultItem => item !== null);

  return { results, distribution: null, fitnessAgeLabel: null };
}

export type MeasurementAnalysisState =
  | { status: "loading" }
  /** 측정 그룹 없음(404) 또는 4종목 미완료(409). 기존 "결과 없음" 화면을 재사용한다 */
  | { status: "empty" }
  | { status: "error"; retry: () => void }
  | { status: "success"; view: AnalysisView };

/**
 * /analysis 로 종합 분석을 조회한다.
 * 400(나이·성별 정보 없음)이면 비교값 없이 측정값만 있는 /results 로 대체해
 * 기존 "비교 데이터 없음" 화면으로 보여 준다.
 */
export function useMeasurementAnalysis(
  measurementGroupId: string | undefined,
): MeasurementAnalysisState {
  const analysisQuery = useQuery({
    queryKey: ["measurement-analysis", measurementGroupId],
    queryFn: () => getMeasurementAnalysis(measurementGroupId as string),
    enabled: !!measurementGroupId,
  });

  const analysisStatus = isAxiosError(analysisQuery.error)
    ? analysisQuery.error.response?.status
    : undefined;

  const resultsQuery = useQuery({
    queryKey: ["measurement-results", measurementGroupId],
    queryFn: () => getMeasurementResults(measurementGroupId as string),
    enabled: !!measurementGroupId && analysisStatus === 400,
  });

  if (!measurementGroupId) {
    return { status: "empty" };
  }

  if (analysisQuery.isSuccess) {
    const view = toAnalysisView(analysisQuery.data);

    return view.results.length === 0 ? { status: "empty" } : { status: "success", view };
  }

  if (analysisStatus === 404 || analysisStatus === 409) {
    return { status: "empty" };
  }

  if (analysisStatus === 400) {
    if (resultsQuery.isSuccess) {
      const view = toNoComparisonView(resultsQuery.data.exercises);

      return view.results.length === 0 ? { status: "empty" } : { status: "success", view };
    }

    if (resultsQuery.isError) {
      return {
        status: "error",
        retry: () => {
          void analysisQuery.refetch();
          void resultsQuery.refetch();
        },
      };
    }

    return { status: "loading" };
  }

  if (analysisQuery.isError) {
    return { status: "error", retry: () => void analysisQuery.refetch() };
  }

  return { status: "loading" };
}
