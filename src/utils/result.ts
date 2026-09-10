/** 초를 `m:ss` 로 표시한다. 예: 60 → "1:00" */
export function formatDurationClock(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

/** 초를 문장용으로 표시한다. 예: 60 → "1분", 70 → "1분 10초", 45 → "45초" */
export function formatDurationText(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  if (minutes === 0) return `${seconds}초`;
  return seconds === 0 ? `${minutes}분` : `${minutes}분 ${seconds}초`;
}
