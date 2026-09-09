interface MascotSpeechProps {
  mascot: string;
  message: string;
}

// UI/MascotSpeech (l3DkBI) — 좌측 꾸북이 + 꼬리 + 말풍선
function MascotSpeech({ mascot, message }: MascotSpeechProps) {
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

      <p className="bg-surface-subtle rounded-bubble text-guide text-text-primary min-w-0 flex-1 px-4 py-3 whitespace-pre-line">
        {message}
      </p>
    </div>
  );
}

export default MascotSpeech;
