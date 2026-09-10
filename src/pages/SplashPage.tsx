import { Navigate } from "react-router-dom";
import BootSplash from "@/components/common/BootSplash";
import { useAuth } from "@/hooks/useAuth";

// 스플래시
function SplashPage() {
  const { status } = useAuth();

  if (status === "loading") {
    return <BootSplash />;
  }

  return <Navigate to={status === "authenticated" ? "/" : "/login"} replace />;
}

export default SplashPage;
