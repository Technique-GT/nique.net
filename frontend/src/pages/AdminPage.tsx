import axios from "axios";
import cookie from "js-cookie";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function AdminPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const jwt_token = cookie.get("jwt");
    if (cookie.get("jwt") === undefined) {
      setMessage("");
    } else {
      axios.get("http://127.0.0.1:5050/auth/test_token", {
        headers: { Authorization: `Bearer ${jwt_token}` }
      }).then(() => {
        setMessage("Welcome back!");
        navigate("/dashboard");
      }, () => {
        setMessage("Login session expired, please log in again");
      })
    }
  }, []);

  return (
    <div className="flex justify-center mt-40">
      <div className="w-80 flex flex-col border-1 rounded p-4 bg-gray-300 justify-center">
        <p>Username</p>
        <input
          className="border-1 rounded border-gray-500 text-2xl h-10 bg-white px-1 w-full"
          type="text"
          id="username"
          name="username"
          value={username}
          onChange={(e) => {
            setUsername(e.target.value);
          }}
        />
        <p className="mt-2">Password</p>
        <input
          className="border-1 rounded border-gray-500 text-2xl h-10 bg-white px-1 w-full"
          type="password"
          id="password"
          name="password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
          }}
        />
        <button
          className="self-end rounded bg-sky-700 hover:bg-sky-800 hover:cursor-pointer text-white px-4 py-1 mt-2"
          onClick={() => {
            axios
              .post("http://127.0.0.1:5050/auth/login", {
                username: username,
                password: password,
              })
              .then(
                (res) => {
                  cookie.set("jwt", res.data);
                  navigate("/dashboard");
                },
                (reason) => {
                  setMessage("Error: Username or password is incorrect.\n"+reason);
                }
              );
          }}
        >
          Log in
        </button>
        <p>{message}</p>
      </div>
    </div>
  );
}
