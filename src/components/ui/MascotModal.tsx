import { useEffect, useRef } from "react";
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
  /** 카메라 화면 위에 띄울 때 쓴다 (체력 측정) */
  cameraLayout?: boolean;
  /** 없으면 닫기 버튼·Esc·바깥 클릭으로 닫을 수 없고 버튼 동작으로만 진행한다 */
  onClose?: () => void;
}

// 카메라 화면 위 모달 배치
// - 모달 위로 올라온 뒤로가기 버튼 자리를 비운다 (세로는 위, 좁은 가로는 왼쪽)
// - 가로에서는 마스코트와 문구를 좌우로 놓고, 높이가 낮은 화면에서는 마스코트를 줄여 버튼까지 보이게 한다
const CAMERA_LAYOUT_CLASS = {
  overlay: "pt-16 landscape:pt-6 landscape:max-[48rem]:pl-16",
  dialog: "landscape:w-160 landscape:flex-row landscape:gap-5",
  closeWrap: "landscape:absolute landscape:top-3 landscape:right-3 landscape:w-auto",
  close: "landscape:m-0",
  mascot:
    "size-[min(15rem,max(5.25rem,calc(100dvh-30.25rem)))] landscape:size-[clamp(6.25rem,calc((100dvh-17.5rem)*2),12.5rem)]",
  content: "landscape:items-stretch landscape:gap-3",
  text: "break-keep landscape:text-left",
};

function MascotModal({
  mascot,
  title,
  body,
  primaryAction,
  secondaryAction,
  primaryVariant = "primary",
  secondaryVariant = "secondary",
  cameraLayout = false,
  onClose,
}: MascotModalProps) {
  const primaryButtonRef = useRef<HTMLButtonElement>(null);
  const layout = cameraLayout ? CAMERA_LAYOUT_CLASS : undefined;

  useEffect(() => {
    primaryButtonRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!onClose) return;

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
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-6 ${layout?.overlay ?? ""}`}
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal
        aria-label={title}
        onClick={(event) => event.stopPropagation()}
        className={`rounded-card relative flex max-h-full w-80 max-w-full flex-col items-center gap-4 overflow-y-auto bg-white p-6 ${layout?.dialog ?? ""}`}
      >
        {onClose && (
          <div className={`flex w-full justify-end ${layout?.closeWrap ?? ""}`}>
            <button
              type="button"
              onClick={onClose}
              aria-label="닫기"
              className={`text-text-primary -mt-2.5 -mr-2.5 flex size-11 items-center justify-center rounded-full ${layout?.close ?? ""}`}
            >
              <X size={24} aria-hidden />
            </button>
          </div>
        )}

        <img
          src={mascot}
          alt=""
          className={`shrink-0 object-contain ${layout?.mascot ?? "size-60"}`}
        />

        <div className={`flex w-full min-w-0 flex-col items-center gap-4 ${layout?.content ?? ""}`}>
          <h2 className={`text-title text-text-primary w-full text-center ${layout?.text ?? ""}`}>
            {title}
          </h2>
          <p
            className={`text-body text-text-primary w-full text-center whitespace-pre-line ${layout?.text ?? ""}`}
          >
            {body}
          </p>

          <div className="flex w-full flex-col gap-2">
            <Button ref={primaryButtonRef} variant={primaryVariant} onClick={primaryAction.onClick}>
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
    </div>
  );
}

export default MascotModal;
