import Button from "@/components/ui/Button";
import turtleGuide from "@/assets/mascots/turtle-guide.png";

interface MeasureBubbleProps {
  message: string;
  onMeasure: () => void;
}

// 운동 능력 측정
function MeasureBubble({ message, onMeasure }: MeasureBubbleProps) {
  return (
    <div className="flex items-center">
      <img src={turtleGuide} alt="" className="size-21 shrink-0 object-contain" />

      <svg
        width="10"
        height="16"
        viewBox="0 0 10 16"
        aria-hidden
        className="text-surface-subtle ml-2 shrink-0"
      >
        <path d="M10 0 L10 16 L0 8 Z" fill="currentColor" />
      </svg>

      <div className="bg-surface-subtle rounded-bubble flex min-w-0 flex-1 flex-col gap-2.5 px-4 py-3.5">
        <p className="text-guide text-text-primary font-semibold whitespace-pre-line">{message}</p>
        <Button onClick={onMeasure}>내 운동 능력 측정해보기</Button>
      </div>
    </div>
  );
}

export default MeasureBubble;
