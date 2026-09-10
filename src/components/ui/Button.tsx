import type { ComponentProps } from "react";
import type { LucideIcon } from "lucide-react";

interface ButtonProps extends ComponentProps<"button"> {
  variant?: "primary" | "secondary";
  leadingIcon?: LucideIcon;
}

// UI/Button (SK7Wl) — 높이 52, radius 16, 라벨 16/600, 아이콘과 gap 8
const VARIANT_CLASS = {
  primary: "bg-action-primary-bg text-action-primary-fg",
  secondary: "border-brand-teal-strong text-action-secondary-fg border bg-white",
} as const;

function Button({
  variant = "primary",
  leadingIcon: Icon,
  className = "",
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`rounded-input text-button flex h-13 items-center justify-center gap-2 disabled:opacity-40 ${VARIANT_CLASS[variant]} ${className}`}
      {...props}
    >
      {Icon && <Icon size={20} aria-hidden />}
      {children}
    </button>
  );
}

export default Button;
