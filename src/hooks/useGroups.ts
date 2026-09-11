import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createGroup,
  deleteGroup,
  getGroupInviteLink,
  getGroupMembers,
  getMyGroups,
  isGroupOwner,
  joinGroup,
  leaveGroup,
  type CreateGroupRequest,
  type GroupMemberResponse,
  type GroupResponse,
} from "@/apis/group";
import type { Group, GroupMember } from "@/types/group";

export const MY_GROUPS_QUERY_KEY = ["groups"] as const;
const groupMembersQueryKey = (groupId: number) => ["groups", groupId, "members"] as const;
const inviteLinkQueryKey = (groupId: number) => ["groups", groupId, "invite-link"] as const;

function toMember(member: GroupMemberResponse): GroupMember {
  return {
    id: member.userId,
    name: member.nickname,
    // 닉네임이 비어 오는 경우가 있어 아바타 글자가 사라지지 않게 물음표로 대신한다
    initial: member.nickname.trim().slice(0, 1) || "?",
    isOwner: isGroupOwner(member),
  };
}

function toGroup(group: GroupResponse, members: GroupMember[]): Group {
  return {
    id: group.id,
    name: group.name,
    maxMemberCount: group.maxMemberCount,
    currentMemberCount: group.currentMemberCount,
    ownerId: group.ownerId,
    isOwner: isGroupOwner(group),
    members,
  };
}

/** 내가 속한 그룹 목록. 멤버는 선택한 그룹만 따로 불러온다 */
export function useMyGroups() {
  return useQuery({ queryKey: MY_GROUPS_QUERY_KEY, queryFn: getMyGroups });
}

/** 선택한 그룹의 멤버. groupId 가 없으면(그룹 없음) 요청하지 않는다 */
export function useGroupMembers(groupId: number | null) {
  return useQuery({
    queryKey: groupMembersQueryKey(groupId ?? 0),
    queryFn: () => getGroupMembers(groupId as number),
    enabled: groupId !== null,
  });
}

/** 목록 응답과 멤버 응답을 화면이 쓰는 한 덩어리로 합친다 */
export function useSelectedGroup(groups: GroupResponse[] | undefined, groupId: number | null) {
  const membersQuery = useGroupMembers(groupId);
  const found = groups?.find((group) => group.id === groupId);

  const group: Group | null =
    found && membersQuery.data ? toGroup(found, membersQuery.data.map(toMember)) : null;

  return { group, isPending: membersQuery.isPending, isError: membersQuery.isError };
}

/**
 * 초대 링크. 방장이 아니면 서버가 403 을 주므로 방장일 때만 켠다.
 * 코드는 그룹당 영구 고정이라 한 번 받으면 다시 부를 일이 없다.
 */
export function useGroupInviteLink(groupId: number | null, enabled: boolean) {
  return useQuery({
    queryKey: inviteLinkQueryKey(groupId ?? 0),
    queryFn: () => getGroupInviteLink(groupId as number),
    enabled: enabled && groupId !== null,
    staleTime: Infinity,
  });
}

export function useGroupMutations() {
  const queryClient = useQueryClient();
  const refreshGroups = () => queryClient.invalidateQueries({ queryKey: MY_GROUPS_QUERY_KEY });

  return {
    create: useMutation({
      mutationFn: (payload: CreateGroupRequest) => createGroup(payload),
      onSuccess: (created) => {
        // 목록 재요청이 끝나기 전에 화면이 새 그룹을 못 찾고 다른 그룹으로 튀는 것을 막는다
        queryClient.setQueryData<GroupResponse[]>(MY_GROUPS_QUERY_KEY, (current) => [
          created,
          ...(current ?? []),
        ]);
        void refreshGroups();
      },
    }),
    join: useMutation({
      mutationFn: (inviteCode: string) => joinGroup(inviteCode),
      onSuccess: refreshGroups,
    }),
    remove: useMutation({
      mutationFn: (groupId: number) => deleteGroup(groupId),
      onSuccess: refreshGroups,
    }),
    leave: useMutation({
      mutationFn: (groupId: number) => leaveGroup(groupId),
      onSuccess: refreshGroups,
    }),
  };
}
