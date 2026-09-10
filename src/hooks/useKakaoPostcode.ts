import { useCallback } from "react";

const POSTCODE_SCRIPT_SRC = "https://t1.kakaocdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js";

export type KakaoPostcodeData = kakao.PostcodeData;

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

/**
 * 서버에 보낼 도로명·지번 한 쌍.
 * 도로명만 있는 주소는 jibunAddress 가 빈 문자열로 오므로,
 * 우편번호 서비스가 같이 주는 auto* 값으로 메운다. 그래도 비면 null 을 돌려준다.
 */
export function toAddressPayload(data: KakaoPostcodeData) {
  const roadNameAddress = data.roadAddress || data.autoRoadAddress;
  const lotNumberAddress = data.jibunAddress || data.autoJibunAddress;

  if (!roadNameAddress || !lotNumberAddress) {
    return null;
  }

  return { roadNameAddress, lotNumberAddress };
}
