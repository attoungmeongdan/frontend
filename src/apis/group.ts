import { axiosInstance } from "@/apis/axiosInstance";
import type { CommonResponse } from "@/types/api";

/** GENERAL = 2인 무료, SUBSCRIBED = 3~5인 유료 */
export type GroupMembership = "GENERAL" | "SUBSCRIBED";

/** GET /api/v1/groups, GET /api/v1/groups/{id}, POST /api/v1/groups 공통 응답 */
export interface GroupResponse {
  id: number;
  name: string;
  membership: GroupMembership;
  /** 방장 포함 가용 최대 인원 (2~5) */
  maxMemberCount: number;
  currentMemberCount: number;
  /** 그룹 유지 요금(원). max(0, maxMemberCount - 2) × 500 */
  price: number;
  ownerId: number;
  /**
   * 요청자가 방장인지.
   * 명세에는 isOwner 로 적혀 있지만 서버는 owner 로 내려준다(Java isOwner() 게터의 기본 직렬화).
   * 서버가 명세대로 고칠 수도 있어 둘 다 받아 두고 isGroupOwner 로 읽는다.
   */
  owner?: boolean;
  isOwner?: boolean;
}

export interface GroupMemberResponse {
  userId: number;
  nickname: string;
  /** 그룹 응답과 같은 이유로 owner 로 내려온다 */
  owner?: boolean;
  isOwner?: boolean;
}

/** owner / isOwner 어느 쪽으로 와도 방장 여부를 읽는다 */
export function isGroupOwner(value: { owner?: boolean; isOwner?: boolean }) {
  return value.isOwner ?? value.owner ?? false;
}

export interface GroupInviteLink {
  /** 12자, 그룹당 영구 고정 */
  inviteCode: string;
  inviteLink: string;
}

export interface GroupJoinResult {
  groupId: number;
  groupName: string;
  currentMemberCount: number;
}

export interface CreateGroupRequest {
  /** 최대 10자 */
  name: string;
  /** 방장 포함 2~5 */
  maxMemberCount: number;
}

// 내 그룹 목록
export async function getMyGroups() {
  const { data } = await axiosInstance.get<CommonResponse<GroupResponse[]>>("/api/v1/groups");

  return data.data;
}

// 그룹 상세. 그룹 멤버만 조회할 수 있다
export async function getGroup(groupId: number) {
  const { data } = await axiosInstance.get<CommonResponse<GroupResponse>>(
    `/api/v1/groups/${groupId}`,
  );

  return data.data;
}

// 그룹 멤버 목록
export async function getGroupMembers(groupId: number) {
  const { data } = await axiosInstance.get<CommonResponse<GroupMemberResponse[]>>(
    `/api/v1/groups/${groupId}/members`,
  );

  return data.data;
}

/** 초대 링크. 방장이 아니면 403 이라 방장일 때만 호출한다 */
export async function getGroupInviteLink(groupId: number) {
  const { data } = await axiosInstance.get<CommonResponse<GroupInviteLink>>(
    `/api/v1/groups/${groupId}/invite-link`,
  );

  return data.data;
}

// 그룹 생성. 요청자가 방장이 된다
export async function createGroup(payload: CreateGroupRequest) {
  const { data } = await axiosInstance.post<CommonResponse<GroupResponse>>(
    "/api/v1/groups",
    payload,
  );

  return data.data;
}

/**
 * 초대 코드로 참가. 이미 로그인한 사용자만 쓴다.
 * 미로그인 상태에서 초대 링크로 들어온 경우는 소셜 로그인 플로우가 알아서 참가시킨다.
 */
export async function joinGroup(inviteCode: string) {
  const { data } = await axiosInstance.post<CommonResponse<GroupJoinResult>>(
    "/api/v1/groups/join",
    null,
    { params: { inviteCode } },
  );

  return data.data;
}

/** 그룹 삭제. 방장만 할 수 있고 모든 멤버의 소속이 함께 사라진다 */
export async function deleteGroup(groupId: number) {
  await axiosInstance.delete<CommonResponse<null>>(`/api/v1/groups/${groupId}`);
}

/** 그룹 탈퇴. 방장은 쓸 수 없고 그룹 삭제를 해야 한다 */
export async function leaveGroup(groupId: number) {
  await axiosInstance.delete<CommonResponse<null>>(`/api/v1/groups/${groupId}/members/me`);
}

/** 서버가 쓰는 운동 코드. 플랭크만 단위가 ms 다 */
export type WorkoutExerciseType = "CHAIR_STAND" | "SIT_UP" | "PUSH_UP" | "PLANK";

export interface GroupExerciseMemberValue {
  userId: number;
  nickname: string;
  /** COUNT 면 횟수, MS 면 유지 시간(ms). 0 이면 미실행 */
  value: number;
  owner?: boolean;
  isOwner?: boolean;
}

export interface GroupExerciseBarSection {
  type: WorkoutExerciseType;
  unit: "COUNT" | "MS";
  /** 막대 100% 기준값. 전원 0 이면 0 */
  topValue: number;
  /** 그룹 전원. 수행량 내림차순으로 서버가 정렬해 준다 */
  members: GroupExerciseMemberValue[];
}

export interface GroupDailyWorkoutResponse {
  groupId: number;
  groupName: string;
  /** yyyy-MM-dd */
  date: string;
  /** 고정 4개 섹션 */
  exercises: GroupExerciseBarSection[];
}

/** 멤버의 하루치 기록. 실제 수행한 날만 온다 */
export interface GroupMemberDailyRecord {
  /** yyyy-MM-dd */
  date: string;
  /** 그날 수행한 운동 종류 수 (1~4). 캘린더 원 채우기 단계 */
  exerciseTypeCount: number;
  chairStandCount: number;
  pushUpCount: number;
  sitUpCount: number;
  plankDurationMs: number;
}

export interface GroupMonthlyMemberSummary {
  /** 1부터. 서버가 실행률 순으로 매겨 준다 */
  rank: number;
  userId: number;
  nickname: string;
  /** 0.0 ~ 100.0 */
  executionRate: number;
  executedDays: number;
  /** 그 달 실행 운동 종류 총합 (하루 최대 4) */
  totalExerciseTypes: number;
  /** 수행한 날만. 날짜 오름차순 */
  days: GroupMemberDailyRecord[];
  owner?: boolean;
  isOwner?: boolean;
}

export interface GroupMonthlyWorkoutResponse {
  groupId: number;
  groupName: string;
  daysInMonth: number;
  /** 그룹 전원. 이미 랭킹 순으로 정렬돼 있다 */
  members: GroupMonthlyMemberSummary[];
}

/** 하루치 운동량. date 를 비우면 서버가 오늘(Asia/Seoul)로 본다 */
export async function getGroupDailyWorkout(groupId: number, date?: string) {
  const { data } = await axiosInstance.get<CommonResponse<GroupDailyWorkoutResponse>>(
    `/api/v1/groups/${groupId}/workout-records/daily`,
    date ? { params: { date } } : undefined,
  );

  return data.data;
}

/** 한 달 실행률 랭킹 + 멤버별 일별 기록. yearMonth 를 비우면 서버가 이번 달로 본다 */
export async function getGroupMonthlyWorkout(groupId: number, yearMonth?: string) {
  const { data } = await axiosInstance.get<CommonResponse<GroupMonthlyWorkoutResponse>>(
    `/api/v1/groups/${groupId}/workout-records/monthly`,
    yearMonth ? { params: { yearMonth } } : undefined,
  );

  return data.data;
}
