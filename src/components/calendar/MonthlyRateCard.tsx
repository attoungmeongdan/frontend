import { RATE_CARD_TITLE, RATE_EMPTY_DESCRIPTION, RATE_UNAVAILABLE } from "@/constants/calendar";
import type { MonthlyRate } from "@/types/calendar";

interface MonthlyRateCardProps {
  rate: MonthlyRate;
}

// 이번 달 운동 실행률. 분모는 오늘까지 경과일이라 미래 날짜는 실패로 계산하지 않는다
function MonthlyRateCard({ rate }: MonthlyRateCardProps) {
  const { elapsedDays, exercisedCount, percent } = rate;

  return (
    <section className="bg-surface-subtle rounded-input flex flex-col gap-1 p-4">
      <h2 className="text-text-secondary text-note-title font-bold">{RATE_CARD_TITLE}</h2>
      <p className="text-brand-teal-strong text-heading-1">
        {percent === null ? RATE_UNAVAILABLE : `${percent}%`}
      </p>
      {percent !== null && (
        <p className="text-text-secondary text-caption">
          {exercisedCount === 0
            ? RATE_EMPTY_DESCRIPTION
            : `${elapsedDays}일 중 ${exercisedCount}일`}
        </p>
      )}
    </section>
  );
}

export default MonthlyRateCard;
