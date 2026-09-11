import { Check, LoaderCircle, Pencil } from "lucide-react";
import { useEffect } from "react";
import type { Gender } from "@/apis/auth";
import PersonalInfoEditor from "@/components/mypage/PersonalInfoEditor";
import {
  PERSONAL_INFO_SAVED_CHECK_MS,
  PERSONAL_INFO_SAVED_LABEL,
  PERSONAL_INFO_SAVING_LABEL,
} from "@/constants/mypage";
import type { EditableField, PersonalInfoItem, SaveFeedback } from "@/types/mypage";

interface EditingState {
  age: string;
  gender: Gender | null;
  height: string;
  weight: string;
}

interface PersonalInfoListProps {
  items: PersonalInfoItem[];
  /** 지금 수정 중인 항목. null 이면 모두 읽기 상태 */
  editingField: EditableField | null;
  editing: EditingState;
  isSaving: boolean;
  /** 저장 중·완료 피드백. 해당 줄의 연필 자리에 스피너·체크를 보여 준다 */
  saveFeedback: SaveFeedback | null;
  onStartEdit: (field: EditableField) => void;
  onCancelEdit: () => void;
  onSave: () => void;
  onSaveFeedbackEnd: () => void;
  onChangeAge: (value: string) => void;
  onChangeGender: (value: Gender) => void;
  onChangeHeight: (value: string) => void;
  onChangeWeight: (value: string) => void;
}

/**
 * 개인정보 목록. 수정 아이콘을 누르면 그 줄만 입력 상태로 바뀐다.
 * 주소는 수정 API 가 없어 아이콘을 흐리게 두고 누를 수 없다.
 */
function PersonalInfoList({
  items,
  editingField,
  editing,
  isSaving,
  saveFeedback,
  onStartEdit,
  onCancelEdit,
  onSave,
  onSaveFeedbackEnd,
  ...editorHandlers
}: PersonalInfoListProps) {
  // 저장 피드백이 보이는 동안 다른 줄 수정을 시작하면 피드백이 뒤섞이므로 막는다
  const isLocked = editingField !== null || saveFeedback !== null;

  return (
    <dl className="border-border-default bg-surface-default flex w-full flex-col rounded-2xl border">
      {items.map(({ label, value, field }, index) => {
        const isEditing = field !== null && field === editingField;
        const rowClass = index > 0 ? "border-border-default border-t" : "";

        if (isEditing) {
          return (
            <div key={label} className={`flex flex-col gap-2 px-4 py-3 ${rowClass}`}>
              <dt className="text-text-secondary text-card-label">{label}</dt>
              <dd className="flex items-center gap-2">
                <PersonalInfoEditor field={field} {...editing} {...editorHandlers} />
                <button
                  type="button"
                  onClick={onCancelEdit}
                  disabled={isSaving}
                  className="text-text-secondary text-body-small shrink-0 px-1"
                >
                  취소
                </button>
                <button
                  type="button"
                  onClick={onSave}
                  disabled={isSaving}
                  className="bg-action-primary-bg text-action-primary-fg rounded-input text-body-small h-10 shrink-0 px-3 font-semibold disabled:opacity-40"
                >
                  저장
                </button>
              </dd>
            </div>
          );
        }

        return (
          <div key={label} className={`flex items-center justify-between px-4 py-2.5 ${rowClass}`}>
            <dt className="text-text-secondary text-card-label">{label}</dt>
            <dd className="flex items-center gap-2">
              <span className="text-text-primary text-body">{value}</span>
              {field === null ? (
                <Pencil size={16} className="text-text-secondary/40" aria-hidden />
              ) : saveFeedback?.field === field ? (
                <SaveFeedbackIcon phase={saveFeedback.phase} onEnd={onSaveFeedbackEnd} />
              ) : (
                <button
                  type="button"
                  aria-label={`${label} 수정`}
                  onClick={() => onStartEdit(field)}
                  disabled={isLocked}
                  className="text-text-secondary flex items-center disabled:opacity-40"
                >
                  <Pencil size={16} aria-hidden />
                </button>
              )}
            </dd>
          </div>
        );
      })}
    </dl>
  );
}

interface SaveFeedbackIconProps {
  phase: SaveFeedback["phase"];
  onEnd: () => void;
}

/** 연필 자리 피드백. 저장 중엔 스피너, 성공하면 체크를 잠깐 보여 준 뒤 부모가 연필로 되돌린다 */
function SaveFeedbackIcon({ phase, onEnd }: SaveFeedbackIconProps) {
  useEffect(() => {
    if (phase !== "saved") return;

    const timer = setTimeout(onEnd, PERSONAL_INFO_SAVED_CHECK_MS);

    return () => clearTimeout(timer);
  }, [phase, onEnd]);

  return (
    <span
      role="status"
      aria-label={phase === "saved" ? PERSONAL_INFO_SAVED_LABEL : PERSONAL_INFO_SAVING_LABEL}
      className="text-brand-teal-strong flex items-center"
    >
      {phase === "saved" ? (
        <Check size={16} aria-hidden />
      ) : (
        <LoaderCircle size={16} className="animate-spin" aria-hidden />
      )}
    </span>
  );
}

export default PersonalInfoList;
