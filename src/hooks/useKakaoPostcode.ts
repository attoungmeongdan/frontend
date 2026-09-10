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

// 진행 중인 로딩을 들고 있어서 동시 호출이 스크립트를 중복 주입하지 않게 한다.
// DOM에서 기존 script 를 찾아 리스너를 다시 붙이면, 이미 error 가 끝난 요소에는
// 이벤트가 다시 오지 않아 Promise 가 영영 pending 으로 남는다.
let pendingLoad: Promise<void> | null = null;

function loadPostcodeScript() {
  if (window.kakao?.Postcode) {
    return Promise.resolve();
  }

  if (pendingLoad) {
    return pendingLoad;
  }

  pendingLoad = new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = POSTCODE_SCRIPT_SRC;
    script.async = true;

    script.addEventListener("load", () => resolve());
    script.addEventListener("error", () => {
      // 실패한 요소와 기억을 함께 버려야 다음 호출이 새로 시도할 수 있다
      script.remove();
      pendingLoad = null;
      reject(new Error("우편번호 스크립트를 불러오지 못했어요."));
    });

    document.body.appendChild(script);
  });

  return pendingLoad;
}

// 카카오 우편번호 서비스 팝업. 스크립트는 처음 열 때 한 번만 주입한다.
// https://postcode.map.kakao.com/guide
export function useKakaoPostcode() {
  // 서버가 도로명·지번을 따로 받으므로 선택 결과를 통째로 넘긴다
  return useCallback(async (onComplete: (data: KakaoPostcodeData) => void) => {
    await loadPostcodeScript();

    const Postcode = window.kakao?.Postcode;

    if (!Postcode) {
      throw new Error("우편번호 검색을 사용할 수 없어요.");
    }

    new Postcode({ oncomplete: onComplete }).open();
  }, []);
}

/** 사용자가 고른 주소를 그대로 보여줄 때 사용 */
export function getSelectedAddress(data: KakaoPostcodeData) {
  return data.userSelectedType === "R" ? data.roadAddress : data.jibunAddress;
}
