import { ClipboardX, TriangleAlert } from "lucide-react";
import Button from "@/components/ui/Button";

interface AnalysisStatusMessageProps {
  state: "error" | "empty";
  onAction: () => void;
}

// error 는 06_Analysis 시안 문구. 분석 조회 실패는 당일 측정 완료 상태를 취소하지 않는다
// empty(결과 없음)는 시안이 없어 error 와 같은 구성으로 둔다
const STATUS_CONTENT = {
  error: {
    icon: TriangleAlert,
    iconClass: "text-feedback-error",
    title: "분석 결과를 불러오지 못했어요",
    description: "측정 기록은 그대로 유지돼요. 잠시 후 다시 시도해 주세요.",
    actionLabel: "다시 불러오기",
  },
  empty: {
    icon: ClipboardX,
    iconClass: "text-brand-teal-strong",
    title: "측정 결과가 없어요",
    description: "체력 측정을 모두 마치면 이곳에서 결과를 볼 수 있어요.",
    actionLabel: "홈으로 돌아가기",
  },
} as const;

function AnalysisStatusMessage({ state, onAction }: AnalysisStatusMessageProps) {
  const { icon: Icon, iconClass, title, description, actionLabel } = STATUS_CONTENT[state];

  return (
    <div className="flex min-h-full flex-col items-center justify-center gap-4 px-3 py-6 text-center">
      <div
        role={state === "error" ? "alert" : undefined}
        className="flex flex-col items-center gap-4"
      >
        <Icon size={56} className={`shrink-0 ${iconClass}`} aria-hidden />
        <h2 className="text-title text-text-primary font-bold">{title}</h2>
        <p className="text-body text-text-secondary break-keep">{description}</p>
      </div>

      <Button type="button" className="w-full" onClick={onAction}>
        {actionLabel}
      </Button>
    </div>
  );
}

export default AnalysisStatusMessage;
