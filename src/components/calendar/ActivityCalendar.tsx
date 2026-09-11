import { ChevronLeft, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  LEGEND_EXERCISED_LABEL,
  LEGEND_MEASURED_LABEL,
  WEEKDAY_LABELS,
} from "@/constants/calendar";
import { MAX_EXERCISE_COUNT, type DayCell, type MonthlyActivity } from "@/types/calendar";
import { buildMonthGrid } from "@/utils/calendar";

interface ActivityCalendarProps {
  activity: MonthlyActivity;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  /** 이번 달을 보고 있으면 다음 달로 갈 수 없다. 미래 기록은 없다 */
  canGoNext: boolean;
}

/** 게이지 채움과 남은 자리 색 */
const GAUGE_COLOR = "#136b6b";
const GAUGE_TRACK = "#dce7e5";

const LEVELS = Array.from({ length: MAX_EXERCISE_COUNT }, (_, index) => index + 1);

/** 수행 종목 수만큼 원을 채운다. 4종목이면 한 바퀴가 찬다 */
function toGaugeBackground(exerciseCount: number) {
  if (exerciseCount === 0) return undefined;

  const filled = (exerciseCount / MAX_EXERCISE_COUNT) * 360;

  return `conic-gradient(${GAUGE_COLOR} 0deg ${filled}deg, ${GAUGE_TRACK} ${filled}deg 360deg)`;
}

// Feature/ActivityCalendar (fcYja) — 당월 달력. 월 이동 없음
function ActivityCalendar({
  activity,
  onPrevMonth,
  onNextMonth,
  canGoNext,
}: ActivityCalendarProps) {
  const navigate = useNavigate();
  const weeks = buildMonthGrid(activity);

  const openAnalysis = (measurementId: string) => {
    navigate(`/measurements/${measurementId}/analysis`);
  };

  return (
    <section className="border-border-default bg-surface-default rounded-input flex flex-col gap-3 border p-5">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onPrevMonth}
          aria-label="이전 달 보기"
          className="text-text-secondary flex size-8 items-center justify-center rounded-full"
        >
          <ChevronLeft size={20} aria-hidden />
        </button>

        <h2 className="text-text-primary text-[18px] leading-[26px] font-bold">
          {activity.year}년 {activity.month}월
        </h2>

        <button
          type="button"
          onClick={onNextMonth}
          disabled={!canGoNext}
          aria-label="다음 달 보기"
          className="text-text-secondary flex size-8 items-center justify-center rounded-full disabled:opacity-30"
        >
          <ChevronRight size={20} aria-hidden />
        </button>
      </div>

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
                <DayMark cell={cell} onOpenAnalysis={openAnalysis} />
              </div>
            ))}
          </div>
        ))}
      </div>

      <ul className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
        <li className="flex items-center gap-1.5">
          <span className="flex items-center gap-1" aria-hidden>
            {LEVELS.map((level) => (
              <LegendGauge key={level} exerciseCount={level} />
            ))}
          </span>
          <span className="text-text-secondary text-caption">{LEGEND_EXERCISED_LABEL}</span>
        </li>
        <li className="flex items-center gap-1.5">
          <span className="bg-action-orange size-2.5 rounded-full" aria-hidden />
          <span className="text-text-secondary text-caption">{LEGEND_MEASURED_LABEL}</span>
        </li>
      </ul>
    </section>
  );
}

interface DayMarkProps {
  cell: DayCell;
  onOpenAnalysis: (measurementId: string) => void;
}

/**
 * 날짜 표시.
 * 배경색은 자유 운동 종목 수, 오렌지 테두리·체크는 그날 체력 측정까지 마쳤다는 뜻이다.
 * 측정한 날은 눌러서 측정 분석 화면으로 갈 수 있다.
 */
function DayMark({ cell, onOpenAnalysis }: DayMarkProps) {
  const { date, isToday, isFuture, exerciseCount, measurementId } = cell;

  if (date === null) return null;

  const isMeasured = measurementId !== null;
  const todayLabel = isToday ? " 오늘" : "";
  const measuredLabel = isMeasured ? " 체력 측정 완료" : "";
  const label =
    exerciseCount > 0
      ? `${date}일 운동 ${exerciseCount}개${measuredLabel}${todayLabel}`
      : `${date}일${todayLabel}`;

  const numberTone = isToday
    ? "text-action-orange font-bold"
    : isFuture
      ? "text-text-secondary/40"
      : "text-text-primary";

  const mark = (
    <div className="relative flex size-9 cursor-default items-center justify-center select-none">
      <div
        className="flex size-9 items-center justify-center rounded-full"
        style={{ background: toGaugeBackground(exerciseCount) }}
      >
        <div className="bg-surface-default flex size-7 items-center justify-center rounded-full">
          <span className={`text-body-small ${numberTone}`}>{date}</span>
        </div>
      </div>
      {isMeasured && (
        <span className="bg-action-orange border-surface-default absolute -top-1 -right-1 size-2.5 rounded-full border-2" />
      )}
    </div>
  );

  // 측정한 날만 분석 화면으로 갈 수 있다
  if (isMeasured) {
    return (
      <button
        type="button"
        aria-label={`${label}, 측정 분석 보기`}
        onClick={() => onOpenAnalysis(measurementId)}
        className="cursor-pointer"
      >
        {mark}
      </button>
    );
  }

  return <div aria-label={label}>{mark}</div>;
}

/** 범례용 작은 게이지 */
function LegendGauge({ exerciseCount }: { exerciseCount: number }) {
  return (
    <span
      className="flex size-4 items-center justify-center rounded-full"
      style={{ background: toGaugeBackground(exerciseCount) }}
    >
      <span className="bg-surface-default size-2.5 rounded-full" />
    </span>
  );
}

export default ActivityCalendar;
