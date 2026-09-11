import { useQuery } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import {
  createMeasurementInsights,
  getMeasurementHistory,
  getMeasurementInsights,
} from "@/apis/exercise";
import { shouldRetry } from "@/config/queryClient";
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
  /** 비었을 때 빈 배열인지 null 인지 명세에 없어 둘 다 받는다 */
  previousMeasurements: MeasurementHistoryEntry[] | null;
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
  let latestAt = Number.NEGATIVE_INFINITY;

  for (const exercise of Object.values(history)) {
    if (!exercise) continue;

    const entries = [
      ...(exercise.today ? [exercise.today] : []),
      ...(exercise.previousMeasurements ?? []),
    ];

    for (const entry of entries) {
      // 문자열 비교는 타임존 표기가 섞이면 순서가 어긋나므로 시각으로 바꿔 비교한다
      const measuredAt = Date.parse(entry.measuredAt);

      // 못 읽는 날짜를 후보에 두면 NaN 비교가 항상 false 라 잘못된 그룹이 최신으로 남는다
      if (Number.isNaN(measuredAt)) continue;

      if (measuredAt > latestAt) {
        latest = entry;
        latestAt = measuredAt;
      }
    }
  }

  return latest?.measurementGroupId ?? null;
}

/**
 * 추천 생성(POST)이 "생성 중"(409)을 돌려주면 저장될 때까지 조회(GET)로 폴링한다.
 * 이 시간이 지나도 404 면 "아직 없어요" 로 둔다
 */
const GENERATION_POLL_INTERVAL = 3 * 1000;
const GENERATION_POLL_MAX_COUNT = 10;

function getStatus(error: unknown) {
  return isAxiosError(error) ? error.response?.status : undefined;
}

/** POST 409 — 측정이 아직 안 끝났거나 다른 요청이 생성 중이다 */
function isGenerating(error: unknown) {
  return getStatus(error) === 409;
}

/**
 * 만들 수 없는 그룹. 400(프로필 나이·성별 누락)·404(그룹 없음)는 다시 불러도 같아서
 * 오류 화면 대신 "아직 없어요" 로 둔다
 */
function isNotCreatable(error: unknown) {
  const status = getStatus(error);

  return status === 400 || status === 404;
}

/** GET 404 — 아직 저장된 추천이 없다 */
function isNotGenerated(error: unknown) {
  return getStatus(error) === 404;
}

/** 404 는 생성 중으로 보고 폴링한다. 그 외는 공용 규칙(5xx·무응답만 3회)을 따른다 */
function shouldRetryRead(failureCount: number, error: Error) {
  if (isNotGenerated(error)) return failureCount < GENERATION_POLL_MAX_COUNT;

  return shouldRetry(failureCount, error);
}

function readRetryDelay(failureCount: number, error: Error) {
  // react-query 기본 백오프(1s·2s·4s…)는 5xx 재시도에만 쓴다
  return isNotGenerated(error)
    ? GENERATION_POLL_INTERVAL
    : Math.min(1000 * 2 ** failureCount, 30 * 1000);
}

interface RecommendationsResult {
  status: RecommendationStatus;
  recommendations: AiInsight[];
  retry: () => void;
}

/**
 * 마이페이지 추천 운동 3개.
 * 최신 측정 그룹을 찾아 추천 생성을 요청한다. 서버가 그룹당 한 번만 만들고 이후엔 저장된 결과를
 * 돌려주므로 생성 요청이 곧 조회다. 생성 중(409)이면 저장될 때까지 조회로 폴링한다.
 * 측정 이력이 없거나 끝내 생성되지 않았으면 빈 목록으로 두어 "아직 없어요" 화면을 띄운다.
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

  // POST 지만 그룹당 결과가 하나로 고정된 멱등 요청이라 조회처럼 캐시한다
  const createQuery = useQuery({
    queryKey: ["measurement-insights", "create", groupId] as const,
    queryFn: () => createMeasurementInsights(groupId as string),
    enabled: groupId !== null,
  });

  const shouldPoll = groupId !== null && isGenerating(createQuery.error);

  const readQuery = useQuery({
    queryKey: ["measurement-insights", groupId] as const,
    queryFn: () => getMeasurementInsights(groupId as string),
    enabled: shouldPoll,
    // 재시도 중엔 isPending 이 유지돼 로딩 화면이 그대로 보인다
    retry: shouldRetryRead,
    retryDelay: readRetryDelay,
  });

  const retry = () => {
    void historyQuery.refetch();
    if (groupId !== null) void createQuery.refetch();
  };

  return {
    status: resolveStatus({
      historyPending: historyQuery.isPending,
      historyError: historyQuery.error,
      hasGroup: groupId !== null,
      createPending: createQuery.isPending,
      createError: createQuery.error,
      readPending: readQuery.isPending,
      readError: readQuery.error,
    }),
    recommendations: createQuery.data?.insights ?? readQuery.data?.insights ?? [],
    retry,
  };
}

interface StatusInput {
  historyPending: boolean;
  historyError: unknown;
  hasGroup: boolean;
  createPending: boolean;
  createError: unknown;
  readPending: boolean;
  readError: unknown;
}

function resolveStatus({
  historyPending,
  historyError,
  hasGroup,
  createPending,
  createError,
  readPending,
  readError,
}: StatusInput): RecommendationStatus {
  if (historyPending) return "loading";
  if (historyError) return "error";

  // 측정한 적이 없으면 추천도 없다. 오류가 아니라 빈 상태다
  if (!hasGroup) return "success";

  if (createPending) return "loading";

  if (isGenerating(createError)) {
    if (readPending) return "loading";
    if (isNotGenerated(readError)) return "success";
    if (readError) return "error";

    return "success";
  }

  if (isNotCreatable(createError)) return "success";
  if (createError) return "error";

  return "success";
}
