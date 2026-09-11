import { Crown } from "lucide-react";
import { MEMBERS_LABEL, RANK_LABEL } from "@/constants/group";
import type { GroupMember } from "@/types/group";

interface RankStripProps {
  members: GroupMember[];
  selectedMemberId: number;
  onSelect: (memberId: number) => void;
  /** 실행률 순위로 정렬된 목록일 때만 순위 라벨과 왕관을 보여 준다 */
  isRanked?: boolean;
}

// 08_Calendar / RankStrip — 팀원 아바타. 누르면 그 팀원 캘린더로 바뀐다
function RankStrip({ members, selectedMemberId, onSelect, isRanked = false }: RankStripProps) {
  return (
    <div className="bg-surface-subtle rounded-input flex items-center justify-between pt-3.5 pr-3.5 pb-2.5 pl-3.5">
      <p className="text-text-secondary text-[13px] leading-[19px] font-semibold">
        {isRanked ? RANK_LABEL : MEMBERS_LABEL}
      </p>

      <ul className="flex items-center gap-3 pt-1.5">
        {members.map((member, index) => {
          const isSelected = member.id === selectedMemberId;
          const showCrown = isRanked && index === 0;

          return (
            <li key={member.id} className="relative">
              <button
                type="button"
                onClick={() => onSelect(member.id)}
                aria-pressed={isSelected}
                aria-label={`${member.name}${member.isOwner ? " 방장" : ""} 기록 보기`}
                className={`flex size-9 items-center justify-center rounded-full text-[14px] leading-5 font-bold ${
                  isSelected
                    ? "bg-brand-mint text-white"
                    : "border-border-default text-text-secondary border bg-white"
                }`}
              >
                {member.initial}
              </button>

              {showCrown && (
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
