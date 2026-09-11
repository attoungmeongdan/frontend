import type { ExerciseType } from "@/constants/exercises";

export type GroupTab = "today" | "month";

export type GroupStatus = "loading" | "error" | "empty" | "success";

export interface GroupMember {
  id: number;
  name: string;
  initial: string;
  monthlyPercent: number;
}

export interface Group {
  id: number;
  name: string;
  inviteCode: string;
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
