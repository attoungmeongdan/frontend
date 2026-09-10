import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { EXERCISES, type ExerciseType } from "@/constants/exercises";

export interface TrendPoint {
  date: string;
  value: number;
}

export type TrendSeries = Record<ExerciseType, TrendPoint[]>;

interface TrendChartProps {
  series: TrendSeries;
}

const CHART_HEIGHT = 140;
const LABEL_HEIGHT = 40;
const MAX_POINTS = 5;

// 체력 측정 추이
function TrendChart({ series }: TrendChartProps) {
  const [selected, setSelected] = useState<ExerciseType>("sit-up");
  const [isOpen, setIsOpen] = useState(false);

  const selectedExercise = EXERCISES.find((exercise) => exercise.type === selected);
  const points = (series[selected] ?? []).slice(-MAX_POINTS);
  const maxValue = Math.max(...points.map((point) => point.value), 1);

  return (
    <section className="border-border-default rounded-bubble flex flex-col gap-3 border bg-white p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-body text-text-primary font-bold">체력 측정 추이</h2>

        <div className="relative">
          <button
            type="button"
            onClick={() => setIsOpen((prev) => !prev)}
            aria-expanded={isOpen}
            className="bg-surface-subtle border-border-default text-caption text-brand-teal-strong rounded-pill flex items-center gap-1 border px-2.5 py-1 font-semibold"
          >
            {selectedExercise?.label}
            <ChevronDown
              size={14}
              aria-hidden
              className={`transition-transform ${isOpen ? "rotate-180" : ""}`}
            />
          </button>

          {isOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
              <ul className="border-border-default shadow-card absolute top-full right-0 z-20 mt-1 w-40 overflow-hidden rounded-xl border bg-white">
                {EXERCISES.map((exercise) => (
                  <li key={exercise.type}>
                    <button
                      type="button"
                      onClick={() => {
                        setSelected(exercise.type);
                        setIsOpen(false);
                      }}
                      aria-current={exercise.type === selected}
                      className={`text-caption w-full px-3 py-2.5 text-left ${
                        exercise.type === selected
                          ? "bg-surface-subtle text-brand-teal-strong font-semibold"
                          : "text-text-primary"
                      }`}
                    >
                      {exercise.label}
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>

      {points.length >= 2 ? (
        <ol className="flex items-end gap-3" style={{ height: CHART_HEIGHT }}>
          {points.map((point) => (
            <li key={point.date} className="flex flex-1 flex-col items-center justify-end gap-1">
              <span className="text-caption text-brand-teal-strong font-bold">{point.value}</span>
              <span
                className="bg-brand-teal w-7 rounded-t-md"
                style={{ height: `${(point.value / maxValue) * (CHART_HEIGHT - LABEL_HEIGHT)}px` }}
              />
              <span className="text-text-secondary text-[11px]">{point.date}</span>
            </li>
          ))}
        </ol>
      ) : (
        <p
          className="text-body-small text-text-secondary flex items-center justify-center"
          style={{ height: CHART_HEIGHT }}
        >
          측정이 2회 이상 쌓이면 그래프를 보여드려요.
        </p>
      )}

      <p className="text-text-secondary text-[11px]">
        단위: 회 · 시간순 최근 최대 5개 · 종목별 축 분리
      </p>
    </section>
  );
}

export default TrendChart;
