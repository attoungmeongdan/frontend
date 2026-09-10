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

// https://postcode.map.kakao.com/guide
declare namespace kakao {
  interface PostcodeData {
    zonecode: string;
    address: string;
    roadAddress: string;
    jibunAddress: string;
    /** 도로명 주소가 없는 곳에서 대신 제공되는 도로명 주소 */
    autoRoadAddress?: string;
    /** 지번 주소가 없는 곳에서 대신 제공되는 지번 주소 */
    autoJibunAddress?: string;
    userSelectedType: "R" | "J";
    buildingName?: string;
  }

  class Postcode {
    constructor(options: { oncomplete: (data: PostcodeData) => void });
    open(): void;
  }
}

interface Window {
  kakao?: typeof kakao;
}
