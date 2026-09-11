import { LoaderCircle } from "lucide-react";

/** 06_Analysis loading 스켈레톤 높이 (결과 카드 2줄 · 분포 · 운동능력 나이) */
const SKELETON_HEIGHT_CLASSES = ["h-30", "h-30", "h-22", "h-22"];

function AnalysisLoading() {
  return (
    <div className="flex flex-col gap-5 pt-0.5">
      <div className="flex flex-col gap-4" aria-hidden>
        {SKELETON_HEIGHT_CLASSES.map((heightClass, index) => (
          <div key={index} className={`bg-surface-subtle rounded-bubble w-full ${heightClass}`} />
        ))}
      </div>

      <p
        role="status"
        className="text-brand-teal-strong text-body flex items-center justify-center gap-2 p-3 font-semibold"
      >
        <LoaderCircle size={20} aria-hidden className="shrink-0 motion-safe:animate-spin" />
        분석 결과를 불러오고 있어요…
      </p>
    </div>
  );
}

export default AnalysisLoading;
