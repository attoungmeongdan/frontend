import { useEffect, useState } from "react";
import { Scan } from "lucide-react";
import Toast from "@/components/ui/Toast";

const VISIBLE_MS = 3000;

// 준비 확인 직후 자동 시작 방식을 알려주고 3초 뒤 서서히 사라진다
function MeasureStartToast() {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => setIsVisible(false), VISIBLE_MS);
    return () => window.clearTimeout(timeoutId);
  }, []);

  return (
    <div
      className={`pointer-events-none absolute inset-x-5 bottom-[max(2.25rem,env(safe-area-inset-bottom))] z-10 flex justify-center transition-[opacity,visibility] duration-500 motion-reduce:transition-none landscape:bottom-[max(1.25rem,env(safe-area-inset-bottom))] ${
        isVisible ? "opacity-100" : "invisible opacity-0"
      }`}
    >
      <Toast message="자세를 잡으면 자동으로 타이머가 시작돼요!" icon={Scan} />
    </div>
  );
}

export default MeasureStartToast;
