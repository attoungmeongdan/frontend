const SEOUL_TIME_ZONE = "Asia/Seoul";

export interface SeoulDate {
  year: number;
  /** 1-12 */
  month: number;
  /** 1-31 */
  date: number;
}

/**
 * 한국 표준시(KST) 기준 오늘 날짜.
 * 기기 타임존을 따르는 Date#getDate 대신 서울 시간대로 고정한다.
 */
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
