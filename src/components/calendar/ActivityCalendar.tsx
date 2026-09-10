import { Check } from "lucide-react";
import { LEGEND_EXERCISED_LABEL, LEGEND_TODAY_LABEL, WEEKDAY_LABELS } from "@/constants/calendar";
import { MAX_EXERCISE_COUNT, type DayCell, type MonthlyActivity } from "@/types/calendar";
import { buildMonthGrid } from "@/utils/calendar";

interface ActivityCalendarProps {
  activity: MonthlyActivity;
}

/** 수행 종목 수(1~4)별 배경색. 인덱스 0 은 쓰지 않는다 */
const LEVEL_BACKGROUND = [
  "",
  "bg-exercise-level-1",
  "bg-exercise-level-2",
  "bg-exercise-level-3",
  "bg-exercise-level-4",
] as const;

const LEVELS = Array.from({ length: MAX_EXERCISE_COUNT }, (_, index) => index + 1);

// Feature/ActivityCalendar (fcYja) — 당월 달력. 월 이동 없음
function ActivityCalendar({ activity }: ActivityCalendarProps) {
  const weeks = buildMonthGrid(activity);

  return (
    <section className="border-border-default bg-surface-default rounded-input flex flex-col gap-3 border p-5">
      <h2 className="text-text-primary text-[18px] leading-[26px] font-bold">
        {activity.year}년 {activity.month}월
      </h2>

      <ul className="flex">
        {WEEKDAY_LABELS.map((label) => (
          <li
            key={label}
            className="text-text-secondary text-caption flex flex-1 justify-center font-semibold"
          >
            {label}
          </li>
        ))}
      </ul>

      <div className="flex flex-col gap-1">
        {weeks.map((week, weekIndex) => (
          <div key={weekIndex} className="flex">
            {week.map((cell, weekday) => (
              <div key={weekday} className="flex h-[42px] flex-1 items-center justify-center">
                <DayMark cell={cell} />
              </div>
            ))}
          </div>
        ))}
      </div>

      <ul className="flex items-center gap-4">
        <li className="flex items-center gap-1.5">
          <span className="flex items-center gap-1" aria-hidden>
            {LEVELS.map((level) => (
              <span key={level} className={`size-3 rounded-full ${LEVEL_BACKGROUND[level]}`} />
            ))}
          </span>
          <span className="text-text-secondary text-caption">{LEGEND_EXERCISED_LABEL}</span>
        </li>
        <li className="flex items-center gap-1.5">
          <span
            className="bg-surface-default border-brand-teal-strong size-3 rounded-full border-2"
            aria-hidden
          />
          <span className="text-text-secondary text-caption">{LEGEND_TODAY_LABEL}</span>
        </li>
      </ul>
    </section>
  );
}

// 날짜 표시. 수행 종목 수가 많을수록 원이 진해지고, 오늘은 강조 테두리를 더한다
function DayMark({ cell }: { cell: DayCell }) {
  const { date, isToday, isFuture, exerciseCount } = cell;

  if (date === null) return null;

  const todayLabel = isToday ? " 오늘" : "";
  const label =
    exerciseCount > 0 ? `${date}일 운동 ${exerciseCount}개${todayLabel}` : `${date}일${todayLabel}`;
  const todayRing = isToday ? "border-brand-teal-strong border-2" : "";

  if (exerciseCount > 0) {
    return (
      <div
        aria-label={label}
        className={`flex size-9 flex-col items-center justify-center rounded-full ${LEVEL_BACKGROUND[exerciseCount]} ${todayRing}`}
      >
        <Check size={14} className="text-action-primary-fg" aria-hidden />
        <span
          className={`text-action-primary-fg text-[10px] leading-none ${
            isToday ? "font-bold" : "font-semibold"
          }`}
        >
          {date}
        </span>
      </div>
    );
  }

  return (
    <div
      aria-label={label}
      className={`flex size-9 items-center justify-center rounded-full ${todayRing}`}
    >
      <span
        className={`text-body-small ${isFuture ? "text-text-secondary/40" : "text-text-primary"} ${
          isToday ? "font-bold" : ""
        }`}
      >
        {date}
      </span>
    </div>
  );
}

export default ActivityCalendar;
