import axios from "axios";
import cookie from "js-cookie";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";


export default function Dashboard() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [message, setMessage] = useState("");
    const navigate = useNavigate();
   useEffect(() => {
    const jwt_token = cookie.get("jwt");
    if (cookie.get("jwt") === undefined) {
      setMessage("Error");
    } else {
      axios.get("http://127.0.0.1:5050/auth/test_token", {
        headers: { Authorization: `Bearer ${jwt_token}` }
      }).then(() => {
        setMessage("Welcome back!");
      }, () => {
        setMessage("Login session expired, please log in again");
        navigate('/admin');
      })
    }
  }, []);

    return (<div>testing testing</div>);
}