// tts
const VOICE_BASE = "/voice";

function countFile(value: number) {
  return `${VOICE_BASE}/count-${value}.m4a`;
}

export const MAX_COUNT = 100;

export function countVoiceSources(count: number): string[] {
  if (!Number.isInteger(count) || count < 1 || count > MAX_COUNT) return [];

  const ones = count % 10;

  return [countFile(ones === 0 ? count : ones)];
}

/** 플랭크 안내 간격(초). 30초마다 "30초 / 1분 / 1분 30초…" 를 읽어 준다 */
export const TIME_STEP_SECONDS = 30;

/** 녹음이 5분까지라 그 뒤로는 안내 X */
export const MAX_TIME_SECONDS = 300;

export function timeVoiceSource(seconds: number): string[] {
  if (seconds < TIME_STEP_SECONDS || seconds > MAX_TIME_SECONDS) return [];
  if (seconds % TIME_STEP_SECONDS !== 0) return [];

  return [`${VOICE_BASE}/time-${seconds}.m4a`];
}

export const VOICE_CLIPS = {
  cheerAja: [`${VOICE_BASE}/cheer-aja.m4a`],
  cheerFighting: [`${VOICE_BASE}/cheer-fighting.m4a`],
  guideFullBody: [`${VOICE_BASE}/guide-full-body.m4a`],
} as const;

/* 미리 받아 둘 파일 */
export function allVoiceSources(): string[] {
  const counts = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
  const times = [30, 60, 90, 120, 150, 180, 210, 240, 270, 300];

  return [
    ...counts.map(countFile),
    ...times.map((seconds) => `${VOICE_BASE}/time-${seconds}.m4a`),
    ...Object.values(VOICE_CLIPS).flat(),
  ];
}
