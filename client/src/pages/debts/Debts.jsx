import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import debtService from "../../services/debtService";
import DebtCard from "../../components/debts/DebtCard";
import DebtForm from "../../components/debts/DebtForm";
import ConfirmDialog from "../../components/shared/ConfirmDialog";
import EmptyState from "../../components/shared/EmptyState";
import Spinner from "../../components/shared/Spinner";
import SummaryCard from "../../components/shared/SummaryCard";
import {
  MdAdd,
  MdCreditCard,
  MdTrendingDown,
  MdTrendingUp,
} from "react-icons/md";
import toast from "react-hot-toast";

const TABS = [
  { key: "all", label: "All" },
  { key: "to_pay", label: "💸 I Owe" },
  { key: "to_receive", label: "💰 Owe Me" },
  { key: "settled", label: "✓ Settled" },
];

const Debts = () => {
  const { user } = useAuth();
  const currency = user?.currency || "LKR";

  const [debts, setDebts] = useState([]);
  const [summary, setSummary] = useState({ totalToPay: 0, totalToReceive: 0 });
  const [activeTab, setActiveTab] = useState("all");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editDebt, setEditDebt] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchDebts = useCallback(async () => {
    try {
      setLoading(true);
      const data = await debtService.getAll();
      setDebts(data.debts);
      setSummary({
        totalToPay: data.totalToPay,
        totalToReceive: data.totalToReceive,
      });
    } catch {
      toast.error("Failed to load debts");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDebts();
  }, [fetchDebts]);

  const filteredDebts = debts.filter((d) => {
    if (activeTab === "all") return d.status === "pending";
    if (activeTab === "to_pay")
      return d.debtType === "to_pay" && d.status === "pending";
    if (activeTab === "to_receive")
      return d.debtType === "to_receive" && d.status === "pending";
    if (activeTab === "settled") return d.status === "settled";
    return true;
  });

  const handleSubmit = async (formData) => {
    setSubmitting(true);
    try {
      if (editDebt) {
        await debtService.update(editDebt._id, formData);
        toast.success("Debt updated");
      } else {
        await debtService.create(formData);
        toast.success("Debt added");
      }
      setShowForm(false);
      setEditDebt(null);
      fetchDebts();
    } catch (err) {
      toast.error(err.response?.data?.message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSettle = async (debt) => {
    try {
      await debtService.settle(debt._id);
      toast.success(
        debt.status === "settled" ? "Marked as pending" : "Marked as settled",
      );
      fetchDebts();
    } catch {
      toast.error("Failed to update status");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await debtService.delete(deleteTarget._id);
      toast.success("Debt deleted");
      setDeleteTarget(null);
      fetchDebts();
    } catch {
      toast.error("Failed to delete debt");
    } finally {
      setDeleting(false);
    }
  };

  const fmt = (v) =>
    Number(v).toLocaleString("en-LK", { minimumFractionDigits: 2 });

  if (loading) return <Spinner size="lg" className="h-64" />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            Debts & Loans
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Track money you owe and money owed to you
          </p>
        </div>
        <button
          onClick={() => {
            setEditDebt(null);
            setShowForm(true);
          }}
          className="btn-primary flex items-center gap-2"
        >
          <MdAdd size={20} />
          <span className="hidden sm:inline">Add Debt</span>
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <SummaryCard
          title="Net Position"
          amount={summary.totalToReceive - summary.totalToPay}
          icon={MdCreditCard}
          color={
            summary.totalToReceive >= summary.totalToPay ? "blue" : "orange"
          }
          currency={currency}
          subtitle="Owed to me − I owe"
        />
        <SummaryCard
          title="Total Owed to Me"
          amount={summary.totalToReceive}
          icon={MdTrendingUp}
          color="green"
          currency={currency}
          subtitle="Pending receivables"
        />
        <SummaryCard
          title="Total I Owe"
          amount={summary.totalToPay}
          icon={MdTrendingDown}
          color="red"
          currency={currency}
          subtitle="Pending payments"
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl w-fit flex-wrap">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Cards */}
      {filteredDebts.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={MdCreditCard}
            title={
              activeTab === "settled"
                ? "No settled debts yet"
                : "No debts found"
            }
            subtitle={
              activeTab === "settled"
                ? "Settled debts will appear here"
                : "Add a debt to start tracking"
            }
            action={
              activeTab !== "settled" && (
                <button
                  onClick={() => {
                    setEditDebt(null);
                    setShowForm(true);
                  }}
                  className="btn-primary flex items-center gap-2 mt-2"
                >
                  <MdAdd size={18} /> Add Debt
                </button>
              )
            }
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredDebts.map((debt) => (
            <DebtCard
              key={debt._id}
              debt={debt}
              currency={currency}
              onEdit={(d) => {
                setEditDebt(d);
                setShowForm(true);
              }}
              onDelete={setDeleteTarget}
              onSettle={handleSettle}
            />
          ))}
        </div>
      )}

      <DebtForm
        isOpen={showForm}
        onClose={() => {
          setShowForm(false);
          setEditDebt(null);
        }}
        onSubmit={handleSubmit}
        debt={editDebt}
        isLoading={submitting}
      />
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Debt"
        message={`Delete debt of ${currency} ${deleteTarget ? fmt(deleteTarget.amount) : ""} with ${deleteTarget?.personName}? This cannot be undone.`}
        isLoading={deleting}
      />
    </div>
  );
};

export default Debts;
