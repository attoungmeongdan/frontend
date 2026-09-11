/** 브라우저가 보안 컨텍스트로 취급하는 호스트. 네트워크를 타지 않아 평문 노출이 없다 */
const LOCAL_HOSTS = ["localhost", "127.0.0.1", "[::1]", "::1"];

function isLocalHost(hostname: string) {
  return LOCAL_HOSTS.includes(hostname);
}

// API 주소가 없으면 요청이 조용히 현재 웹 origin 으로 나가고,
// 토큰 갱신은 "undefined/api/v1/auth/refresh" 같은 경로를 만든다.
// 잘못된 곳으로 자격 증명이 나가느니 앱을 띄우지 않는 편이 낫다.
function resolveApiBaseUrl() {
  const raw = import.meta.env.VITE_API_BASE_URL;

  if (!raw) {
    throw new Error("VITE_API_BASE_URL이 설정되지 않았어요. .env 파일을 확인해 주세요.");
  }

  let parsed: URL;

  try {
    parsed = new URL(raw);
  } catch {
    throw new Error(`VITE_API_BASE_URL이 올바른 URL이 아니에요: ${raw}`);
  }

  // 모든 요청이 withCredentials 로 인증 쿠키를 싣고 나간다.
  // http 로 보내면 쿠키와 액세스 토큰이 평문으로 흐르므로 https 만 허용한다.
  // 예외는 개발 서버에서 쓰는 로컬 백엔드뿐이며, 배포 빌드에서는 무조건 https 다.
  if (parsed.protocol !== "https:") {
    const isLocalDev =
      import.meta.env.DEV && parsed.protocol === "http:" && isLocalHost(parsed.hostname);

    if (!isLocalDev) {
      throw new Error(
        `VITE_API_BASE_URL은 https 여야 해요. 인증 쿠키가 평문으로 전송됩니다: ${raw}`,
      );
    }
  }

  // 경로를 이어붙일 때 슬래시가 겹치지 않게 끝 슬래시를 떼어둔다
  return raw.replace(/\/+$/, "");
}

export const API_BASE_URL = resolveApiBaseUrl();
