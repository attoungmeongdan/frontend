// 카카오맵 JS SDK 중 이 프로젝트에서 쓰는 API만 선언한다.
// 공식 타입 패키지가 없어 필요한 만큼만 정의한다.

declare namespace kakao {
  /** 다음 우편번호 서비스가 돌려주는 주소 데이터 */
  interface PostcodeData {
    zonecode: string;
    address: string;
    roadAddress: string;
    jibunAddress: string;
    userSelectedType: "R" | "J";
    buildingName?: string;
  }

  /** 우편번호 스크립트는 지도 SDK와 별개로 로드되므로 optional 이다 */
  const Postcode:
    | (new (options: { oncomplete: (data: PostcodeData) => void }) => { open: () => void })
    | undefined;
}

declare namespace kakao.maps {
  class LatLng {
    constructor(lat: number, lng: number);
    getLat(): number;
    getLng(): number;
  }

  class LatLngBounds {
    constructor(sw: LatLng, ne: LatLng);
  }

  class Map {
    constructor(container: HTMLElement, options: { center: LatLng; level: number });
    setCenter(latlng: LatLng): void;
    setBounds(bounds: LatLngBounds): void;
    relayout(): void;
  }

  class CustomOverlay {
    constructor(options: {
      position: LatLng;
      content: HTMLElement;
      map?: Map | null;
      yAnchor?: number;
      xAnchor?: number;
      zIndex?: number;
      clickable?: boolean;
    });
    setMap(map: Map | null): void;
  }

  class Circle {
    constructor(options: {
      center: LatLng;
      radius: number;
      strokeWeight?: number;
      strokeColor?: string;
      strokeOpacity?: number;
      strokeStyle?: string;
      fillColor?: string;
      fillOpacity?: number;
    });
    setMap(map: Map | null): void;
  }

  function load(callback: () => void): void;

  namespace services {
    const Status: { OK: string; ZERO_RESULT: string; ERROR: string };

    interface AddressSearchResult {
      x: string;
      y: string;
    }

    class Geocoder {
      addressSearch(
        address: string,
        callback: (result: AddressSearchResult[], status: string) => void,
      ): void;
    }
  }
}

interface Window {
  kakao?: typeof kakao;
}
