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

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error(`VITE_API_BASE_URL은 http/https 여야 해요: ${raw}`);
  }

  // 경로를 이어붙일 때 슬래시가 겹치지 않게 끝 슬래시를 떼어둔다
  return raw.replace(/\/+$/, "");
}

export const API_BASE_URL = resolveApiBaseUrl();
