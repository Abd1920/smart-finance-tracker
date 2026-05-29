import { useState, useEffect } from "react";
import Modal from "../shared/Modal";
import { MdSwapHoriz, MdArrowForward } from "react-icons/md";

const today = () => new Date().toISOString().split("T")[0];

const TransferForm = ({ isOpen, onClose, onSubmit, accounts, isLoading }) => {
  const [form, setForm] = useState({
    fromAccount: "",
    toAccount: "",
    amount: "",
    date: today(),
    description: "",
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      setForm({
        fromAccount: "",
        toAccount: "",
        amount: "",
        date: today(),
        description: "",
      });
      setErrors({});
    }
  }, [isOpen]);

  const validate = () => {
    const e = {};
    if (!form.fromAccount) e.fromAccount = "Select source account";
    if (!form.toAccount) e.toAccount = "Select destination account";
    if (
      form.fromAccount &&
      form.toAccount &&
      form.fromAccount === form.toAccount
    )
      e.toAccount = "Accounts must be different";
    if (!form.amount || isNaN(Number(form.amount)) || Number(form.amount) <= 0)
      e.amount = "Enter a valid amount";
    if (!form.date) e.date = "Date is required";
    return e;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
    if (errors[name]) setErrors((p) => ({ ...p, [name]: "" }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    onSubmit({ ...form, amount: parseFloat(form.amount) });
  };

  const fromAccount = accounts?.find((a) => a._id === form.fromAccount);
  const toAccount = accounts?.find((a) => a._id === form.toAccount);

  const fmt = (v) =>
    Number(v).toLocaleString("en-LK", { minimumFractionDigits: 2 });

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Transfer Money">
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Preview */}
        {fromAccount && toAccount && form.amount && (
          <div className="flex items-center justify-between p-4 bg-primary-50 dark:bg-primary-900/20 rounded-xl">
            <div className="text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                From
              </p>
              <div
                className="w-8 h-8 rounded-full mx-auto mb-1"
                style={{ backgroundColor: `${fromAccount.color}30` }}
              >
                <div className="w-full h-full rounded-full flex items-center justify-center">
                  <span
                    className="text-xs font-bold"
                    style={{ color: fromAccount.color }}
                  >
                    {fromAccount.name.charAt(0)}
                  </span>
                </div>
              </div>
              <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                {fromAccount.name}
              </p>
            </div>

            <div className="flex flex-col items-center">
              <MdArrowForward size={20} className="text-primary-500" />
              <p className="text-sm font-bold text-primary-600 mt-1">
                {Number(form.amount) > 0 ? fmt(form.amount) : "-"}
              </p>
            </div>

            <div className="text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                To
              </p>
              <div
                className="w-8 h-8 rounded-full mx-auto mb-1"
                style={{ backgroundColor: `${toAccount.color}30` }}
              >
                <div className="w-full h-full rounded-full flex items-center justify-center">
                  <span
                    className="text-xs font-bold"
                    style={{ color: toAccount.color }}
                  >
                    {toAccount.name.charAt(0)}
                  </span>
                </div>
              </div>
              <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                {toAccount.name}
              </p>
            </div>
          </div>
        )}

        {/* From Account */}
        <div>
          <label className="label">From Account</label>
          <select
            name="fromAccount"
            value={form.fromAccount}
            onChange={handleChange}
            className={`input ${errors.fromAccount ? "border-red-400" : ""}`}
          >
            <option value="">Select source account</option>
            {accounts?.map((a) => (
              <option
                key={a._id}
                value={a._id}
                disabled={a._id === form.toAccount}
              >
                {a.name} - LKR {fmt(a.currentBalance)}
              </option>
            ))}
          </select>
          {errors.fromAccount && (
            <p className="text-red-500 text-xs mt-1">{errors.fromAccount}</p>
          )}
        </div>

        {/* Swap button */}
        <div className="flex justify-center -my-2">
          <button
            type="button"
            onClick={() =>
              setForm((p) => ({
                ...p,
                fromAccount: p.toAccount,
                toAccount: p.fromAccount,
              }))
            }
            className="p-2 bg-gray-100 dark:bg-gray-700 rounded-full hover:bg-primary-100 dark:hover:bg-primary-900/30 transition-colors"
            title="Swap accounts"
          >
            <MdSwapHoriz
              size={20}
              className="text-gray-500 dark:text-gray-400"
            />
          </button>
        </div>

        {/* To Account */}
        <div>
          <label className="label">To Account</label>
          <select
            name="toAccount"
            value={form.toAccount}
            onChange={handleChange}
            className={`input ${errors.toAccount ? "border-red-400" : ""}`}
          >
            <option value="">Select destination account</option>
            {accounts?.map((a) => (
              <option
                key={a._id}
                value={a._id}
                disabled={a._id === form.fromAccount}
              >
                {a.name} - LKR {fmt(a.currentBalance)}
              </option>
            ))}
          </select>
          {errors.toAccount && (
            <p className="text-red-500 text-xs mt-1">{errors.toAccount}</p>
          )}
        </div>

        {/* Amount */}
        <div>
          <label className="label">Amount</label>
          <input
            name="amount"
            type="number"
            min="0.01"
            step="0.01"
            value={form.amount}
            onChange={handleChange}
            placeholder="0.00"
            className={`input ${errors.amount ? "border-red-400" : ""}`}
          />
          {errors.amount && (
            <p className="text-red-500 text-xs mt-1">{errors.amount}</p>
          )}
        </div>

        {/* Date */}
        <div>
          <label className="label">Date</label>
          <input
            name="date"
            type="date"
            value={form.date}
            onChange={handleChange}
            className={`input ${errors.date ? "border-red-400" : ""}`}
          />
          {errors.date && (
            <p className="text-red-500 text-xs mt-1">{errors.date}</p>
          )}
        </div>

        {/* Description */}
        <div>
          <label className="label">
            Description{" "}
            <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <input
            name="description"
            type="text"
            value={form.description}
            onChange={handleChange}
            placeholder="e.g. Cash deposit to Sampath Bank"
            className="input"
            maxLength={200}
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary flex-1"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="flex-1 flex items-center justify-center gap-2 font-medium py-2.5 px-4 rounded-lg transition-colors bg-primary-600 hover:bg-primary-700 text-white disabled:opacity-50"
          >
            {isLoading ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <MdSwapHoriz size={18} /> Transfer
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default TransferForm;
