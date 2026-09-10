import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import type { Gender } from "@/apis/auth";
import { updateMyProfile, type UserProfile } from "@/apis/user";
import { PERSONAL_INFO_ERROR } from "@/constants/mypage";
import { MY_PROFILE_QUERY_KEY } from "@/hooks/useMyPage";
import type { EditableField } from "@/types/mypage";

interface EditingValues {
  age: string;
  gender: Gender | null;
  height: string;
  weight: string;
}

const EMPTY_VALUES: EditingValues = { age: "", gender: null, height: "", weight: "" };

function toNumberOrNull(value: string) {
  const trimmed = value.trim();

  return trimmed === "" ? null : Number(trimmed);
}

function isValidNumber(value: string) {
  const trimmed = value.trim();

  return trimmed === "" || (/^\d+(\.\d+)?$/.test(trimmed) && Number(trimmed) > 0);
}

interface Options {
  profile: UserProfile | undefined;
  onError: (message: string) => void;
}

/**
 * 개인정보 한 줄 수정.
 * 서버가 null 을 "값 지우기"로 처리하므로 고치지 않는 필드도 기존 값을 함께 보낸다.
 */
export function usePersonalInfoEdit({ profile, onError }: Options) {
  const queryClient = useQueryClient();
  const [editingField, setEditingField] = useState<EditableField | null>(null);
  const [editing, setEditing] = useState<EditingValues>(EMPTY_VALUES);

  const mutation = useMutation({
    mutationFn: updateMyProfile,
    onSuccess: (updated) => {
      queryClient.setQueryData(MY_PROFILE_QUERY_KEY, updated);
      setEditingField(null);
    },
    onError: () => onError(PERSONAL_INFO_ERROR.save),
  });

  const startEdit = (field: EditableField) => {
    if (!profile) return;

    setEditing({
      age: profile.age === null ? "" : String(profile.age),
      gender: profile.gender,
      height: profile.height === null ? "" : String(profile.height),
      weight: profile.weight === null ? "" : String(profile.weight),
    });
    setEditingField(field);
  };

  const cancelEdit = () => setEditingField(null);

  const save = () => {
    if (!profile) return;

    if (
      !isValidNumber(editing.age) ||
      !isValidNumber(editing.height) ||
      !isValidNumber(editing.weight)
    ) {
      onError(PERSONAL_INFO_ERROR.invalid);
      return;
    }

    mutation.mutate({
      nickname: profile.nickname,
      age: toNumberOrNull(editing.age),
      gender: editing.gender,
      height: toNumberOrNull(editing.height),
      weight: toNumberOrNull(editing.weight),
    });
  };

  return {
    editingField,
    editing,
    isSaving: mutation.isPending,
    startEdit,
    cancelEdit,
    save,
    changeAge: (age: string) => setEditing((prev) => ({ ...prev, age })),
    changeGender: (gender: Gender) => setEditing((prev) => ({ ...prev, gender })),
    changeHeight: (height: string) => setEditing((prev) => ({ ...prev, height })),
    changeWeight: (weight: string) => setEditing((prev) => ({ ...prev, weight })),
  };
}
