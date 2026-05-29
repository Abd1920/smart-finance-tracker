import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import accountService from "../../services/accountService";
import AccountCard from "../../components/accounts/AccountCard";
import AccountForm from "../../components/accounts/AccountForm";
import ConfirmDialog from "../../components/shared/ConfirmDialog";
import EmptyState from "../../components/shared/EmptyState";
import Spinner from "../../components/shared/Spinner";
import SummaryCard from "../../components/shared/SummaryCard";
import Modal from "../../components/shared/Modal";
import {
  MdAdd,
  MdAccountBalance,
  MdTrendingUp,
  MdRefresh,
} from "react-icons/md";
import toast from "react-hot-toast";

const Accounts = () => {
  const { user } = useAuth();
  const currency = user?.currency || "LKR";

  const [accounts, setAccounts] = useState([]);
  const [totalBalance, setTotalBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editAccount, setEditAccount] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Reset balance state
  const [resetTarget, setResetTarget] = useState(null);
  const [resetValue, setResetValue] = useState("");
  const [resetting, setResetting] = useState(false);

  const fetchAccounts = useCallback(async () => {
    try {
      setLoading(true);
      const data = await accountService.getAll();
      setAccounts(data.accounts);
      setTotalBalance(data.totalBalance);
    } catch {
      toast.error("Failed to load accounts");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  const handleOpenCreate = () => {
    setEditAccount(null);
    setShowForm(true);
  };
  const handleOpenEdit = (acc) => {
    setEditAccount(acc);
    setShowForm(true);
  };
  const handleCloseForm = () => {
    setShowForm(false);
    setEditAccount(null);
  };

  const handleSubmit = async (formData) => {
    setSubmitting(true);
    try {
      if (editAccount) {
        await accountService.update(editAccount._id, formData);
        toast.success("Account updated successfully");
      } else {
        await accountService.create(formData);
        toast.success("Account added successfully");
      }
      handleCloseForm();
      fetchAccounts();
    } catch (err) {
      toast.error(err.response?.data?.message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await accountService.delete(deleteTarget._id);
      toast.success("Account deleted");
      setDeleteTarget(null);
      fetchAccounts();
    } catch {
      toast.error("Failed to delete account");
    } finally {
      setDeleting(false);
    }
  };

  const handleResetBalance = async () => {
    if (!resetTarget) return;
    const val = parseFloat(resetValue);
    if (isNaN(val)) {
      toast.error("Enter a valid balance");
      return;
    }
    setResetting(true);
    try {
      await accountService.resetBalance(resetTarget._id, val);
      toast.success(`Balance reset to ${currency} ${val.toLocaleString()}`);
      setResetTarget(null);
      setResetValue("");
      fetchAccounts();
    } catch {
      toast.error("Failed to reset balance");
    } finally {
      setResetting(false);
    }
  };

  if (loading) return <Spinner size="lg" className="h-64" />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            Accounts
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Manage your bank accounts, cash, and wallets
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="btn-primary flex items-center gap-2"
        >
          <MdAdd size={20} />
          <span className="hidden sm:inline">Add Account</span>
        </button>
      </div>

      {/* Summary */}
      {accounts.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <SummaryCard
            title="Total Balance"
            amount={totalBalance}
            icon={MdAccountBalance}
            color="blue"
            currency={currency}
            subtitle={`Across ${accounts.length} account${accounts.length > 1 ? "s" : ""}`}
          />
          <SummaryCard
            title="Highest Balance"
            amount={Math.max(...accounts.map((a) => a.currentBalance))}
            icon={MdTrendingUp}
            color="green"
            currency={currency}
            subtitle={
              accounts.reduce((a, b) =>
                a.currentBalance > b.currentBalance ? a : b,
              ).name
            }
          />
        </div>
      )}

      {/* Accounts grid */}
      {accounts.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={MdAccountBalance}
            title="No accounts yet"
            subtitle="Add your first account to start tracking your finances"
            action={
              <button
                onClick={handleOpenCreate}
                className="btn-primary flex items-center gap-2 mt-2"
              >
                <MdAdd size={18} /> Add Your First Account
              </button>
            }
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {accounts.map((acc) => (
            <AccountCard
              key={acc._id}
              account={acc}
              currency={currency}
              onEdit={handleOpenEdit}
              onDelete={setDeleteTarget}
              onReset={(acc) => {
                setResetTarget(acc);
                setResetValue(String(acc.currentBalance));
              }}
            />
          ))}
          <button
            onClick={handleOpenCreate}
            className="card flex flex-col items-center justify-center min-h-[180px] border-dashed border-2 border-gray-200 dark:border-gray-600 bg-transparent shadow-none hover:border-primary-400 hover:bg-primary-50/50 dark:hover:bg-primary-900/10 transition-colors group"
          >
            <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mb-2 group-hover:bg-primary-100">
              <MdAdd
                size={22}
                className="text-gray-400 group-hover:text-primary-500"
              />
            </div>
            <p className="text-sm text-gray-400 group-hover:text-primary-500 font-medium">
              Add Account
            </p>
          </button>
        </div>
      )}

      <AccountForm
        isOpen={showForm}
        onClose={handleCloseForm}
        onSubmit={handleSubmit}
        account={editAccount}
        isLoading={submitting}
      />

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Account"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This cannot be undone.`}
        isLoading={deleting}
      />

      {/* Reset Balance Modal */}
      <Modal
        isOpen={!!resetTarget}
        onClose={() => {
          setResetTarget(null);
          setResetValue("");
        }}
        title="Reset Account Balance"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Manually set the current balance for{" "}
            <strong>{resetTarget?.name}</strong>. Use this to fix incorrect
            balances caused by deleted transactions.
          </p>
          <div>
            <label className="label">Correct Balance ({currency})</label>
            <input
              type="number"
              step="0.01"
              value={resetValue}
              onChange={(e) => setResetValue(e.target.value)}
              className="input"
              placeholder="0.00"
            />
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => {
                setResetTarget(null);
                setResetValue("");
              }}
              className="btn-secondary flex-1"
            >
              Cancel
            </button>
            <button
              onClick={handleResetBalance}
              disabled={resetting}
              className="flex-1 flex items-center justify-center gap-2 btn-primary"
            >
              {resetting ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <MdRefresh size={18} /> Reset Balance
                </>
              )}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Accounts;
