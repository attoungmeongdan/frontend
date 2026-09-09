import { useCallback } from "react";

const POSTCODE_SCRIPT_SRC = "https://t1.kakaocdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js";

export interface KakaoPostcodeData {
  zonecode: string;
  address: string;
  roadAddress: string;
  jibunAddress: string;
  userSelectedType: "R" | "J";
  buildingName?: string;
}

declare global {
  interface Window {
    // 카카오 지도 SDK도 window.kakao 를 쓰므로 Postcode 만 optional 로 선언해 병합되게 둔다
    kakao?: {
      Postcode?: new (options: { oncomplete: (data: KakaoPostcodeData) => void }) => {
        open: () => void;
      };
    };
  }
}

function loadPostcodeScript() {
  return new Promise<void>((resolve, reject) => {
    if (window.kakao?.Postcode) {
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

// 카카오 우편번호 서비스 팝업. 스크립트는 처음 열 때 한 번만 주입한다.
// https://postcode.map.kakao.com/guide
export function useKakaoPostcode() {
  return useCallback(async (onComplete: (address: string) => void) => {
    await loadPostcodeScript();

    const Postcode = window.kakao?.Postcode;

    if (!Postcode) {
      throw new Error("우편번호 검색을 사용할 수 없어요.");
    }

    new Postcode({
      oncomplete: (data) => {
        onComplete(data.userSelectedType === "R" ? data.roadAddress : data.jibunAddress);
      },
    }).open();
  }, []);
}
