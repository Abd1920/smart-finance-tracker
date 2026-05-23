import { useState } from "react";
import { useGoogleLogin } from "@react-oauth/google";
import authService from "../../services/authService";
import toast from "react-hot-toast";

// GoogleButton does NOT use useAuth or useNavigate
// to avoid triggering AuthContext re-renders that unmount the Login component
const GoogleButton = ({ label = "Continue with Google" }) => {
  const [loading, setLoading] = useState(false);

  const login = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setLoading(true);
      try {
        const userInfoRes = await fetch(
          "https://www.googleapis.com/oauth2/v3/userinfo",
          {
            headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
          },
        );
        const userInfo = await userInfoRes.json();
        const data = await authService.googleAuth(
          null,
          tokenResponse.access_token,
          userInfo,
        );
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        sessionStorage.setItem("welcomeMsg", `Welcome, ${data.user.fullName}!`);
        window.location.href = "/dashboard";
      } catch (err) {
        setLoading(false);
        const message = err.response?.data?.message || "Google sign-in failed";
        toast.error(message);
      }
    },
    onError: () => {
      toast.error("Google sign-in was cancelled or failed");
    },
  });

  return (
    <button
      type="button"
      onClick={() => login()}
      disabled={loading}
      className="w-full flex items-center justify-center gap-3 px-4 py-2.5 border-2 border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 font-medium text-sm hover:bg-gray-50 dark:hover:bg-gray-600 hover:border-gray-300 dark:hover:border-gray-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {loading ? (
        <span className="w-4 h-4 border-2 border-gray-300 border-t-primary-500 rounded-full animate-spin" />
      ) : (
        <svg
          width="18"
          height="18"
          viewBox="0 0 18 18"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fill="#4285F4"
            d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 002.38-5.88c0-.57-.05-.66-.15-1.18z"
          />
          <path
            fill="#34A853"
            d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2a4.8 4.8 0 01-7.18-2.54H1.83v2.07A8 8 0 008.98 17z"
          />
          <path
            fill="#FBBC05"
            d="M4.5 10.52a4.8 4.8 0 010-3.04V5.41H1.83a8 8 0 000 7.18l2.67-2.07z"
          />
          <path
            fill="#EA4335"
            d="M8.98 4.18c1.17 0 2.23.4 3.06 1.2l2.3-2.3A8 8 0 001.83 5.4L4.5 7.49a4.77 4.77 0 014.48-3.31z"
          />
        </svg>
      )}
      {label}
    </button>
  );
};

export default GoogleButton;
