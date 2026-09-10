import { Footprints, PersonStanding, TriangleAlert, Waves, type LucideIcon } from "lucide-react";
import turtleGuide from "@/assets/mascots/turtle-guide.png";
import turtleSad from "@/assets/mascots/turtle-sad.png";
import Button from "@/components/ui/Button";
import { RECOMMENDATION_MESSAGES, RECOMMENDATION_TITLE } from "@/constants/mypage";
import type { Recommendation, RecommendationIcon, RecommendationStatus } from "@/types/mypage";

interface RecommendationSectionProps {
  status: RecommendationStatus;
  recommendations: Recommendation[];
  onRetry: () => void;
}

const ICON_MAP: Record<RecommendationIcon, LucideIcon> = {
  walk: Footprints,
  swim: Waves,
  stretch: PersonStanding,
};

// BMI·연령대·성별로 매칭된 상위 3개를 그대로 노출한다. 매칭이 없으면 비워 둔다
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
            {recommendations.map((recommendation, index) => (
              <RecommendationRow
                key={recommendation.id}
                rank={index + 1}
                recommendation={recommendation}
              />
            ))}
          </ol>
        ))}
    </section>
  );
}

function RecommendationRow({
  rank,
  recommendation,
}: {
  rank: number;
  recommendation: Recommendation;
}) {
  const Icon = ICON_MAP[recommendation.icon];

  return (
    <li className="border-border-default bg-surface-default flex items-center gap-3 rounded-2xl border p-4">
      <span className="bg-surface-subtle text-brand-teal-strong text-card-label flex size-7 shrink-0 items-center justify-center rounded-full font-bold">
        {rank}
      </span>
      <Icon size={28} className="text-brand-teal shrink-0" aria-hidden />
      <div className="flex min-w-0 flex-col gap-0.5">
        <p className="text-text-primary text-body font-semibold">{recommendation.name}</p>
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
        {[0, 1, 2].map((index) => (
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
