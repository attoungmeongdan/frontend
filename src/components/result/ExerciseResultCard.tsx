import type { ResultComparison } from "@/types/result";

interface ExerciseResultCardProps {
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

// 종목 결과 카드 — 06_Analysis Res 카드 (값 · 단위 · 평균 · 비교 문구)
function ExerciseResultCard({
  name,
  value,
  unit,
  averageLabel,
  comparison,
}: ExerciseResultCardProps) {
  const content = comparison ? COMPARISON_CONTENT[comparison] : undefined;

  return (
    <div className="border-border-default rounded-bubble bg-surface-default flex h-full flex-col items-center gap-1.5 border px-2 py-4 text-center">
      <p className="text-note-title text-text-primary font-bold break-keep">{name}</p>

      <p className="flex items-end gap-0.5">
        <span className={`text-display ${content?.valueClass ?? "text-text-primary"}`}>
          {value}
        </span>
        <span className="text-body-small text-text-secondary pb-1">{unit}</span>
      </p>

      <p className="text-caption text-text-secondary">{averageLabel ?? "평균 정보 없음"}</p>
      <p
        className={`text-caption font-semibold ${content ? "text-text-primary" : "text-text-secondary"}`}
      >
        {content?.label ?? "비교 정보 없음"}
      </p>
    </div>
  );
}

export default ExerciseResultCard;
