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

  class Size {
    constructor(width: number, height: number);
  }

  class Point {
    constructor(x: number, y: number);
  }

  class MarkerImage {
    constructor(src: string, size: Size, options?: { offset?: Point });
  }

  class Marker {
    constructor(options: { position: LatLng; image?: MarkerImage; title?: string });
    setImage(image: MarkerImage): void;
    setMap(map: Map | null): void;
  }

  /** 마커가 많을 때 가까운 것끼리 묶어 준다. libraries=clusterer 로 로드해야 쓸 수 있다 */
  class MarkerClusterer {
    constructor(options: {
      map: Map;
      markers?: Marker[];
      averageCenter?: boolean;
      minLevel?: number;
      disableClickZoom?: boolean;
      /** 단계를 나누는 개수 기준 */
      calculator?: number[];
      /** calculator 구간 수보다 하나 많게 준다 */
      styles?: Record<string, string>[];
    });
    addMarkers(markers: Marker[]): void;
    clear(): void;
  }

  function event(): void;
  namespace event {
    function addListener(target: object, type: string, handler: (...args: never[]) => void): void;
  }

  function load(callback: () => void): void;
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
