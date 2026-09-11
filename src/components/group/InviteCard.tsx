import { Link, Share2 } from "lucide-react";
import { GROUP_SHEET, INVITE_LINK_HOST } from "@/constants/group";

interface InviteCardProps {
  inviteCode: string;
  onCopy: () => void;
  onShare: () => void;
}

function InviteCard({ inviteCode, onCopy, onShare }: InviteCardProps) {
  return (
    <div className="bg-surface-subtle rounded-input flex items-center gap-3 px-3.5 py-3">
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-text-secondary text-caption font-semibold">
          {GROUP_SHEET.inviteLabel}
        </span>
        <span className="text-brand-teal-strong text-body-small truncate font-bold">
          {INVITE_LINK_HOST}/{inviteCode}
        </span>
      </div>

      <button
        type="button"
        onClick={onCopy}
        className="border-border-default text-brand-teal-strong rounded-pill flex h-9 shrink-0 items-center gap-1 border bg-white px-3 text-[13px] leading-[19px] font-semibold"
      >
        <Link size={14} aria-hidden />
        {GROUP_SHEET.copyLabel}
      </button>

      <button
        type="button"
        onClick={onShare}
        className="bg-brand-teal-strong rounded-pill flex h-9 shrink-0 items-center gap-1 px-3 text-[13px] leading-[19px] font-semibold text-white"
      >
        <Share2 size={14} aria-hidden />
        {GROUP_SHEET.shareLabel}
      </button>
    </div>
  );
}

export default InviteCard;
