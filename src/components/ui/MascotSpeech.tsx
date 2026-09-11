import type { ReactNode } from "react";

interface MascotSpeechProps {
  mascot: string;
  message: string;
  /** 말풍선 안 문구 아래에 두는 버튼 등. 06_Analysis 지도 이동처럼 안내와 행동을 묶을 때 쓴다 */
  action?: ReactNode;
}

// UI/MascotSpeech (l3DkBI) — 좌측 꾸북이 + 꼬리 + 말풍선
function MascotSpeech({ mascot, message, action }: MascotSpeechProps) {
  return (
    <div className="flex w-full items-center">
      <img src={mascot} alt="" className="size-21 shrink-0 object-contain" />

      <svg
        width="10"
        height="16"
        viewBox="0 0 10 16"
        aria-hidden
        className="text-surface-subtle ml-2 shrink-0"
      >
        <path d="M10 0 L10 16 L0 8 Z" fill="currentColor" />
      </svg>

      <div className="bg-surface-subtle rounded-bubble flex min-w-0 flex-1 flex-col gap-2.5 px-4 py-3">
        <p className="text-guide text-text-primary whitespace-pre-line">{message}</p>
        {action}
      </div>
    </div>
  );
}

export default MascotSpeech;
