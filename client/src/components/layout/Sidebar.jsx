import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  MdDashboard,
  MdAccountBalance,
  MdReceiptLong,
  MdCreditCard,
  MdBarChart,
  MdSettings,
  MdLogout,
  MdClose,
  MdWarning,
} from "react-icons/md";

const navItems = [
  { path: "/dashboard", icon: MdDashboard, label: "Dashboard" },
  { path: "/accounts", icon: MdAccountBalance, label: "Accounts" },
  { path: "/transactions", icon: MdReceiptLong, label: "Transactions" },
  { path: "/debts", icon: MdCreditCard, label: "Debts & Loans" },
  { path: "/reports", icon: MdBarChart, label: "Reports" },
  { path: "/settings", icon: MdSettings, label: "Settings" },
];

const LogoutModal = ({ onClose, onConfirm }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
    <div
      className="absolute inset-0 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    />
    <div className="relative w-full max-w-sm bg-white dark:bg-gray-800 rounded-2xl shadow-2xl z-10 p-6">
      <div className="flex flex-col items-center text-center">
        <div className="w-14 h-14 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center mb-4">
          <MdLogout size={28} className="text-orange-500" />
        </div>
        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">
          Sign Out
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          Are you sure you want to sign out of Smart Finance Tracker?
        </p>
        <div className="flex gap-3 w-full">
          <button onClick={onClose} className="btn-secondary flex-1">
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-2.5 px-4 rounded-lg transition-colors"
          >
            Yes, Sign Out
          </button>
        </div>
      </div>
    </div>
  </div>
);

const Sidebar = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showLogout, setShowLogout] = useState(false);

  const handleLogoClick = () => {
    onClose();
    navigate("/dashboard");
  };
  const handleProfileClick = () => {
    onClose();
    navigate("/settings");
  };

  const handleLogoutConfirmed = () => {
    setShowLogout(false);
    logout();
    navigate("/login");
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
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`
        fixed top-0 left-0 h-full w-64 bg-white dark:bg-gray-800
        border-r border-gray-100 dark:border-gray-700
        flex flex-col z-30 transition-transform duration-300
        lg:translate-x-0 lg:static lg:z-auto
        ${isOpen ? "translate-x-0" : "-translate-x-full"}
      `}
      >
        {/* Logo */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-700">
          <button
            onClick={handleLogoClick}
            className="flex items-center gap-3 hover:opacity-80 transition-opacity"
            title="Go to Dashboard"
          >
            <div className="w-9 h-9 bg-primary-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <MdAccountBalance size={20} className="text-white" />
            </div>
            <div className="text-left">
              <div className="text-sm font-bold text-gray-900 dark:text-gray-100 leading-tight">
                Smart Finance
              </div>
              <div className="text-xs text-gray-400">Tracker</div>
            </div>
          </button>
          <button
            onClick={onClose}
            className="lg:hidden text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <MdClose size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map(({ path, icon: Icon, label }) => (
            <NavLink
              key={path}
              to={path}
              onClick={onClose}
              className={({ isActive }) =>
                `nav-link ${isActive ? "active" : ""}`
              }
            >
              <Icon size={20} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* User profile + logout */}
        <div className="p-4 border-t border-gray-100 dark:border-gray-700">
          <button
            onClick={handleProfileClick}
            className="flex items-center gap-3 px-2 py-2 mb-2 w-full rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left"
            title="Go to Settings"
          >
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt={user.fullName}
                className="w-9 h-9 rounded-full object-cover flex-shrink-0 ring-2 ring-primary-100 dark:ring-primary-900/40"
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-semibold text-primary-700 dark:text-primary-300">
                  {getInitials(user?.fullName)}
                </span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                {user?.fullName}
              </p>
              <p className="text-xs text-gray-400 truncate">{user?.email}</p>
            </div>
          </button>

          <button
            onClick={() => setShowLogout(true)}
            className="nav-link w-full text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600"
          >
            <MdLogout size={20} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {showLogout && (
        <LogoutModal
          onClose={() => setShowLogout(false)}
          onConfirm={handleLogoutConfirmed}
        />
      )}
    </>
  );
};

export default Sidebar;
