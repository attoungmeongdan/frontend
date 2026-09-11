import { useEffect, useState } from "react";
import { CalendarClock, LoaderCircle, TriangleAlert } from "lucide-react";
import ActivityCalendar from "@/components/calendar/ActivityCalendar";
import MascotSpeech from "@/components/common/MascotSpeech";
import ToastHost from "@/components/common/ToastHost";
import GroupBar from "@/components/group/GroupBar";
import GroupCreateSheet from "@/components/group/GroupCreateSheet";
import GroupDeleteDialog from "@/components/group/GroupDeleteDialog";
import GroupEmptyState from "@/components/group/GroupEmptyState";
import GroupSettingsSheet from "@/components/group/GroupSettingsSheet";
import GroupSwitchSheet from "@/components/group/GroupSwitchSheet";
import RankStrip from "@/components/group/RankStrip";
import Button from "@/components/ui/Button";
import { GROUP_ERROR, GROUP_MASCOT_MESSAGES, GROUP_PENDING, GROUP_TOAST } from "@/constants/group";
import {
  useGroupInviteLink,
  useGroupMutations,
  useMyGroups,
  useSelectedGroup,
} from "@/hooks/useGroups";
import { useMonthlyActivity } from "@/hooks/useMonthlyActivity";
import { useMyProfile } from "@/hooks/useMyPage";
import { useToast } from "@/hooks/useToast";
import type { CreateGroupRequest } from "@/apis/group";
import type { GroupTab } from "@/types/group";
import { parseSeoulDate, getSeoulToday } from "@/utils/date";
import { toGroupErrorMessage } from "@/utils/groupError";
import { copyText } from "@/utils/share";

type OpenSheet = "groups" | "create" | "settings" | null;

/** 연·월을 한 달 옮긴다. 12월 → 1월 처럼 해가 바뀌는 경우를 함께 처리한다 */
function shiftMonth(year: number, month: number, delta: number) {
  const shifted = new Date(year, month - 1 + delta, 1);

  return { year: shifted.getFullYear(), month: shifted.getMonth() + 1 };
}

function GroupPage() {
  const toast = useToast();
  const seoulToday = getSeoulToday();
  const [view, setView] = useState({ year: seoulToday.year, month: seoulToday.month });

  // 캘린더는 내 기록을 그대로 쓴다. 팀원별 기록 API 는 아직 없다
  const { data: profile } = useMyProfile();
  const joinedAt = parseSeoulDate(profile?.createdAt);
  const isJoinedMonth =
    joinedAt !== null && view.year === joinedAt.year && view.month === joinedAt.month;
  const isCurrentMonth = view.year === seoulToday.year && view.month === seoulToday.month;
  const { activity } = useMonthlyActivity(view.year, view.month, joinedAt);
  const mutations = useGroupMutations();

  const groupsQuery = useMyGroups();
  const groups = groupsQuery.data;

  const [currentGroupId, setCurrentGroupId] = useState<number | null>(null);
  const [tab, setTab] = useState<GroupTab>("month");
  const [openSheet, setOpenSheet] = useState<OpenSheet>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState<number | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);

  useEffect(() => {
    // 목록을 다시 받아오는 중에는 방금 만들거나 고른 그룹이 아직 안 보일 수 있다.
    // 그때 되돌리면 남이 만든 그룹으로 튕겨 방장이 아닌 화면이 뜬다
    if (!groups || groupsQuery.isFetching) return;
    if (groups.some((group) => group.id === currentGroupId)) return;

    setCurrentGroupId(groups[0]?.id ?? null);
  }, [groups, currentGroupId, groupsQuery.isFetching]);

  const { group, isPending: isMemberPending } = useSelectedGroup(groups, currentGroupId);

  useEffect(() => {
    if (!group) return;
    if (group.members.some((member) => member.id === selectedMemberId)) return;

    setSelectedMemberId(group.members[0]?.id ?? null);
  }, [group, selectedMemberId]);

  const inviteLinkQuery = useGroupInviteLink(
    currentGroupId,
    openSheet === "settings" && Boolean(group?.isOwner),
  );

  const selectedMember = group?.members.find((member) => member.id === selectedMemberId);

  const closeSheet = () => setOpenSheet(null);

  const openGroup = (groupId: number) => {
    setCurrentGroupId(groupId);
    setSelectedMemberId(null);
    setTab("month");
    closeSheet();
  };

  const copyInviteLink = async (link: string) => {
    toast.show((await copyText(link)) ? GROUP_TOAST.linkCopied : GROUP_TOAST.copyFailed);
  };

  const submitCreate = (payload: CreateGroupRequest) => {
    setCreateError(null);
    mutations.create.mutate(payload, {
      onSuccess: (created) => {
        setCurrentGroupId(created.id);
        setSelectedMemberId(null);
        setTab("month");
        closeSheet();
        toast.show(GROUP_TOAST.created(created.name));
      },
      onError: (error) => setCreateError(toGroupErrorMessage(error)),
    });
  };

  const confirmDelete = () => {
    if (!group) return;

    const removedName = group.name;
    mutations.remove.mutate(group.id, {
      onSuccess: () => {
        setIsDeleteOpen(false);
        closeSheet();
        toast.show(GROUP_TOAST.deleted(removedName));
      },
      onError: (error) => {
        setIsDeleteOpen(false);
        toast.show(toGroupErrorMessage(error));
      },
    });
  };

  if (groupsQuery.isPending) {
    return (
      <div className="flex h-full flex-col gap-4">
        <MascotSpeech message={GROUP_MASCOT_MESSAGES.loading} />
        <div className="flex min-h-0 flex-1 items-center justify-center">
          <LoaderCircle size={24} aria-hidden className="text-brand-teal-strong animate-spin" />
        </div>
      </div>
    );
  }

  if (groupsQuery.isError) {
    return (
      <div className="flex h-full flex-col gap-4">
        <MascotSpeech message={GROUP_MASCOT_MESSAGES.error} />
        <div
          role="alert"
          className="flex min-h-0 flex-1 flex-col items-center justify-center gap-4 px-3"
        >
          <TriangleAlert size={56} aria-hidden className="text-feedback-error" />
          <h2 className="text-text-primary text-title font-bold">{GROUP_ERROR.title}</h2>
          <p className="text-text-secondary text-body text-center leading-normal">
            {GROUP_ERROR.description}
          </p>
          <Button type="button" onClick={() => void groupsQuery.refetch()} className="w-full">
            {GROUP_ERROR.retryLabel}
          </Button>
        </div>
      </div>
    );
  }

  const hasGroup = (groups?.length ?? 0) > 0;

  // 1등을 보고 있으면 그룹 전체 멘트, 다른 팀원을 고르면 그 사람 멘트로 바뀐다
  const isFirstMemberSelected = selectedMemberId === group?.members[0]?.id;
  const message = !hasGroup
    ? GROUP_MASCOT_MESSAGES.empty
    : !group
      ? GROUP_MASCOT_MESSAGES.loading
      : tab === "today"
        ? GROUP_MASCOT_MESSAGES.today
        : isFirstMemberSelected || !selectedMember
          ? GROUP_MASCOT_MESSAGES.month(group.name)
          : GROUP_MASCOT_MESSAGES.memberSelected(selectedMember.name);

  return (
    <>
      <div className={`flex flex-col gap-4 ${hasGroup ? "" : "h-full"}`}>
        <MascotSpeech message={message} />

        {!hasGroup && <GroupEmptyState onCreate={() => setOpenSheet("create")} />}

        {hasGroup && group && (
          <>
            <GroupBar
              groupName={group.name}
              tab={tab}
              onTabChange={setTab}
              onOpenGroups={() => setOpenSheet("groups")}
              onOpenSettings={() => setOpenSheet("settings")}
              canManage={group.isOwner}
            />

            {tab === "month" ? (
              <>
                <RankStrip
                  members={group.members}
                  selectedMemberId={selectedMemberId ?? 0}
                  onSelect={setSelectedMemberId}
                  isRanked
                />
                {activity && (
                  <ActivityCalendar
                    activity={activity}
                    onPrevMonth={() =>
                      setView((current) => shiftMonth(current.year, current.month, -1))
                    }
                    onNextMonth={() =>
                      setView((current) => shiftMonth(current.year, current.month, 1))
                    }
                    canGoPrev={!isJoinedMonth}
                    canGoNext={!isCurrentMonth}
                    variant="group"
                  />
                )}
              </>
            ) : (
              /* 오늘 리포트 API 는 아직 없어 자리만 잡아 둔다 */
              <PendingPanel title={GROUP_PENDING.todayReport} />
            )}
          </>
        )}

        {hasGroup && !group && isMemberPending && (
          <div className="flex min-h-40 items-center justify-center">
            <LoaderCircle size={24} aria-hidden className="text-brand-teal-strong animate-spin" />
          </div>
        )}
      </div>

      <GroupSwitchSheet
        open={openSheet === "groups"}
        groups={groups ?? []}
        currentGroupId={currentGroupId ?? 0}
        onClose={closeSheet}
        onSelect={openGroup}
        onCreate={() => setOpenSheet("create")}
      />

      <GroupCreateSheet
        open={openSheet === "create"}
        isSubmitting={mutations.create.isPending}
        errorMessage={createError}
        onClose={closeSheet}
        onSubmit={submitCreate}
      />

      {group?.isOwner && (
        <GroupSettingsSheet
          open={openSheet === "settings"}
          group={group}
          isInviteLinkPending={inviteLinkQuery.isPending}
          onClose={closeSheet}
          onCopyLink={() => {
            const link = inviteLinkQuery.data?.inviteLink;
            // 링크를 못 받았으면 조용히 넘기지 말고 이유를 알려 준다
            if (link) void copyInviteLink(link);
            else toast.show(toGroupErrorMessage(inviteLinkQuery.error));
          }}
          onDelete={() => setIsDeleteOpen(true)}
        />
      )}

      {group && (
        <GroupDeleteDialog
          open={isDeleteOpen}
          groupName={group.name}
          onClose={() => setIsDeleteOpen(false)}
          onConfirm={confirmDelete}
        />
      )}

      <ToastHost message={toast.message} />
    </>
  );
}

/** 서버 API 를 기다리는 영역 */
function PendingPanel({ title }: { title: string }) {
  return (
    <div className="border-border-default rounded-input flex flex-col items-center gap-2 border border-dashed px-5 py-10">
      <CalendarClock size={32} aria-hidden className="text-brand-mint" />
      <p className="text-text-primary text-body-small font-semibold">{title}</p>
    </div>
  );
}

export default GroupPage;
