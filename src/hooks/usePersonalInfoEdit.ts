import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import type { Gender } from "@/apis/auth";
import { updateMyProfile, type UserProfile } from "@/apis/user";
import { PERSONAL_INFO_ERROR, PERSONAL_INFO_SAVING_MIN_MS } from "@/constants/mypage";
import { MY_PROFILE_QUERY_KEY } from "@/hooks/useMyPage";
import type { EditableField, SaveFeedback } from "@/types/mypage";

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
  // 저장 중·저장 완료 피드백. 화면이 그대로면 저장됐는지 알기 어려워 연필 자리에 잠깐 보여 준다
  const [saveFeedback, setSaveFeedback] = useState<SaveFeedback | null>(null);
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    };
  }, []);

  const mutation = useMutation({
    mutationFn: updateMyProfile,
    onSuccess: (updated) => queryClient.setQueryData(MY_PROFILE_QUERY_KEY, updated),
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
    if (!profile || editingField === null) return;

    if (
      !isValidNumber(editing.age) ||
      !isValidNumber(editing.height) ||
      !isValidNumber(editing.weight)
    ) {
      onError(PERSONAL_INFO_ERROR.invalid);
      return;
    }

    // 저장 버튼 대신 연필 자리에서 진행 상황을 보여 주므로 요청과 함께 읽기 상태로 돌아간다
    const field = editingField;
    const startedAt = Date.now();

    setEditingField(null);
    setSaveFeedback({ field, phase: "saving" });

    mutation.mutate(
      {
        nickname: profile.nickname,
        age: toNumberOrNull(editing.age),
        gender: editing.gender,
        height: toNumberOrNull(editing.height),
        weight: toNumberOrNull(editing.weight),
      },
      {
        onSuccess: () => {
          // 응답이 빨라도 스피너가 한 바퀴는 돌고 체크로 바뀌게 남은 시간만큼 기다린다
          const remaining = Math.max(0, PERSONAL_INFO_SAVING_MIN_MS - (Date.now() - startedAt));

          feedbackTimerRef.current = setTimeout(
            () => setSaveFeedback({ field, phase: "saved" }),
            remaining,
          );
        },
        // 입력값은 그대로 두었으므로 실패하면 같은 줄을 다시 수정 상태로 연다
        onError: () => {
          setSaveFeedback(null);
          setEditingField(field);
        },
      },
    );
  };

  const endSaveFeedback = () => setSaveFeedback(null);

  return {
    editingField,
    editing,
    isSaving: mutation.isPending,
    saveFeedback,
    startEdit,
    cancelEdit,
    save,
    endSaveFeedback,
    changeAge: (age: string) => setEditing((prev) => ({ ...prev, age })),
    changeGender: (gender: Gender) => setEditing((prev) => ({ ...prev, gender })),
    changeHeight: (height: string) => setEditing((prev) => ({ ...prev, height })),
    changeWeight: (weight: string) => setEditing((prev) => ({ ...prev, weight })),
  };
}
