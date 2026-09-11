import { EXERCISES } from "@/constants/exercises";
import { TODAY_REPORT_EXERCISES, TODAY_REPORT_HINT } from "@/constants/group";
import type { TodayReportSection } from "@/types/group";

interface TodayReportProps {
  /** 오늘 날짜 표시. 예: "9월 12일 (금) · 오늘" */
  dateLabel: string;
  sections: TodayReportSection[];
}

// 08_Calendar / TodayReport — 종목별로 팀원이 얼마나 했는지 가로 막대로 비교한다
function TodayReport({ dateLabel, sections }: TodayReportProps) {
  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-center justify-between">
        <p className="text-text-primary text-body-small font-bold">{dateLabel}</p>
        <p className="text-text-secondary text-[11px] leading-4">{TODAY_REPORT_HINT}</p>
      </div>

      {TODAY_REPORT_EXERCISES.map(({ exercise, icon: Icon, unitLabel, suffix }) => {
        const section = sections.find((item) => item.exercise === exercise);
        if (!section || section.rows.length === 0) return null;

        const label = EXERCISES.find((item) => item.type === exercise)?.label ?? exercise;
        // 1등을 100% 로 두고 나머지 길이를 정한다. 전원 0 이면 나누기가 깨지므로 막는다
        const topValue = Math.max(...section.rows.map((row) => row.value), 0);

        return (
          <section
            key={exercise}
            className="border-border-default rounded-input flex flex-col gap-2.5 border bg-white px-4 py-3.5"
          >
            <h3 className="flex items-baseline gap-1.5">
              <Icon size={15} aria-hidden className="text-brand-teal-strong translate-y-0.5" />
              <span className="text-text-primary text-body-small font-bold">{label}</span>
              <span className="text-text-secondary text-[11px] leading-4">{unitLabel}</span>
            </h3>

            <div className="flex flex-col gap-3">
              {section.rows.map((row, index) => {
                const isTop = index === 0 && row.value > 0;
                const hasRecord = row.value > 0;
                const percent = topValue > 0 ? (row.value / topValue) * 100 : 0;
                const tone = isTop
                  ? "text-brand-teal-strong font-bold"
                  : hasRecord
                    ? "text-text-primary"
                    : "text-text-secondary/60";

                return (
                  <div key={row.memberId} className="flex flex-col gap-1">
                    {/* 이름·값을 위로 올려야 막대가 종목 이름과 같은 선에서 시작한다 */}
                    <div className="flex items-baseline justify-between gap-2">
                      <span className={`text-caption min-w-0 truncate ${tone}`}>{row.name}</span>
                      <span className={`text-caption shrink-0 tabular-nums ${tone}`}>
                        {row.value.toLocaleString()}
                        {suffix}
                      </span>
                    </div>

                    <span className="bg-surface-subtle rounded-pill h-2.5 w-full overflow-hidden">
                      <span
                        className={`rounded-pill block h-full transition-[width] duration-500 ${
                          isTop ? "bg-brand-teal-strong" : "bg-brand-mint"
                        }`}
                        // 기록이 있는데 막대가 안 보이면 0 과 구분이 안 돼 최소 폭을 준다
                        style={{ width: hasRecord ? `${Math.max(percent, 4)}%` : 0 }}
                      />
                    </span>
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}

export default TodayReport;
