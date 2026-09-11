import { useId, type ComponentProps } from "react";
import { Check, TriangleAlert } from "lucide-react";

type FieldStatus = "default" | "error" | "success" | "readonly";

interface TextFieldProps extends Omit<ComponentProps<"input">, "id"> {
  label: string;
  unit?: string;
  helper?: string;
  status?: FieldStatus;
  /** subtle 은 버튼·카드와 같은 연한 테두리를 쓴다. 기본은 입력칸용 진한 테두리 */
  borderTone?: "strong" | "subtle";
}

// UI/TextField (nNDM3) — 라벨 14/600 + 입력박스 52 + 헬퍼행
const BOX_CLASS: Record<FieldStatus, string> = {
  default: "border-field-border-strong border bg-white",
  error: "border-feedback-error border-2 bg-white",
  success: "border-field-border-strong border bg-white",
  readonly: "border-border-default bg-surface-subtle border",
};

function TextField({
  label,
  unit,
  helper,
  status = "default",
  borderTone = "strong",
  ...props
}: TextFieldProps) {
  const inputId = useId();
  const isError = status === "error";
  // 오류·읽기전용은 상태를 테두리로 알려야 해서 톤 옵션을 적용하지 않는다
  const boxClass =
    status === "default" && borderTone === "subtle"
      ? "border-border-default border bg-white"
      : BOX_CLASS[status];
  const HelperIcon = isError ? TriangleAlert : Check;

  return (
    <div className="flex w-full flex-col gap-2">
      <label htmlFor={inputId} className="text-card-label text-text-primary">
        {label}
      </label>

      <div className={`rounded-input flex h-13 items-center justify-between px-4 ${boxClass}`}>
        <input
          id={inputId}
          readOnly={status === "readonly"}
          className={`text-body min-w-0 flex-1 bg-transparent outline-none ${
            status === "readonly" ? "text-text-secondary" : "text-text-primary"
          } placeholder:text-text-secondary`}
          {...props}
        />
        {unit && <span className="text-body text-text-secondary shrink-0 pl-2">{unit}</span>}
      </div>

      {helper && (
        <div className="flex items-center gap-1">
          {(isError || status === "success") && (
            <HelperIcon
              size={16}
              aria-hidden
              className={isError ? "text-feedback-error" : "text-brand-teal-strong"}
            />
          )}
          <p
            className={`text-body-small ${
              isError ? "text-feedback-error font-semibold" : "text-text-secondary"
            }`}
          >
            {helper}
          </p>
        </div>
      )}
    </div>
  );
}

export default TextField;
