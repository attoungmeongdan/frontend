import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { refreshAccessToken } from "@/apis/auth";
import { getAccessToken, setAccessToken } from "@/apis/tokenStore";
import { AuthContext, type AuthStatus } from "@/contexts/authContext";

function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const hasRestored = useRef(false);

  useEffect(() => {
    if (hasRestored.current) {
      return;
    }
    hasRestored.current = true;

    if (getAccessToken()) {
      setStatus("authenticated");
      return;
    }

    const restore = async () => {
      try {
        const { accessToken } = await refreshAccessToken();
        setAccessToken(accessToken);
        setStatus("authenticated");
      } catch {
        setStatus("unauthenticated");
      }
    };

    void restore();
  }, []);

  const markAuthenticated = useCallback(() => setStatus("authenticated"), []);
  const markSignedOut = useCallback(() => setStatus("unauthenticated"), []);

  const value = useMemo(
    () => ({ status, markAuthenticated, markSignedOut }),
    [status, markAuthenticated, markSignedOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export default AuthProvider;
