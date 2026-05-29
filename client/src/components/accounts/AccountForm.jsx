import { useState, useEffect } from "react";
import Modal from "../shared/Modal";

const ACCOUNT_TYPES = [
  { value: "bank", label: "Bank Account" },
  { value: "cash", label: "Cash in Hand" },
  { value: "credit_card", label: "Credit Card" },
  { value: "savings", label: "Savings Account" },
  { value: "wallet", label: "Wallet" },
];

const COLORS = [
  "#3b82f6",
  "#8b5cf6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#06b6d4",
  "#ec4899",
  "#84cc16",
];

const AccountForm = ({ isOpen, onClose, onSubmit, account, isLoading }) => {
  const isEdit = !!account;

  const [form, setForm] = useState({
    name: "",
    type: "bank",
    initialBalance: "",
    color: "#3b82f6",
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (account) {
      setForm({
        name: account.name || "",
        type: account.type || "bank",
        initialBalance: account.initialBalance ?? "",
        color: account.color || "#3b82f6",
      });
    } else {
      setForm({ name: "", type: "bank", initialBalance: "", color: "#3b82f6" });
    }
    setErrors({});
  }, [account, isOpen]);

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Account name is required";
    if (form.initialBalance === "" || isNaN(Number(form.initialBalance))) {
      e.initialBalance = "Enter a valid balance";
    }
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
    onSubmit({ ...form, initialBalance: Number(form.initialBalance) });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? "Edit Account" : "Add New Account"}
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Name */}
        <div>
          <label className="label">Account Name</label>
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="e.g. Commercial Bank, Cash"
            className={`input ${errors.name ? "border-red-400" : ""}`}
          />
          {errors.name && (
            <p className="text-red-500 text-xs mt-1">{errors.name}</p>
          )}
        </div>

        {/* Type */}
        <div>
          <label className="label">Account Type</label>
          <select
            name="type"
            value={form.type}
            onChange={handleChange}
            className="input"
          >
            {ACCOUNT_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        {/* Initial Balance — only show when creating, not editing */}
        {!isEdit && (
          <div>
            <label className="label">Opening Balance</label>
            <input
              name="initialBalance"
              type="number"
              min="0"
              step="0.01"
              value={form.initialBalance}
              onChange={handleChange}
              placeholder="0.00"
              className={`input ${errors.initialBalance ? "border-red-400" : ""}`}
            />
            {errors.initialBalance && (
              <p className="text-red-500 text-xs mt-1">
                {errors.initialBalance}
              </p>
            )}
          </div>
        )}

        {/* Color picker */}
        <div>
          <label className="label">Account Color</label>
          <div className="flex gap-2 flex-wrap">
            {COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setForm((p) => ({ ...p, color: c }))}
                className={`w-8 h-8 rounded-full transition-transform ${form.color === c ? "scale-125 ring-2 ring-offset-2 ring-gray-400" : "hover:scale-110"}`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
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
              "Add Account"
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default AccountForm;
