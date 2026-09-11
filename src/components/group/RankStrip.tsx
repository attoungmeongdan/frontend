import { Crown } from "lucide-react";
import { RANK_LABEL } from "@/constants/group";
import type { GroupMember } from "@/types/group";

interface RankStripProps {
  members: GroupMember[];
  selectedMemberId: number;
  onSelect: (memberId: number) => void;
}

function RankStrip({ members, selectedMemberId, onSelect }: RankStripProps) {
  return (
    <div className="bg-surface-subtle rounded-input flex items-center justify-between pt-3.5 pr-3.5 pb-2.5 pl-3.5">
      <p className="text-text-secondary text-[13px] leading-[19px] font-semibold">{RANK_LABEL}</p>

      <ul className="flex items-center gap-3 pt-1.5">
        {members.map((member, index) => {
          const isSelected = member.id === selectedMemberId;
          const rank = index + 1;

          return (
            <li key={member.id} className="relative">
              <button
                type="button"
                onClick={() => onSelect(member.id)}
                aria-pressed={isSelected}
                aria-label={`${rank}등 ${member.name}, 실행률 ${member.monthlyPercent}퍼센트`}
                className={`flex size-9 items-center justify-center rounded-full text-[14px] leading-5 font-bold ${
                  isSelected
                    ? "bg-brand-mint text-white"
                    : "border-border-default text-text-secondary border bg-white"
                }`}
              >
                {member.initial}
              </button>

              {rank === 1 && (
                <Crown
                  size={18}
                  aria-hidden
                  className="fill-accent-yellow text-accent-yellow absolute -top-3.5 left-2.5"
                />
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default RankStrip;
