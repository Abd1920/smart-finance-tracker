import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useNotifications } from "../../context/NotificationContext";
import {
  MdMenu,
  MdDarkMode,
  MdLightMode,
  MdNotifications,
} from "react-icons/md";
import NotificationPanel from "./NotificationPanel";
import authService from "../../services/authService";

const pageTitles = {
  "/dashboard": "Dashboard",
  "/accounts": "Accounts",
  "/transactions": "Transactions",
  "/debts": "Debts & Loans",
  "/reports": "Reports",
  "/settings": "Settings",
};

const Navbar = ({ onMenuClick }) => {
  const { user, updateUser } = useAuth();
  const { unreadCount } = useNotifications();
  const location = useLocation();
  const navigate = useNavigate();
  const [showNotif, setShowNotif] = useState(false);
  const title = pageTitles[location.pathname] || "Smart Finance Tracker";

  const toggleDarkMode = async () => {
    const newMode = !user?.darkMode;
    document.body.classList.toggle("dark", newMode);
    try {
      const data = await authService.updateProfile({ darkMode: newMode });
      updateUser(data.user);
    } catch {
      updateUser({ ...user, darkMode: newMode });
    }
  };

  const getInitials = (name) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header className="h-16 bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between px-4 lg:px-6 flex-shrink-0">
      {/* Left */}
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <MdMenu size={22} />
        </button>
        <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          {title}
        </h1>
      </div>

      {/* Right */}
      <div className="flex items-center gap-1">
        {/* Dark mode toggle */}
        <button
          onClick={toggleDarkMode}
          className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          title="Toggle dark mode"
        >
          {user?.darkMode ? (
            <MdLightMode size={20} />
          ) : (
            <MdDarkMode size={20} />
          )}
        </button>

        {/* Notification bell */}
        <div className="relative">
          <button
            onClick={() => setShowNotif((v) => !v)}
            className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors relative"
            title="Notifications"
          >
            <MdNotifications size={20} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 min-w-4 h-4 px-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>
          {showNotif && (
            <NotificationPanel onClose={() => setShowNotif(false)} />
          )}
        </div>

        {/* Avatar - click goes to settings */}
        <button
          onClick={() => navigate("/settings")}
          className="ml-1 pl-3 border-l border-gray-100 dark:border-gray-700 flex items-center"
          title="Go to settings"
        >
          {user?.avatar ? (
            <img
              src={user.avatar}
              alt={user.fullName}
              className="w-8 h-8 rounded-full object-cover ring-2 ring-primary-100 dark:ring-primary-900/40"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center">
              <span className="text-xs font-semibold text-primary-700 dark:text-primary-300">
                {getInitials(user?.fullName)}
              </span>
            </div>
          )}
        </button>
      </div>
    </header>
  );
};

export default Navbar;
