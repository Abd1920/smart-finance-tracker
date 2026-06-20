import { useState } from "react";
import Modal from "../shared/Modal";
import { MdCheckCircle } from "react-icons/md";

const SettleDebtModal = ({
  isOpen,
  onClose,
  onConfirm,
  debt,
  accounts,
  currency,
  isLoading,
}) => {
  const [settlementAccount, setSettlementAccount] = useState("");

  const isPay = debt?.debtType === "to_pay";
  const fmt = (v) =>
    Number(v).toLocaleString("en-LK", { minimumFractionDigits: 2 });

  const handleConfirm = () => {
    onConfirm(debt, settlementAccount || null);
    setSettlementAccount("");
  };

  const handleClose = () => {
    setSettlementAccount("");
    onClose();
  };

  if (!debt) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Mark as Settled"
      size="sm"
    >
      <div className="space-y-4">
        <div className="flex flex-col items-center text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-xl">
          <MdCheckCircle size={32} className="text-green-500 mb-2" />
          <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
            {isPay
              ? `Repaying LKR ${fmt(debt.amount)} to ${debt.personName}`
              : `Received LKR ${fmt(debt.amount)} from ${debt.personName}`}
          </p>
        </div>

        <div>
          <label className="label">
            {isPay ? "Account to pay from" : "Account to receive into"}
            <span className="text-gray-400 font-normal ml-1">(optional)</span>
          </label>
          <select
            value={settlementAccount}
            onChange={(e) => setSettlementAccount(e.target.value)}
            className="input"
          >
            <option value="">-- Don't link an account --</option>
            {accounts?.map((a) => (
              <option key={a._id} value={a._id}>
                {a.name} - {currency} {fmt(a.currentBalance)}
              </option>
            ))}
          </select>
          {settlementAccount && (
            <p
              className={`text-xs mt-1 ${isPay ? "text-red-500" : "text-green-600"}`}
            >
              {isPay
                ? `✓ Account balance will decrease by ${currency} ${fmt(debt.amount)}`
                : `✓ Account balance will increase by ${currency} ${fmt(debt.amount)}`}
            </p>
          )}
        </div>

        <p className="text-xs text-gray-400 text-center">
          A transaction record will be created automatically.
        </p>

        <div className="flex gap-3">
          <button onClick={handleClose} className="btn-secondary flex-1">
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={isLoading}
            className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-medium py-2.5 px-4 rounded-lg transition-colors disabled:opacity-50"
          >
            {isLoading ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <MdCheckCircle size={18} /> Confirm Settled
              </>
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default SettleDebtModal;
