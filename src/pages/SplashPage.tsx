import { Navigate } from "react-router-dom";
import BootSplash from "@/components/common/BootSplash";
import { HOME_FOR_STATUS } from "@/contexts/authContext";
import { useAuth } from "@/hooks/useAuth";

// 스플래시. 고정 시간 대기가 아니라 세션 복구가 끝나는 시점까지 머문다
function SplashPage() {
  const { status } = useAuth();

  if (status === "loading") {
    return <BootSplash />;
  }

  return <Navigate to={HOME_FOR_STATUS[status]} replace />;
}

export default SplashPage;
