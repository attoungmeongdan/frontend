import { useId, type ComponentProps } from "react";
import { Check, TriangleAlert } from "lucide-react";

type FieldStatus = "default" | "error" | "success" | "readonly";

interface TextFieldProps extends Omit<ComponentProps<"input">, "id"> {
  label: string;
  unit?: string;
  helper?: string;
  status?: FieldStatus;
}

// UI/TextField (nNDM3) — 라벨 14/600 + 입력박스 52 + 헬퍼행
const BOX_CLASS: Record<FieldStatus, string> = {
  default: "border-field-border-strong border bg-white",
  error: "border-feedback-error border-2 bg-white",
  success: "border-field-border-strong border bg-white",
  readonly: "border-border-default bg-surface-subtle border",
};

function TextField({ label, unit, helper, status = "default", ...props }: TextFieldProps) {
  const inputId = useId();
  const isError = status === "error";
  const HelperIcon = isError ? TriangleAlert : Check;

  return (
    <div className="flex w-full flex-col gap-2">
      <label htmlFor={inputId} className="text-card-label text-text-primary">
        {label}
      </label>

      <div
        className={`rounded-input flex h-13 items-center justify-between px-4 ${BOX_CLASS[status]}`}
      >
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
