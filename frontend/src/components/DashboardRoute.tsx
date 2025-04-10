import { useState, useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import axios from "axios";
import cookie from "js-cookie";
import DashboardBaseLayout from "./DashboardBaseLayout";

export default function ProtectedRoute() {
  const navigate = useNavigate();
  const [authStatus, setAuthStatus] = useState<"loading" | "authenticated" | "unauthenticated">("loading");

  useEffect(() => {
    const verifyToken = async () => {
      const jwt_token = cookie.get("jwt");

      if (!jwt_token) {
        setAuthStatus("unauthenticated");
        return;
      }

      try {
        await axios.get(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5050/api'}/auth/test_token`, {
          headers: { Authorization: `Bearer ${jwt_token}` }
        });
        setAuthStatus("authenticated");
      } catch (error) {
        console.error("Token validation failed", error);  // Log error for debugging
        cookie.remove("jwt");
        setAuthStatus("unauthenticated");
      }
    };

    verifyToken();
  }, []);

  useEffect(() => {
    if (authStatus === "unauthenticated") {
      navigate("/dashboard", { replace: true }); // Redirect to the login page
    }
  }, [authStatus, navigate]);

  if (authStatus === "loading") {
    return <div className="p-4">Loading authentication status...</div>;
  }

  if (authStatus === "authenticated") {
    return (
      <DashboardBaseLayout>
        <Outlet />
      </DashboardBaseLayout>
    );
  }

  return null;
}
