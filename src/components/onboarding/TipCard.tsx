import type { LucideIcon } from "lucide-react";

interface TipCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

// 온보딩 하단 서비스 소개 카드
function TipCard({ icon: Icon, title, description }: TipCardProps) {
  return (
    <div className="relative pt-2">
      <span className="text-tip-label text-caption absolute top-0 left-3 bg-white px-1.5 font-bold">
        Tip.
      </span>

      <div className="border-border-default flex gap-2 rounded-xl border px-3 pt-4 pb-3">
        <Icon size={15} aria-hidden className="text-brand-mint mt-0.5 shrink-0" />
        <div className="flex min-w-0 flex-1 flex-col gap-px">
          <p className="text-tip-title text-note-title">{title}</p>
          <p className="text-tip-desc text-caption leading-[1.4] whitespace-pre-line">
            {description}
          </p>
        </div>
      </div>
    </div>
  );
}

export default TipCard;
