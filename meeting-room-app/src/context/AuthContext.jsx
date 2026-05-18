import { createContext, useContext, useEffect, useState } from "react";
import { loginUser, registerUser, logoutUser } from "../services/api";
import api from "../services/api";

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // ── On app load — restore session from localStorage ─────────────────────────
  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    const savedToken = localStorage.getItem("token");

    if (savedUser && savedToken) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
        setToken(savedToken);
      } catch {
        localStorage.removeItem("user");
        localStorage.removeItem("token");
      }
    }

    setLoading(false);
  }, []);

  // ── Fetch all users (admin use) ─────────────────────────────────────────────
  const fetchAllUsers = async () => {
    try {
      const response = await api.get("/admin/users");
      if (response.data?.success) {
        setUsers(response.data.data || []);
      }
    } catch {
      // silently fail
    }
  };

  useEffect(() => {
    if (user?.role === "admin" && token) {
      fetchAllUsers();
    }
  }, [user, token]);

  // ── LOGIN ───────────────────────────────────────────────────────────────────
  const login = async (loginData) => {
    try {
      if (!loginData.email || !loginData.password) {
        return { success: false, message: "Please enter email and password" };
      }

      const response = await loginUser(loginData);

      if (response.success && response.data) {
        const { user: loggedInUser, accessToken, refreshToken } = response.data;

        localStorage.setItem("token", accessToken);
        localStorage.setItem("refreshToken", refreshToken);
        localStorage.setItem("user", JSON.stringify(loggedInUser));

        setToken(accessToken);
        setUser(loggedInUser);

        return { success: true, user: loggedInUser };
      }

      return {
        success: false,
        message: response.message || "Login failed. Please check your credentials.",
      };

    } catch (error) {
      const message = error.response?.data?.message || "Login failed. Please try again.";
      return { success: false, message };
    }
  };

  // ── REGISTER ────────────────────────────────────────────────────────────────
  const register = async (registerData) => {
    try {
      const response = await registerUser({
        name: registerData.name,
        email: registerData.email,
        password: registerData.password,
        role: "user",
      });

      if (response && response.success) {
        return { success: true };
      }

      return {
        success: false,
        message: response?.message || "Registration failed.",
      };

    } catch (error) {
      const message = error.response?.data?.message || "Registration failed. Please try again.";
      return { success: false, message };
    }
  };

  // ── LOGOUT ──────────────────────────────────────────────────────────────────
  const logout = () => {
    logoutUser();
    setUser(null);
    setToken(null);
    setUsers([]);
  };

  // ── UPDATE PROFILE ──────────────────────────────────────────────────────────
  const updateProfile = async ({ name }) => {
    try {
      const response = await api.put("/auth/profile", { name });

      if (response.data?.success) {
        const updatedUser = { ...user, name };
        setUser(updatedUser);
        localStorage.setItem("user", JSON.stringify(updatedUser));
        return { success: true };
      }

      return { success: false, message: response.data?.message || "Update failed." };

    } catch {
      // localStorage fallback
      const updatedUser = { ...user, name };
      setUser(updatedUser);
      localStorage.setItem("user", JSON.stringify(updatedUser));
      return { success: true };
    }
  };

  // ── CHANGE PASSWORD ─────────────────────────────────────────────────────────
  const changePassword = async ({ currentPassword, newPassword }) => {
    try {
      const response = await api.put("/auth/change-password", {
        currentPassword,
        newPassword,
      });

      if (response.data?.success) {
        return { success: true };
      }

      return { success: false, message: response.data?.message || "Password change failed." };

    } catch (error) {
      const message = error.response?.data?.message || "Password change failed. Please try again.";
      return { success: false, message };
    }
  };

  // ── ADMIN — Change user role ────────────────────────────────────────────────
  const changeUserRole = async (userId) => {
    try {
      const response = await api.put(`/admin/users/${userId}/role`);

      if (response.data?.success) {
        await fetchAllUsers();
        return { success: true, message: "User role updated successfully." };
      }

      return { success: false, message: response.data?.message || "Role update failed." };

    } catch (error) {
      const message = error.response?.data?.message || "Role update failed.";
      return { success: false, message };
    }
  };

  // ── ADMIN — Toggle user status ──────────────────────────────────────────────
  const toggleUserStatus = async (userId) => {
    try {
      const response = await api.put(`/admin/users/${userId}/status`);

      if (response.data?.success) {
        await fetchAllUsers();
        return { success: true, message: "User status updated successfully." };
      }

      return { success: false, message: response.data?.message || "Status update failed." };

    } catch (error) {
      const message = error.response?.data?.message || "Status update failed.";
      return { success: false, message };
    }
  };

  // ── helpers ─────────────────────────────────────────────────────────────────
  const isAdmin = () => user?.role === "admin";
  const isLoggedIn = () => user !== null && token !== null;

  const admins = users.filter((u) => u.role === "admin");
  const normalUsers = users.filter((u) => u.role === "user");

  const value = {
    user,
    token,
    users,
    admins,
    normalUsers,
    loading,
    login,
    register,
    logout,
    isAdmin,
    isLoggedIn,
    updateProfile,
    changePassword,
    changeUserRole,
    toggleUserStatus,
    fetchAllUsers,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};