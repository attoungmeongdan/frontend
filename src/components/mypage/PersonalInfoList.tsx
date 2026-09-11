import { Pencil } from "lucide-react";
import type { Gender } from "@/apis/auth";
import PersonalInfoEditor from "@/components/mypage/PersonalInfoEditor";
import type { EditableField, PersonalInfoItem } from "@/types/mypage";

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
  onStartEdit: (field: EditableField) => void;
  onCancelEdit: () => void;
  onSave: () => void;
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
  onStartEdit,
  onCancelEdit,
  onSave,
  ...editorHandlers
}: PersonalInfoListProps) {
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
              ) : (
                <button
                  type="button"
                  aria-label={`${label} 수정`}
                  onClick={() => onStartEdit(field)}
                  disabled={editingField !== null}
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

export default PersonalInfoList;
