import { useEffect, useId, useRef } from "react";
import { TriangleAlert } from "lucide-react";
import Button from "@/components/ui/Button";

interface MeasureSaveErrorDialogProps {
  onRetry: () => void;
  onSaveAndExit: () => void;
}

// 종목 기록 저장 실패. 저장되지 않은 기록은 완료로 넘기지 않고 재시도나 저장 후 중단만 고르게 한다
function MeasureSaveErrorDialog({ onRetry, onSaveAndExit }: MeasureSaveErrorDialogProps) {
  const titleId = useId();
  const bodyId = useId();
  const retryButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    retryButtonRef.current?.focus();
  }, []);

  return (
    <div className="bg-camera-overlay fixed inset-0 z-50 flex items-center justify-center p-6 landscape:py-4 landscape:max-[48rem]:pl-16">
      <div
        role="alertdialog"
        aria-modal
        aria-labelledby={titleId}
        aria-describedby={bodyId}
        className="rounded-card flex max-h-full w-full max-w-86 flex-col items-center gap-3 overflow-y-auto bg-white p-6 text-center landscape:max-w-120"
      >
        <TriangleAlert size={40} className="text-feedback-error shrink-0" aria-hidden />
        <h2 id={titleId} className="text-title text-text-primary font-bold">
          기록 저장에 실패했어요
        </h2>
        <p id={bodyId} className="text-body text-text-secondary whitespace-pre-line">
          {"네트워크를 확인하고 다시 시도해 주세요.\n이번 종목 기록은 아직 저장되지 않았어요."}
        </p>
        <div className="flex w-full flex-col gap-3 landscape:flex-row">
          <Button ref={retryButtonRef} type="button" onClick={onRetry} className="landscape:flex-1">
            다시 저장하기
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={onSaveAndExit}
            className="landscape:flex-1"
          >
            홈으로 (저장 후 중단)
          </Button>
        </div>
      </div>
    </div>
  );
}

export default MeasureSaveErrorDialog;
