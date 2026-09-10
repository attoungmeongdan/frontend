import { Navigate, Outlet } from "react-router-dom";
import BootSplash from "@/components/common/BootSplash";
import { useAuth } from "@/hooks/useAuth";

function ProtectedRoute() {
  const { status } = useAuth();

  if (status === "loading") {
    return <BootSplash />;
  }

  if (status === "unauthenticated") {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}

export default ProtectedRoute;
