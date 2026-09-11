import { LoaderCircle } from "lucide-react";

// 종목 기록 저장 중. 카메라 화면 전체를 덮어 뒤로가기 등 중복 조작을 막는다
function MeasureSaving() {
  return (
    <div className="bg-camera-overlay absolute inset-0 z-30 flex items-center justify-center px-6">
      <p
        role="status"
        className="rounded-pill text-body text-brand-teal-strong flex items-center gap-2 bg-white px-5 py-3 font-semibold"
      >
        <LoaderCircle size={20} className="shrink-0 motion-safe:animate-spin" aria-hidden />
        기록을 저장하고 있어요…
      </p>
    </div>
  );
}

export default MeasureSaving;
