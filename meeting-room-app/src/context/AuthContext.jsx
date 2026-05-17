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

    let finalUsers = defaultUsers;

    if (savedUsers) {
      try {
        const parsedUsers = JSON.parse(savedUsers);

        finalUsers = parsedUsers.map((currentUser) => ({
          ...currentUser,
          status: currentUser.status || "active",
          createdAt:
            currentUser.createdAt || new Date().toISOString().split("T")[0],
        }));
      } catch (error) {
        finalUsers = defaultUsers;
      }
    }

    const activeAdmins = finalUsers.filter(
      (currentUser) =>
        currentUser.role === "admin" && currentUser.status !== "disabled"
    );

    /*
      Safety repair:
      If all admins were accidentally changed to users or disabled,
      restore the default admin account automatically.
    */
    if (activeAdmins.length === 0) {
      const defaultAdmin = defaultUsers[0];

      const adminAlreadyExists = finalUsers.some(
        (currentUser) => currentUser.email === defaultAdmin.email
      );

      if (adminAlreadyExists) {
        finalUsers = finalUsers.map((currentUser) =>
          currentUser.email === defaultAdmin.email
            ? {
                ...currentUser,
                role: "admin",
                status: "active",
              }
            : currentUser
        );
      } else {
        finalUsers = [defaultAdmin, ...finalUsers];
      }
    }

    setUsers(finalUsers);
    localStorage.setItem("users", JSON.stringify(finalUsers));

    if (savedUser && savedToken) {
      try {
        const parsedSavedUser = JSON.parse(savedUser);

        const latestUserData = finalUsers.find(
          (currentUser) => currentUser.id === parsedSavedUser.id
        );

        if (latestUserData && latestUserData.status !== "disabled") {
          setUser(latestUserData);
          setToken(savedToken);
          localStorage.setItem("user", JSON.stringify(latestUserData));
        } else {
          localStorage.removeItem("user");
          localStorage.removeItem("token");
        }
      } catch (error) {
        localStorage.removeItem("user");
        localStorage.removeItem("token");
      }
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    if (!loading) {
      localStorage.setItem("users", JSON.stringify(users));
    }
  }, [users, loading]);

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
    const targetUser = users.find(
      (currentUser) => Number(currentUser.id) === Number(userId)
    );

    if (!targetUser) {
      return {
        success: false,
        message: "User not found.",
      };
    }

    /*
      Rule 1:
      Admin cannot change own role.
    */
    if (Number(user?.id) === Number(userId)) {
      return {
        success: false,
        message: "You cannot change your own admin role.",
      };
    }

    const activeAdmins = users.filter(
      (currentUser) =>
        currentUser.role === "admin" && currentUser.status !== "disabled"
    );

    /*
      Rule 3:
      At least one active admin must always remain.
    */
    if (targetUser.role === "admin" && activeAdmins.length <= 1) {
      return {
        success: false,
        message: "At least one active admin must remain in the system.",
      };
    }

    const updatedUsers = users.map((currentUser) =>
      Number(currentUser.id) === Number(userId)
        ? {
            ...currentUser,
            role: currentUser.role === "admin" ? "user" : "admin",
          }
        : currentUser
    );

    setUsers(updatedUsers);
    localStorage.setItem("users", JSON.stringify(updatedUsers));

    return {
      success: true,
      message: "User role updated successfully.",
    };
  };

  const toggleUserStatus = (userId) => {
    const targetUser = users.find(
      (currentUser) => Number(currentUser.id) === Number(userId)
    );

    if (!targetUser) {
      return {
        success: false,
        message: "User not found.",
      };
    }

    /*
      Rule 2:
      Admin cannot disable own account.
    */
    if (
      Number(user?.id) === Number(userId) &&
      targetUser.status === "active"
    ) {
      return {
        success: false,
        message: "You cannot disable your own account.",
      };
    }

    const activeAdmins = users.filter(
      (currentUser) =>
        currentUser.role === "admin" && currentUser.status !== "disabled"
    );

    /*
      Rule 3:
      At least one active admin must always remain.
    */
    if (
      targetUser.role === "admin" &&
      targetUser.status === "active" &&
      activeAdmins.length <= 1
    ) {
      return {
        success: false,
        message: "At least one active admin must remain in the system.",
      };
    }

    const updatedUsers = users.map((currentUser) =>
      Number(currentUser.id) === Number(userId)
        ? {
            ...currentUser,
            status: currentUser.status === "active" ? "disabled" : "active",
          }
        : currentUser
    );

    setUsers(updatedUsers);
    localStorage.setItem("users", JSON.stringify(updatedUsers));

    return {
      success: true,
      message:
        targetUser.status === "active"
          ? "User disabled successfully."
          : "User enabled successfully.",
    };
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