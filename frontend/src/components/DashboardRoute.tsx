import axios from "axios";
import cookie from "js-cookie";
import { useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import DashboardBaseLayout from "./DashboardBaseLayout";

export default function ProtectedRoute() {
  const navigate = useNavigate();

  const checkAuth = () => {
    const jwt_token = cookie.get("jwt");
    if (cookie.get("jwt") === undefined) {
      // Not logged in
      return false;
    } else {
      axios
        .get("http://127.0.0.1:5050/auth/test_token", {
          headers: { Authorization: `Bearer ${jwt_token}` },
        })
        .then(
          () => {
            // User logged in
            return true;
          },
          () => {
            // Login session expired
            return false;
          }
        );
    }
  };
  const auth = checkAuth();

  useEffect(() => {
    if (auth == false) {
      navigate("/admin", {replace: true})
    }
  }, [auth, navigate]);

  return <DashboardBaseLayout>
    <Outlet />
  </DashboardBaseLayout>;
}
