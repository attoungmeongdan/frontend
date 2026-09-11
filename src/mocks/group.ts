import type { Group, TodayReportSection } from "@/types/group";
import type { MonthlyActivity } from "@/types/calendar";
import { getSeoulToday } from "@/utils/date";

export const GROUP_MOCK: Group = {
  id: 1,
  name: "아뚱멍단",
  inviteCode: "K7X2PD",
  isOwner: true,
  members: [
    { id: 1, name: "재인", initial: "재", monthlyPercent: 73 },
    { id: 2, name: "수연", initial: "수", monthlyPercent: 61 },
    { id: 3, name: "동국", initial: "동", monthlyPercent: 48 },
    { id: 4, name: "나윤", initial: "나", monthlyPercent: 44 },
    { id: 5, name: "동균", initial: "동", monthlyPercent: 22 },
  ],
};

export const GROUPS_MOCK: Group[] = [
  GROUP_MOCK,
  {
    id: 2,
    name: "러닝 크루",
    inviteCode: "R3N9QT",
    isOwner: false,
    members: [
      { id: 1, name: "재인", initial: "재", monthlyPercent: 66 },
      { id: 6, name: "지호", initial: "지", monthlyPercent: 52 },
      { id: 7, name: "민서", initial: "민", monthlyPercent: 31 },
    ],
  },
  {
    id: 3,
    name: "가족",
    inviteCode: "F2M8LK",
    isOwner: true,
    members: [
      { id: 8, name: "엄마", initial: "엄", monthlyPercent: 58 },
      { id: 9, name: "아빠", initial: "아", monthlyPercent: 40 },
    ],
  },
];

export const TODAY_REPORT_MOCK: TodayReportSection[] = [
  {
    exercise: "plank",
    rows: [
      { memberId: 1, name: "재인", value: 62 },
      { memberId: 4, name: "나윤", value: 45 },
      { memberId: 2, name: "수연", value: 30 },
    ],
  },
  {
    exercise: "sit-up",
    rows: [
      { memberId: 4, name: "나윤", value: 15 },
      { memberId: 1, name: "재인", value: 9 },
      { memberId: 2, name: "수연", value: 9 },
    ],
  },
  {
    exercise: "chair-stand",
    rows: [
      { memberId: 1, name: "재인", value: 10 },
      { memberId: 2, name: "수연", value: 5 },
      { memberId: 4, name: "나윤", value: 3 },
    ],
  },
  {
    exercise: "push-up",
    rows: [
      { memberId: 2, name: "수연", value: 12 },
      { memberId: 1, name: "재인", value: 8 },
      { memberId: 4, name: "나윤", value: 0 },
    ],
  },
];

/** 팀원·달마다 같은 값이 나오도록 섞는다. 목데이터라 규칙만 있으면 된다 */
function pseudoRandom(seed: number) {
  const value = Math.sin(seed) * 10_000;

  return value - Math.floor(value);
}

/**
 * 팀원 한 명의 월간 기록을 만든다.
 * 실행률이 높은 팀원일수록 운동한 날이 많이 나오도록 monthlyPercent 를 확률로 쓴다.
 */
export function buildMemberActivity(
  memberId: number,
  year: number,
  month: number,
): MonthlyActivity {
  const member = GROUP_MOCK.members.find((item) => item.id === memberId);
  const percent = member?.monthlyPercent ?? 50;

  const seoulToday = getSeoulToday();
  const isCurrentMonth = year === seoulToday.year && month === seoulToday.month;
  const daysInMonth = new Date(year, month, 0).getDate();
  const lastDay = isCurrentMonth ? seoulToday.date : daysInMonth;

  const exercisedDays = [];
  for (let day = 1; day <= lastDay; day += 1) {
    const roll = pseudoRandom(memberId * 1_000 + year * 12 + month + day);
    if (roll * 100 >= percent) continue;

    exercisedDays.push({
      day,
      // 1~4종목. 실행률이 높을수록 종목도 조금 더 많이 잡힌다
      count: 1 + Math.floor(pseudoRandom(day * 7 + memberId) * 4),
      measurementId: null,
    });
  }

  return {
    year,
    month,
    today: isCurrentMonth ? seoulToday.date : null,
    // 팀원 가입일은 그룹 API 가 내려주기 전까지 알 수 없어 회색 처리를 하지 않는다
    joinedDay: null,
    totalTargetDays: lastDay,
    exercisedDays,
  };
}
