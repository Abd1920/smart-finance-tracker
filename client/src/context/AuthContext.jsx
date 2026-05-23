import { createContext, useContext, useReducer, useEffect } from "react";
import authService from "../services/authService";
import toast from "react-hot-toast";

const AuthContext = createContext(null);

const initialState = {
  user: JSON.parse(localStorage.getItem("user")) || null,
  token: localStorage.getItem("token") || null,
  isLoading: false,
  isAuthenticated: !!localStorage.getItem("token"),
};

const authReducer = (state, action) => {
  switch (action.type) {
    case "SET_LOADING":
      return { ...state, isLoading: action.payload };
    case "AUTH_SUCCESS":
      localStorage.setItem("token", action.payload.token);
      localStorage.setItem("user", JSON.stringify(action.payload.user));
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false,
      };
    case "UPDATE_USER":
      localStorage.setItem("user", JSON.stringify(action.payload));
      return { ...state, user: action.payload };
    case "LOGOUT":
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("readNotifications");
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      };
    default:
      return state;
  }
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    if (state.user?.darkMode) document.body.classList.add("dark");
    else document.body.classList.remove("dark");
  }, [state.user?.darkMode]);

  // Used after OTP verification — full auth just like login
  const completeRegistration = (tokenData) => {
    localStorage.setItem("token", tokenData.token);
    localStorage.setItem("user", JSON.stringify(tokenData.user));
    dispatch({ type: "AUTH_SUCCESS", payload: tokenData });
  };

  // Login — no SET_LOADING dispatch to prevent form state clearing on re-render
  const login = async (formData) => {
    try {
      const data = await authService.login(formData);
      dispatch({ type: "AUTH_SUCCESS", payload: data });
      toast.success(`Welcome back, ${data.user.fullName}!`);
      return { success: true };
    } catch (error) {
      const res = error.response?.data;
      const message = res?.message || "Login failed. Please try again.";
      const field = res?.field || null;
      if (!field) toast.error(message);
      return { success: false, message, field };
    }
  };

  const googleLogin = async (accessToken, userInfo) => {
    try {
      const data = await authService.googleAuth(null, accessToken, userInfo);
      dispatch({ type: "AUTH_SUCCESS", payload: data });
      return { success: true, data };
    } catch (error) {
      const message = error.response?.data?.message || "Google sign-in failed";
      return { success: false, message };
    }
  };

  // Expose performLogout so Sidebar can call it after confirmation
  const performLogout = () => {
    dispatch({ type: "LOGOUT" });
    toast.success("Logged out successfully");
  };

  const updateUser = (userData) => {
    dispatch({ type: "UPDATE_USER", payload: userData });
  };

  return (
    <AuthContext.Provider
      value={{
        user: state.user,
        token: state.token,
        isLoading: state.isLoading,
        isAuthenticated: state.isAuthenticated,
        login,
        googleLogin,
        completeRegistration,
        logout: performLogout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};

export default AuthContext;
