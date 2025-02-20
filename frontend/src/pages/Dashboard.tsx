import axios from "axios";
import cookie from "js-cookie";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";


export default function Dashboard() {
  const navigate = useNavigate();
  useEffect(() => {
    const jwt_token = cookie.get("jwt");
    if (cookie.get("jwt") === undefined) {
      // Not logged in
      navigate('/admin');
    } else {
      axios.get("http://127.0.0.1:5050/auth/test_token", {
        headers: { Authorization: `Bearer ${jwt_token}` }
      }).then(() => {
        // User logged in
      }, () => {
        // Login session expired
        navigate('/admin');
      })
    }
  }, []);

  return (<div>testing testing</div>);
}