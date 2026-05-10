import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function ProtectedRoute({ children, adminOnly = false, userOnly = false }) {
  const { isLoggedIn, isAdmin } = useAuth();

  if (!isLoggedIn()) {
    return <Navigate to="/" replace />;
  }

  if (adminOnly && !isAdmin()) {
    return <Navigate to="/rooms" replace />;
  }

  if (userOnly && isAdmin()) {
    return <Navigate to="/admin" replace />;
  }

  return children;
}

export default ProtectedRoute;