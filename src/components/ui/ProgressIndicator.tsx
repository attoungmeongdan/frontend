interface ProgressIndicatorProps {
  stepName: string;
  current: number;
  total: number;
  stateText?: string;
}

// UI/ProgressIndicator (Gf9vG) — 라벨 행 + 트랙 8px + 상태 문구
function ProgressIndicator({ stepName, current, total, stateText }: ProgressIndicatorProps) {
  const fillWidth = `${(current / total) * 100}%`;

  return (
    <div className="flex w-full flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-body text-text-primary font-semibold">{stepName}</span>
        <span className="text-body-small text-brand-teal-strong font-semibold">
          {current}/{total}
        </span>
      </div>

      <div
        role="progressbar"
        aria-valuenow={current}
        aria-valuemin={1}
        aria-valuemax={total}
        className="bg-border-default rounded-pill h-2 w-full overflow-hidden"
      >
        <div
          className="bg-brand-teal rounded-pill h-full transition-[width] duration-300"
          style={{ width: fillWidth }}
        />
      </div>

      {stateText && <p className="text-body-small text-text-secondary">{stateText}</p>}
    </div>
  );
}

export default ProgressIndicator;
