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

    const existing = document.getElementById(SDK_SCRIPT_ID) as HTMLScriptElement | null;

    if (existing) {
      // 이미 삽입돼 있어도 로드가 끝났다는 보장은 없으므로 이벤트를 기다린다
      existing.addEventListener("load", handleLoad, { once: true });
      existing.addEventListener(
        "error",
        () => reject(new Error("카카오맵 SDK 를 불러오지 못했습니다.")),
        {
          once: true,
        },
      );
      return;
    }

    const script = document.createElement("script");
    script.id = SDK_SCRIPT_ID;
    script.async = true;
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${appKey}&libraries=services&autoload=false`;
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

/** 주소를 좌표로 변환한다. 결과가 없으면 실패로 처리한다 */
export function geocodeAddress(sdk: typeof kakao, address: string) {
  return new Promise<{ lat: number; lng: number }>((resolve, reject) => {
    const geocoder = new sdk.maps.services.Geocoder();

    geocoder.addressSearch(address, (results, status) => {
      if (status !== sdk.maps.services.Status.OK || results.length === 0) {
        reject(new Error("주소를 좌표로 변환하지 못했습니다."));
        return;
      }

      resolve({ lat: Number(results[0].y), lng: Number(results[0].x) });
    });
  });
}
