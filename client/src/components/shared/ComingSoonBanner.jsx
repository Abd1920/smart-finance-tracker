import { useState } from "react";
import { MdClose, MdCurrencyExchange } from "react-icons/md";

const ComingSoonBanner = () => {
  const [dismissed, setDismissed] = useState(
    () => sessionStorage.getItem("multicurrency_banner_dismissed") === "true",
  );

  if (dismissed) return null;

  const handleDismiss = () => {
    sessionStorage.setItem("multicurrency_banner_dismissed", "true");
    setDismissed(true);
  };

  return (
    <div className="relative overflow-hidden rounded-xl border border-amber-200 dark:border-amber-800 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 px-5 py-4">
      {/* Decorative circles */}
      <div className="absolute -top-4 -right-4 w-20 h-20 bg-amber-200/40 dark:bg-amber-700/20 rounded-full" />
      <div className="absolute -bottom-3 right-16 w-12 h-12 bg-orange-200/40 dark:bg-orange-700/20 rounded-full" />

      <div className="relative flex items-center gap-4">
        {/* Icon */}
        <div className="w-10 h-10 bg-amber-100 dark:bg-amber-800/50 border border-amber-200 dark:border-amber-700 rounded-xl flex items-center justify-center flex-shrink-0">
          <MdCurrencyExchange
            size={22}
            className="text-amber-600 dark:text-amber-400"
          />
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
            <span className="text-xs font-bold bg-amber-500 text-white px-2 py-0.5 rounded-full tracking-wide uppercase">
              Coming Soon
            </span>
            <h4 className="text-sm font-bold text-amber-900 dark:text-amber-200">
              Multi-Currency Accounts with Live Exchange Rates
            </h4>
          </div>
          <p className="text-xs text-amber-700 dark:text-amber-400">
            Track accounts in LKR, QAR, USD, SAR, INR, AED, EUR & GBP - all
            automatically converted to your primary currency.
          </p>
        </div>

        {/* Dismiss */}
        <button
          onClick={handleDismiss}
          className="flex-shrink-0 p-1.5 hover:bg-amber-100 dark:hover:bg-amber-800/50 rounded-lg transition-colors"
          title="Dismiss"
        >
          <MdClose size={18} className="text-amber-500 dark:text-amber-400" />
        </button>
      </div>
    </div>
  );
};

export default ComingSoonBanner;
