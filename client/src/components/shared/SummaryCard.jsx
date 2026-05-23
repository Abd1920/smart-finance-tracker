const SummaryCard = ({ title, amount, icon: Icon, color, currency = 'LKR', subtitle }) => {
  const colorMap = {
    blue:   { bg: 'bg-blue-50 dark:bg-blue-900/20',   icon: 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400',   text: 'text-blue-600 dark:text-blue-400' },
    green:  { bg: 'bg-green-50 dark:bg-green-900/20', icon: 'bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400', text: 'text-green-600 dark:text-green-400' },
    red:    { bg: 'bg-red-50 dark:bg-red-900/20',     icon: 'bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400',         text: 'text-red-600 dark:text-red-400' },
    orange: { bg: 'bg-orange-50 dark:bg-orange-900/20', icon: 'bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400', text: 'text-orange-600 dark:text-orange-400' },
    purple: { bg: 'bg-purple-50 dark:bg-purple-900/20', icon: 'bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400', text: 'text-purple-600 dark:text-purple-400' },
  };

  const c = colorMap[color] || colorMap.blue;

  const formatAmount = (val) => {
    if (val === undefined || val === null) return '0.00';
    return Number(val).toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  return (
    <div className="card flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${c.icon}`}>
        <Icon size={24} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{title}</p>
        <p className={`text-xl font-bold truncate ${c.text}`}>
          {currency} {formatAmount(amount)}
        </p>
        {subtitle && (
          <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>
        )}
      </div>
    </div>
  );
};

export default SummaryCard;
