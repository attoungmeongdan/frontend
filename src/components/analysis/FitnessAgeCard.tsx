interface FitnessAgeCardProps {
  /** 운동능력 나이 문구. 예: "40대" */
  ageLabel: string;
}

// UI/FitnessAge (Hkhmb) — 값 색은 디자인 표기(result-high)를 따른다
function FitnessAgeCard({ ageLabel }: FitnessAgeCardProps) {
  return (
    <section className="bg-surface-subtle rounded-bubble flex items-center justify-between gap-2 p-4">
      <h2 className="text-body text-text-primary font-semibold">당신의 운동 수행력은?</h2>
      <p className="text-display text-result-high shrink-0">{ageLabel}</p>
    </section>
  );
}

export default FitnessAgeCard;
