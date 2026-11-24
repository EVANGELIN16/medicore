import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { Button, Result, Spin, message } from "antd";

import { useAuth } from "../../context/useAuth";
import type { UserRole } from "../../services/authApi";

type ProtectedRouteProps = {
  children: ReactNode;
  allowedRoles?: UserRole[];
};

export default function ProtectedRoute({
  children,
  allowedRoles,
}: ProtectedRouteProps) {
  const { user, loading, logout } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spin size="large" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <Result
        status="403"
        title="Access Denied"
        subTitle="You do not have permission to access this page."
        extra={
          <Button
            onClick={async () => {
              try {
                await logout();
              } catch {
                message.error("Unable to logout");
              }
            }}
          >
            Logout
          </Button>
        }
      />
    );
  }

  return <>{children}</>;
}