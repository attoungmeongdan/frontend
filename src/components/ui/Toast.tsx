import { Check, type LucideIcon } from "lucide-react";

interface ToastProps {
  message: string;
  icon?: LucideIcon;
  iconClassName?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

// UI/Toast (LQ4tc) — text-primary 배경, radius 16, padding 14/16, gap 8
function Toast({ message, icon: Icon = Check, iconClassName = "text-white", action }: ToastProps) {
  return (
    <div
      role="status"
      className="bg-text-primary/70 rounded-input flex items-center gap-2 px-4 py-3.5 backdrop-blur-sm"
    >
      <Icon size={20} aria-hidden className={`shrink-0 ${iconClassName}`} />
      <p className="text-body flex-1 font-semibold whitespace-pre-line text-white">{message}</p>
      {action && (
        <button
          type="button"
          onClick={action.onClick}
          className="text-accent-yellow text-body shrink-0 font-bold"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}

export default Toast;
