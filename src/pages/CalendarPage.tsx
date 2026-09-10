import { LoaderCircle, TriangleAlert } from "lucide-react";
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
import { CALENDAR_MOCK, CALENDAR_STATUS } from "@/mocks/calendar";
import { calculateMonthlyRate, selectMascotMessage } from "@/utils/calendar";

// 08_Calendar — /calendar (당월만, 월 이동 없음)
function CalendarPage() {
  // API 연동 전이라 목데이터를 그대로 쓴다
  const status = CALENDAR_STATUS;
  const activity = CALENDAR_MOCK;

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
            // API 연동 시 쿼리 refetch 로 교체
            onClick={() => window.location.reload()}
            className="bg-action-primary-bg text-action-primary-fg rounded-input text-button h-control w-full pb-1"
          >
            {ERROR_RETRY_LABEL}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <MascotSpeech message={selectMascotMessage(activity)} />
      <ActivityCalendar activity={activity} />
      <MonthlyRateCard rate={calculateMonthlyRate(activity)} />
    </div>
  );
}

export default CalendarPage;
