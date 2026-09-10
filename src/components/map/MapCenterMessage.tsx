import type { LucideIcon } from "lucide-react";

interface MapCenterMessageProps {
  icon: LucideIcon;
  iconClassName?: string;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

// 지도 위 중앙 안내 카드. 로딩·빈 결과·실패 화면이 공유한다
function MapCenterMessage({
  icon: Icon,
  iconClassName = "text-brand-teal-strong",
  title,
  description,
  action,
}: MapCenterMessageProps) {
  return (
    // 카카오 지도 내부 레이어가 z-index 2 까지 쓰므로 그 위로 올린다
    <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center px-5">
      <div className="bg-surface-default rounded-card pointer-events-auto flex w-full max-w-[350px] flex-col items-center gap-3.5 p-6">
        <Icon size={48} className={iconClassName} aria-hidden />
        <p className="text-text-primary text-center text-[18px] leading-[26px] font-bold">
          {title}
        </p>
        <p className="text-text-secondary text-guide text-center whitespace-pre-line">
          {description}
        </p>

        {action && (
          <button
            type="button"
            onClick={action.onClick}
            className="bg-action-primary-bg text-action-primary-fg rounded-input text-button h-control w-full pb-1"
          >
            {action.label}
          </button>
        )}
      </div>
    </div>
  );
}

export default MapCenterMessage;
