import { useEffect, useRef } from "react";
import {
  countVoiceSources,
  MAX_TIME_SECONDS,
  TIME_STEP_SECONDS,
  timeVoiceSource,
  VOICE_CLIPS,
} from "@/constants/voice";
import { playVoice, prefetchVoices, stopVoice } from "@/utils/voice";

/** 운동 화면에 들어오면 음성을 미리 받고, 화면을 벗어나면 재생을 끊는다 */
function useVoiceLifecycle() {
  useEffect(() => {
    prefetchVoices();

    return stopVoice;
  }, []);
}

export function useCountVoice(count: number | null | undefined, enabled: boolean) {
  const spokenRef = useRef(0);

  useVoiceLifecycle();

  useEffect(() => {
    if (!enabled) {
      spokenRef.current = 0;
      return;
    }

    const current = count ?? 0;

    if (current <= spokenRef.current) {
      spokenRef.current = current;
      return;
    }

    spokenRef.current = current;
    playVoice(countVoiceSources(current));
  }, [count, enabled]);
}

export function useDurationVoice(durationMs: number | null | undefined, enabled: boolean) {
  const spokenRef = useRef(0);

  useVoiceLifecycle();

  useEffect(() => {
    if (!enabled) {
      spokenRef.current = 0;
      return;
    }

    const seconds = Math.floor((durationMs ?? 0) / 1_000);
    const milestone = Math.min(
      Math.floor(seconds / TIME_STEP_SECONDS) * TIME_STEP_SECONDS,
      MAX_TIME_SECONDS,
    );

    if (milestone <= spokenRef.current) {
      spokenRef.current = milestone;
      return;
    }

    spokenRef.current = milestone;
    playVoice(timeVoiceSource(milestone));
  }, [durationMs, enabled]);
}

/** 몸이 잠깐 가려졌을 뿐인데 바로 말하면 시끄럽다. 이만큼 계속 안 잡혀야 안내한다 */
const BODY_GUIDE_DELAY_MS = 1_500;

/** 계속 안 잡히면 이 간격으로 다시 안내한다 */
const BODY_GUIDE_REPEAT_MS = 10_000;

/**
 * 몸이 화면에 다 안 들어올 때 "화면에 전신이 들어오게 해주세요" 를 읽어 준다.
 * 화면의 경고 문구와 같은 조건이라, 눈으로 보는 안내와 귀로 듣는 안내가 어긋나지 않는다.
 */
export function useBodyGuideVoice(isBodyMissing: boolean, enabled: boolean) {
  useVoiceLifecycle();

  useEffect(() => {
    if (!enabled || !isBodyMissing) return;

    let timer = 0;

    const speak = () => {
      playVoice(VOICE_CLIPS.guideFullBody);
      timer = window.setTimeout(speak, BODY_GUIDE_REPEAT_MS);
    };

    timer = window.setTimeout(speak, BODY_GUIDE_DELAY_MS);

    // 몸이 다시 잡히면 예약된 안내를 취소한다
    return () => window.clearTimeout(timer);
  }, [isBodyMissing, enabled]);
}
