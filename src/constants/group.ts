import { Activity, Armchair, Dumbbell, Timer, type LucideIcon } from "lucide-react";
import type { ExerciseType } from "@/constants/exercises";

export const GROUP_TAB_LABELS = {
  today: "오늘",
  month: "이번 달",
} as const;

export const RANK_LABEL = "이번 달 순위";

/** 실행률 순위 API 가 없을 때 쓰는 중립 라벨 */
export const MEMBERS_LABEL = "팀원";

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
  description: "그룹을 만들어 운동을 시작해 보세요.",
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

export const INVITE_LINK_HOST = "fittle.app/g";

export const GROUP_SHEET = {
  switchTitle: "내 그룹",
  createTitle: "그룹 만들기",
  createAction: "새 그룹 만들기",
  submitLabel: "결제하고 만들기",
  /** 2인 그룹은 요금이 0원이라 결제 문구를 쓰지 않는다 */
  submitFreeLabel: "만들기",
  nameLabel: "그룹 이름",
  namePlaceholder: "그룹 이름을 입력해 주세요.",
  memberCountLabel: "최대 인원",
  memberCountHelper: "2명까지는 무료예요.",
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

/** 최대 인원 선택지. 서버가 2~5 만 받는다 */
export const MEMBER_COUNT_OPTIONS = [2, 3, 4, 5] as const;

/** 요금 = max(0, 최대 인원 - 2) × 500 */
export function groupPrice(maxMemberCount: number) {
  return Math.max(0, maxMemberCount - 2) * 500;
}

export const FREE_PRICE_LABEL = "무료";

/** 서버 에러 코드를 화면 문구로 바꾼다. 없는 코드는 기본 문구로 떨어진다 */
export const GROUP_ERROR_MESSAGES: Record<string, string> = {
  GROUP_400_INVALID_MEMBER_COUNT: "인원은 2명에서 5명까지 정할 수 있어요.",
  GROUP_400_INVALID_INVITE_CODE: "초대 코드가 올바르지 않아요.",
  GROUP_400_NOT_MEMBER: "이미 나간 그룹이에요.",
  GROUP_400_OWNER_MUST_DELETE_GROUP: "방장은 그룹을 나갈 수 없어요. 그룹을 삭제해 주세요.",
  GROUP_403_ACCESS_DENIED: "이 그룹에 대한 권한이 없어요.",
  GROUP_404_NOT_FOUND: "이미 사라진 그룹이에요.",
  GROUP_409_ALREADY_MEMBER: "이미 참가한 그룹이에요.",
  GROUP_409_GROUP_FULL: "그룹 정원이 가득 찼어요.",
  GROUP_409_MAX_GROUPS_EXCEEDED: "그룹은 5개까지 참가할 수 있어요.",
  GROUP_500_INVITE_CODE_FAILED: "초대 코드를 만들지 못했어요. 잠시 후 다시 시도해 주세요.",
};

export const GROUP_FALLBACK_ERROR = "잠시 후 다시 시도해 주세요.";

/** 서버 API 가 아직 없는 영역에 띄우는 안내 */
export const GROUP_PENDING = {
  calendar: "팀원별 기록은 곧 볼 수 있어요.",
  todayReport: "오늘 리포트는 준비하고 있어요.",
} as const;
