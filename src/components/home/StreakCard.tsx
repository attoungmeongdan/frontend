import { Check } from "lucide-react";

export interface StreakDay {
  label: string;
  done: boolean;
  isToday: boolean;
}

interface StreakCardProps {
  days: StreakDay[];
}

// 최근 7일 운동 여부
function StreakCard({ days }: StreakCardProps) {
  return (
    <section className="bg-surface-subtle rounded-bubble flex flex-col gap-2 p-2.5">
      <h2 className="text-card-label text-text-primary font-bold">최근 7일 운동 여부</h2>

      <ol className="flex">
        {days.map((day, index) => (
          <li key={index} className="flex flex-1 flex-col items-center gap-1.5">
            <span className="text-caption text-text-secondary">{day.label}</span>
            <span
              aria-label={day.done ? "운동함" : "운동 안 함"}
              className={`flex size-7 items-center justify-center rounded-full border ${
                day.done
                  ? "bg-brand-mint border-border-default"
                  : day.isToday
                    ? "border-brand-teal-strong bg-white"
                    : "border-border-default bg-white"
              }`}
            >
              {day.done && <Check size={14} aria-hidden className="text-white" />}
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}

export default StreakCard;
