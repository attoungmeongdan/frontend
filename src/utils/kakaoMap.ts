const SDK_SCRIPT_ID = "kakao-map-sdk";

/**
 * 로드 결과를 캐싱한다.
 * StrictMode 처럼 초기화가 여러 번 호출돼도 스크립트를 한 번만 넣고 같은 Promise 를 공유한다.
 */
let sdkPromise: Promise<typeof kakao> | null = null;

function injectSdk(): Promise<typeof kakao> {
  const appKey = import.meta.env.VITE_KAKAO_MAP_KEY;

  if (!appKey) {
    return Promise.reject(new Error("VITE_KAKAO_MAP_KEY 가 설정되지 않았습니다."));
  }

  return new Promise((resolve, reject) => {
    const handleLoad = () => {
      if (!window.kakao) {
        reject(new Error("카카오맵 SDK 를 초기화하지 못했습니다."));
        return;
      }

      window.kakao.maps.load(() => resolve(window.kakao!));
    };

    // load / error 는 지나가면 끝인 이벤트라 나중에 리스너를 붙여도 잡지 못한다.
    // 이미 끝난 결과는 이벤트 대신 window.kakao 로 확인한다
    if (window.kakao) {
      handleLoad();
      return;
    }

    // 남아 있는 스크립트는 직전 시도가 실패했다는 뜻이다.
    // 재사용하면 이벤트가 다시 오지 않아 Promise 가 끝나지 않으므로 버리고 새로 넣는다
    document.getElementById(SDK_SCRIPT_ID)?.remove();

    const script = document.createElement("script");
    script.id = SDK_SCRIPT_ID;
    script.async = true;
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${appKey}&libraries=clusterer&autoload=false`;
    script.addEventListener("load", handleLoad, { once: true });
    script.addEventListener(
      "error",
      () => reject(new Error("카카오맵 SDK 를 불러오지 못했습니다.")),
      {
        once: true,
      },
    );

    document.head.appendChild(script);
  });
}

/** 카카오맵 SDK 를 한 번만 로드한다. autoload=false 라 kakao.maps.load 이후에 API 를 쓴다 */
export function loadKakaoMapSdk(): Promise<typeof kakao> {
  sdkPromise ??= injectSdk().catch((error: unknown) => {
    // 실패한 결과를 캐싱하면 재시도가 막히므로 비운다
    sdkPromise = null;
    throw error;
  });

  return sdkPromise;
}
