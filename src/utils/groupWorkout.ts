import {
  isGroupOwner,
  type GroupExerciseBarSection,
  type GroupMonthlyMemberSummary,
  type WorkoutExerciseType,
} from "@/apis/group";
import { EXERCISES, type ExerciseType } from "@/constants/exercises";
import type { MonthlyActivity } from "@/types/calendar";
import type { GroupMember, TodayReportSection } from "@/types/group";

/** 서버 운동 코드를 앱의 운동 타입으로 바꾼다 */
function toExerciseType(type: WorkoutExerciseType): ExerciseType | null {
  return EXERCISES.find((exercise) => exercise.apiType === type)?.type ?? null;
}

/**
 * 일별 응답을 화면이 쓰는 종목별 줄로 바꾼다.
 * 정렬은 서버가 이미 해 주므로 순서를 건드리지 않고, 플랭크만 ms 를 초로 바꾼다.
 */
export function toReportSections(exercises: GroupExerciseBarSection[]): TodayReportSection[] {
  return exercises.flatMap((section) => {
    const exercise = toExerciseType(section.type);
    if (!exercise) return [];

    const isDuration = section.unit === "MS";

    return [
      {
        exercise,
        rows: section.members.map((member) => ({
          memberId: member.userId,
          name: member.nickname,
          value: isDuration ? Math.round(member.value / 1_000) : member.value,
        })),
      },
    ];
  });
}

/** 월별 응답의 멤버 요약을 아바타 목록으로. 서버가 이미 랭킹 순으로 준다 */
export function toRankedMembers(members: GroupMonthlyMemberSummary[]): GroupMember[] {
  return members.map((member) => ({
    id: member.userId,
    name: member.nickname,
    // 닉네임이 비어 오면 아바타 글자가 사라지지 않게 물음표로 대신한다
    initial: member.nickname.trim().slice(0, 1) || "?",
    isOwner: isGroupOwner(member),
  }));
}

/** "2026-09-05" → 5 */
function toDayOfMonth(date: string) {
  return Number(date.slice(8, 10));
}

/**
 * 팀원 한 명의 월간 기록을 캘린더가 읽는 형태로 바꾼다.
 * 그룹 캘린더는 체력 측정 표시를 쓰지 않으므로 measurementId 는 항상 null 이다.
 */
export function toMemberActivity(
  member: GroupMonthlyMemberSummary,
  year: number,
  month: number,
  daysInMonth: number,
  today: number | null,
): MonthlyActivity {
  return {
    year,
    month,
    today,
    // 팀원의 가입일은 알 수 없어 가입 전 회색 처리를 하지 않는다
    joinedDay: null,
    totalTargetDays: daysInMonth,
    exercisedDays: member.days.map((record) => ({
      day: toDayOfMonth(record.date),
      count: record.exerciseTypeCount,
      measurementId: null,
    })),
  };
}
