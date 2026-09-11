import { ChevronDown, EllipsisVertical, Users } from "lucide-react";
import { GROUP_TAB_LABELS } from "@/constants/group";
import type { GroupTab } from "@/types/group";

interface GroupBarProps {
  groupName: string;
  tab: GroupTab;
  onTabChange: (tab: GroupTab) => void;
  onOpenGroups: () => void;
  onOpenSettings: () => void;
  /** 방장만 쓸 수 있는 메뉴라, 팀원에게는 진입점을 보여 주지 않는다 */
  canManage: boolean;
}

const TABS: GroupTab[] = ["today", "month"];

// 08_Calendar / GroupBar — 그룹명(→ 내 그룹 시트) + 오늘·이번달 세그먼트 + 설정
function GroupBar({
  groupName,
  tab,
  onTabChange,
  onOpenGroups,
  onOpenSettings,
  canManage,
}: GroupBarProps) {
  return (
    <div className="flex items-center justify-between gap-2">
      <button
        type="button"
        onClick={onOpenGroups}
        aria-label={`현재 그룹 ${groupName}, 그룹 바꾸기`}
        className="flex min-w-0 items-center gap-1"
      >
        <Users size={18} aria-hidden className="text-brand-teal-strong shrink-0" />
        <span className="text-text-primary truncate text-[16px] leading-6 font-bold">
          {groupName}
        </span>
        <ChevronDown size={16} aria-hidden className="text-text-secondary shrink-0" />
      </button>

      <div className="flex shrink-0 items-center gap-1">
        <div
          role="tablist"
          aria-label="그룹 기록 기간"
          className="bg-surface-subtle rounded-pill flex gap-0.5 p-[3px]"
        >
          {TABS.map((item) => {
            const isActive = item === tab;

            return (
              <button
                key={item}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => onTabChange(item)}
                className={`rounded-pill text-caption px-3 py-1.5 ${
                  isActive
                    ? "bg-brand-teal-strong font-bold text-white"
                    : "text-text-secondary font-semibold"
                }`}
              >
                {GROUP_TAB_LABELS[item]}
              </button>
            );
          })}
        </div>

        {canManage && (
          <button
            type="button"
            onClick={onOpenSettings}
            aria-label="그룹 설정"
            className="text-text-secondary flex size-9 items-center justify-center rounded-full"
          >
            <EllipsisVertical size={20} aria-hidden />
          </button>
        )}
      </div>
    </div>
  );
}

export default GroupBar;
