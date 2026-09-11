import { afterEach, expect, it, vi } from "vitest";
import { installVoiceUnlock } from "@/utils/voice";

class AudioStub {
  static instance: AudioStub | null = null;

  preload = "";
  muted = false;
  src = "";
  currentTime = 0;
  onended: (() => void) | null = null;
  play = vi.fn().mockResolvedValue(undefined);
  pause = vi.fn();

  constructor() {
    AudioStub.instance = this;
  }
}

afterEach(() => {
  vi.unstubAllGlobals();
});

it("unlocks voice with embedded silence instead of a spoken count file", async () => {
  vi.stubGlobal("Audio", AudioStub);

  installVoiceUnlock();
  window.dispatchEvent(new Event("pointerdown"));

  const audio = AudioStub.instance;
  expect(audio).not.toBeNull();
  expect(audio?.src).toMatch(/^data:audio\/wav;base64,/);
  expect(audio?.src).not.toContain("count-1.m4a");
  expect(audio?.play).toHaveBeenCalledOnce();

  await Promise.resolve();
  expect(audio?.pause).toHaveBeenCalledOnce();
  expect(audio?.currentTime).toBe(0);
});
