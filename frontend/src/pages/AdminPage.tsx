import axios from "axios";
import cookie from "js-cookie";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

axios.defaults.baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5050/api';
axios.defaults.withCredentials = true;

declare const process: {
  env: {
    NODE_ENV: string;
  };
};

export default function AdminPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [staffKey, setStaffKey] = useState("");
  const [showRegisterForm, setShowRegisterForm] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
    bio: ""
  });
  const [message, setMessage] = useState({ text: "", type: "" });
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      const jwt_token = cookie.get("jwt");
      console.log("Auth check - token:", jwt_token); // Debug
  
      if (!jwt_token) return;
  
      try {
        await axios.get("/auth/test_token", {
          headers: { Authorization: `Bearer ${jwt_token}` },
        });
        console.log("Token valid - redirecting to /dashboard");
        navigate("/dashboard", { replace: true });
      } catch (error) {
        console.error("Token invalid:", error);
        cookie.remove("jwt");
      }
    };
  
    checkAuth();
  }, [navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const verifyStaffKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (staffKey === "TechniqueRemember") {
      setShowRegisterForm(true);
      setMessage({ text: "Staff key verified. Please complete registration.", type: "success" });
    } else {
      setMessage({ text: "Invalid staff key. Try again.", type: "error" });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage({ text: "", type: "" });

    // Validation
    if (!isLogin && formData.password !== formData.confirmPassword) {
      setMessage({ text: "Passwords do not match", type: "error" });
      return;
    }

    try {
      const endpoint = isLogin ? "/auth/login" : "/auth/register";
      const payload = isLogin 
        ? { username: formData.username, password: formData.password }
        : {
            username: formData.username,
            email: formData.email,
            password: formData.password,
            firstName: formData.firstName,
            lastName: formData.lastName,
            bio: formData.bio
          };

      const res = await axios.post(endpoint, payload, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      // Set cookie - matching backend settings
      cookie.set("jwt", res.data.token, {
        expires: 0.5 / 24, // 30 minutes
        secure: window.location.protocol === "https:", // secure only in HTTPS
        sameSite: "strict", // stricter policy to avoid CSRF
        path: "/",
      });

      // Update state before navigation
      setMessage({
        text: isLogin ? "Login successful!" : "Registration successful!",
        type: "success"
      });

      // Add slight delay to ensure state updates and cookie is set
      console.log("JWT after set:", cookie.get("jwt")); 
      navigate("/dashboard", { replace: true }); // Immediate redirect

    } catch (error) {
      console.error("Auth error:", error);
      setMessage({ 
        text: (error as any)?.message || "Authentication failed",
        type: "error",
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">
            {isLogin ? "Staff Login" : "Register New Staff"}
          </h2>

          {!isLogin && !showRegisterForm ? (
            <form onSubmit={verifyStaffKey} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Staff Key
                </label>
                <input
                  type="password"
                  value={staffKey}
                  onChange={(e) => setStaffKey(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter staff key"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md transition duration-200"
              >
                Verify Staff Key
              </button>
            </form>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        First Name
                      </label>
                      <input
                        type="text"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Last Name
                      </label>
                      <input
                        type="text"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Username
                </label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              {!isLogin && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Confirm Password
                    </label>
                    <input
                      type="password"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Bio
                    </label>
                    <textarea
                      name="bio"
                      value={formData.bio}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={3}
                      required
                    />
                  </div>
                </>
              )}

              {message.text && (
                <div className={`p-3 rounded-md ${message.type === "error" ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
                  {message.text}
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md transition duration-200"
              >
                {isLogin ? "Sign In" : "Register"}
              </button>
            </form>
          )}

          <div className="mt-4 text-center">
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setShowRegisterForm(false);
                setMessage({ text: "", type: "" });
              }}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              {isLogin 
                ? "Need to register a new staff member?" 
                : "Already have an account? Sign in"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
