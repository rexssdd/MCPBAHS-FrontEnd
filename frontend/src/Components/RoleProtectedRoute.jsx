import { Navigate } from "react-router-dom";

export default function RoleProtectedRoute({ children, userRole, allowedRoles }) {
  if (!userRole || !allowedRoles.includes(userRole)) {
    return <Navigate to="/login" replace />;
  }
  return children;
}


