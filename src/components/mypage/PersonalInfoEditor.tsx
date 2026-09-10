import type { Gender } from "@/apis/auth";
import type { EditableField } from "@/types/mypage";

interface PersonalInfoEditorProps {
  field: EditableField;
  age: string;
  gender: Gender | null;
  height: string;
  weight: string;
  onChangeAge: (value: string) => void;
  onChangeGender: (value: Gender) => void;
  onChangeHeight: (value: string) => void;
  onChangeWeight: (value: string) => void;
}

const GENDER_OPTIONS: { value: Gender; label: string }[] = [
  { value: "MALE", label: "남성" },
  { value: "FEMALE", label: "여성" },
];

interface UnitInputProps {
  label: string;
  unit: string;
  value: string;
  onChange: (value: string) => void;
}

/** 오른쪽에 단위를 붙인 입력창 */
function UnitInput({ label, unit, value, onChange }: UnitInputProps) {
  return (
    <div className="border-field-border-strong rounded-input flex h-10 min-w-0 flex-1 items-center gap-1 border bg-white px-3">
      <input
        aria-label={label}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        inputMode="decimal"
        className="text-body text-text-primary w-full min-w-0 bg-transparent outline-none"
      />
      <span className="text-body-small text-text-secondary shrink-0">{unit}</span>
    </div>
  );
}

// 개인정보 한 줄을 수정할 때 값 자리에 들어가는 입력 영역
function PersonalInfoEditor({
  field,
  age,
  gender,
  height,
  weight,
  onChangeAge,
  onChangeGender,
  onChangeHeight,
  onChangeWeight,
}: PersonalInfoEditorProps) {
  if (field === "age") {
    return <UnitInput label="나이" unit="세" value={age} onChange={onChangeAge} />;
  }

  if (field === "gender") {
    return (
      <div className="flex min-w-0 flex-1 gap-2">
        {GENDER_OPTIONS.map((option) => {
          const isSelected = gender === option.value;

          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={isSelected}
              onClick={() => onChangeGender(option.value)}
              className={`rounded-input text-body-small h-10 flex-1 border ${
                isSelected
                  ? "border-brand-teal-strong text-action-secondary-fg font-semibold"
                  : "border-border-default text-text-secondary"
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="flex min-w-0 flex-1 items-center gap-2">
      <UnitInput label="키" unit="cm" value={height} onChange={onChangeHeight} />
      <UnitInput label="몸무게" unit="kg" value={weight} onChange={onChangeWeight} />
    </div>
  );
}

export default PersonalInfoEditor;
