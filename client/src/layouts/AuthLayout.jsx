import { Outlet } from "react-router-dom";
import {
  MdAccountBalance,
  MdTrendingUp,
  MdPieChart,
  MdSavings,
} from "react-icons/md";

const FinanceIllustration = () => (
  <svg
    viewBox="0 0 400 320"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="w-full max-w-sm"
  >
    {/* Background card */}
    <rect
      x="40"
      y="40"
      width="320"
      height="200"
      rx="20"
      fill="white"
      fillOpacity="0.12"
    />
    {/* Chart bars */}
    <rect
      x="80"
      y="160"
      width="32"
      height="60"
      rx="6"
      fill="white"
      fillOpacity="0.4"
    />
    <rect
      x="128"
      y="120"
      width="32"
      height="100"
      rx="6"
      fill="white"
      fillOpacity="0.6"
    />
    <rect
      x="176"
      y="90"
      width="32"
      height="130"
      rx="6"
      fill="white"
      fillOpacity="0.8"
    />
    <rect
      x="224"
      y="110"
      width="32"
      height="110"
      rx="6"
      fill="white"
      fillOpacity="0.6"
    />
    <rect x="272" y="70" width="32" height="150" rx="6" fill="white" />
    {/* Trend line */}
    <polyline
      points="96,180 144,140 192,110 240,130 288,90"
      stroke="white"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
      strokeOpacity="0.8"
    />
    {/* Dots on line */}
    <circle cx="96" cy="180" r="5" fill="white" />
    <circle cx="144" cy="140" r="5" fill="white" />
    <circle cx="192" cy="110" r="5" fill="white" />
    <circle cx="240" cy="130" r="5" fill="white" />
    <circle cx="288" cy="90" r="7" fill="white" />
    {/* Balance card */}
    <rect
      x="200"
      y="210"
      width="170"
      height="80"
      rx="14"
      fill="white"
      fillOpacity="0.15"
    />
    <rect
      x="216"
      y="226"
      width="60"
      height="8"
      rx="4"
      fill="white"
      fillOpacity="0.5"
    />
    <rect
      x="216"
      y="244"
      width="100"
      height="14"
      rx="4"
      fill="white"
      fillOpacity="0.9"
    />
    <rect
      x="216"
      y="266"
      width="80"
      height="8"
      rx="4"
      fill="white"
      fillOpacity="0.4"
    />
    {/* Coin stack */}
    <ellipse cx="100" cy="265" rx="28" ry="8" fill="white" fillOpacity="0.25" />
    <ellipse cx="100" cy="255" rx="28" ry="8" fill="white" fillOpacity="0.35" />
    <ellipse cx="100" cy="245" rx="28" ry="8" fill="white" fillOpacity="0.5" />
    <ellipse cx="100" cy="235" rx="28" ry="8" fill="white" fillOpacity="0.7" />
    <text x="92" y="239" fontSize="10" fill="white" fontWeight="bold">
      $
    </text>
  </svg>
);

const AuthLayout = () => {
  return (
    <div className="min-h-screen flex">
      {/* Left panel — hidden on mobile */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-700 via-primary-600 to-primary-500 flex-col items-center justify-center p-12 relative overflow-hidden">
        {/* Background circles */}
        <div className="absolute -top-24 -left-24 w-72 h-72 bg-white/5 rounded-full" />
        <div className="absolute -bottom-32 -right-16 w-96 h-96 bg-white/5 rounded-full" />
        <div className="absolute top-1/2 -right-12 w-48 h-48 bg-white/5 rounded-full" />

        <div className="relative z-10 text-center max-w-md">
          {/* Logo */}
          <div className="flex items-center justify-center gap-3 mb-10">
            <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center">
              <MdAccountBalance size={28} className="text-white" />
            </div>
            <span className="text-2xl font-bold text-white">
              Smart Finance Tracker
            </span>
          </div>

          {/* Illustration */}
          <FinanceIllustration />

          {/* Text */}
          <h2 className="text-2xl font-bold text-white mt-8 mb-3">
            Manage your money smarter
          </h2>
          <p className="text-primary-100 text-base leading-relaxed">
            Track your income, expenses, and financial goals all in one place.
          </p>

          {/* Feature pills */}
          <div className="flex flex-wrap justify-center gap-2 mt-8">
            {[
              { icon: MdTrendingUp, label: "Income Tracking" },
              { icon: MdPieChart, label: "Expense Reports" },
              { icon: MdSavings, label: "Debt Management" },
            ].map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="flex items-center gap-1.5 bg-white/15 backdrop-blur rounded-full px-3 py-1.5"
              >
                <Icon size={14} className="text-white" />
                <span className="text-white text-xs font-medium">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel — form area */}
      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-6 sm:p-10 bg-gray-50 dark:bg-gray-950 overflow-y-auto">
        {/* Mobile logo */}
        <div className="flex lg:hidden items-center gap-2 mb-8">
          <div className="w-9 h-9 bg-primary-600 rounded-xl flex items-center justify-center">
            <MdAccountBalance size={20} className="text-white" />
          </div>
          <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
            Smart Finance Tracker
          </span>
        </div>

        {/* Form card */}
        <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
          <Outlet />
        </div>

        <p className="text-center text-gray-400 text-xs mt-6">
          © {new Date().getFullYear()} Smart Finance Tracker
        </p>
      </div>
    </div>
  );
};

export default AuthLayout;
