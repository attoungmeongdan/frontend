import { Navigate, Outlet } from "react-router-dom";
import BootSplash from "@/components/common/BootSplash";
import { useAuth } from "@/hooks/useAuth";

function PublicOnlyRoute() {
  const { status } = useAuth();

  if (status === "loading") {
    return <BootSplash />;
  }

  if (status === "authenticated") {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}

export default PublicOnlyRoute;
