import { useEffect } from "react";
import { X } from "lucide-react";
import Button, { type ButtonVariant } from "@/components/ui/Button";

interface MascotModalAction {
  label: string;
  onClick: () => void;
}

interface MascotModalProps {
  mascot: string;
  title: string;
  body: string;
  primaryAction: MascotModalAction;
  secondaryAction?: MascotModalAction;
  /** 되돌릴 수 없는 동작을 확인받을 때 destructive 로 바꾼다 */
  primaryVariant?: ButtonVariant;
  secondaryVariant?: ButtonVariant;
  onClose: () => void;
}

function MascotModal({
  mascot,
  title,
  body,
  primaryAction,
  secondaryAction,
  primaryVariant = "primary",
  secondaryVariant = "secondary",
  onClose,
}: MascotModalProps) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-6"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal
        aria-label={title}
        onClick={(event) => event.stopPropagation()}
        className="rounded-card flex w-80 flex-col items-center gap-4 bg-white p-6"
      >
        <div className="flex w-full justify-end">
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="text-text-primary -mt-2.5 -mr-2.5 flex size-11 items-center justify-center rounded-full"
          >
            <X size={24} aria-hidden />
          </button>
        </div>

        <img src={mascot} alt="" className="size-60 object-contain" />

        <h2 className="text-title text-text-primary w-full text-center">{title}</h2>
        <p className="text-body text-text-primary w-full text-center whitespace-pre-line">{body}</p>

        <div className="flex w-full flex-col gap-2">
          <Button variant={primaryVariant} onClick={primaryAction.onClick}>
            {primaryAction.label}
          </Button>
          {secondaryAction && (
            <Button variant={secondaryVariant} onClick={secondaryAction.onClick}>
              {secondaryAction.label}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export default MascotModal;
