import { useCallback } from "react";

const POSTCODE_SCRIPT_SRC = "https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js";

export interface DaumPostcodeData {
  roadAddress: string;
  jibunAddress: string;
  userSelectedType: "R" | "J";
}

declare global {
  interface Window {
    daum?: {
      Postcode: new (options: { oncomplete: (data: DaumPostcodeData) => void }) => {
        open: () => void;
      };
    };
  }
}

function loadPostcodeScript() {
  return new Promise<void>((resolve, reject) => {
    if (window.daum?.Postcode) {
      resolve();
      return;
    }

    const fail = () => reject(new Error("우편번호 스크립트를 불러오지 못했어요."));
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${POSTCODE_SCRIPT_SRC}"]`,
    );

    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", fail);
      return;
    }

    const script = document.createElement("script");
    script.src = POSTCODE_SCRIPT_SRC;
    script.async = true;
    script.addEventListener("load", () => resolve());
    script.addEventListener("error", fail);
    document.body.appendChild(script);
  });
}

// 다음 우편번호 검색 팝업. 스크립트는 처음 열 때 한 번만 주입한다.
export function useDaumPostcode() {
  return useCallback(async (onComplete: (address: string) => void) => {
    await loadPostcodeScript();

    if (!window.daum?.Postcode) {
      throw new Error("우편번호 검색을 사용할 수 없어요.");
    }

    new window.daum.Postcode({
      oncomplete: (data) => {
        onComplete(data.userSelectedType === "R" ? data.roadAddress : data.jibunAddress);
      },
    }).open();
  }, []);
}
