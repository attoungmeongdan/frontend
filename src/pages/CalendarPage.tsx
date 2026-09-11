import { LoaderCircle, TriangleAlert } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import ActivityCalendar from "@/components/calendar/ActivityCalendar";
import MonthlyRateCard from "@/components/calendar/MonthlyRateCard";
import MascotSpeech from "@/components/common/MascotSpeech";
import {
  ERROR_DESCRIPTION,
  ERROR_RETRY_LABEL,
  ERROR_TITLE,
  LOADING_MESSAGE,
  MASCOT_MESSAGES,
} from "@/constants/calendar";
import { useMonthlyActivity } from "@/hooks/useMonthlyActivity";
import { useMyProfile } from "@/hooks/useMyPage";
import { selectMascotMessage, readCalendarMonth } from "@/utils/calendar";
import { getSeoulToday, parseSeoulDate } from "@/utils/date";

/** 연·월을 한 달 옮긴다. 12월 → 1월 처럼 해가 바뀌는 경우를 함께 처리한다 */
function shiftMonth(year: number, month: number, delta: number) {
  const shifted = new Date(year, month - 1 + delta, 1);

  return { year: shifted.getFullYear(), month: shifted.getMonth() + 1 };
}

// 08_Calendar — /calendar
function CalendarPage() {
  const seoulToday = getSeoulToday();
  const [searchParams, setSearchParams] = useSearchParams();

  // 가입일 전 기록은 없으므로 가입한 달보다 앞으로는 못 가고, 가입한 달의 가입일 전 날짜는 가린다
  const { data: profile } = useMyProfile();
  const joinedAt = parseSeoulDate(profile?.createdAt);
  const view = readCalendarMonth(searchParams, seoulToday, joinedAt);
  const setView = (next: { year: number; month: number }) => {
    setSearchParams(
      (current) => {
        const params = new URLSearchParams(current);
        params.set("year", String(next.year));
        params.set("month", String(next.month));
        return params;
      },
      { replace: true },
    );
  };
  const isJoinedMonth =
    joinedAt !== null && view.year === joinedAt.year && view.month === joinedAt.month;

  const isCurrentMonth = view.year === seoulToday.year && view.month === seoulToday.month;
  const { status, activity, rate, retry } = useMonthlyActivity(view.year, view.month, joinedAt);

  const goPrevMonth = () => setView(shiftMonth(view.year, view.month, -1));
  const goNextMonth = () => setView(shiftMonth(view.year, view.month, 1));

  if (status === "loading") {
    return (
      <div className="flex h-full flex-col gap-5">
        <MascotSpeech message={MASCOT_MESSAGES.loading} />
        <div className="bg-surface-subtle rounded-input h-90 w-full" aria-hidden />
        <p
          role="status"
          className="text-brand-teal-strong text-button flex items-center justify-center gap-2 p-3"
        >
          <LoaderCircle size={20} aria-hidden className="animate-spin" />
          {LOADING_MESSAGE}
        </p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="flex h-full flex-col gap-5">
        <MascotSpeech message={MASCOT_MESSAGES.error} />
        <div
          role="alert"
          className="flex min-h-0 flex-1 flex-col items-center justify-center gap-4 px-3"
        >
          <TriangleAlert size={56} className="text-feedback-error" aria-hidden />
          <h2 className="text-text-primary text-title font-bold">{ERROR_TITLE}</h2>
          <p className="text-text-secondary text-body text-center leading-normal">
            {ERROR_DESCRIPTION}
          </p>
          <button
            type="button"
            onClick={() => void retry()}
            className="bg-action-primary-bg text-action-primary-fg rounded-input text-button h-control w-full pb-1"
          >
            {ERROR_RETRY_LABEL}
          </button>
        </div>
      </div>
    );
  }

  if (!activity || !rate) {
    return null;
  }

  return (
    <div className="flex flex-col gap-5">
      <MascotSpeech message={selectMascotMessage(activity)} />
      <ActivityCalendar
        activity={activity}
        onPrevMonth={goPrevMonth}
        onNextMonth={goNextMonth}
        canGoPrev={!isJoinedMonth}
        canGoNext={!isCurrentMonth}
      />
      <MonthlyRateCard rate={rate} isCurrentMonth={isCurrentMonth} month={view.month} />
    </div>
  );
}

export default CalendarPage;
