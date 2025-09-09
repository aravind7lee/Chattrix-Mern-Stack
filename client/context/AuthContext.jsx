// AuthContext.jsx
import { createContext, useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { io } from "socket.io-client";

// ---- CONFIG ----
const backendUrl = import.meta.env.VITE_BACKEND_URL;
axios.defaults.baseURL = backendUrl;

// ---- CONTEXT ----
export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [authUser, setAuthUser] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [socket, setSocket] = useState(null);

  /**
   * Check if user is authenticated when provider mounts
   */
  const checkAuth = async () => {
    try {
      const { data } = await axios.get("/api/auth/check");
      if (data?.success) {
        setAuthUser(data.user);
        connectSocket(data.user);
      } else {
        setAuthUser(null);
      }
    } catch (error) {
      console.warn("checkAuth failed:", error?.message || error);
      setAuthUser(null);
    }
  };

  /**
   * Login (state = "login" | "register")
   */
  const login = async (state, credentials) => {
    try {
      const { data } = await axios.post(`/api/auth/${state}`, credentials);
      if (data?.success) {
        const user = data.userData ?? data.user;
        setAuthUser(user);
        axios.defaults.headers.common["token"] = data.token;
        setToken(data.token);
        localStorage.setItem("token", data.token);
        connectSocket(user);
        toast.success(data.message || "Logged in");
        return data;
      } else {
        toast.error(data?.message || "Login failed");
        return data;
      }
    } catch (error) {
      console.error("login error:", error);
      toast.error(error?.message || "Login failed");
      throw error;
    }
  };

  /**
   * Logout - async, clears state, disconnects socket, and redirects
   *
   * Usage examples:
   *   await logout();  // logs out + redirects to /login
   *   await logout({ redirect: false }); // logs out without redirect
   *   await logout({ redirectTo: "/welcome", showToast: true });
   */
  const logout = async ({ redirect = true, redirectTo = "/login", showToast = true } = {}) => {
    try {
      // Notify backend (if implemented)
      try {
        await axios.post("/api/auth/logout");
      } catch (err) {
        // Not all backends implement logout, ignore
      }

      // Local cleanup
      localStorage.removeItem("token");
      setToken(null);
      setAuthUser(null);
      setOnlineUsers([]);

      try {
        delete axios.defaults.headers.common["token"];
      } catch {
        axios.defaults.headers.common["token"] = null;
      }

      // Disconnect socket safely
      if (socket && typeof socket.disconnect === "function") {
        try {
          socket.disconnect();
        } catch (err) {
          console.warn("Socket disconnect error:", err);
        }
      }
      setSocket(null);

      if (showToast) toast.success("Logged out successfully");

      if (redirect) {
        window.location.replace(redirectTo);
      }

      return Promise.resolve(); // explicit promise resolution
    } catch (error) {
      console.error("logout error:", error);
      if (showToast) toast.error("Logout failed");
      return Promise.reject(error);
    }
  };

  /**
   * Update profile
   */
  const updateProfile = async (body) => {
    try {
      const { data } = await axios.put("/api/auth/update-profile", body);
      if (data?.success) {
        setAuthUser(data.user);
        toast.success("Profile updated successfully");
        return data;
      } else {
        toast.error(data?.message || "Update failed");
        return data;
      }
    } catch (error) {
      console.error("updateProfile error:", error);
      toast.error(error?.message || "Update failed");
      throw error;
    }
  };

  /**
   * Connect socket.io
   */
  const connectSocket = (userData) => {
    if (socket?.connected) return;

    try {
      const newSocket = io(backendUrl, {
        query: { userId: userData?._id },
        transports: ["websocket"],
      });

      setSocket(newSocket);

      newSocket.on("getOnlineUsers", (userIds) => {
        if (Array.isArray(userIds)) setOnlineUsers(userIds);
      });

      newSocket.on("connect_error", (err) => {
        console.warn("Socket connection error:", err.message);
      });
    } catch (err) {
      console.warn("connectSocket error:", err);
    }
  };

  // ---- EFFECTS ----

  // Set axios token header on mount
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common["token"] = token;
    } else {
      try {
        delete axios.defaults.headers.common["token"];
      } catch {
        axios.defaults.headers.common["token"] = null;
      }
    }
    checkAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cleanup socket on unmount
  useEffect(() => {
    return () => {
      if (socket && typeof socket.disconnect === "function") {
        try {
          socket.disconnect();
        } catch {
          // ignore
        }
      }
    };
  }, [socket]);

  // ---- PROVIDER VALUE ----
  const value = {
    axios,
    authUser,
    onlineUsers,
    socket,
    login,
    logout,
    updateProfile,
    checkAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
