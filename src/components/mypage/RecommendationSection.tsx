import { TriangleAlert } from "lucide-react";
import turtleGuide from "@/assets/mascots/turtle-guide.png";
import turtleSad from "@/assets/mascots/turtle-sad.png";
import Button from "@/components/ui/Button";
import { RECOMMENDATION_MESSAGES, RECOMMENDATION_TITLE } from "@/constants/mypage";
import type { AiInsight } from "@/types/exercise";
import type { RecommendationStatus } from "@/types/mypage";

interface RecommendationSectionProps {
  status: RecommendationStatus;
  recommendations: AiInsight[];
  onRetry: () => void;
}

/** 디자인 10_Mypage 기준 노출 개수. 스켈레톤 행 수도 이 값을 따른다 */
const MAX_RECOMMENDATIONS = 3;

// 최신 측정 결과로 만든 AI 추천 3개를 순서 그대로 노출한다. 추천이 없으면 비워 둔다.
// 순위는 서버 응답 순서를 따르되, 4개 이상 내려와도 rank 가 4 이상으로 찍히지 않도록 3개에서 자른다
function RecommendationSection({ status, recommendations, onRetry }: RecommendationSectionProps) {
  return (
    <section className="flex w-full flex-col gap-3">
      <div className="flex w-full items-center gap-2.5">
        <img src={turtleGuide} alt="" aria-hidden className="size-14 shrink-0 object-contain" />
        <h2 className="text-text-primary text-body font-bold">{RECOMMENDATION_TITLE}</h2>
      </div>

      {status === "loading" && <RecommendationSkeleton />}
      {status === "error" && <RecommendationError onRetry={onRetry} />}
      {status === "success" &&
        (recommendations.length === 0 ? (
          <RecommendationEmpty />
        ) : (
          <ol className="flex flex-col gap-3">
            {recommendations.slice(0, MAX_RECOMMENDATIONS).map((recommendation, index) => (
              // 응답에 id 가 없다. 운동명이 겹칠 수 있어 순위를 키에 함께 쓴다
              <RecommendationRow
                key={`${index}-${recommendation.exerciseName}`}
                rank={index + 1}
                recommendation={recommendation}
              />
            ))}
          </ol>
        ))}
    </section>
  );
}

function RecommendationRow({ rank, recommendation }: { rank: number; recommendation: AiInsight }) {
  return (
    <li className="border-border-default bg-surface-default flex items-center gap-3 rounded-2xl border p-4">
      <span className="bg-surface-subtle text-brand-teal-strong text-card-label flex size-7 shrink-0 items-center justify-center rounded-full font-bold">
        {rank}
      </span>
      {/* 시안의 28px 아이콘 자리. 서버가 이모지를 정해 주므로 그대로 그린다 */}
      <span
        aria-hidden
        className="flex size-7 shrink-0 items-center justify-center text-[22px] leading-none"
      >
        {recommendation.emoji}
      </span>
      <div className="flex min-w-0 flex-col gap-0.5">
        <p className="text-text-primary text-body font-semibold">{recommendation.exerciseName}</p>
        <p className="text-text-secondary text-note-title font-normal">
          {recommendation.description}
        </p>
      </div>
    </li>
  );
}

function RecommendationSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-3" aria-hidden>
        {Array.from({ length: MAX_RECOMMENDATIONS }, (_, index) => (
          <div key={index} className="bg-surface-subtle h-18 w-full rounded-2xl" />
        ))}
      </div>
      <p role="status" className="text-brand-teal-strong text-card-label text-center">
        {RECOMMENDATION_MESSAGES.loading}
      </p>
    </div>
  );
}

function RecommendationEmpty() {
  return (
    <div className="bg-surface-subtle flex flex-col items-center gap-2 rounded-2xl p-6">
      <img src={turtleSad} alt="" aria-hidden className="size-20 object-contain" />
      <p className="text-text-secondary text-body text-center font-bold">
        {RECOMMENDATION_MESSAGES.empty.title}
      </p>
    </div>
  );
}

function RecommendationError({ onRetry }: { onRetry: () => void }) {
  return (
    <div
      role="alert"
      className="bg-surface-subtle flex flex-col items-center gap-2.5 rounded-2xl p-6"
    >
      <TriangleAlert size={32} className="text-feedback-error" aria-hidden />
      <p className="text-text-primary text-body font-bold">{RECOMMENDATION_MESSAGES.error.title}</p>
      <Button className="w-full" onClick={onRetry}>
        {RECOMMENDATION_MESSAGES.error.action}
      </Button>
    </div>
  );
}

export default RecommendationSection;
