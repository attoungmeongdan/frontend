import { Navigate, Outlet } from "react-router-dom";
import BootSplash from "@/components/common/BootSplash";
import { HOME_FOR_STATUS, type AuthStatus } from "@/contexts/authContext";
import { useAuth } from "@/hooks/useAuth";

/**
 * 인증 상태로 라우트를 가른다.
 * 세션 복구가 끝나기 전에는 판단하지 않고 스플래시를 띄운다.
 */
function AuthGate({ allow }: { allow: Exclude<AuthStatus, "loading"> }) {
  const { status } = useAuth();

  if (status === "loading") {
    return <BootSplash />;
  }

  if (status !== allow) {
    return <Navigate to={HOME_FOR_STATUS[status]} replace />;
  }

  return <Outlet />;
}

export default AuthGate;
