import { RATE_UNAVAILABLE } from "@/constants/calendar";
import type { MonthlyRate } from "@/types/calendar";

interface MonthlyRateCardProps {
  rate: MonthlyRate;
  /** 이번 달을 보고 있는지. 문구를 "이번 달" 과 "N월" 로 나눈다 */
  isCurrentMonth: boolean;
  month: number;
}

// 운동 실행률. 분모는 이번 달이면 오늘까지 경과일, 지난달이면 그 달 전체 일수다
function MonthlyRateCard({ rate, isCurrentMonth, month }: MonthlyRateCardProps) {
  const { totalTargetDays, exercisedCount, percent } = rate;
  const periodLabel = isCurrentMonth ? "이번 달" : `${month}월`;

  return (
    <section className="bg-surface-subtle rounded-input flex flex-col gap-1 p-4">
      <h2 className="text-text-secondary text-note-title font-bold">{periodLabel} 운동 실행률</h2>
      <p className="text-brand-teal-strong text-heading-1">
        {percent === null ? RATE_UNAVAILABLE : `${percent}%`}
      </p>
      {percent !== null && (
        <p className="text-text-secondary text-caption">
          {exercisedCount === 0
            ? `${periodLabel} 기록이 아직 없어요`
            : `${totalTargetDays}일 중 ${exercisedCount}일`}
        </p>
      )}
    </section>
  );
}

export default MonthlyRateCard;
