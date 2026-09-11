import type { ReactNode } from "react";
import { ArrowLeft, OctagonX, TriangleAlert } from "lucide-react";
import Button from "@/components/ui/Button";
import "./CameraStage.css";

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
  /** 실제 카메라 영상과 스켈레톤 캔버스 */
  cameraFeed?: ReactNode;
  warning?: CameraWarning;
  cancelLabel?: string;
  /** 기록 저장 중처럼 화면을 떠나면 안 되는 동안 뒤로가기를 막는다 */
  cancelDisabled?: boolean;
  onCancel: () => void;
  /** 넘길 때만 운동 종료 버튼을 표시한다. 체력 측정은 수동 종료가 없다 */
  onEnd?: () => void;
  children?: ReactNode;
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
  cameraFeed,
  warning,
  cancelLabel = "운동을 취소하고 홈으로 돌아가기",
  cancelDisabled = false,
  onCancel,
  onEnd,
  children,
}: CameraStageProps) {
  const valueClassName =
    valueKind === "count"
      ? "text-camera-count landscape:text-camera-count-landscape"
      : "text-camera-number landscape:text-camera-number-landscape";

  return (
    <section
      aria-label={stageLabel ? `${stageLabel} 카메라` : `${exerciseName} 자유 운동 카메라`}
      className="camera-stage bg-camera-backdrop relative h-full min-h-0 overflow-hidden text-white"
    >
      {cameraFeed ?? (
        <div className="absolute inset-0 flex items-center justify-center opacity-8" aria-hidden>
          <div className="flex flex-col items-center gap-2 landscape:flex-row landscape:gap-3">
            <div className="size-16 rounded-full bg-white landscape:size-14" />
            <div className="h-52 w-22 rounded-[40px] bg-white landscape:h-20 landscape:w-45" />
          </div>
        </div>
      )}

      <header className="camera-stage-header relative z-60 flex min-w-0 items-center gap-3">
        <button
          type="button"
          aria-label={cancelLabel}
          onClick={onCancel}
          disabled={cancelDisabled}
          className="flex size-11 shrink-0 items-center justify-center rounded-full bg-black/25 disabled:opacity-40"
        >
          <ArrowLeft size={24} aria-hidden />
        </button>
        <div className="flex min-w-0 flex-1 justify-center pr-14">
          <div className="rounded-pill text-note-title bg-camera-overlay px-3.5 py-1.5 text-center break-keep">
            {stageLabel ?? `자유 운동 · ${exerciseName}`}
          </div>
        </div>
      </header>

      <div className="camera-stage-metrics relative z-10 flex min-w-0 flex-col items-center justify-center gap-1 text-center landscape:gap-0.5">
        <output
          aria-label={valueKind === "timer" ? `운동 시간 ${value}` : `운동 횟수 ${value}`}
          className={`${valueClassName} tabular-nums drop-shadow-sm`}
        >
          {value}
        </output>
        {subInfo && (
          <p className="text-body landscape:text-body-small max-w-full font-semibold break-keep text-white/80">
            {subInfo}
          </p>
        )}
      </div>

      {overlay}

      {/* 가이드와 경고는 측정값·종료 버튼이 차지하는 영역 밖에 배치한다. */}
      {warning && (
        <div
          role="alert"
          className="camera-stage-view pointer-events-none relative z-20 flex flex-col items-center justify-center gap-2 overflow-hidden"
        >
          <div className="flex min-h-0 w-full flex-1 justify-center opacity-50" aria-hidden>
            <TriangleAlert
              size={288}
              strokeWidth={2.25}
              className="text-accent-yellow h-full max-h-72 w-full motion-safe:animate-pulse"
            />
          </div>
          <p className="bg-camera-scrim text-body-small shrink-0 rounded-sm px-4 py-2 text-center font-semibold break-keep">
            {WARNING_MESSAGE[warning]}
          </p>
        </div>
      )}

      {onEnd && (
        <div className="camera-stage-footer relative z-10 flex justify-center">
          <Button
            type="button"
            onClick={onEnd}
            leadingIcon={OctagonX}
            className="w-60 max-w-full landscape:w-full"
          >
            운동 종료
          </Button>
        </div>
      )}
      {children}
    </section>
  );
}

export default CameraStage;
