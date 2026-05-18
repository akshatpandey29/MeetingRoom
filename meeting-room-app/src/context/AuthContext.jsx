import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  changeAdminUserRole,
  getAdminUsers,
  getProfile,
  loginUser,
  logoutUser,
  registerUser,
  toggleAdminUserStatus,
} from "../services/api";

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

function getId(value) {
  if (!value) return "";
  return String(value._id || value.id || value);
}

function normalizeUser(user) {
  if (!user) return null;

  return {
    ...user,
    id: getId(user),
    _id: getId(user),
    name: user.name || "",
    email: user.email || "",
    role: user.role || "user",
    isActive: user.isActive ?? user.status !== "disabled",
    status: user.isActive === false || user.status === "disabled" ? "disabled" : "active",
    createdAt: user.createdAt || "",
  };
}

function getErrorMessage(error, fallbackMessage = "Something went wrong.") {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.errors?.[0]?.message ||
    error?.message ||
    fallbackMessage
  );
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [usersLoading, setUsersLoading] = useState(false);

  const saveSessionUser = (nextUser) => {
    if (!nextUser) {
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      setUser(null);
      setToken(null);
      return;
    }

    localStorage.setItem("user", JSON.stringify(nextUser));
    localStorage.setItem("token", "cookie-session");
    setUser(nextUser);
    setToken("cookie-session");
  };

  const fetchUsers = async () => {
    try {
      setUsersLoading(true);
      const response = await getAdminUsers();
      const nextUsers = response?.data?.users || [];
      setUsers(nextUsers.map(normalizeUser).filter(Boolean));
      return {
        success: true,
        message: response?.message || "Users fetched successfully.",
      };
    } catch (error) {
      return {
        success: false,
        message: getErrorMessage(error, "Users could not be fetched."),
      };
    } finally {
      setUsersLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const hydrateSession = async () => {
      try {
        const response = await getProfile();
        if (!isMounted) return;

        const currentUser = normalizeUser(response?.data?.user);
        saveSessionUser(currentUser);
        setUsers(currentUser ? [currentUser] : []);
      } catch (error) {
        if (!isMounted) return;

        saveSessionUser(null);
        setUsers([]);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    hydrateSession();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!user) {
      setUsers([]);
      return;
    }

    if (user.role === "admin") {
      fetchUsers();
      return;
    }

    setUsers([user]);
  }, [user]);

  const login = async (loginData) => {
    try {
      if (!loginData.email || !loginData.password) {
        return {
          success: false,
          message: "Please enter email and password",
        };
      }

      const response = await loginUser(loginData);
      const loggedInUser = normalizeUser(response?.data?.user);

      if (!loggedInUser) {
        return {
          success: false,
          message: "Login failed. User data was not returned.",
        };
      }

      saveSessionUser(loggedInUser);
      setUsers([loggedInUser]);

      if (loggedInUser.role === "admin") {
        fetchUsers();
      }

      return {
        success: true,
        user: loggedInUser,
        message: response?.message || "Login successful",
      };
    } catch (error) {
      return {
        success: false,
        message: getErrorMessage(error, "Login failed"),
      };
    }
  };

  const register = async (registerData) => {
    try {
      const response = await registerUser(registerData);
      const createdUser = normalizeUser(response?.data?.user);

      if (createdUser) {
        setUsers((previousUsers) => {
          const exists = previousUsers.some(
            (currentUser) => currentUser.id === createdUser.id
          );

          return exists ? previousUsers : [...previousUsers, createdUser];
        });
      }

      return {
        success: true,
        data: createdUser,
        message: response?.message || "Registration successful",
      };
    } catch (error) {
      return {
        success: false,
        message: getErrorMessage(error, "Registration failed"),
      };
    }
  };

  const changeUserRole = async (userId) => {
    try {
      if (String(user?.id) === String(userId)) {
        return {
          success: false,
          message: "You cannot change your own admin role.",
        };
      }

      const response = await changeAdminUserRole(userId);
      const updatedUser = normalizeUser(response?.data?.user);

      if (updatedUser) {
        setUsers((previousUsers) =>
          previousUsers.map((currentUser) =>
            currentUser.id === updatedUser.id ? updatedUser : currentUser
          )
        );
      }

      return {
        success: true,
        message: response?.message || "User role updated successfully.",
      };
    } catch (error) {
      return {
        success: false,
        message: getErrorMessage(error, "User role could not be updated."),
      };
    }
  };

  const toggleUserStatus = async (userId) => {
    try {
      if (String(user?.id) === String(userId)) {
        return {
          success: false,
          message: "You cannot disable your own account.",
        };
      }

      const response = await toggleAdminUserStatus(userId);
      const updatedUser = normalizeUser(response?.data?.user);

      if (updatedUser) {
        setUsers((previousUsers) =>
          previousUsers.map((currentUser) =>
            currentUser.id === updatedUser.id ? updatedUser : currentUser
          )
        );
      }

      return {
        success: true,
        message: response?.message || "User status updated successfully.",
      };
    } catch (error) {
      return {
        success: false,
        message: getErrorMessage(error, "User status could not be updated."),
      };
    }
  };

  const logout = async () => {
    try {
      await logoutUser();
    } catch (error) {
      // Clear local session even if the server session is already gone.
    } finally {
      saveSessionUser(null);
      setUsers([]);
    }
  };

  const isAdmin = () => {
    return user?.role === "admin";
  };

  const isLoggedIn = () => {
    return user !== null;
  };

  const admins = useMemo(
    () => users.filter((currentUser) => currentUser.role === "admin"),
    [users]
  );

  const normalUsers = useMemo(
    () => users.filter((currentUser) => currentUser.role === "user"),
    [users]
  );

  const value = {
    user,
    token,
    users,
    admins,
    normalUsers,
    loading,
    usersLoading,
    login,
    register,
    logout,
    isAdmin,
    isLoggedIn,
    fetchUsers,
    changeUserRole,
    toggleUserStatus,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
