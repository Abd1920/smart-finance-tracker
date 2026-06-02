import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import authService from "../../services/authService";
import GoogleButton from "../../components/auth/GoogleButton";
import {
  MdPerson,
  MdEmail,
  MdLock,
  MdVisibility,
  MdVisibilityOff,
  MdCheck,
  MdClose,
  MdErrorOutline,
  MdMarkEmailRead,
  MdArrowBack,
} from "react-icons/md";
import toast from "react-hot-toast";

const passwordRules = [
  { id: "length", label: "At least 8 characters", test: (p) => p.length >= 8 },
  {
    id: "uppercase",
    label: "One uppercase letter",
    test: (p) => /[A-Z]/.test(p),
  },
  {
    id: "lowercase",
    label: "One lowercase letter",
    test: (p) => /[a-z]/.test(p),
  },
  { id: "number", label: "One number", test: (p) => /[0-9]/.test(p) },
];

const getStrength = (password) => {
  const passed = passwordRules.filter((r) => r.test(password)).length;
  if (!password)
    return { label: "", color: "bg-gray-200", width: "w-0", textColor: "" };
  if (passed <= 1)
    return {
      label: "Weak",
      color: "bg-red-500",
      width: "w-1/4",
      textColor: "text-red-500",
    };
  if (passed === 2)
    return {
      label: "Fair",
      color: "bg-yellow-500",
      width: "w-2/4",
      textColor: "text-yellow-500",
    };
  if (passed === 3)
    return {
      label: "Good",
      color: "bg-blue-500",
      width: "w-3/4",
      textColor: "text-blue-500",
    };
  return {
    label: "Strong",
    color: "bg-green-500",
    width: "w-full",
    textColor: "text-green-500",
  };
};

// ─── Step 1: Registration form ────────────────────────────────────────────────
const RegisterForm = ({ onSent }) => {
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const strength = getStrength(form.password);

  const validate = () => {
    const e = {};
    if (!form.fullName.trim()) e.fullName = "Full name is required";
    else if (form.fullName.trim().length < 2)
      e.fullName = "At least 2 characters";
    if (!form.email.trim()) e.email = "Email is required";
    else if (!/^\S+@\S+\.\S+$/.test(form.email))
      e.email = "Enter a valid email address";
    if (!form.password) e.password = "Password is required";
    else if (!passwordRules.every((r) => r.test(form.password)))
      e.password = "Password does not meet all requirements";
    if (!form.confirmPassword)
      e.confirmPassword = "Please confirm your password";
    else if (form.password !== form.confirmPassword)
      e.confirmPassword = "Passwords do not match";
    return e;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
    if (errors[name]) setErrors((p) => ({ ...p, [name]: "" }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setLoading(true);
    try {
      await authService.sendVerification({
        fullName: form.fullName,
        email: form.email,
        password: form.password,
      });
      toast.success("Verification code sent! Check your email.");
      onSent({ email: form.email, fullName: form.fullName });
    } catch (err) {
      const msg =
        err.response?.data?.message || "Failed to send verification email";
      if (msg.toLowerCase().includes("already exists")) {
        setErrors({ email: msg });
      } else {
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">
        Create Account 🚀
      </h1>
      <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
        Start your financial journey today
      </p>

      <GoogleButton label="Continue with Google" />

      <div className="flex items-center gap-3 my-5">
        <div className="flex-1 h-px bg-gray-200 dark:bg-gray-600" />
        <span className="text-xs text-gray-400 font-medium">OR</span>
        <div className="flex-1 h-px bg-gray-200 dark:bg-gray-600" />
      </div>

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {/* Full Name */}
        <div>
          <label className="label">Full Name</label>
          <div className="relative">
            <MdPerson
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              name="fullName"
              type="text"
              autoComplete="name"
              placeholder="Your full name"
              value={form.fullName}
              onChange={handleChange}
              className={`input pl-10 ${errors.fullName ? "border-red-400" : ""}`}
            />
          </div>
          {errors.fullName && (
            <div className="flex items-center gap-1.5 mt-1.5">
              <MdErrorOutline
                size={14}
                className="text-red-500 flex-shrink-0"
              />
              <p className="text-red-500 text-xs">{errors.fullName}</p>
            </div>
          )}
        </div>

        {/* Email */}
        <div>
          <label className="label">Email Address</label>
          <div className="relative">
            <MdEmail
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={handleChange}
              className={`input pl-10 ${errors.email ? "border-red-400" : ""}`}
            />
          </div>
          {errors.email && (
            <div className="flex items-center gap-1.5 mt-1.5">
              <MdErrorOutline
                size={14}
                className="text-red-500 flex-shrink-0"
              />
              <p className="text-red-500 text-xs">{errors.email}</p>
            </div>
          )}
        </div>

        {/* Password */}
        <div>
          <label className="label">Password</label>
          <div className="relative">
            <MdLock
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="Create a strong password"
              value={form.password}
              onChange={handleChange}
              className={`input pl-10 pr-10 [&::-ms-reveal]:hidden [&::-webkit-credentials-auto-fill-button]:hidden ${errors.password ? "border-red-400" : ""}`}
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
          {form.password && (
            <>
              <div className="mt-2">
                <div className="h-1.5 w-full bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${strength.color} ${strength.width}`}
                  />
                </div>
                <p className={`text-xs mt-1 font-medium ${strength.textColor}`}>
                  {strength.label}
                </p>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-1">
                {passwordRules.map((rule) => {
                  const passed = rule.test(form.password);
                  return (
                    <div
                      key={rule.id}
                      className={`flex items-center gap-1.5 text-xs ${passed ? "text-green-600" : "text-gray-400"}`}
                    >
                      {passed ? <MdCheck size={12} /> : <MdClose size={12} />}
                      {rule.label}
                    </div>
                  );
                })}
              </div>
            </>
          )}
          {errors.password && (
            <div className="flex items-center gap-1.5 mt-1.5">
              <MdErrorOutline
                size={14}
                className="text-red-500 flex-shrink-0"
              />
              <p className="text-red-500 text-xs">{errors.password}</p>
            </div>
          )}
        </div>

        {/* Confirm Password */}
        <div>
          <label className="label">Confirm Password</label>
          <div className="relative">
            <MdLock
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              name="confirmPassword"
              type={showConfirm ? "text" : "password"}
              autoComplete="new-password"
              placeholder="Repeat your password"
              value={form.confirmPassword}
              onChange={handleChange}
              className={`input pl-10 pr-10 [&::-ms-reveal]:hidden [&::-webkit-credentials-auto-fill-button]:hidden ${errors.confirmPassword ? "border-red-400" : ""}`}
            />
            <button
              type="button"
              tabIndex={-1}
              onMouseDown={(e) => {
                e.preventDefault();
                setShowConfirm((v) => !v);
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 z-10"
            >
              {showConfirm ? (
                <MdVisibilityOff size={18} />
              ) : (
                <MdVisibility size={18} />
              )}
            </button>
          </div>
          {errors.confirmPassword && (
            <div className="flex items-center gap-1.5 mt-1.5">
              <MdErrorOutline
                size={14}
                className="text-red-500 flex-shrink-0"
              />
              <p className="text-red-500 text-xs">{errors.confirmPassword}</p>
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full flex items-center justify-center gap-2 mt-2"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Sending verification code...
            </span>
          ) : (
            "Create Account"
          )}
        </button>
      </form>

      <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
        Already have an account?{" "}
        <Link
          to="/login"
          className="text-primary-600 hover:text-primary-700 font-semibold"
        >
          Sign In
        </Link>
      </p>
    </div>
  );
};

// ─── Step 2: OTP verification ─────────────────────────────────────────────────
const OTPVerification = ({ email, fullName, onBack }) => {
  const navigate = useNavigate();
  const { completeRegistration } = useAuth(); // ← uses proper AUTH_SUCCESS dispatch

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const updated = [...otp];
    updated[index] = value.slice(-1);
    setOtp(updated);
    setError("");
    if (value && index < 5)
      document.getElementById(`otp-${index + 1}`)?.focus();
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      document.getElementById(`otp-${index - 1}`)?.focus();
    }
  };

  const handlePaste = (e) => {
    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 6);
    if (pasted.length === 6) {
      setOtp(pasted.split(""));
      document.getElementById("otp-5")?.focus();
    }
  };

  const handleVerify = async () => {
    const code = otp.join("");
    if (code.length < 6) {
      setError("Please enter the complete 6-digit code");
      return;
    }
    setLoading(true);
    try {
      const data = await authService.verifyEmail(email, code);
      completeRegistration(data);
      sessionStorage.setItem(
        "welcomeMsg",
        `Welcome to Smart Finance Tracker, ${data.user.fullName}! 🎉`,
      );
      navigate("/dashboard");
    } catch (err) {
      const msg = err.response?.data?.message || "Invalid verification code";
      setError(msg);
      setOtp(["", "", "", "", "", ""]);
      document.getElementById("otp-0")?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      await authService.sendVerification({
        fullName,
        email,
        password: "resend",
      });
      toast.success("New verification code sent!");
      setOtp(["", "", "", "", "", ""]);
      setError("");
      setResendTimer(60);
      const interval = setInterval(() => {
        setResendTimer((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch {
      toast.error("Failed to resend. Please try again.");
    } finally {
      setResending(false);
    }
  };

  return (
    <div>
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 mb-6"
      >
        <MdArrowBack size={16} /> Back
      </button>

      <div className="w-14 h-14 bg-primary-100 dark:bg-primary-900/30 rounded-2xl flex items-center justify-center mb-5">
        <MdMarkEmailRead
          size={28}
          className="text-primary-600 dark:text-primary-400"
        />
      </div>

      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">
        Verify your email
      </h1>
      <p className="text-gray-500 dark:text-gray-400 text-sm mb-1">
        We sent a 6-digit code to
      </p>
      <p className="text-primary-600 font-semibold text-sm mb-6">{email}</p>

      {/* OTP inputs */}
      <div className="flex gap-2 justify-center mb-4" onPaste={handlePaste}>
        {otp.map((digit, index) => (
          <input
            key={index}
            id={`otp-${index}`}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => handleOtpChange(index, e.target.value)}
            onKeyDown={(e) => handleOtpKeyDown(index, e)}
            className={`w-11 h-12 text-center text-lg font-bold rounded-xl border-2 bg-white dark:bg-gray-700
              text-gray-900 dark:text-gray-100 focus:outline-none transition-colors
              ${error ? "border-red-400" : digit ? "border-primary-500" : "border-gray-200 dark:border-gray-600"}
              focus:border-primary-500`}
          />
        ))}
      </div>

      {error && (
        <div className="flex items-center gap-1.5 mb-4 justify-center">
          <MdErrorOutline size={14} className="text-red-500 flex-shrink-0" />
          <p className="text-red-500 text-xs">{error}</p>
        </div>
      )}

      <button
        onClick={handleVerify}
        disabled={loading || otp.join("").length < 6}
        className="btn-primary w-full flex items-center justify-center gap-2 mb-4"
      >
        {loading ? (
          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : (
          "Verify & Create Account"
        )}
      </button>

      <div className="text-center">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Didn't receive the code?{" "}
          {resendTimer > 0 ? (
            <span className="text-gray-400">Resend in {resendTimer}s</span>
          ) : (
            <button
              onClick={handleResend}
              disabled={resending}
              className="text-primary-600 hover:text-primary-700 font-semibold"
            >
              {resending ? "Sending..." : "Resend"}
            </button>
          )}
        </p>
        <p className="text-xs text-gray-400 mt-1">
          Check your spam folder if you don't see it
        </p>
      </div>
    </div>
  );
};

// ─── Main Register component ──────────────────────────────────────────────────
const Register = () => {
  const [step, setStep] = useState("form");
  const [pendingData, setPendingData] = useState(null);

  if (step === "verify") {
    return (
      <OTPVerification
        email={pendingData.email}
        fullName={pendingData.fullName}
        onBack={() => setStep("form")}
      />
    );
  }

  return (
    <RegisterForm
      onSent={(data) => {
        setPendingData(data);
        setStep("verify");
      }}
    />
  );
};

export default Register;
