import type { ReactNode } from "react";
import { ArrowLeft, OctagonX, TriangleAlert } from "lucide-react";
import Button from "@/components/ui/Button";

export type CameraWarning = "no-body" | "bad-pose";

interface CameraStageProps {
  exerciseName: string;
  value: string;
  valueKind: "count" | "timer";
  /** 상단 단계 라벨. 기본값은 자유 운동 라벨 */
  stageLabel?: string;
  /** 수치 아래 보조 정보 (예: 남은 시간) */
  subInfo?: string;
  /** 카메라 위에 올리는 상태 표시 (자세 인식 안내 토스트·저장 중) */
  overlay?: ReactNode;
  warning?: CameraWarning;
  cancelLabel?: string;
  /** 기록 저장 중처럼 화면을 떠나면 안 되는 동안 뒤로가기를 막는다 */
  cancelDisabled?: boolean;
  onCancel: () => void;
  /** 넘길 때만 운동 종료 버튼을 표시한다. 체력 측정은 수동 종료가 없다 */
  onEnd?: () => void;
}

const WARNING_MESSAGE: Record<CameraWarning, string> = {
  "no-body": "몸 전체가 화면에 보이도록 조정해 주세요.",
  "bad-pose": "잠시 자세를 다시 잡아 주세요.",
};

function CameraStage({
  exerciseName,
  value,
  valueKind,
  stageLabel,
  subInfo,
  overlay,
  warning,
  cancelLabel = "운동을 취소하고 홈으로 돌아가기",
  cancelDisabled = false,
  onCancel,
  onEnd,
}: CameraStageProps) {
  const valueClassName =
    valueKind === "count"
      ? "text-camera-count landscape:text-camera-count-landscape"
      : "text-camera-number landscape:text-camera-number-landscape";

  return (
    <section
      aria-label={stageLabel ? `${stageLabel} 카메라` : `${exerciseName} 자유 운동 카메라`}
      className="bg-camera-backdrop relative h-full min-h-80 overflow-hidden text-white"
    >
      <div className="absolute inset-0 flex items-center justify-center opacity-8" aria-hidden>
        <div className="flex flex-col items-center gap-2 landscape:flex-row landscape:gap-3">
          <div className="size-16 rounded-full bg-white landscape:size-14" />
          <div className="h-52 w-22 rounded-[40px] bg-white landscape:h-20 landscape:w-45" />
        </div>
      </div>

      {/* 안내 모달(z-50)이 떠 있어도 뒤로가기는 누를 수 있도록 모달보다 위에 둔다 */}
      <button
        type="button"
        aria-label={cancelLabel}
        onClick={onCancel}
        disabled={cancelDisabled}
        className="absolute top-[max(0.5rem,env(safe-area-inset-top))] left-[max(0.5rem,env(safe-area-inset-left))] z-60 flex size-11 items-center justify-center rounded-full bg-black/25 disabled:opacity-40"
      >
        <ArrowLeft size={24} aria-hidden />
      </button>

      <div className="rounded-pill text-note-title bg-camera-overlay absolute top-[max(1rem,env(safe-area-inset-top))] left-1/2 z-10 -translate-x-1/2 px-3.5 py-1.5 text-center whitespace-nowrap landscape:top-[max(0.875rem,env(safe-area-inset-top))]">
        {stageLabel ?? `자유 운동 · ${exerciseName}`}
      </div>

      <div className="absolute top-16 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-1 text-center landscape:top-12 landscape:gap-0.5">
        <output
          aria-label={valueKind === "timer" ? `운동 시간 ${value}` : `운동 횟수 ${value}`}
          className={`${valueClassName} tabular-nums drop-shadow-sm`}
        >
          {value}
        </output>
        {subInfo && (
          <p className="text-body landscape:text-body-small font-semibold whitespace-nowrap text-white/80">
            {subInfo}
          </p>
        )}
      </div>

      {overlay}

      {warning && (
        <div
          role="alert"
          className="absolute inset-x-4 top-1/2 z-10 flex -translate-y-1/2 flex-col items-center gap-3 text-center landscape:flex-row landscape:justify-center landscape:gap-4"
        >
          <TriangleAlert
            size={192}
            strokeWidth={2.25}
            className="text-accent-yellow motion-safe:animate-pulse landscape:size-42"
            aria-hidden
          />
          <p className="bg-camera-scrim text-body-small rounded-sm px-4 py-2 font-semibold">
            {WARNING_MESSAGE[warning]}
          </p>
        </div>
      )}

      {onEnd && (
        <div className="absolute inset-x-0 bottom-[max(2.25rem,env(safe-area-inset-bottom))] z-10 flex justify-center landscape:bottom-[max(1.25rem,env(safe-area-inset-bottom))]">
          <Button
            type="button"
            onClick={onEnd}
            leadingIcon={OctagonX}
            className="w-60 landscape:w-55"
          >
            운동 종료
          </Button>
        </div>
      )}
    </section>
  );
}

export default CameraStage;
