import type { ResultComparison } from "@/types/result";

interface ExerciseResultCardProps {
  /** 분석의 작은 카드(default) 또는 운동 마무리의 큰 단일 카드 */
  variant?: "default" | "complete";
  name: string;
  /** 표시용 값. 예: "15", "1:00" */
  value: string;
  unit: string;
  /** 평균 문구. 화면마다 표기가 달라 호출부에서 만든다. 없으면 "평균 정보 없음" */
  averageLabel?: string;
  /** 동연령대 평균 대비 비교 상태. 없으면 "비교 정보 없음" */
  comparison?: ResultComparison;
}

// 결과 색은 동연령대 평균 비교 전용이며 항상 비교 문구와 함께 표시한다
const COMPARISON_CONTENT = {
  low: { label: "동연령대보다 낮음", valueClass: "text-result-low" },
  similar: { label: "동연령대와 비슷함", valueClass: "text-result-neutral" },
  high: { label: "동연령대보다 높음", valueClass: "text-result-high" },
} as const;

// 종목 결과 카드 — 06_Analysis 작은 카드 / 07_ExerciseComplete 단일 카드
function ExerciseResultCard({
  variant = "default",
  name,
  value,
  unit,
  averageLabel,
  comparison,
}: ExerciseResultCardProps) {
  const content = comparison ? COMPARISON_CONTENT[comparison] : undefined;
  const isComplete = variant === "complete";

  return (
    <div
      className={`border-border-default bg-surface-default flex flex-col items-center border text-center ${isComplete ? "rounded-card shadow-card gap-2 px-5 py-8" : "rounded-bubble h-full gap-1.5 px-2 py-4"}`}
    >
      <p
        className={`text-text-primary font-bold break-keep ${isComplete ? "text-body" : "text-note-title"}`}
      >
        {name}
      </p>

      <p className={`flex items-end ${isComplete ? "gap-1" : "gap-0.5"}`}>
        {/* 완료 시안의 48px 수치는 이 variant 에서만 적용한다. */}
        <span
          className={`${isComplete ? "text-5xl leading-[1.45] font-bold" : "text-display"} ${content?.valueClass ?? "text-text-primary"}`}
        >
          {value}
        </span>
        <span
          className={`text-text-secondary ${isComplete ? "text-lg leading-[1.45]" : "text-body-small pb-1"}`}
        >
          {unit}
        </span>
      </p>

      <p className={`text-text-secondary ${isComplete ? "text-body-small" : "text-caption"}`}>
        {averageLabel ?? "평균 정보 없음"}
      </p>
      <p
        className={`${isComplete ? "text-body-small" : "text-caption"} font-semibold ${content ? "text-text-primary" : "text-text-secondary"}`}
      >
        {content?.label ?? "비교 정보 없음"}
      </p>
    </div>
  );
}

export default ExerciseResultCard;
