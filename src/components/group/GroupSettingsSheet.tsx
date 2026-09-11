import { ChevronRight, Link, Trash2, type LucideIcon } from "lucide-react";
import BottomSheet from "@/components/common/BottomSheet";
import { GROUP_SETTINGS_MENU } from "@/constants/group";
import type { Group } from "@/types/group";

interface GroupSettingsSheetProps {
  open: boolean;
  group: Group;
  /** 초대 링크를 아직 받아오는 중이면 복사를 막는다 */
  isInviteLinkPending: boolean;
  onClose: () => void;
  onCopyLink: () => void;
  onDelete: () => void;
}

function GroupSettingsSheet({
  open,
  group,
  isInviteLinkPending,
  onClose,
  onCopyLink,
  onDelete,
}: GroupSettingsSheetProps) {
  return (
    <BottomSheet open={open} title={group.name} onClose={onClose} bodyPadding="list">
      <MenuRow
        icon={Link}
        label={GROUP_SETTINGS_MENU.copyLink}
        onClick={onCopyLink}
        disabled={isInviteLinkPending}
      />

      <span className="bg-border-default mx-3 my-1 h-px" aria-hidden />

      <MenuRow icon={Trash2} label={GROUP_SETTINGS_MENU.remove} onClick={onDelete} destructive />
    </BottomSheet>
  );
}

interface MenuRowProps {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  destructive?: boolean;
  disabled?: boolean;
}

function MenuRow({
  icon: Icon,
  label,
  onClick,
  destructive = false,
  disabled = false,
}: MenuRowProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex h-13 w-full items-center gap-3 px-3 disabled:opacity-40"
    >
      <span
        className={`flex size-9 shrink-0 items-center justify-center rounded-sm ${
          destructive
            ? "bg-destructive/10 text-destructive"
            : "bg-surface-subtle text-brand-teal-strong"
        }`}
      >
        <Icon size={18} aria-hidden />
      </span>
      <span
        className={`flex-1 text-left text-[15px] leading-[22px] font-semibold ${
          destructive ? "text-destructive" : "text-text-primary"
        }`}
      >
        {label}
      </span>
      <ChevronRight size={18} aria-hidden className="text-text-secondary/40 shrink-0" />
    </button>
  );
}

export default GroupSettingsSheet;
