const SEOUL_TIME_ZONE = "Asia/Seoul";

export interface SeoulDate {
  year: number;
  month: number;
  date: number;
}

export interface SeoulDay extends SeoulDate {
  iso: string;
  weekday: number;
}

function toSeoulDate(instant: Date): SeoulDate {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: SEOUL_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(instant);

  const findPart = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value);

  return {
    year: findPart("year"),
    month: findPart("month"),
    date: findPart("day"),
  };
}

export function getSeoulToday(): SeoulDate {
  return toSeoulDate(new Date());
}

/**
 * 서버 일시 문자열을 KST 날짜로 바꾼다.
 * "2026-08-25" 나 "2026-08-25T10:00:00" 처럼 시간대가 없으면 KST 로 보고 날짜 부분만 쓴다.
 * "…Z" 나 "+09:00" 처럼 시간대가 있으면 KST 로 환산한다. 파싱할 수 없으면 null
 */
export function parseSeoulDate(value: string | null | undefined): SeoulDate | null {
  if (!value) return null;

  const hasZone = /(Z|[+-]\d{2}:?\d{2})$/.test(value);
  if (!hasZone) {
    const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
    if (!match) return null;

    return { year: Number(match[1]), month: Number(match[2]), date: Number(match[3]) };
  }

  const instant = new Date(value);
  if (Number.isNaN(instant.getTime())) return null;

  return toSeoulDate(instant);
}

export function getRecentSeoulDays(count: number): SeoulDay[] {
  const today = getSeoulToday();
  const base = Date.UTC(today.year, today.month - 1, today.date);

  return Array.from({ length: count }, (_, index) => {
    const day = new Date(base);
    day.setUTCDate(day.getUTCDate() - (count - 1 - index));

    return {
      year: day.getUTCFullYear(),
      month: day.getUTCMonth() + 1,
      date: day.getUTCDate(),
      iso: day.toISOString().slice(0, 10),
      weekday: day.getUTCDay(),
    };
  });
}
