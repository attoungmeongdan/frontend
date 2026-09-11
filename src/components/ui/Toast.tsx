import { Check, type LucideIcon } from "lucide-react";

interface ToastProps {
  message: string;
  size?: "default" | "compact";
  icon?: LucideIcon;
  iconClassName?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

function Toast({
  message,
  size = "default",
  icon: Icon = Check,
  iconClassName = "text-white",
  action,
}: ToastProps) {
  const isCompact = size === "compact";

  return (
    <div
      role="status"
      className={`flex items-center ${
        isCompact
          ? "bg-text-primary/85 shadow-card gap-2 rounded-sm px-4 py-2.5 backdrop-blur-sm"
          : "bg-text-primary/70 rounded-input gap-2 px-4 py-3.5 backdrop-blur-sm"
      }`}
    >
      <Icon size={isCompact ? 16 : 20} aria-hidden className={`shrink-0 ${iconClassName}`} />

      <p
        className={`whitespace-pre-line text-white ${
          isCompact ? "text-body-small font-semibold" : "text-body flex-1 font-semibold"
        }`}
      >
        {message}
      </p>

      {action && (
        <button
          type="button"
          onClick={action.onClick}
          className={`text-accent-yellow shrink-0 font-bold ${
            isCompact ? "text-body-small" : "text-body"
          }`}
        >
          {action.label}
        </button>
      )}
    </div>
  );
}

export default Toast;
