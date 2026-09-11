import { useEffect, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import { X } from "lucide-react";

const EASE = [0.32, 0.72, 0, 1] as const;

interface BottomSheetProps {
  open: boolean;
  title: string;
  onClose: () => void;
  bodyPadding?: "default" | "list";
  children: ReactNode;
}

function BottomSheet({
  open,
  title,
  onClose,
  bodyPadding = "default",
  children,
}: BottomSheetProps) {
  useEffect(() => {
    if (!open) return;

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeOnEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex justify-center">
          <motion.button
            type="button"
            aria-label="닫기"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="bg-camera-scrim absolute inset-0 cursor-default"
          />

          <div className="max-w-shell pointer-events-none relative flex w-full flex-col justify-end">
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label={title}
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ duration: 0.32, ease: EASE }}
              className="rounded-t-card shadow-sheet pointer-events-auto flex max-h-[85dvh] flex-col bg-white"
            >
              <div className="flex justify-center pt-3 pb-1">
                <span className="bg-border-default h-1 w-10 rounded-full" aria-hidden />
              </div>

              <div className="flex items-center justify-between py-1 pr-3 pl-5">
                <h2 className="text-text-primary text-title">{title}</h2>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="닫기"
                  className="text-text-primary flex size-11 items-center justify-center rounded-full"
                >
                  <X size={24} aria-hidden />
                </button>
              </div>

              <div
                className={`flex flex-col overflow-y-auto overscroll-contain pt-2 pb-[max(24px,env(safe-area-inset-bottom))] ${
                  bodyPadding === "list" ? "gap-1 px-2" : "gap-3 px-5"
                }`}
              >
                {children}
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}

export default BottomSheet;
