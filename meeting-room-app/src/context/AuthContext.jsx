import { createContext, useCallback, useContext, useEffect, useState } from "react";
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

  const normalizeUser = useCallback((currentUser) => {
    if (!currentUser) return null;

    return {
      ...currentUser,
      id: currentUser.id || currentUser._id,
      status:
        currentUser.status ||
        (currentUser.isActive === false ? "disabled" : "active"),
    };
  }, []);

  // ── On app load — restore session from auth cookie ─────────────────────────
  useEffect(() => {
    let isMounted = true;

    const restoreSession = async () => {
      try {
        const response = await api.get("/auth/profile");
        const profileUser = normalizeUser(response.data?.data?.user);

        if (isMounted && profileUser) {
          setUser(profileUser);
          setToken("cookie-session");
        }
      } catch {
        if (isMounted) {
          setUser(null);
          setToken(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    restoreSession();

    return () => {
      isMounted = false;
    };
  }, [normalizeUser]);

  // ── Fetch all users (admin use) ─────────────────────────────────────────────
  const fetchAllUsers = useCallback(async () => {
    try {
      const response = await api.get("/admin/users");
      if (response.data?.success) {
        const userList = response.data.data?.users || response.data.data || [];
        setUsers(Array.isArray(userList) ? userList.map(normalizeUser) : []);
      }
    } catch {
      // silently fail
    }
  }, [normalizeUser]);

  useEffect(() => {
    if (user?.role === "admin" && token) {
      fetchAllUsers();
    }
  }, [fetchAllUsers, token, user?.role]);

  // ── LOGIN ───────────────────────────────────────────────────────────────────
  const login = async (loginData) => {
    try {
      if (!loginData.email || !loginData.password) {
        return { success: false, message: "Please enter email and password" };
      }

      const response = await loginUser(loginData);

      if (response.success && response.data) {
        const loggedInUser = normalizeUser(response.data.user);

        setToken("cookie-session");
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
  const logout = async () => {
    try {
      await logoutUser();
    } catch {
      // Session is cleared locally even if the cookie is already expired.
    }

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
        return { success: true };
      }

      return { success: false, message: response.data?.message || "Update failed." };

    } catch {
      const updatedUser = { ...user, name };
      setUser(updatedUser);
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
      const response = await api.patch(`/admin/users/${userId}/role`);

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
      const response = await api.patch(`/admin/users/${userId}/status`);

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
  const isLoggedIn = () => user !== null;

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
