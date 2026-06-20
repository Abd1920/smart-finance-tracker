import { useState, useEffect } from "react";
import Modal from "../shared/Modal";

const DebtForm = ({ isOpen, onClose, onSubmit, debt, accounts, isLoading }) => {
  const isEdit = !!debt;

  const [form, setForm] = useState({
    debtType: "to_pay",
    personName: "",
    amount: "",
    description: "",
    dueDate: "",
    linkedAccount: "",
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (debt) {
      setForm({
        debtType: debt.debtType || "to_pay",
        personName: debt.personName || "",
        amount: debt.amount || "",
        description: debt.description || "",
        dueDate: debt.dueDate
          ? new Date(debt.dueDate).toISOString().split("T")[0]
          : "",
        linkedAccount: debt.linkedAccount?._id || debt.linkedAccount || "",
      });
    } else {
      setForm({
        debtType: "to_pay",
        personName: "",
        amount: "",
        description: "",
        dueDate: "",
        linkedAccount: "",
      });
    }
    setErrors({});
  }, [debt, isOpen]);

  const validate = () => {
    const e = {};
    if (!form.personName.trim()) e.personName = "Person name is required";
    if (!form.amount || isNaN(Number(form.amount)) || Number(form.amount) <= 0)
      e.amount = "Enter a valid amount";
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

  const fmt = (v) =>
    Number(v).toLocaleString("en-LK", { minimumFractionDigits: 2 });

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? "Edit Debt" : "Add Debt / Loan"}
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Type toggle */}
        <div>
          <label className="label">Type</label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { value: "to_pay", label: "💸 I Need to Pay" },
              { value: "to_receive", label: "💰 Others Owe Me" },
            ].map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => setForm((p) => ({ ...p, debtType: t.value }))}
                className={`py-2.5 px-3 rounded-lg text-sm font-medium border-2 transition-colors text-left ${
                  form.debtType === t.value
                    ? t.value === "to_pay"
                      ? "bg-red-50 border-red-400 text-red-700 dark:bg-red-900/20 dark:text-red-400"
                      : "bg-green-50 border-green-400 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                    : "border-gray-200 dark:border-gray-600 text-gray-500 hover:border-gray-300"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Person Name */}
        <div>
          <label className="label">
            {form.debtType === "to_pay"
              ? "Creditor Name (Who you owe)"
              : "Debtor Name (Who owes you)"}
          </label>
          <input
            name="personName"
            value={form.personName}
            onChange={handleChange}
            placeholder={
              form.debtType === "to_pay"
                ? "Who did you borrow from?"
                : "Who did you lend to?"
            }
            className={`input ${errors.personName ? "border-red-400" : ""}`}
          />
          {errors.personName && (
            <p className="text-red-500 text-xs mt-1">{errors.personName}</p>
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

        {/* Linked Account */}
        <div>
          <label className="label">
            {form.debtType === "to_pay"
              ? "Account that received the money"
              : "Account the money was given from"}
            <span className="text-gray-400 font-normal ml-1">(optional)</span>
          </label>
          <select
            name="linkedAccount"
            value={form.linkedAccount}
            onChange={handleChange}
            className="input"
            disabled={isEdit && debt?.accountAdjusted}
          >
            <option value="">-- Don't link an account --</option>
            {accounts?.map((a) => (
              <option key={a._id} value={a._id}>
                {a.name} - LKR {fmt(a.currentBalance)}
              </option>
            ))}
          </select>
          {form.linkedAccount && !isEdit && (
            <p
              className={`text-xs mt-1 ${form.debtType === "to_pay" ? "text-green-600" : "text-red-500"}`}
            >
              {form.debtType === "to_pay"
                ? `✓ Account balance will increase by LKR ${form.amount ? Number(form.amount).toLocaleString() : "0"}`
                : `✓ Account balance will decrease by LKR ${form.amount ? Number(form.amount).toLocaleString() : "0"}`}
            </p>
          )}
          {isEdit && debt?.accountAdjusted && (
            <p className="text-xs text-gray-400 mt-1">
              Account link cannot be changed after creation.
            </p>
          )}
        </div>

        {/* Due Date */}
        <div>
          <label className="label">
            Due Date{" "}
            <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <input
            name="dueDate"
            type="date"
            value={form.dueDate}
            onChange={handleChange}
            className="input"
          />
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
            placeholder="What is this for?"
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
            className="btn-primary flex-1 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : isEdit ? (
              "Save Changes"
            ) : (
              "Add Debt"
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default DebtForm;
