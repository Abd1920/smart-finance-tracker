import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import transactionService from "../../services/transactionService";
import accountService from "../../services/accountService";
import TransactionRow from "../../components/transactions/TransactionRow";
import TransactionForm from "../../components/transactions/TransactionForm";
import TransferForm from "../../components/transactions/TransferForm";
import TransactionFilters from "../../components/transactions/TransactionFilters";
import ConfirmDialog from "../../components/shared/ConfirmDialog";
import EmptyState from "../../components/shared/EmptyState";
import Spinner from "../../components/shared/Spinner";
import SummaryCard from "../../components/shared/SummaryCard";
import {
  MdAdd,
  MdReceiptLong,
  MdTrendingUp,
  MdTrendingDown,
  MdAccountBalance,
  MdChevronLeft,
  MdChevronRight,
  MdSwapHoriz,
} from "react-icons/md";
import toast from "react-hot-toast";

const defaultFilters = {
  search: "",
  type: "",
  category: "",
  account: "",
  month: "", // no default month filter
  year: "", // no default year filter
  page: 1,
  limit: 15,
  sort: "createdAt",
  order: "desc",
};

const Transactions = () => {
  const { user } = useAuth();
  const currency = user?.currency || "LKR";

  const [transactions, setTransactions] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [meta, setMeta] = useState({
    total: 0,
    pages: 1,
    income: 0,
    expense: 0,
    balance: 0,
  });
  const [filters, setFilters] = useState(defaultFilters);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [showTransfer, setShowTransfer] = useState(false);
  const [editTx, setEditTx] = useState(null);
  const [deleteTx, setDeleteTx] = useState(null);
  const [deleteTransferTx, setDeleteTransferTx] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      Object.entries(filters).forEach(([k, v]) => {
        if (v !== "") params[k] = v;
      });
      const data = await transactionService.getAll(params);
      setTransactions(data.transactions);
      setMeta({
        total: data.total,
        pages: data.pages,
        income: data.income,
        expense: data.expense,
        balance: data.balance,
      });
    } catch {
      toast.error("Failed to load transactions");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const fetchAccounts = useCallback(async () => {
    try {
      const data = await accountService.getAll();
      setAccounts(data.accounts);
    } catch {}
  }, []);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);
  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const handleSubmit = async (formData) => {
    setSubmitting(true);
    try {
      if (editTx) {
        await transactionService.update(editTx._id, formData);
        toast.success("Transaction updated");
      } else {
        await transactionService.create(formData);
        toast.success("Transaction added");
      }
      setShowForm(false);
      setEditTx(null);
      fetchTransactions();
      fetchAccounts();
    } catch (err) {
      toast.error(err.response?.data?.message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  const handleTransfer = async (formData) => {
    setSubmitting(true);
    try {
      await transactionService.transfer(formData);
      toast.success("Transfer completed successfully");
      setShowTransfer(false);
      fetchTransactions();
      fetchAccounts();
    } catch (err) {
      toast.error(err.response?.data?.message || "Transfer failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTx) return;
    setDeleting(true);
    try {
      await transactionService.delete(deleteTx._id);
      toast.success("Transaction deleted");
      setDeleteTx(null);
      fetchTransactions();
      fetchAccounts();
    } catch {
      toast.error("Failed to delete transaction");
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteTransfer = async () => {
    if (!deleteTransferTx) return;
    setDeleting(true);
    try {
      await transactionService.deleteTransfer(deleteTransferTx.transferRef);
      toast.success("Transfer deleted - both account balances reversed");
      setDeleteTransferTx(null);
      fetchTransactions();
      fetchAccounts();
    } catch {
      toast.error("Failed to delete transfer");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            Transactions
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {meta.total} transaction{meta.total !== 1 ? "s" : ""} found
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => {
              setEditTx(null);
              setShowForm(true);
            }}
            className="btn-primary flex items-center gap-2"
          >
            <MdAdd size={20} />
            <span className="hidden sm:inline">Add Transaction</span>
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <SummaryCard
          title="Balance"
          amount={meta.balance}
          icon={MdAccountBalance}
          color={meta.balance >= 0 ? "blue" : "red"}
          currency={currency}
          subtitle="Income − Expenses"
        />
        <SummaryCard
          title="Income"
          amount={meta.income}
          icon={MdTrendingUp}
          color="green"
          currency={currency}
          subtitle="Filtered results"
        />
        <SummaryCard
          title="Expenses"
          amount={meta.expense}
          icon={MdTrendingDown}
          color="red"
          currency={currency}
          subtitle="Filtered results"
        />
      </div>

      {/* Filters */}
      <div className="card">
        <TransactionFilters
          filters={filters}
          onChange={(f) => setFilters(f)}
          onReset={() => setFilters(defaultFilters)}
          accounts={accounts}
        />
      </div>

      {/* List */}
      <div className="card">
        {loading ? (
          <Spinner size="lg" className="h-48" />
        ) : transactions.length === 0 ? (
          <EmptyState
            icon={MdReceiptLong}
            title="No transactions found"
            subtitle="Try adjusting your filters or add a new transaction"
            action={
              <button
                onClick={() => {
                  setEditTx(null);
                  setShowForm(true);
                }}
                className="btn-primary flex items-center gap-2 mt-2"
              >
                <MdAdd size={18} /> Add Transaction
              </button>
            }
          />
        ) : (
          <>
            <div className="divide-y divide-gray-50 dark:divide-gray-700/50">
              {transactions.map((tx) => (
                <TransactionRow
                  key={tx._id}
                  transaction={tx}
                  currency={currency}
                  onEdit={(t) => {
                    setEditTx(t);
                    setShowForm(true);
                  }}
                  onDelete={setDeleteTx}
                  onDeleteTransfer={setDeleteTransferTx}
                />
              ))}
            </div>
            {meta.pages > 1 && (
              <div className="flex items-center justify-between pt-4 mt-4 border-t border-gray-100 dark:border-gray-700">
                <p className="text-sm text-gray-500">
                  Page {filters.page} of {meta.pages}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() =>
                      setFilters((p) => ({ ...p, page: p.page - 1 }))
                    }
                    disabled={filters.page <= 1}
                    className="p-2 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-600 disabled:opacity-40"
                  >
                    <MdChevronLeft size={20} />
                  </button>
                  <button
                    onClick={() =>
                      setFilters((p) => ({ ...p, page: p.page + 1 }))
                    }
                    disabled={filters.page >= meta.pages}
                    className="p-2 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-600 disabled:opacity-40"
                  >
                    <MdChevronRight size={20} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modals */}
      <TransactionForm
        isOpen={showForm}
        onClose={() => {
          setShowForm(false);
          setEditTx(null);
        }}
        onSubmit={handleSubmit}
        transaction={editTx}
        accounts={accounts}
        isLoading={submitting}
      />

      <TransferForm
        isOpen={showTransfer}
        onClose={() => setShowTransfer(false)}
        onSubmit={handleTransfer}
        accounts={accounts}
        isLoading={submitting}
      />

      <ConfirmDialog
        isOpen={!!deleteTx}
        onClose={() => setDeleteTx(null)}
        onConfirm={handleDelete}
        title="Delete Transaction"
        message={`Delete this ${deleteTx?.type} of ${currency} ${deleteTx ? Number(deleteTx.amount).toLocaleString() : ""}? The account balance will be reversed automatically.`}
        isLoading={deleting}
      />

      <ConfirmDialog
        isOpen={!!deleteTransferTx}
        onClose={() => setDeleteTransferTx(null)}
        onConfirm={handleDeleteTransfer}
        title="Delete Transfer"
        message={`Delete this transfer of ${currency} ${deleteTransferTx ? Number(deleteTransferTx.amount).toLocaleString() : ""}? Both account balances will be reversed automatically.`}
        isLoading={deleting}
      />
    </div>
  );
};

export default Transactions;
