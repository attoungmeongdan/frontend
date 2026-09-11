import BottomSheet from "@/components/common/BottomSheet";
import { GROUP_SHEET } from "@/constants/group";
import { Plus } from "lucide-react";
import type { GroupResponse } from "@/apis/group";

interface GroupSwitchSheetProps {
  open: boolean;
  groups: GroupResponse[];
  currentGroupId: number;
  onClose: () => void;
  onSelect: (groupId: number) => void;
  onCreate: () => void;
}

function GroupSwitchSheet({
  open,
  groups,
  currentGroupId,
  onClose,
  onSelect,
  onCreate,
}: GroupSwitchSheetProps) {
  return (
    <BottomSheet open={open} title={GROUP_SHEET.switchTitle} onClose={onClose} bodyPadding="list">
      <ul className="flex flex-col gap-1">
        {groups.map((group) => {
          const isCurrent = group.id === currentGroupId;

          return (
            <li key={group.id}>
              <button
                type="button"
                onClick={() => onSelect(group.id)}
                aria-current={isCurrent}
                className={`rounded-input flex h-14 w-full items-center gap-3 px-3 ${
                  isCurrent ? "bg-brand-mint/15" : ""
                }`}
              >
                <span
                  className={`flex size-9 shrink-0 items-center justify-center rounded-sm text-[14px] leading-5 font-bold ${
                    isCurrent ? "bg-brand-mint text-white" : "bg-surface-subtle text-text-secondary"
                  }`}
                >
                  {group.name.slice(0, 1)}
                </span>

                <span className="flex min-w-0 flex-1 flex-col items-start gap-0.5">
                  <span
                    className={`truncate text-[15px] leading-[22px] ${
                      isCurrent
                        ? "text-brand-teal-strong font-bold"
                        : "text-text-primary font-semibold"
                    }`}
                  >
                    {group.name}
                  </span>
                  <span className="text-text-secondary text-caption">
                    팀원 {group.currentMemberCount}/{group.maxMemberCount}명
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      <span className="bg-border-default mx-3 h-px" aria-hidden />

      <button type="button" onClick={onCreate} className="flex h-13 w-full items-center gap-3 px-3">
        <span className="border-border-default text-brand-teal-strong flex size-9 items-center justify-center rounded-sm border">
          <Plus size={18} aria-hidden />
        </span>
        <span className="text-brand-teal-strong text-[15px] leading-[22px] font-semibold">
          {GROUP_SHEET.createAction}
        </span>
      </button>
    </BottomSheet>
  );
}

export default GroupSwitchSheet;
