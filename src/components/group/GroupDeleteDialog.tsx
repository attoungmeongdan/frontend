import { useEffect } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Trash2 } from "lucide-react";
import { GROUP_DELETE } from "@/constants/group";

interface GroupDeleteDialogProps {
  open: boolean;
  groupName: string;
  onClose: () => void;
  onConfirm: () => void;
}

function GroupDeleteDialog({ open, groupName, onClose, onConfirm }: GroupDeleteDialogProps) {
  useEffect(() => {
    if (!open) return;

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", closeOnEscape);

    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-60 flex items-center justify-center px-7">
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

          <motion.div
            role="alertdialog"
            aria-modal="true"
            aria-label={GROUP_DELETE.title(groupName)}
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.94 }}
            transition={{ duration: 0.2 }}
            className="rounded-card relative flex w-full max-w-84 flex-col items-center gap-4 bg-white px-6 pt-7 pb-5"
          >
            <span className="bg-destructive/10 text-destructive flex size-14 items-center justify-center rounded-full">
              <Trash2 size={26} aria-hidden />
            </span>

            <div className="flex flex-col items-center gap-2">
              <h2 className="text-text-primary text-center text-[18px] leading-[26px] font-bold break-keep">
                {GROUP_DELETE.title(groupName)}
              </h2>
              <p className="text-text-secondary text-body-small text-center leading-normal whitespace-pre-line">
                {GROUP_DELETE.description}
              </p>
            </div>

            <div className="flex w-full flex-col gap-2">
              <button
                type="button"
                onClick={onConfirm}
                className="bg-destructive rounded-input text-button h-control w-full pb-1 text-white"
              >
                {GROUP_DELETE.confirmLabel}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="border-border-muted text-text-secondary rounded-input text-button h-12 w-full border bg-white"
              >
                {GROUP_DELETE.cancelLabel}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export default GroupDeleteDialog;
