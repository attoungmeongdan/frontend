import turtleGuide from "@/assets/mascots/turtle-guide.webp";

interface MascotSpeechProps {
  message: string;
}

// UI/MascotSpeech (l3DkBI) — 좌측 꾸북이 80px · 꼬리 10x16 · 말풍선
function MascotSpeech({ message }: MascotSpeechProps) {
  return (
    <div className="flex w-full items-center">
      <img src={turtleGuide} alt="" aria-hidden className="size-20 shrink-0 object-contain" />

      <div className="w-2 shrink-0" />

      <svg
        width="10"
        height="16"
        viewBox="0 0 10 16"
        aria-hidden
        className="text-surface-subtle shrink-0"
      >
        <path d="M10 0 L0 8 L10 16 Z" fill="currentColor" />
      </svg>

      <p className="bg-surface-subtle rounded-bubble text-text-primary text-guide min-w-0 flex-1 px-4 py-3 whitespace-pre-line">
        {message}
      </p>
    </div>
  );
}

export default MascotSpeech;
