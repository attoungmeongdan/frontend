import { allVoiceSources } from "@/constants/voice";

// 음성 재생 엔진.
// element 를 하나만 두고 src 를 갈아끼운다. 숫자 하나가 끝나기 전에 다음 숫자가 오면
// 새 src 가 이전 재생을 그대로 끊어 주므로, 동작보다 뒤처진 숫자가 쌓이지 않는다.
// 실제 발화 파일을 쓰면 로그인처럼 첫 탭 직후 페이지가 이동할 때 pause 전에
// 소리가 새어 나올 수 있다. 네트워크 요청도 만들지 않는 짧은 무음 WAV 로 연다.
const UNLOCK_SOURCE =
  "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQQAAACAgICA";

let element: HTMLAudioElement | null = null;
let playToken = 0;
let isUnlockInstalled = false;
let isPrefetched = false;

function getElement() {
  if (!element) {
    element = new Audio();
    element.preload = "auto";
  }

  return element;
}

/**
 * iOS 는 사용자 제스처 안에서 play() 를 한 번 부르기 전까지 자동 재생을 막는다.
 * 운동 화면은 시작 자세를 자동으로 잡아 탭이 없으므로, 앱을 띄운 뒤 첫 탭에서 미리 열어 둔다.
 */
export function installVoiceUnlock() {
  if (isUnlockInstalled) return;
  isUnlockInstalled = true;

  const unlock = () => {
    const audio = getElement();
    const token = playToken;

    audio.muted = true;
    audio.src = UNLOCK_SOURCE;
    void audio
      .play()
      .then(() => {
        // 여는 사이에 진짜 재생이 시작됐다면 건드리지 않는다
        if (token !== playToken) return;
        audio.pause();
        audio.currentTime = 0;
      })
      .catch(() => {})
      .finally(() => {
        audio.muted = false;
      });
  };

  window.addEventListener("pointerdown", unlock, { once: true });
}

/** 재생 시점에 네트워크를 타면 숫자가 동작보다 늦는다. 운동 화면에 들어올 때 미리 받아 둔다 */
export function prefetchVoices() {
  if (isPrefetched) return;
  isPrefetched = true;

  for (const source of allVoiceSources()) {
    void fetch(source, { cache: "force-cache" }).catch(() => {});
  }
}

/** 여러 파일을 이어서 읽는다. "열하나" 는 열 + 하나 두 파일이다 */
export function playVoice(sources: readonly string[]) {
  if (sources.length === 0) return;

  const audio = getElement();
  const token = ++playToken;
  let index = 0;

  const playNext = () => {
    // 다음 숫자가 이미 재생을 가져갔으면 남은 파일은 버린다
    if (token !== playToken || index >= sources.length) return;

    audio.src = sources[index];
    index += 1;
    void audio.play().catch(() => {});
  };

  audio.onended = playNext;
  playNext();
}

export function stopVoice() {
  playToken += 1;

  if (!element) return;
  element.onended = null;
  element.pause();
}
