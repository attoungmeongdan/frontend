import { useEffect, useState } from "react";
import { CalendarClock, LoaderCircle, TriangleAlert } from "lucide-react";
import ActivityCalendar from "@/components/calendar/ActivityCalendar";
import TodayReport from "@/components/group/TodayReport";
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
  useGroupDailyWorkout,
  useGroupInviteLink,
  useGroupMonthlyWorkout,
  useGroupMutations,
  useMyGroups,
  useSelectedGroup,
} from "@/hooks/useGroups";
import { useToast } from "@/hooks/useToast";
import type { CreateGroupRequest } from "@/apis/group";
import type { GroupTab } from "@/types/group";
import { getSeoulToday } from "@/utils/date";
import { toGroupErrorMessage } from "@/utils/groupError";
import { toMemberActivity, toRankedMembers, toReportSections } from "@/utils/groupWorkout";
import { copyText } from "@/utils/share";

type OpenSheet = "groups" | "create" | "settings" | null;

const WEEKDAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"] as const;

const pad = (value: number) => String(value).padStart(2, "0");

/** "9월 12일 (금) · 오늘" */
function formatTodayLabel({ year, month, date }: ReturnType<typeof getSeoulToday>) {
  const weekday = WEEKDAY_LABELS[new Date(year, month - 1, date).getDay()];

  return `${month}월 ${date}일 (${weekday}) · 오늘`;
}

/** 연·월을 한 달 옮긴다. 12월 → 1월 처럼 해가 바뀌는 경우를 함께 처리한다 */
function shiftMonth(year: number, month: number, delta: number) {
  const shifted = new Date(year, month - 1 + delta, 1);

  return { year: shifted.getFullYear(), month: shifted.getMonth() + 1 };
}

function GroupPage() {
  const toast = useToast();
  const seoulToday = getSeoulToday();
  const [view, setView] = useState({ year: seoulToday.year, month: seoulToday.month });

  const isCurrentMonth = view.year === seoulToday.year && view.month === seoulToday.month;
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

  // 오늘 탭은 그날 기록, 이번 달 탭은 순위를 위해 한 달 누적을 본다. 보고 있는 탭만 부른다
  const monthKey = `${view.year}-${pad(view.month)}`;
  // 오늘·이번 달은 서버 기본값이라 파라미터를 비워 보낸다
  const dailyQuery = useGroupDailyWorkout(currentGroupId, undefined, tab === "today");
  const monthlyQuery = useGroupMonthlyWorkout(
    currentGroupId,
    isCurrentMonth ? undefined : monthKey,
    tab === "month",
  );

  const inviteLinkQuery = useGroupInviteLink(
    currentGroupId,
    openSheet === "settings" && Boolean(group?.isOwner),
  );

  const monthly = monthlyQuery.data;
  const rankedMembers = monthly ? toRankedMembers(monthly.members) : (group?.members ?? []);
  // 아직 아무도 안 골랐거나 고른 사람이 목록에 없으면 1등을 본다.
  // 이 자리를 비워 두면 캘린더가 조용히 사라진다
  const activeMemberId =
    rankedMembers.find((member) => member.id === selectedMemberId)?.id ?? rankedMembers[0]?.id;
  const selectedMember = rankedMembers.find((member) => member.id === activeMemberId);

  // 선택한 팀원의 일별 기록으로 캘린더를 그린다. 별도 요청 없이 월별 응답에 들어 있다
  const selectedSummary =
    monthly?.members.find((member) => member.userId === activeMemberId) ?? monthly?.members[0];
  const memberActivity =
    monthly && selectedSummary
      ? toMemberActivity(
          selectedSummary,
          view.year,
          view.month,
          monthly.daysInMonth,
          isCurrentMonth ? seoulToday.date : null,
        )
      : null;

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
  const isFirstMemberSelected = activeMemberId === rankedMembers[0]?.id;
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
                  members={rankedMembers}
                  selectedMemberId={activeMemberId ?? 0}
                  onSelect={setSelectedMemberId}
                  isRanked={Boolean(monthly)}
                />
                {memberActivity && (
                  <ActivityCalendar
                    activity={memberActivity}
                    onPrevMonth={() =>
                      setView((current) => shiftMonth(current.year, current.month, -1))
                    }
                    onNextMonth={() =>
                      setView((current) => shiftMonth(current.year, current.month, 1))
                    }
                    canGoPrev
                    canGoNext={!isCurrentMonth}
                    variant="group"
                  />
                )}
                {!memberActivity && monthlyQuery.isPending && <InlineSpinner />}
                {!memberActivity && !monthlyQuery.isPending && (
                  <PendingPanel title={GROUP_PENDING.calendar} />
                )}
              </>
            ) : dailyQuery.data ? (
              <TodayReport
                dateLabel={formatTodayLabel(seoulToday)}
                sections={toReportSections(dailyQuery.data.exercises)}
              />
            ) : dailyQuery.isError ? (
              <PendingPanel title={GROUP_PENDING.todayReport} />
            ) : (
              <div className="flex min-h-40 items-center justify-center">
                <LoaderCircle
                  size={24}
                  aria-hidden
                  className="text-brand-teal-strong animate-spin"
                />
              </div>
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

/** 본문 안에서 잠깐 기다릴 때 */
function InlineSpinner() {
  return (
    <div className="flex min-h-40 items-center justify-center">
      <LoaderCircle size={24} aria-hidden className="text-brand-teal-strong animate-spin" />
    </div>
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
