const INVITE_JOIN_KEY = "fittle:invite-join";

/**
 * 초대 링크로 들어온 흐름임을 남긴다.
 * 그룹 참가 자체는 서버가 처리하지만, 로그인·가입을 마친 뒤 어디로 보낼지는 프론트가 알아야 한다.
 * 저장이 막혀 있어도(시크릿 모드 등) 홈으로 가는 것뿐이라 치명적이지 않다.
 */
export function rememberInviteJoin() {
  try {
    sessionStorage.setItem(INVITE_JOIN_KEY, "1");
  } catch {
    // 무시
  }
}

/** 한 번 읽고 지운다. 남겨 두면 다음 로그인에서 엉뚱하게 그룹으로 보내게 된다 */
export function consumeInviteJoin() {
  try {
    const hasFlag = sessionStorage.getItem(INVITE_JOIN_KEY) !== null;
    sessionStorage.removeItem(INVITE_JOIN_KEY);

    return hasFlag;
  } catch {
    return false;
  }
}

/** 로그인·가입을 마친 뒤 갈 곳 */
export function landingAfterAuth() {
  return consumeInviteJoin() ? "/group" : "/";
}
