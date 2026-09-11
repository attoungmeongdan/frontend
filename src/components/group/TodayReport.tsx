import { EXERCISES } from "@/constants/exercises";
import { NO_RECORD_LABEL, TODAY_REPORT_EXERCISES, TODAY_REPORT_HINT } from "@/constants/group";
import type { TodayReportSection } from "@/types/group";

interface TodayReportProps {
  dateLabel: string;
  sections: TodayReportSection[];
}

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
        const topValue = Math.max(...section.rows.map((row) => row.value), 0);

        return (
          <section
            key={exercise}
            className="border-border-default rounded-input flex flex-col gap-[5px] border bg-white px-3.5 py-2.5"
          >
            <h3 className="flex items-center gap-1.5">
              <Icon size={16} aria-hidden className="text-brand-teal-strong shrink-0" />
              <span className="text-text-primary text-[13px] leading-[19px] font-bold">
                {label}
              </span>
              <span className="text-text-secondary text-[11px] leading-4">{unitLabel}</span>
            </h3>

            {section.rows.map((row, index) => {
              const isTop = index === 0 && row.value > 0;
              const percent = topValue > 0 ? (row.value / topValue) * 100 : 0;
              const tone = isTop ? "text-brand-teal-strong font-bold" : "text-text-primary";

              return (
                <div key={row.memberId} className="flex items-center gap-2">
                  <span className={`text-caption w-11 shrink-0 ${tone}`}>{row.name}</span>

                  <span className="bg-surface-subtle rounded-pill h-3 w-49 shrink-0 overflow-hidden">
                    <span
                      className={`rounded-pill block h-full ${
                        isTop ? "bg-brand-teal-strong" : "bg-brand-mint"
                      }`}
                      style={{ width: `${percent}%` }}
                    />
                  </span>

                  <span className={`text-caption flex-1 text-right ${tone}`}>
                    {row.value > 0 ? `${row.value}${suffix}` : NO_RECORD_LABEL}
                  </span>
                </div>
              );
            })}
          </section>
        );
      })}
    </div>
  );
}

export default TodayReport;
