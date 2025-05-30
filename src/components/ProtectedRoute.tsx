
import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles = [],
}) => {
  const { user, userData, isLoading } = useAuth();
  const location = useLocation();

  // Add debug logs
  console.log("Protected Route - User:", user?.email);
  console.log("Protected Route - User Data:", userData);
  console.log("Protected Route - Is Loading:", isLoading);
  console.log("Protected Route - Allowed Roles:", allowedRoles);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-16 h-16 border-4 border-t-blue-500 border-b-blue-700 rounded-full animate-spin"></div>
          <p className="text-xl font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    console.log("Protected Route - No user, redirecting to /auth");
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  if (allowedRoles.length > 0 && userData && !allowedRoles.includes(userData.role)) {
    // Redirect to the appropriate dashboard based on the user's role
    console.log("Protected Route - User has incorrect role, redirecting to proper dashboard");
    if (userData.role === "admin") {
      return <Navigate to="/admin" replace />;
    } else if (userData.role === "trainer") {
      return <Navigate to="/trainer" replace />;
    } else if (userData.role === "member") {
      return <Navigate to="/member" replace />;
    }
    
    // Fallback - should not reach here if roles are properly set
    return <Navigate to="/auth" replace />;
  }

  console.log("Protected Route - Access granted");
  return <>{children}</>;
};

export default ProtectedRoute;
