import { createContext, useContext, useEffect, useState } from "react";
import { logoutUser } from "../services/api";

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

const defaultUsers = [
  {
    id: 1,
    name: "Admin",
    email: "admin@gmail.com",
    role: "admin",
    status: "active",
    createdAt: "2026-05-01",
  },
  {
    id: 2,
    name: "Rahul",
    email: "rahul@gmail.com",
    role: "user",
    status: "active",
    createdAt: "2026-05-02",
  },
  {
    id: 3,
    name: "Priya",
    email: "priya@gmail.com",
    role: "user",
    status: "active",
    createdAt: "2026-05-03",
  },
];

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [users, setUsers] = useState(defaultUsers);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    const savedToken = localStorage.getItem("token");
    const savedUsers = localStorage.getItem("users");

    if (savedUsers) {
      const parsedUsers = JSON.parse(savedUsers);

      const updatedUsers = parsedUsers.map((currentUser) => ({
        ...currentUser,
        status: currentUser.status || "active",
        createdAt:
          currentUser.createdAt || new Date().toISOString().split("T")[0],
      }));

      setUsers(updatedUsers);
    }

    if (savedUser && savedToken) {
      setUser(JSON.parse(savedUser));
      setToken(savedToken);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    localStorage.setItem("users", JSON.stringify(users));
  }, [users]);

  const login = async (loginData) => {
    try {
      if (!loginData.email || !loginData.password) {
        return {
          success: false,
          message: "Please enter email and password",
        };
      }

      let existingUser = users.find(
        (currentUser) => currentUser.email === loginData.email
      );

      if (!existingUser) {
        existingUser = {
          id: Date.now(),
          name: loginData.email.split("@")[0],
          email: loginData.email,
          role: loginData.email.includes("admin") ? "admin" : "user",
          status: "active",
          createdAt: new Date().toISOString().split("T")[0],
        };

        setUsers((previousUsers) => [...previousUsers, existingUser]);
      }

      if (existingUser.status === "disabled") {
        return {
          success: false,
          message: "Your account is disabled. Please contact admin.",
        };
      }

      const tempToken = "temp-token-" + loginData.email;

      localStorage.setItem("token", tempToken);
      localStorage.setItem("user", JSON.stringify(existingUser));

      setToken(tempToken);
      setUser(existingUser);

      return {
        success: true,
        user: existingUser,
      };
    } catch (error) {
      return {
        success: false,
        message: "Login failed",
      };
    }
  };

  const register = async (registerData) => {
    try {
      const alreadyExists = users.some(
        (currentUser) => currentUser.email === registerData.email
      );

      if (alreadyExists) {
        return {
          success: false,
          message: "User already exists",
        };
      }

      const newUser = {
        id: Date.now(),
        name: registerData.name,
        email: registerData.email,
        role: registerData.role || "user",
        status: "active",
        createdAt: new Date().toISOString().split("T")[0],
      };

      setUsers((previousUsers) => [...previousUsers, newUser]);

      return {
        success: true,
        data: newUser,
      };
    } catch (error) {
      return {
        success: false,
        message: "Registration failed",
      };
    }
  };

  const changeUserRole = (userId) => {
    setUsers((previousUsers) =>
      previousUsers.map((currentUser) =>
        currentUser.id === userId
          ? {
              ...currentUser,
              role: currentUser.role === "admin" ? "user" : "admin",
            }
          : currentUser
      )
    );

    const loggedInUser = JSON.parse(localStorage.getItem("user"));

    if (loggedInUser?.id === userId) {
      const updatedLoggedInUser = {
        ...loggedInUser,
        role: loggedInUser.role === "admin" ? "user" : "admin",
      };

      localStorage.setItem("user", JSON.stringify(updatedLoggedInUser));
      setUser(updatedLoggedInUser);
    }
  };

  const toggleUserStatus = (userId) => {
    setUsers((previousUsers) =>
      previousUsers.map((currentUser) =>
        currentUser.id === userId
          ? {
              ...currentUser,
              status:
                currentUser.status === "active" ? "disabled" : "active",
            }
          : currentUser
      )
    );
  };

  const logout = () => {
    logoutUser();
    setUser(null);
    setToken(null);
  };

  const isAdmin = () => {
    return user?.role === "admin";
  };

  const isLoggedIn = () => {
    return user !== null && token !== null;
  };

  const admins = users.filter((currentUser) => currentUser.role === "admin");

  const normalUsers = users.filter((currentUser) => currentUser.role === "user");

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
    changeUserRole,
    toggleUserStatus,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};