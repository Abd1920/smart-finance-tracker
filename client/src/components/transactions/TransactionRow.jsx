import { MdEdit, MdDelete, MdTrendingUp, MdTrendingDown } from "react-icons/md";
import { CATEGORY_COLORS } from "../../utils/categories";

const TransactionRow = ({ transaction, currency, onEdit, onDelete }) => {
  const isIncome = transaction.type === "income";
  const color = CATEGORY_COLORS[transaction.category] || "#94a3b8";

  const fmt = (v) =>
    Number(v).toLocaleString("en-LK", { minimumFractionDigits: 2 });

  const fmtDate = (d) =>
    new Date(d).toLocaleDateString("en-LK", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group">
      {/* Category icon */}
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: `${color}20` }}
      >
        {isIncome ? (
          <MdTrendingUp size={20} style={{ color }} />
        ) : (
          <MdTrendingDown size={20} style={{ color }} />
        )}
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
          {transaction.description || transaction.category}
        </p>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          <span className="text-xs text-gray-400">{transaction.category}</span>
          <span className="text-gray-300 dark:text-gray-600 text-xs">·</span>
          <span className="text-xs text-gray-400">
            {fmtDate(transaction.date)}
          </span>
          {transaction.account && (
            <>
              <span className="text-gray-300 dark:text-gray-600 text-xs">
                ·
              </span>
              <span
                className="text-xs px-1.5 py-0.5 rounded-full"
                style={{
                  backgroundColor: `${transaction.account.color || "#3b82f6"}20`,
                  color: transaction.account.color || "#3b82f6",
                }}
              >
                {transaction.account.name}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Amount */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <span
          className={`text-sm font-semibold ${isIncome ? "text-green-600 dark:text-green-400" : "text-red-500 dark:text-red-400"}`}
        >
          {isIncome ? "+" : "-"} {currency} {fmt(transaction.amount)}
        </span>

        {/* Action buttons - show on hover */}
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onEdit(transaction)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
          >
            <MdEdit size={16} />
          </button>
          <button
            onClick={() => onDelete(transaction)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            <MdDelete size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default TransactionRow;
