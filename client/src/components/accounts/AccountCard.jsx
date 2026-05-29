import {
  MdEdit,
  MdDelete,
  MdAccountBalance,
  MdCreditCard,
  MdSavings,
  MdAccountBalanceWallet,
  MdRefresh,
} from "react-icons/md";
import { FaMoneyBillWave } from "react-icons/fa";

const typeConfig = {
  bank: { label: "Bank Account", Icon: MdAccountBalance },
  cash: { label: "Cash in Hand", Icon: FaMoneyBillWave },
  credit_card: { label: "Credit Card", Icon: MdCreditCard },
  savings: { label: "Savings Account", Icon: MdSavings },
  wallet: { label: "Wallet", Icon: MdAccountBalanceWallet },
};

const AccountCard = ({
  account,
  onEdit,
  onDelete,
  onReset,
  currency = "LKR",
}) => {
  const config = typeConfig[account.type] || typeConfig.bank;
  const { Icon, label } = config;

  const fmt = (v) =>
    Number(v).toLocaleString("en-LK", { minimumFractionDigits: 2 });

  const isNegative = account.currentBalance < 0;

  return (
    <div className="card hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: `${account.color}20` }}
        >
          <Icon size={24} style={{ color: account.color }} />
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => onReset(account)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors"
            title="Reset balance"
          >
            <MdRefresh size={18} />
          </button>
          <button
            onClick={() => onEdit(account)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
            title="Edit account"
          >
            <MdEdit size={18} />
          </button>
          <button
            onClick={() => onDelete(account)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            title="Delete account"
          >
            <MdDelete size={18} />
          </button>
        </div>
      </div>

      <p className="text-base font-semibold text-gray-800 dark:text-gray-100 truncate mb-0.5">
        {account.name}
      </p>
      <p className="text-xs text-gray-400 mb-4">{label}</p>

      <div className="border-t border-gray-100 dark:border-gray-700 pt-4">
        <p className="text-xs text-gray-400 mb-1">Current Balance</p>
        <p
          className={`text-xl font-bold ${isNegative ? "text-red-500" : "text-gray-800 dark:text-gray-100"}`}
        >
          {currency} {fmt(account.currentBalance)}
        </p>
        {account.initialBalance !== account.currentBalance && (
          <p className="text-xs text-gray-400 mt-1">
            Opening: {currency} {fmt(account.initialBalance)}
          </p>
        )}
      </div>

      <div
        className="h-1 rounded-full mt-4"
        style={{ backgroundColor: account.color }}
      />
    </div>
  );
};

export default AccountCard;
