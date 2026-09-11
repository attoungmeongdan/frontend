import { useQuery } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { getMeasurementHistory, getMeasurementInsights } from "@/apis/exercise";
import type { AiInsight } from "@/types/exercise";
import type { RecommendationStatus } from "@/types/mypage";

/** 홈 추이 차트(useHomeData)와 같은 키를 써서 응답 캐시를 공유한다 */
const MEASUREMENT_HISTORY_QUERY_KEY = ["measurement-history"] as const;

/**
 * measurement-history 실제 응답. 종목별로 최근 측정이 나뉘어 온다.
 * types/exercise.ts 의 MeasurementHistory 는 측정 1회에 종목 4개가 묶인 구조라 실제와 다르다.
 * 그 타입을 쓰는 홈 추이 차트는 별도 수정이 필요하다.
 */
interface MeasurementHistoryEntry {
  measurementGroupId: string;
  measuredAt: string;
}

interface MeasurementHistoryByExercise {
  today: MeasurementHistoryEntry | null;
  previousMeasurements: MeasurementHistoryEntry[];
}

type MeasurementHistoryResponse = Record<
  "chairStand" | "sitUp" | "pushUp" | "plank",
  MeasurementHistoryByExercise | null
>;

/**
 * 추천을 붙일 측정 그룹. 추천 API 가 사용자 단위가 아니라 측정 그룹 단위라
 * 가장 최근 측정을 먼저 골라야 한다. 네 종목을 모두 훑어 measuredAt 이 가장 늦은 것을 고른다.
 * 오늘 측정이 있으면 어느 종목이든 그것이 최신이다.
 */
function pickLatestMeasurementGroupId(history: MeasurementHistoryResponse): string | null {
  let latest: MeasurementHistoryEntry | null = null;

  for (const exercise of Object.values(history)) {
    if (!exercise) continue;

    const entries = [...(exercise.today ? [exercise.today] : []), ...exercise.previousMeasurements];

    for (const entry of entries) {
      if (latest === null || entry.measuredAt > latest.measuredAt) latest = entry;
    }
  }

  return latest?.measurementGroupId ?? null;
}

/** 저장된 추천이 없을 때 서버는 404 를 준다. 실패가 아니라 "아직 없음" 이다 */
function isNotGenerated(error: unknown) {
  return isAxiosError(error) && error.response?.status === 404;
}

interface RecommendationsResult {
  status: RecommendationStatus;
  recommendations: AiInsight[];
  retry: () => void;
}

/**
 * 마이페이지 추천 운동 3개.
 * 최신 측정 그룹을 찾은 뒤 그 그룹에 저장된 AI 추천을 읽는다.
 * 측정 이력이 없거나 추천이 아직 생성되지 않았으면 빈 목록으로 두어 "아직 없어요" 화면을 띄운다.
 */
export function useRecommendations(): RecommendationsResult {
  const historyQuery = useQuery({
    queryKey: MEASUREMENT_HISTORY_QUERY_KEY,
    queryFn: getMeasurementHistory,
  });

  // getMeasurementHistory 의 반환 타입이 실제 응답과 달라 여기서 실제 구조로 본다.
  // types/exercise.ts 의 MeasurementHistory 가 고쳐지면 이 캐스팅을 걷어낸다
  const history = historyQuery.data as MeasurementHistoryResponse | undefined;
  const groupId = history ? pickLatestMeasurementGroupId(history) : null;

  const insightQuery = useQuery({
    queryKey: ["measurement-insights", groupId] as const,
    queryFn: () => getMeasurementInsights(groupId as string),
    enabled: groupId !== null,
  });

  const retry = () => {
    void historyQuery.refetch();
    if (groupId !== null) void insightQuery.refetch();
  };

  return {
    status: resolveStatus({
      historyPending: historyQuery.isPending,
      historyError: historyQuery.error,
      hasGroup: groupId !== null,
      insightPending: insightQuery.isPending,
      insightError: insightQuery.error,
    }),
    recommendations: insightQuery.data?.insights ?? [],
    retry,
  };
}

interface StatusInput {
  historyPending: boolean;
  historyError: unknown;
  hasGroup: boolean;
  insightPending: boolean;
  insightError: unknown;
}

function resolveStatus({
  historyPending,
  historyError,
  hasGroup,
  insightPending,
  insightError,
}: StatusInput): RecommendationStatus {
  if (historyPending) return "loading";
  if (historyError) return "error";

  // 측정한 적이 없으면 추천도 없다. 오류가 아니라 빈 상태다
  if (!hasGroup) return "success";

  if (insightPending) return "loading";
  if (isNotGenerated(insightError)) return "success";
  if (insightError) return "error";

  return "success";
}
