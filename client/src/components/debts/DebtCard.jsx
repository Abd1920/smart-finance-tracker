import { MdEdit, MdDelete, MdCheckCircle, MdRadioButtonUnchecked, MdCalendarToday, MdWarning } from 'react-icons/md';

const DebtCard = ({ debt, currency, onEdit, onDelete, onSettle }) => {
  const isPay      = debt.debtType === 'to_pay';
  const isSettled  = debt.status   === 'settled';

  const fmt = (v) => Number(v).toLocaleString('en-LK', { minimumFractionDigits: 2 });

  const fmtDate = (d) =>
    new Date(d).toLocaleDateString('en-LK', { day: 'numeric', month: 'short', year: 'numeric' });

  const isOverdue = debt.dueDate && !isSettled && new Date(debt.dueDate) < new Date();
  const isDueSoon = debt.dueDate && !isSettled && !isOverdue &&
    (new Date(debt.dueDate) - new Date()) < 3 * 24 * 60 * 60 * 1000; // 3 days

  return (
    <div className={`card transition-all ${isSettled ? 'opacity-60' : 'hover:shadow-md'}`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold flex-shrink-0 ${
            isPay
              ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
              : 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
          }`}>
            {debt.personName.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{debt.personName}</p>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              isPay
                ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                : 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
            }`}>
              {isPay ? 'I Owe' : 'Owes Me'}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-1">
          <button
            onClick={() => onSettle(debt)}
            className={`p-1.5 rounded-lg transition-colors ${
              isSettled
                ? 'text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20'
                : 'text-gray-400 hover:text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20'
            }`}
            title={isSettled ? 'Mark as pending' : 'Mark as settled'}
          >
            {isSettled ? <MdCheckCircle size={18} /> : <MdRadioButtonUnchecked size={18} />}
          </button>
          <button
            onClick={() => onEdit(debt)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
          >
            <MdEdit size={18} />
          </button>
          <button
            onClick={() => onDelete(debt)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            <MdDelete size={18} />
          </button>
        </div>
      </div>

      {/* Amount */}
      <p className={`text-2xl font-bold mb-2 ${
        isPay
          ? 'text-red-600 dark:text-red-400'
          : 'text-green-600 dark:text-green-400'
      } ${isSettled ? 'line-through' : ''}`}>
        {currency} {fmt(debt.amount)}
      </p>

      {/* Description */}
      {debt.description && (
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-3 truncate">{debt.description}</p>
      )}

      {/* Due date */}
      {debt.dueDate && (
        <div className={`flex items-center gap-1.5 text-xs mt-2 ${
          isOverdue  ? 'text-red-500' :
          isDueSoon  ? 'text-orange-500' :
          'text-gray-400'
        }`}>
          {isOverdue || isDueSoon ? <MdWarning size={14} /> : <MdCalendarToday size={14} />}
          <span>
            {isOverdue ? 'Overdue · ' : isDueSoon ? 'Due soon · ' : 'Due · '}
            {fmtDate(debt.dueDate)}
          </span>
        </div>
      )}

      {/* Settled badge */}
      {isSettled && (
        <div className="flex items-center gap-1.5 mt-2 text-xs text-green-600 dark:text-green-400">
          <MdCheckCircle size={14} />
          <span>Settled {debt.settledAt ? `· ${fmtDate(debt.settledAt)}` : ''}</span>
        </div>
      )}

      {/* Color bar */}
      <div className={`h-1 rounded-full mt-4 ${isPay ? 'bg-red-400' : 'bg-green-400'}`} />
    </div>
  );
};

export default DebtCard;
