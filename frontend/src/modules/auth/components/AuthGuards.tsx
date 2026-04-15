import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuthStore } from "../state/useAuthStore";

export function RequireAuth() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const user = useAuthStore((state) => state.user);
  const location = useLocation();

  if (!accessToken) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (user?.requirePasswordReset && location.pathname !== "/change-password") {
    return <Navigate to="/change-password" replace />;
  }

  return <Outlet />;
}

export function RequireGuest() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const user = useAuthStore((state) => state.user);

  if (accessToken) {
    return <Navigate to={user?.requirePasswordReset ? "/change-password" : "/"} replace />;
  }

  return <Outlet />;
}
