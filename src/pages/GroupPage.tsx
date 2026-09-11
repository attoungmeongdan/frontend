import { useMemo, useState } from "react";
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
import TodayReport from "@/components/group/TodayReport";
import { GROUP_MASCOT_MESSAGES, GROUP_TOAST, INVITE_LINK_HOST } from "@/constants/group";
import { useToast } from "@/hooks/useToast";
import { buildMemberActivity, GROUPS_MOCK, TODAY_REPORT_MOCK } from "@/mocks/group";
import type { Group, GroupTab } from "@/types/group";
import { getSeoulToday } from "@/utils/date";
import { copyText, shareText } from "@/utils/share";

type OpenSheet = "groups" | "create" | "settings" | null;

const WEEKDAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"] as const;

const RESERVED_INVITE_CODE = "K7X2PD";

function formatTodayLabel({ year, month, date }: ReturnType<typeof getSeoulToday>) {
  const weekday = WEEKDAY_LABELS[new Date(year, month - 1, date).getDay()];

  return `${month}월 ${date}일 (${weekday}) · 오늘`;
}

function shiftMonth(year: number, month: number, delta: number) {
  const shifted = new Date(year, month - 1 + delta, 1);

  return { year: shifted.getFullYear(), month: shifted.getMonth() + 1 };
}

function inviteLink(inviteCode: string) {
  return `https://${INVITE_LINK_HOST}/${inviteCode}`;
}

function GroupPage() {
  const seoulToday = getSeoulToday();
  const toast = useToast();

  const [groups, setGroups] = useState<Group[]>(GROUPS_MOCK);
  const [currentGroupId, setCurrentGroupId] = useState(GROUPS_MOCK[0]?.id ?? 0);

  const [tab, setTab] = useState<GroupTab>("month");
  const [view, setView] = useState({ year: seoulToday.year, month: seoulToday.month });
  const [openSheet, setOpenSheet] = useState<OpenSheet>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState(GROUPS_MOCK[0]?.members[0]?.id ?? 0);

  const group = groups.find((item) => item.id === currentGroupId) ?? null;
  const isCurrentMonth = view.year === seoulToday.year && view.month === seoulToday.month;
  const selectedMember = group?.members.find((member) => member.id === selectedMemberId);

  const activity = useMemo(
    () => buildMemberActivity(selectedMemberId, view.year, view.month),
    [selectedMemberId, view.year, view.month],
  );

  const closeSheet = () => setOpenSheet(null);

  const openGroup = (groupId: number) => {
    const next = groups.find((item) => item.id === groupId);
    setCurrentGroupId(groupId);
    setSelectedMemberId(next?.members[0]?.id ?? 0);
    setTab("month");
    closeSheet();
  };

  const copyInviteLink = async (inviteCode: string) => {
    const isCopied = await copyText(inviteLink(inviteCode));
    toast.show(isCopied ? GROUP_TOAST.linkCopied : GROUP_TOAST.copyFailed);
  };

  const shareInviteLink = async (inviteCode: string) => {
    const result = await shareText(inviteLink(inviteCode));
    if (result === "copied") toast.show(GROUP_TOAST.linkCopied);
    if (result === "failed") toast.show(GROUP_TOAST.copyFailed);
  };

  const createGroup = (name: string) => {
    const created: Group = {
      id: Date.now(),
      name,
      inviteCode: RESERVED_INVITE_CODE,
      isOwner: true,
      members: [{ id: 1, name: "나", initial: "나", monthlyPercent: 0 }],
    };

    setGroups((current) => [created, ...current]);
    setCurrentGroupId(created.id);
    setSelectedMemberId(created.members[0].id);
    setTab("month");
    closeSheet();
    toast.show(GROUP_TOAST.created(name));
  };

  const deleteGroup = () => {
    if (!group) return;

    const remaining = groups.filter((item) => item.id !== group.id);
    setGroups(remaining);
    setCurrentGroupId(remaining[0]?.id ?? 0);
    setSelectedMemberId(remaining[0]?.members[0]?.id ?? 0);
    setIsDeleteOpen(false);
    closeSheet();
    toast.show(GROUP_TOAST.deleted(group.name));
  };

  const isTopMemberSelected = selectedMemberId === group?.members[0]?.id;
  const message = !group
    ? GROUP_MASCOT_MESSAGES.empty
    : tab === "today"
      ? GROUP_MASCOT_MESSAGES.today
      : isTopMemberSelected || !selectedMember
        ? GROUP_MASCOT_MESSAGES.month(group.name)
        : GROUP_MASCOT_MESSAGES.memberSelected(selectedMember.name);

  return (
    <>
      <div className={`flex flex-col gap-4 ${group ? "" : "h-full"}`}>
        <MascotSpeech message={message} />

        {group ? (
          <>
            <GroupBar
              groupName={group.name}
              tab={tab}
              onTabChange={setTab}
              onOpenGroups={() => setOpenSheet("groups")}
              onOpenSettings={() => setOpenSheet("settings")}
              canManage={group.isOwner}
            />

            {tab === "today" ? (
              <TodayReport dateLabel={formatTodayLabel(seoulToday)} sections={TODAY_REPORT_MOCK} />
            ) : (
              <>
                <RankStrip
                  members={group.members}
                  selectedMemberId={selectedMemberId}
                  onSelect={setSelectedMemberId}
                />
                <ActivityCalendar
                  activity={activity}
                  onPrevMonth={() =>
                    setView((current) => shiftMonth(current.year, current.month, -1))
                  }
                  onNextMonth={() =>
                    setView((current) => shiftMonth(current.year, current.month, 1))
                  }
                  canGoPrev
                  canGoNext={!isCurrentMonth}
                />
              </>
            )}
          </>
        ) : (
          <GroupEmptyState onCreate={() => setOpenSheet("create")} />
        )}
      </div>

      <GroupSwitchSheet
        open={openSheet === "groups"}
        groups={groups}
        currentGroupId={currentGroupId}
        onClose={closeSheet}
        onSelect={openGroup}
        onCreate={() => setOpenSheet("create")}
      />

      <GroupCreateSheet
        open={openSheet === "create"}
        inviteCode={RESERVED_INVITE_CODE}
        onClose={closeSheet}
        onSubmit={createGroup}
        onCopyLink={(code) => void copyInviteLink(code)}
        onShareLink={(code) => void shareInviteLink(code)}
      />

      {group?.isOwner && (
        <GroupSettingsSheet
          open={openSheet === "settings"}
          group={group}
          onClose={closeSheet}
          onCopyLink={() => void copyInviteLink(group.inviteCode)}
          onDelete={() => setIsDeleteOpen(true)}
        />
      )}

      {group && (
        <GroupDeleteDialog
          open={isDeleteOpen}
          groupName={group.name}
          onClose={() => setIsDeleteOpen(false)}
          onConfirm={deleteGroup}
        />
      )}

      <ToastHost message={toast.message} />
    </>
  );
}

export default GroupPage;
