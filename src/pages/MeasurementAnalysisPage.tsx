import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import turtleGuide from "@/assets/mascots/turtle-guide.png";
import AnalysisLoading from "@/components/analysis/AnalysisLoading";
import AnalysisStatusMessage from "@/components/analysis/AnalysisStatusMessage";
import DistributionUnavailable from "@/components/analysis/DistributionUnavailable";
import FitnessAgeCard from "@/components/analysis/FitnessAgeCard";
import PercentileDistribution from "@/components/analysis/PercentileDistribution";
import ExerciseResultCard from "@/components/result/ExerciseResultCard";
import Button from "@/components/ui/Button";
import MascotSpeech from "@/components/ui/MascotSpeech";
import { MEASUREMENT_RESULT_EXERCISES, RESULT_VALUE_UNIT } from "@/constants/result";
import {
  ANALYSIS_EMPTY_MOCK,
  ANALYSIS_MOCK,
  ANALYSIS_NO_COMPARISON_MOCK,
  MOCK_RETRY_DELAY_MS,
  readAnalysisMockState,
  type AnalysisMockState,
} from "@/mocks/analysis";
import type { AnalysisView } from "@/types/analysis";
import type { ResultValueKind } from "@/types/result";
import { formatDurationClock, formatDurationText } from "@/utils/result";

const MAP_GUIDE_MESSAGE = "주변에 운동할 곳이 있나 \n알아보러 갈까요?";

type RetryPhase = "idle" | "loading" | "done";

function formatValue(kind: ResultValueKind, value: number) {
  return kind === "time" ? formatDurationClock(value) : String(value);
}

function formatAverage(kind: ResultValueKind, average: number) {
  return kind === "time" ? `평균 ${formatDurationText(average)}` : `평균 ${average}회`;
}

function selectMockView(mockState: AnalysisMockState): AnalysisView {
  if (mockState === "empty") return ANALYSIS_EMPTY_MOCK;
  if (mockState === "no-comparison") return ANALYSIS_NO_COMPARISON_MOCK;
  return ANALYSIS_MOCK;
}

// 06_Analysis — /measurements/:id/analysis
function MeasurementAnalysisPage() {
  // 측정 ID 로 조회하는 것은 API 연동(#15) 범위다. 목데이터는 ID 와 무관하게 같은 결과를 보여준다
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const mockState = readAnalysisMockState(searchParams.get("state"));

  // 측정 ID 나 목 상태가 바뀌면 재시도 진행 상태를 초기화한다
  return <MeasurementAnalysis key={`${id}:${mockState}`} mockState={mockState} />;
}

function MeasurementAnalysis({ mockState }: { mockState: AnalysisMockState }) {
  const navigate = useNavigate();
  const [retryPhase, setRetryPhase] = useState<RetryPhase>("idle");

  // 목 재시도: 잠시 로딩을 보여 준 뒤 기본 결과로 전환한다. 연동 시 쿼리 refetch 로 교체
  useEffect(() => {
    if (retryPhase !== "loading") return;

    const timer = window.setTimeout(() => setRetryPhase("done"), MOCK_RETRY_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [retryPhase]);

  if (mockState === "loading" || retryPhase === "loading") {
    return <AnalysisLoading />;
  }

  if (mockState === "error" && retryPhase === "idle") {
    return <AnalysisStatusMessage state="error" onAction={() => setRetryPhase("loading")} />;
  }

  const view = retryPhase === "done" ? ANALYSIS_MOCK : selectMockView(mockState);

  if (view.results.length === 0) {
    return <AnalysisStatusMessage state="empty" onAction={() => navigate("/")} />;
  }

  const hasComparison = view.distribution !== null;

  return (
    <div className="flex flex-col gap-6 pb-1">
      <ul className="grid grid-cols-2 gap-3" aria-label="종목별 측정 결과">
        {MEASUREMENT_RESULT_EXERCISES.map(({ type, name, valueKind }) => {
          const result = view.results.find((item) => item.exercise === type);
          if (!result) return null;

          return (
            <li key={type}>
              <ExerciseResultCard
                name={name}
                value={formatValue(valueKind, result.value)}
                unit={RESULT_VALUE_UNIT[valueKind]}
                averageLabel={
                  result.average === null ? undefined : formatAverage(valueKind, result.average)
                }
                comparison={result.comparison ?? undefined}
              />
            </li>
          );
        })}
      </ul>

      <div className="flex flex-col gap-3">
        {view.distribution ? (
          <PercentileDistribution {...view.distribution} />
        ) : (
          <DistributionUnavailable />
        )}

        {view.fitnessAgeLabel && <FitnessAgeCard ageLabel={view.fitnessAgeLabel} />}
      </div>

      {/* 비교 데이터 없음 시안에는 운동능력 나이와 지도 안내가 없다 */}
      {hasComparison && (
        <MascotSpeech
          mascot={turtleGuide}
          message={MAP_GUIDE_MESSAGE}
          action={
            <Button type="button" onClick={() => navigate("/map")}>
              지도 보기
            </Button>
          }
        />
      )}
    </div>
  );
}

export default MeasurementAnalysisPage;
