import type { AnalysisDistributionView } from "@/types/analysis";

type PercentileDistributionProps = AnalysisDistributionView;

/** 가장 높은 막대 높이(px). 06_Analysis Distribution 막대 영역 기준 */
const MAX_BAR_HEIGHT = 64;

// 백분위 분포 — 막대는 목데이터 상대 높이, 강조 막대와 점이 사용자 구간이다
function PercentileDistribution({
  groupLabel,
  source,
  bins,
  highlightIndex,
  percentile,
}: PercentileDistributionProps) {
  const maxBin = Math.max(...bins, 1);

  return (
    <section className="border-border-default rounded-bubble bg-surface-default flex flex-col gap-2.5 border p-4">
      <div className="flex items-start justify-between gap-2">
        <h2 className="text-note-title text-text-primary min-w-0 font-bold break-keep">
          백분위 분포 — <span className="whitespace-nowrap">{groupLabel}</span>
        </h2>
        <p className="text-caption text-text-primary shrink-0 opacity-60">출처: {source}</p>
      </div>

      <div
        role="img"
        aria-label={`${groupLabel} 백분위 분포 그래프. 내 위치는 백분위 ${percentile}`}
      >
        <ol className="flex h-17 items-end gap-1.5" aria-hidden>
          {bins.map((bin, index) => {
            const isMine = index === highlightIndex;

            return (
              <li
                key={index}
                className="flex h-full flex-1 flex-col items-center justify-end gap-0.5"
              >
                {isMine && <span className="bg-action-orange size-2 shrink-0 rounded-full" />}
                <span
                  className={`w-full shrink-0 rounded-t-[4px] ${isMine ? "bg-brand-teal-strong" : "bg-brand-mint"}`}
                  style={{ height: `${(bin / maxBin) * MAX_BAR_HEIGHT}px` }}
                />
              </li>
            );
          })}
        </ol>

        <div
          className="text-text-secondary mt-2.5 flex justify-between text-[11px] leading-4"
          aria-hidden
        >
          <span>백분위 0</span>
          <span>50</span>
          <span>100</span>
        </div>
      </div>

      <p className="text-caption text-brand-teal-strong font-semibold">
        <span aria-hidden>● </span>내 위치: 백분위 {percentile}
      </p>
    </section>
  );
}

export default PercentileDistribution;
