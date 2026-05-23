import { useState } from "react";
import { Link } from "react-router-dom";
import authService from "../../services/authService";
import {
  MdEmail,
  MdArrowBack,
  MdMarkEmailRead,
  MdErrorOutline,
} from "react-icons/md";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      setError("Email is required");
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError("Enter a valid email address");
      return;
    }

    setLoading(true);
    try {
      const res = await authService.forgotPassword(email);
      // Backend returns success:false with a message if email not found
      if (res.success) {
        setSent(true);
      } else {
        setError(res.message || "Something went wrong");
      }
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        "Something went wrong. Please try again.";
      // Show inline error for not-found emails
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="text-center">
        <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
          <MdMarkEmailRead
            size={32}
            className="text-green-600 dark:text-green-400"
          />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Check your email
        </h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mb-2">
          We've sent a password reset link to
        </p>
        <p className="text-primary-600 font-semibold text-sm mb-6">{email}</p>
        <p className="text-gray-400 text-xs mb-8">
          The link expires in 1 hour. If you don't see it, check your spam
          folder.
        </p>
        <Link
          to="/login"
          className="btn-primary inline-flex items-center gap-2"
        >
          <MdArrowBack size={18} /> Back to Sign In
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="w-14 h-14 bg-primary-100 dark:bg-primary-900/30 rounded-2xl flex items-center justify-center mb-5">
        <MdEmail size={28} className="text-primary-600 dark:text-primary-400" />
      </div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">
        Forgot Password?
      </h1>
      <p className="text-gray-500 dark:text-gray-400 text-sm mb-7">
        Enter your registered email and we'll send you a reset link.
      </p>

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <div>
          <label className="label">Email Address</label>
          <div className="relative">
            <MdEmail
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError("");
              }}
              className={`input pl-10 ${error ? "border-red-400 focus:ring-red-400" : ""}`}
            />
          </div>
          {error && (
            <div className="flex items-center gap-1.5 mt-1.5">
              <MdErrorOutline
                size={14}
                className="text-red-500 flex-shrink-0"
              />
              <p className="text-red-500 text-xs">{error}</p>
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full flex items-center justify-center gap-2"
        >
          {loading ? (
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            "Send Reset Link"
          )}
        </button>
      </form>

      <div className="mt-6 text-center">
        <Link
          to="/login"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
        >
          <MdArrowBack size={16} /> Back to Sign In
        </Link>
      </div>
    </div>
  );
};

export default ForgotPassword;
