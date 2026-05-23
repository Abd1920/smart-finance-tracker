import { useState, useEffect } from 'react';
import Modal from '../shared/Modal';
import { INCOME_CATEGORIES, EXPENSE_CATEGORIES } from '../../utils/categories';

const today = () => new Date().toISOString().split('T')[0];

const TransactionForm = ({ isOpen, onClose, onSubmit, transaction, accounts, isLoading }) => {
  const isEdit = !!transaction;

  const [form, setForm] = useState({
    type: 'expense',
    amount: '',
    category: '',
    account: '',
    date: today(),
    description: '',
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (transaction) {
      setForm({
        type:        transaction.type        || 'expense',
        amount:      transaction.amount      || '',
        category:    transaction.category    || '',
        account:     transaction.account?._id || transaction.account || '',
        date:        transaction.date ? new Date(transaction.date).toISOString().split('T')[0] : today(),
        description: transaction.description || '',
      });
    } else {
      setForm({
        type: 'expense', amount: '', category: '',
        account: accounts?.[0]?._id || '',
        date: today(), description: '',
      });
    }
    setErrors({});
  }, [transaction, isOpen, accounts]);

  const categories = form.type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  const validate = () => {
    const e = {};
    if (!form.amount || isNaN(Number(form.amount)) || Number(form.amount) <= 0)
      e.amount = 'Enter a valid amount greater than 0';
    if (!form.category) e.category = 'Please select a category';
    if (!form.account)  e.account  = 'Please select an account';
    if (!form.date)     e.date     = 'Date is required';
    return e;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => {
      const updated = { ...p, [name]: value };
      // Reset category when type changes
      if (name === 'type') updated.category = '';
      return updated;
    });
    if (errors[name]) setErrors((p) => ({ ...p, [name]: '' }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    onSubmit({ ...form, amount: parseFloat(form.amount) });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? 'Edit Transaction' : 'Add Transaction'}
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Type toggle */}
        <div>
          <label className="label">Type</label>
          <div className="grid grid-cols-2 gap-2">
            {['income', 'expense'].map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setForm((p) => ({ ...p, type: t, category: '' }))}
                className={`py-2.5 rounded-lg text-sm font-medium border-2 transition-colors capitalize ${
                  form.type === t
                    ? t === 'income'
                      ? 'bg-green-50 border-green-500 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                      : 'bg-red-50 border-red-500 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                    : 'border-gray-200 dark:border-gray-600 text-gray-500 hover:border-gray-300'
                }`}
              >
                {t === 'income' ? '↑ Income' : '↓ Expense'}
              </button>
            ))}
          </div>
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
            className={`input ${errors.amount ? 'border-red-400' : ''}`}
          />
          {errors.amount && <p className="text-red-500 text-xs mt-1">{errors.amount}</p>}
        </div>

        {/* Category */}
        <div>
          <label className="label">Category</label>
          <select
            name="category"
            value={form.category}
            onChange={handleChange}
            className={`input ${errors.category ? 'border-red-400' : ''}`}
          >
            <option value="">Select category</option>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          {errors.category && <p className="text-red-500 text-xs mt-1">{errors.category}</p>}
        </div>

        {/* Account */}
        <div>
          <label className="label">Account</label>
          <select
            name="account"
            value={form.account}
            onChange={handleChange}
            className={`input ${errors.account ? 'border-red-400' : ''}`}
          >
            <option value="">Select account</option>
            {accounts?.map((a) => (
              <option key={a._id} value={a._id}>{a.name}</option>
            ))}
          </select>
          {errors.account && <p className="text-red-500 text-xs mt-1">{errors.account}</p>}
        </div>

        {/* Date */}
        <div>
          <label className="label">Date</label>
          <input
            name="date"
            type="date"
            value={form.date}
            onChange={handleChange}
            className={`input ${errors.date ? 'border-red-400' : ''}`}
          />
          {errors.date && <p className="text-red-500 text-xs mt-1">{errors.date}</p>}
        </div>

        {/* Description */}
        <div>
          <label className="label">Description <span className="text-gray-400 font-normal">(optional)</span></label>
          <input
            name="description"
            type="text"
            value={form.description}
            onChange={handleChange}
            placeholder="e.g. Monthly grocery run"
            className="input"
            maxLength={200}
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button
            type="submit"
            disabled={isLoading}
            className={`flex-1 flex items-center justify-center gap-2 font-medium py-2.5 px-4 rounded-lg transition-colors
              ${form.type === 'income'
                ? 'bg-green-600 hover:bg-green-700 text-white'
                : 'bg-red-600 hover:bg-red-700 text-white'
              } disabled:opacity-50`}
          >
            {isLoading
              ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              : isEdit ? 'Save Changes' : `Add ${form.type === 'income' ? 'Income' : 'Expense'}`
            }
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default TransactionForm;
