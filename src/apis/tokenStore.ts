// 액세스 토큰은 메모리에만 둔다.
// localStorage 에 두면 같은 출처에서 XSS 가 나는 순간 토큰이 그대로 읽힌다.
// 새로고침하면 사라지지만, refresh_token(HttpOnly 쿠키)으로 다시 받아오므로 로그인은 유지된다.
let accessToken: string | null = null;

// 세션 세대 번호. 로그아웃·재로그인 때마다 올라간다.
// 갱신 요청은 시작 시점의 번호를 들고 있다가 저장 직전에 같은지 확인해서,
// 이미 끝난 세션의 갱신 결과가 뒤늦게 토큰을 되살리는 것을 막는다.
let sessionId = 0;

export function getSessionId() {
  return sessionId;
}

export function getAccessToken() {
  return accessToken;
}

/** 로그인·회원가입으로 새 세션을 시작한다. 이전 세션의 갱신 결과는 버려진다. */
export function setAccessToken(token: string) {
  accessToken = token;
  sessionId += 1;
}

/** 진행 중이던 갱신이 끝났을 때. 같은 세션일 때만 저장하고, 저장 여부를 돌려준다. */
export function updateTokenForSession(token: string, expectedSessionId: number) {
  if (expectedSessionId !== sessionId) {
    return false;
  }

  accessToken = token;

  return true;
}

/** 로그아웃. 세대 번호를 올려 진행 중인 갱신 결과를 무효화한다. */
export function clearAccessToken() {
  accessToken = null;
  sessionId += 1;
}
