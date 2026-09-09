export type SocialProvider = "kakao" | "google";

// 백엔드 OAuth 시작점으로 리다이렉트한다.
// TODO: 백엔드 인증 명세 확정되면 이 함수만 교체하면 된다.
//       (프론트 SDK로 토큰을 직접 받는 방식이면 시그니처가 Promise로 바뀔 수 있음)
export function startSocialLogin(provider: SocialProvider) {
  const baseUrl = import.meta.env.VITE_API_BASE_URL;

  if (!baseUrl) {
    throw new Error("VITE_API_BASE_URL이 설정되지 않았어요.");
  }

  window.location.href = `${baseUrl}/api/v1/auth/${provider}`;
}
