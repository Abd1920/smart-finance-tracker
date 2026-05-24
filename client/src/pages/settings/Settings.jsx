import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import authService from "../../services/authService";
import api from "../../services/api";
import {
  MdPerson,
  MdLock,
  MdPalette,
  MdCheck,
  MdCameraAlt,
  MdDelete,
  MdWarning,
  MdVisibility,
  MdVisibilityOff,
} from "react-icons/md";
import toast from "react-hot-toast";

const CURRENCIES = [
  { code: "LKR", label: "LKR - Sri Lankan Rupee" },
  { code: "QAR", label: "QAR - Qatari Riyal" },
  { code: "USD", label: "USD - US Dollar" },
  { code: "SAR", label: "SAR - Saudi Riyal" },
  { code: "INR", label: "INR - Indian Rupee" },
  { code: "AED", label: "AED - UAE Dirham" },
  { code: "EUR", label: "EUR - Euro" },
  { code: "GBP", label: "GBP - British Pound" },
];

// ── Delete Account modal ──────────────────────────────────────────────────────
const DeleteAccountModal = ({ user, onClose, onDeleted }) => {
  const [password, setPassword] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  const handleDelete = async () => {
    if (!user?.isGoogleUser && !password.trim()) {
      setError("Password is required to delete your account");
      return;
    }
    setDeleting(true);
    try {
      await api.delete("/auth/account", { data: { password } });
      onDeleted();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete account");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-sm bg-white dark:bg-gray-800 rounded-2xl shadow-2xl z-10 p-6">
        <div className="flex flex-col items-center text-center">
          <div className="w-14 h-14 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4">
            <MdWarning size={28} className="text-red-500" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">
            Delete Account
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            This will permanently delete your account and{" "}
            <strong>all your data</strong> - accounts, transactions, debts, and
            reports. This cannot be undone.
          </p>

          {!user?.isGoogleUser && (
            <div className="w-full mb-3">
              <input
                type="password"
                placeholder="Enter your password to confirm"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError("");
                }}
                className={`input text-sm ${error ? "border-red-400" : ""}`}
              />
              {error && (
                <p className="text-red-500 text-xs mt-1 text-left">{error}</p>
              )}
            </div>
          )}

          {user?.isGoogleUser && error && (
            <p className="text-red-500 text-xs mb-3">{error}</p>
          )}

          <div className="flex gap-3 w-full">
            <button
              onClick={onClose}
              disabled={deleting}
              className="btn-secondary flex-1"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-2.5 px-4 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {deleting ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                "Delete Account"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Main Settings page ────────────────────────────────────────────────────────
const Settings = () => {
  const { user, updateUser, logout } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [profile, setProfile] = useState({
    fullName: user?.fullName || "",
    currency: user?.currency || "LKR",
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar || "");
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showPasswords, setShowPasswords] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState({});

  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const isGoogleOnly = user?.isGoogleUser && !user?.hasPassword;

  const getInitials = (name) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image must be under 2MB");
      return;
    }

    // Show local preview immediately
    const localPreview = URL.createObjectURL(file);
    setAvatarPreview(localPreview);
    setUploadingAvatar(true);

    try {
      const data = await authService.uploadAvatar(file);
      updateUser(data.user);
      setAvatarPreview(data.avatar); // replace local blob with Cloudinary URL
      toast.success("Profile picture updated");
    } catch {
      toast.error("Failed to update profile picture");
      setAvatarPreview(user?.avatar || "");
    } finally {
      setUploadingAvatar(false);
      // Clean up local blob URL
      URL.revokeObjectURL(localPreview);
    }
  };

  const handleRemoveAvatar = async () => {
    setUploadingAvatar(true);
    try {
      await authService.removeAvatar();
      updateUser({ ...user, avatar: "", avatarPublicId: null });
      setAvatarPreview("");
      toast.success("Profile picture removed");
    } catch {
      toast.error("Failed to remove profile picture");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    if (!profile.fullName.trim()) {
      toast.error("Full name is required");
      return;
    }
    setSavingProfile(true);
    try {
      const data = await authService.updateProfile(profile);
      updateUser(data.user);
      toast.success("Profile updated");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update profile");
    } finally {
      setSavingProfile(false);
    }
  };

  const validatePasswords = () => {
    const e = {};
    // Regular (non-Google) users ALWAYS have a password — require current password
    // Google users only require current password if they've already set one (hasPassword: true)
    const needsCurrentPassword = !user?.isGoogleUser || user?.hasPassword;
    if (needsCurrentPassword) {
      if (!passwords.currentPassword)
        e.currentPassword = "Current password is required";
    }
    if (!passwords.newPassword) e.newPassword = "New password is required";
    else if (passwords.newPassword.length < 6)
      e.newPassword = "At least 6 characters";
    if (passwords.newPassword !== passwords.confirmPassword)
      e.confirmPassword = "Passwords do not match";
    return e;
  };

  const handlePasswordSave = async (e) => {
    e.preventDefault();
    const errs = validatePasswords();
    if (Object.keys(errs).length > 0) {
      setPasswordErrors(errs);
      return;
    }
    setSavingPassword(true);
    try {
      const res = await authService.changePassword({
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword,
      });
      toast.success(
        user?.isGoogleUser && !user?.hasPassword
          ? "Password set! You can now also sign in with email."
          : "Password changed successfully",
      );
      setPasswords({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setPasswordErrors({});
      // Update hasPassword in context so current password field shows on next change
      if (res?.hasPassword !== undefined) {
        updateUser({ ...user, hasPassword: res.hasPassword });
      } else {
        updateUser({ ...user, hasPassword: true });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update password");
    } finally {
      setSavingPassword(false);
    }
  };

  const handleDarkMode = async (val) => {
    document.body.classList.toggle("dark", val);
    try {
      const data = await authService.updateProfile({ darkMode: val });
      updateUser(data.user);
    } catch {
      updateUser({ ...user, darkMode: val });
    }
  };

  const handleDeleted = () => {
    toast.success("Account deleted successfully");
    logout();
    navigate("/login");
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
          Settings
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
          Manage your account and preferences
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ── LEFT COLUMN ── */}
        <div className="space-y-6">
          {/* Profile Picture */}
          <div className="card">
            <div className="flex items-center gap-3 mb-5">
              <MdCameraAlt size={20} className="text-primary-600" />
              <h3 className="text-base font-semibold text-gray-800 dark:text-gray-200">
                Profile Picture
              </h3>
            </div>
            <div className="flex items-center gap-5">
              <div className="relative flex-shrink-0">
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt="Profile"
                    className="w-20 h-20 rounded-full object-cover ring-4 ring-primary-100 dark:ring-primary-900/40"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center ring-4 ring-primary-50 dark:ring-primary-900/20">
                    <span className="text-2xl font-bold text-primary-700 dark:text-primary-300">
                      {getInitials(user?.fullName)}
                    </span>
                  </div>
                )}
                {uploadingAvatar && (
                  <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center">
                    <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-0.5">
                  {user?.fullName}
                </p>
                <p className="text-xs text-gray-400 mb-3">
                  JPG, PNG or GIF · Max 2MB
                </p>
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingAvatar}
                    className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1.5"
                  >
                    <MdCameraAlt size={14} />
                    {avatarPreview ? "Change Photo" : "Upload Photo"}
                  </button>
                  {avatarPreview && (
                    <button
                      onClick={handleRemoveAvatar}
                      disabled={uploadingAvatar}
                      className="text-xs py-1.5 px-3 flex items-center gap-1.5 border border-red-200 dark:border-red-800 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    >
                      <MdDelete size={14} /> Remove
                    </button>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
              </div>
            </div>
          </div>

          {/* Profile Info */}
          <div className="card">
            <div className="flex items-center gap-3 mb-5">
              <MdPerson size={20} className="text-primary-600" />
              <h3 className="text-base font-semibold text-gray-800 dark:text-gray-200">
                Profile Information
              </h3>
            </div>
            <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <p className="text-xs text-gray-400 mb-0.5">Email address</p>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {user?.email}
              </p>
              {user?.isGoogleUser && (
                <span className="inline-flex items-center gap-1 mt-1 text-xs text-blue-600 dark:text-blue-400">
                  <svg width="12" height="12" viewBox="0 0 18 18">
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
                  Connected with Google
                </span>
              )}
            </div>
            <form onSubmit={handleProfileSave} className="space-y-4">
              <div>
                <label className="label">Full Name</label>
                <input
                  value={profile.fullName}
                  onChange={(e) =>
                    setProfile((p) => ({ ...p, fullName: e.target.value }))
                  }
                  className="input"
                  placeholder="Your full name"
                />
              </div>
              <div>
                <label className="label">Currency</label>
                <select
                  value={profile.currency}
                  onChange={(e) =>
                    setProfile((p) => ({ ...p, currency: e.target.value }))
                  }
                  className="input"
                >
                  {CURRENCIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="submit"
                disabled={savingProfile}
                className="btn-primary flex items-center gap-2"
              >
                {savingProfile ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <MdCheck size={18} />
                )}
                Save Changes
              </button>
            </form>
          </div>
        </div>

        {/* ── RIGHT COLUMN ── */}
        <div className="space-y-6">
          {/* Appearance */}
          <div className="card">
            <div className="flex items-center gap-3 mb-5">
              <MdPalette size={20} className="text-primary-600" />
              <h3 className="text-base font-semibold text-gray-800 dark:text-gray-200">
                Appearance
              </h3>
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
              <div>
                <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                  Dark Mode
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  Switch between light and dark theme
                </p>
              </div>
              <button
                onClick={() => handleDarkMode(!user?.darkMode)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${user?.darkMode ? "bg-primary-600" : "bg-gray-200 dark:bg-gray-600"}`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${user?.darkMode ? "translate-x-6" : "translate-x-1"}`}
                />
              </button>
            </div>
          </div>

          {/* Change / Set Password */}
          <div className="card">
            <div className="flex items-center gap-3 mb-5">
              <MdLock size={20} className="text-primary-600" />
              <h3 className="text-base font-semibold text-gray-800 dark:text-gray-200">
                {user?.isGoogleUser && !user?.hasPassword
                  ? "Set a Password"
                  : "Change Password"}
              </h3>
            </div>

            {user?.isGoogleUser && !user?.hasPassword && (
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl mb-4">
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  You signed in with Google. Set a password to also sign in with
                  your email and password.
                </p>
              </div>
            )}

            <form onSubmit={handlePasswordSave} className="space-y-4">
              {/* Current password — for regular users always, for Google users only after they set one */}
              {(!user?.isGoogleUser || user?.hasPassword) && (
                <div>
                  <label className="label">Current Password</label>
                  <div className="relative">
                    <input
                      type={showPasswords ? "text" : "password"}
                      value={passwords.currentPassword}
                      onChange={(e) => {
                        setPasswords((p) => ({
                          ...p,
                          currentPassword: e.target.value,
                        }));
                        if (passwordErrors.currentPassword)
                          setPasswordErrors((p) => ({
                            ...p,
                            currentPassword: "",
                          }));
                      }}
                      placeholder="Enter your current password"
                      className={`input pr-10 ${passwordErrors.currentPassword ? "border-red-400" : ""}`}
                    />
                  </div>
                  {passwordErrors.currentPassword && (
                    <p className="text-red-500 text-xs mt-1">
                      {passwordErrors.currentPassword}
                    </p>
                  )}
                </div>
              )}

              <div>
                <label className="label">New Password</label>
                <div className="relative">
                  <input
                    type={showPasswords ? "text" : "password"}
                    value={passwords.newPassword}
                    onChange={(e) => {
                      setPasswords((p) => ({
                        ...p,
                        newPassword: e.target.value,
                      }));
                      if (passwordErrors.newPassword)
                        setPasswordErrors((p) => ({ ...p, newPassword: "" }));
                    }}
                    placeholder="Min. 6 characters"
                    className={`input pr-10 ${passwordErrors.newPassword ? "border-red-400" : ""}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPasswords ? (
                      <MdVisibilityOff size={18} />
                    ) : (
                      <MdVisibility size={18} />
                    )}
                  </button>
                </div>
                {passwordErrors.newPassword && (
                  <p className="text-red-500 text-xs mt-1">
                    {passwordErrors.newPassword}
                  </p>
                )}
              </div>

              <div>
                <label className="label">Confirm Password</label>
                <input
                  type={showPasswords ? "text" : "password"}
                  value={passwords.confirmPassword}
                  onChange={(e) => {
                    setPasswords((p) => ({
                      ...p,
                      confirmPassword: e.target.value,
                    }));
                    if (passwordErrors.confirmPassword)
                      setPasswordErrors((p) => ({ ...p, confirmPassword: "" }));
                  }}
                  placeholder="Repeat new password"
                  className={`input ${passwordErrors.confirmPassword ? "border-red-400" : ""}`}
                />
                {passwordErrors.confirmPassword && (
                  <p className="text-red-500 text-xs mt-1">
                    {passwordErrors.confirmPassword}
                  </p>
                )}
              </div>

              <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showPasswords}
                  onChange={(e) => setShowPasswords(e.target.checked)}
                  className="rounded"
                />
                Show passwords
              </label>

              <button
                type="submit"
                disabled={savingPassword}
                className="btn-primary flex items-center gap-2"
              >
                {savingPassword ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <MdLock size={18} />
                )}
                {user?.isGoogleUser && !user?.hasPassword
                  ? "Set Password"
                  : "Change Password"}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* ── FULL WIDTH BOTTOM ROW ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* About */}
        <div className="card bg-gray-50 dark:bg-gray-800/50 shadow-none border border-dashed border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center py-8">
          <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1">
            Smart Finance Tracker
          </p>
          <p className="text-xs text-gray-400">
            Your data is encrypted and stored securely
          </p>
          <p className="text-xs text-gray-300 dark:text-gray-600 mt-1">
            Member since{" "}
            {new Date(user?.createdAt).toLocaleDateString("en-LK", {
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>

        {/* Delete Account */}
        <div className="card border border-red-100 dark:border-red-900/30 flex flex-col justify-between">
          <div className="mb-4">
            <h3 className="text-base font-semibold text-gray-800 dark:text-gray-200 mb-2">
              Delete Account
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Permanently delete your account and all associated data. This
              action cannot be undone.
            </p>
          </div>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-lg text-sm font-medium hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors w-fit"
          >
            <MdDelete size={18} />
            Delete My Account
          </button>
        </div>
      </div>

      {showDeleteModal && (
        <DeleteAccountModal
          user={user}
          onClose={() => setShowDeleteModal(false)}
          onDeleted={handleDeleted}
        />
      )}
    </div>
  );
};

export default Settings;
