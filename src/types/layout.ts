// 레이아웃 라우트가 handle 로 넘기는 셸 설정
export interface HeaderConfig {
  /** 지정하면 워드마크 대신 텍스트 타이틀을 표시 */
  title?: string;
  /** 좌측 뒤로가기 버튼 노출 여부 */
  showBack?: boolean;
  /** 우측 닫기 버튼 노출 여부. 결과 화면을 닫고 홈으로 이동 */
  showClose?: boolean;
  /** 뒤로가기 목적지. 없으면 history back */
  backTo?: string;
}

export interface LayoutHandle {
  /** false 면 헤더 없음. 기본값은 워드마크 헤더 */
  header?: false | HeaderConfig;
  /** 바텀 네비게이션 노출 여부 */
  bottomNav?: boolean;
  /** 카메라 화면처럼 본문 여백 없이 꽉 채우는 경우 */
  fullBleed?: boolean;
  /** 카메라 화면처럼 데스크톱·가로 화면에서도 모바일 셸 너비를 제한하지 않는 경우 */
  fullViewport?: boolean;
}
