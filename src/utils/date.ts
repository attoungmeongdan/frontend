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

export function getSeoulToday(): SeoulDate {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: SEOUL_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const findPart = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value);

  return {
    year: findPart("year"),
    month: findPart("month"),
    date: findPart("day"),
  };
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
