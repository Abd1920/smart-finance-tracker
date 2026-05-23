import { useState } from "react";
import { Link } from "react-router-dom";
import GoogleButton from "../../components/auth/GoogleButton";
import {
  MdEmail,
  MdLock,
  MdVisibility,
  MdVisibilityOff,
  MdErrorOutline,
} from "react-icons/md";
import authService from "../../services/authService";

// Login does NOT import useAuth or useNavigate at the top level.
// This means AuthContext re-renders can never unmount this component.
// On success we do a hard redirect. On error we just set local state.

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [generalError, setGeneralError] = useState("");

  const handleSubmit = async () => {
    // Clear previous errors
    setEmailError("");
    setPasswordError("");
    setGeneralError("");

    // Client-side validation
    let valid = true;
    if (!email.trim()) {
      setEmailError("Email is required");
      valid = false;
    } else if (!/^\S+@\S+\.\S+$/.test(email)) {
      setEmailError("Enter a valid email address");
      valid = false;
    }
    if (!password) {
      setPasswordError("Password is required");
      valid = false;
    }
    if (!valid) return;

    setLoading(true);
    try {
      const data = await authService.login({ email, password });
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      // Store welcome message to show after redirect
      sessionStorage.setItem(
        "welcomeMsg",
        `Welcome back, ${data.user.fullName}!`,
      );
      window.location.href = "/dashboard";
    } catch (error) {
      setLoading(false); // only set false on error - success navigates away
      const res = error.response?.data;
      const message = res?.message || "Login failed. Please try again.";
      const field = res?.field || null;
      if (field === "email") setEmailError(message);
      else if (field === "password") setPasswordError(message);
      else setGeneralError(message);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">
        Welcome Back 👋
      </h1>
      <p className="text-gray-500 dark:text-gray-400 text-sm mb-7">
        Sign in to continue managing your finances
      </p>

      <GoogleButton label="Continue with Google" />

      <div className="flex items-center gap-3 my-5">
        <div className="flex-1 h-px bg-gray-200 dark:bg-gray-600" />
        <span className="text-xs text-gray-400 font-medium">OR</span>
        <div className="flex-1 h-px bg-gray-200 dark:bg-gray-600" />
      </div>

      {/* General error banner */}
      {generalError && (
        <div className="flex items-center gap-2 p-3 mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <MdErrorOutline size={18} className="text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-600 dark:text-red-400">
            {generalError}
          </p>
        </div>
      )}

      <div className="space-y-4">
        {/* Email */}
        <div>
          <label className="label" htmlFor="login-email">
            Email Address
          </label>
          <div className="relative">
            <MdEmail
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
            />
            <input
              id="login-email"
              type="text"
              inputMode="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setEmailError("");
                setGeneralError("");
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSubmit();
              }}
              className={`input pl-10 ${emailError ? "border-red-400 focus:ring-red-400" : ""}`}
            />
          </div>
          {emailError && (
            <div className="flex items-center gap-1.5 mt-1.5">
              <MdErrorOutline
                size={14}
                className="text-red-500 flex-shrink-0"
              />
              <p className="text-red-500 text-xs">{emailError}</p>
            </div>
          )}
        </div>

        {/* Password */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="label mb-0" htmlFor="login-password">
              Password
            </label>
            <Link
              to="/forgot-password"
              className="text-xs text-primary-600 hover:text-primary-700 font-medium"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <MdLock
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
            />
            <input
              id="login-password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setPasswordError("");
                setGeneralError("");
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSubmit();
              }}
              className={`input pl-10 pr-10 [&::-ms-reveal]:hidden [&::-webkit-credentials-auto-fill-button]:hidden ${passwordError ? "border-red-400 focus:ring-red-400" : ""}`}
            />
            <button
              type="button"
              tabIndex={-1}
              onMouseDown={(e) => {
                e.preventDefault();
                setShowPassword((v) => !v);
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 z-10"
            >
              {showPassword ? (
                <MdVisibilityOff size={18} />
              ) : (
                <MdVisibility size={18} />
              )}
            </button>
          </div>
          {passwordError && (
            <div className="flex items-center gap-1.5 mt-1.5">
              <MdErrorOutline
                size={14}
                className="text-red-500 flex-shrink-0"
              />
              <p className="text-red-500 text-xs">{passwordError}</p>
            </div>
          )}
        </div>

        {/* Remember Me */}
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
          />
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Remember me
          </span>
        </label>

        <button
          type="button"
          disabled={loading}
          onClick={handleSubmit}
          className="btn-primary w-full flex items-center justify-center gap-2 mt-2"
        >
          {loading ? (
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            "Sign In"
          )}
        </button>
      </div>

      <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
        Don't have an account?{" "}
        <Link
          to="/register"
          className="text-primary-600 hover:text-primary-700 font-semibold"
        >
          Sign Up
        </Link>
      </p>
    </div>
  );
};

export default Login;
