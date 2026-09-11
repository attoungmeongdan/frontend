import { Activity, Armchair, Dumbbell, Timer, type LucideIcon } from "lucide-react";
import type { ExerciseType } from "@/constants/exercises";

export const GROUP_TAB_LABELS = {
  today: "오늘",
  month: "이번달",
} as const;

export const RANK_LABEL = "이번 달 순위";

export const TODAY_REPORT_HINT = "가장 많이 한 사람 100%";

export const GROUP_MASCOT_MESSAGES = {
  month: (groupName: string) => `이번 달 ${groupName} 실행률이에요.\n서로 응원하며 움직여요!`,
  memberSelected: (memberName: string) =>
    `${memberName}님의 이번 달 기록이에요.\n서로 응원하며 움직여요!`,
  today: "오늘 팀원들이 이만큼 움직였어요.\n제일 많이 한 사람이 기준이에요!",
  empty: "친구들과 함께 기록해 볼까요?\n같이 하면 더 꾸준해져요.",
  loading: "기록을 살펴보고 있어요.",
  error: "잠시만요, 다시 한 번 볼게요.",
} as const;

export const GROUP_EMPTY = {
  title: "아직 그룹이 없어요",
  description:
    "그룹을 만들어 친구·가족을 초대하면\n서로의 운동 기록을 한눈에 볼 수 있어요.\n그룹은 여러 개 만들 수 있어요.",
  createLabel: "그룹 만들기",
} as const;

export const GROUP_ERROR = {
  title: "그룹 기록을 불러오지 못했어요",
  description: "잠시 후 다시 시도해 주세요. 기록 자체는 사라지지 않아요.",
  retryLabel: "다시 불러오기",
} as const;

export const TODAY_REPORT_EXERCISES: {
  exercise: ExerciseType;
  icon: LucideIcon;
  unitLabel: string;
  suffix: string;
}[] = [
  { exercise: "plank", icon: Timer, unitLabel: "유지 시간", suffix: "초" },
  { exercise: "sit-up", icon: Activity, unitLabel: "횟수", suffix: "개" },
  { exercise: "chair-stand", icon: Armchair, unitLabel: "횟수", suffix: "개" },
  { exercise: "push-up", icon: Dumbbell, unitLabel: "횟수", suffix: "개" },
];

export const NO_RECORD_LABEL = "아직";

export const INVITE_LINK_HOST = "fittle.app/g";

export const GROUP_SHEET = {
  switchTitle: "내 그룹",
  createTitle: "그룹 만들기",
  createAction: "새 그룹 만들기",
  submitLabel: "만들기",
  nameLabel: "그룹 이름",
  namePlaceholder: "그룹 이름을 입력해 주세요.",
  nameHelper: "팀원에게 보이는 이름이에요. 나중에 바꿀 수 있어요.",
  nameMaxLength: 10,
  inviteLabel: "초대 링크",
  copyLabel: "링크 복사",
  shareLabel: "공유",
} as const;

export const GROUP_SETTINGS_MENU = {
  copyLink: "초대 링크 복사",
  remove: "그룹 삭제",
} as const;

export const GROUP_DELETE = {
  title: (groupName: string) => `${groupName} 그룹을 삭제할까요?`,
  description: "삭제하면 되돌릴 수 없어요.\n각자의 개인 기록은 그대로 남아요.",
  confirmLabel: "삭제하기",
  cancelLabel: "취소",
} as const;

export const GROUP_TOAST = {
  created: (groupName: string) => `${groupName} 그룹을 만들었어요!`,
  linkCopied: "초대 링크를 복사했어요.",
  copyFailed: "링크를 복사하지 못했어요.",
  deleted: (groupName: string) => `${groupName} 그룹을 삭제했어요.`,
} as const;
