import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { refreshAccessToken } from "@/apis/auth";
import { getAccessToken, setAccessToken } from "@/apis/tokenStore";
import { AuthContext, type AuthStatus } from "@/contexts/authContext";

const OAUTH_CALLBACK_PATTERN = /^\/auth\/oauth2\/[^/]+\/callback$/;

function isOAuthCallbackPath(pathname: string) {
  return OAUTH_CALLBACK_PATTERN.test(pathname);
}

/**
 * 액세스 토큰은 메모리에만 있어서 새로고침하면 사라진다.
 * 앱이 뜰 때 HttpOnly refresh_token 쿠키로 세션 복구를 한 번 시도하고,
 * 그 결과가 나오기 전까지는 어떤 페이지도 판단하지 않는다.
 */
function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<AuthStatus>("loading");
  // StrictMode 이중 실행으로 갱신이 두 번 나가지 않게 막는다
  const hasRestored = useRef(false);
  // 세션 세대 번호. 로그인·가입대기·로그아웃이 일어나면 올라간다.
  // 부팅 복구는 시작 시점의 번호를 들고 있다가, 늦게 끝났을 때 그 사이 바뀐 상태를 덮어쓰지 않는다.
  const sessionVersion = useRef(0);

  useEffect(() => {
    if (hasRestored.current) {
      return;
    }
    hasRestored.current = true;

    if (getAccessToken()) {
      setStatus("authenticated");
      return;
    }

    // 소셜 콜백은 이 페이지가 직접 인증을 끝내고 상태를 바꾼다.
    // 여기서 복구까지 시도하면 쿠키가 심어지기 전에 재발급이 나가 401 이 한 번 더 뜬다.
    if (isOAuthCallbackPath(window.location.pathname)) {
      return;
    }

    const restoreVersion = sessionVersion.current;

    const restore = async () => {
      try {
        const { accessToken } = await refreshAccessToken();

        if (restoreVersion !== sessionVersion.current) {
          return;
        }

        setAccessToken(accessToken);
        setStatus("authenticated");
      } catch {
        if (restoreVersion !== sessionVersion.current) {
          return;
        }

        setStatus("unauthenticated");
      }
    };

    void restore();
  }, []);

  // 계정이 바뀌면 이전 계정의 응답이 화면에 남지 않도록 캐시를 통째로 버린다
  const changeSession = useCallback(
    (next: AuthStatus) => {
      sessionVersion.current += 1;
      queryClient.clear();
      setStatus(next);
    },
    [queryClient],
  );

  const markAuthenticated = useCallback(() => changeSession("authenticated"), [changeSession]);
  const markSignupRequired = useCallback(() => changeSession("signup_required"), [changeSession]);
  const markSignedOut = useCallback(() => changeSession("unauthenticated"), [changeSession]);

  const value = useMemo(
    () => ({ status, markAuthenticated, markSignupRequired, markSignedOut }),
    [status, markAuthenticated, markSignupRequired, markSignedOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export default AuthProvider;
