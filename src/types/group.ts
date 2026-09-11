import type { ExerciseType } from "@/constants/exercises";

export type GroupTab = "today" | "month";

export interface GroupMember {
  id: number;
  name: string;
  initial: string;
  isOwner: boolean;
}

export interface Group {
  id: number;
  name: string;
  penalty: string;
  maxMemberCount: number;
  currentMemberCount: number;
  ownerId: number;
  isOwner: boolean;
  members: GroupMember[];
}

export interface TodayReportRow {
  memberId: number;
  name: string;
  value: number;
}

export interface TodayReportSection {
  exercise: ExerciseType;
  rows: TodayReportRow[];
}
