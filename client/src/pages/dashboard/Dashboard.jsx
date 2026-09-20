import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import transactionService from "../../services/transactionService";
import accountService from "../../services/accountService";
import debtService from "../../services/debtService";
import SummaryCard from "../../components/shared/SummaryCard";
import EmptyState from "../../components/shared/EmptyState";
import Spinner from "../../components/shared/Spinner";
import {
  MdAccountBalance,
  MdTrendingUp,
  MdTrendingDown,
  MdCreditCard,
  MdReceiptLong,
  MdAdd,
  MdCalendarToday,
  MdExpandMore,
  MdExpandLess,
  MdClose,
} from "react-icons/md";
import { CATEGORY_COLORS } from "../../utils/categories";
import { formatCurrency } from "../../utils/currencies";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import toast from "react-hot-toast";

// ── Helpers ───────────────────────────────────────────────────────────────────
// Format date as YYYY-MM-DD without timezone conversion issues
const toYMD = (y, m, d) => {
  const mm = String(m + 1).padStart(2, "0");
  const dd = String(d).padStart(2, "0");
  return `${y}-${mm}-${dd}`;
};

const lastDay = (y, m) => new Date(y, m + 1, 0).getDate(); // last day of month

const getPresetRange = (preset) => {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth(); // 0-indexed

  switch (preset) {
    case "this_month":
      return {
        startDate: toYMD(y, m, 1),
        endDate: toYMD(y, m, lastDay(y, m)),
      };
    case "last_month": {
      const lm = m === 0 ? 11 : m - 1;
      const ly = m === 0 ? y - 1 : y;
      return {
        startDate: toYMD(ly, lm, 1),
        endDate: toYMD(ly, lm, lastDay(ly, lm)),
      };
    }
    case "last_3_months": {
      const sm = m - 2;
      const sy = sm < 0 ? y - 1 : y;
      const smAdj = sm < 0 ? sm + 12 : sm;
      return {
        startDate: toYMD(sy, smAdj, 1),
        endDate: toYMD(y, m, lastDay(y, m)),
      };
    }
    case "this_year":
      return {
        startDate: toYMD(y, 0, 1),
        endDate: toYMD(y, 11, 31),
      };
    default:
      return { startDate: "", endDate: "" };
  }
};

const PRESETS = [
  { key: "this_month", label: "This Month" },
  { key: "last_month", label: "Last Month" },
  { key: "last_3_months", label: "Last 3 Months" },
  { key: "this_year", label: "This Year" },
  { key: "custom", label: "Custom" },
];

const fmtLabel = (dateStr) => {
  if (!dateStr) return "";
  // Parse as local date - split to avoid UTC timezone shift
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-LK", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

// ── Dashboard ─────────────────────────────────────────────────────────────────
const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const currency = user?.currency || "LKR";

  const currentYear = new Date().getFullYear();

  // Welcome toast
  useEffect(() => {
    const msg = sessionStorage.getItem("welcomeMsg");
    if (msg) {
      toast.success(msg);
      sessionStorage.removeItem("welcomeMsg");
    }
  }, []);

  // Date range state - default to this month
  const [activePreset, setActivePreset] = useState("this_month");
  const [startDate, setStartDate] = useState(
    getPresetRange("this_month").startDate,
  );
  const [endDate, setEndDate] = useState(getPresetRange("this_month").endDate);
  const [showPicker, setShowPicker] = useState(false);
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");

  // Data state
  const [loading, setLoading] = useState(true);
  const [accounts, setAccounts] = useState([]);
  const [totalBalance, setTotalBalance] = useState(0);
  const [rangeIncome, setRangeIncome] = useState(0);
  const [rangeExpense, setRangeExpense] = useState(0);
  const [recentTx, setRecentTx] = useState([]);
  const [monthlySummary, setMonthlySummary] = useState([]);
  const [expensePie, setExpensePie] = useState([]);
  const [debtSummary, setDebtSummary] = useState({
    totalToPay: 0,
    totalToReceive: 0,
  });

  const handlePreset = (key) => {
    setActivePreset(key);
    if (key === "custom") return; // keep picker open, wait for Apply
    const { startDate: s, endDate: e } = getPresetRange(key);
    setStartDate(s);
    setEndDate(e);
    setShowPicker(false);
  };

  const handleCustomApply = () => {
    if (!customStart || !customEnd) {
      toast.error("Please select both dates");
      return;
    }
    if (new Date(customStart) > new Date(customEnd)) {
      toast.error("From date must be before To date");
      return;
    }
    setStartDate(customStart);
    setEndDate(customEnd);
    setShowPicker(false);
  };

  const fetchAll = useCallback(async () => {
    if (!startDate || !endDate) return;
    setLoading(true);
    try {
      const [accRes, txRes, recentRes, summaryRes, pieRes, debtRes] =
        await Promise.all([
          accountService.getAll(),
          transactionService.getAll({ startDate, endDate, limit: 1 }),
          transactionService.getAll({
            startDate,
            endDate,
            limit: 5,
            sort: "createdAt",
            order: "desc",
          }),
          transactionService.getMonthlySummary(currentYear),
          transactionService.getCategoryBreakdown({
            type: "expense",
            startDate,
            endDate,
          }),
          debtService.getAll(),
        ]);
      setAccounts(accRes.accounts);
      setTotalBalance(accRes.totalBalance);
      setRangeIncome(txRes.income);
      setRangeExpense(txRes.expense);
      setRecentTx(recentRes.transactions);
      setMonthlySummary(summaryRes.summary);
      setExpensePie(
        pieRes.breakdown.slice(0, 6).map((b) => ({
          name: b._id,
          value: b.total,
          color: CATEGORY_COLORS[b._id] || "#94a3b8",
        })),
      );
      setDebtSummary({
        totalToPay: debtRes.totalToPay,
        totalToReceive: debtRes.totalToReceive,
      });
    } catch {
      /* silent fail */
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, currentYear]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "morning";
    if (h < 17) return "afternoon";
    return "evening";
  };

  const fmtNum = (v) =>
    Number(v).toLocaleString("en-LK", { minimumFractionDigits: 2 });
  const fmtDate = (d) =>
    new Date(d).toLocaleDateString("en-LK", { day: "numeric", month: "short" });

  const activeLabel =
    activePreset !== "custom"
      ? PRESETS.find((p) => p.key === activePreset)?.label
      : "Custom Range";

  const rangeDisplay = `${fmtLabel(startDate)} - ${fmtLabel(endDate)}`;

  if (loading) return <Spinner size="lg" className="h-64" />;

  return (
    <div className="space-y-6">
      {/* Welcome banner */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl p-5 text-white">
        <h2 className="text-lg font-semibold mb-0.5">
          Good {greeting()}, {user?.fullName?.split(" ")[0]}! 👋
        </h2>
        <p className="text-primary-100 text-sm">
          Here's your financial overview.
        </p>
      </div>

      {/* Date Range Filter Bar */}
      <div className="relative">
        {/* Trigger button */}
        <button
          onClick={() => setShowPicker((v) => !v)}
          className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm hover:border-primary-400 transition-colors text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          <MdCalendarToday size={16} className="text-primary-600" />
          <span className="text-primary-600 font-semibold">{activeLabel}</span>
          <span className="text-gray-400 hidden sm:inline">·</span>
          <span className="text-gray-500 dark:text-gray-400 hidden sm:inline text-xs">
            {rangeDisplay}
          </span>
          {showPicker ? (
            <MdExpandLess size={18} className="text-gray-400 ml-auto" />
          ) : (
            <MdExpandMore size={18} className="text-gray-400 ml-auto" />
          )}
        </button>

        {/* Dropdown picker */}
        {showPicker && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setShowPicker(false)}
            />
            <div className="absolute top-full left-0 mt-2 z-20 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl p-4 min-w-[320px]">
              {/* Preset buttons */}
              <p className="text-xs text-gray-400 font-medium mb-2 uppercase tracking-wide">
                Quick Select
              </p>
              <div className="grid grid-cols-2 gap-2 mb-4">
                {PRESETS.map((p) => (
                  <button
                    key={p.key}
                    onClick={() => handlePreset(p.key)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left ${
                      activePreset === p.key
                        ? "bg-primary-600 text-white"
                        : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600"
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              {/* Custom date inputs */}
              {activePreset === "custom" && (
                <div className="border-t border-gray-100 dark:border-gray-700 pt-3 space-y-3">
                  <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">
                    Custom Range
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="label text-xs">From</label>
                      <input
                        type="date"
                        value={customStart}
                        onChange={(e) => setCustomStart(e.target.value)}
                        className="input text-sm py-2"
                      />
                    </div>
                    <div>
                      <label className="label text-xs">To</label>
                      <input
                        type="date"
                        value={customEnd}
                        onChange={(e) => setCustomEnd(e.target.value)}
                        className="input text-sm py-2"
                      />
                    </div>
                  </div>
                  <button
                    onClick={handleCustomApply}
                    className="btn-primary w-full text-sm py-2"
                  >
                    Apply Range
                  </button>
                </div>
              )}

              {/* Active range display */}
              {activePreset !== "custom" && (
                <div className="border-t border-gray-100 dark:border-gray-700 pt-3">
                  <p className="text-xs text-gray-400">Selected range</p>
                  <p className="text-sm font-medium text-primary-600 mt-0.5">
                    {rangeDisplay}
                  </p>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        <SummaryCard
          title="Total Balance"
          amount={totalBalance}
          icon={MdAccountBalance}
          color="blue"
          currency={currency}
          subtitle={`${accounts.length} account${accounts.length !== 1 ? "s" : ""}`}
        />
        <SummaryCard
          title="Income"
          amount={rangeIncome}
          icon={MdTrendingUp}
          color="green"
          currency={currency}
          subtitle={activeLabel}
        />
        <SummaryCard
          title="Expenses"
          amount={rangeExpense}
          icon={MdTrendingDown}
          color="red"
          currency={currency}
          subtitle={activeLabel}
        />
        <SummaryCard
          title="Debt to Pay"
          amount={debtSummary.totalToPay}
          icon={MdCreditCard}
          color="orange"
          currency={currency}
          subtitle="Pending payments"
        />
        <SummaryCard
          title="Money to Receive"
          amount={debtSummary.totalToReceive}
          icon={MdTrendingUp}
          color="purple"
          currency={currency}
          subtitle="Pending receivables"
        />
        <button
          onClick={() => navigate("/accounts")}
          className="card flex flex-col items-center justify-center min-h-[100px] border-dashed border-2 border-gray-200 dark:border-gray-600 bg-transparent shadow-none hover:border-primary-400 hover:bg-primary-50/50 dark:hover:bg-primary-900/10 transition-colors group"
        >
          <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mb-2 group-hover:bg-primary-100">
            <MdAdd
              size={20}
              className="text-gray-400 group-hover:text-primary-500"
            />
          </div>
          <p className="text-sm text-gray-400 group-hover:text-primary-500 font-medium">
            Manage Accounts
          </p>
        </button>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="card lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-gray-800 dark:text-gray-200">
              Income vs Expenses
            </h3>
            <span className="text-xs text-gray-400">
              {currentYear} - Monthly
            </span>
          </div>
          {monthlySummary.every((m) => m.income === 0 && m.expense === 0) ? (
            <div className="h-[220px] flex items-center justify-center">
              <p className="text-sm text-gray-400">
                No data yet - add some transactions
              </p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={monthlySummary} barSize={12} barGap={3}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#f0f0f0"
                  vertical={false}
                />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  formatter={(v) => [`${currency} ${fmtNum(v)}`, ""]}
                  contentStyle={{
                    borderRadius: 8,
                    border: "none",
                    fontSize: 12,
                  }}
                />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: 12 }}
                />
                <Bar
                  dataKey="income"
                  name="Income"
                  fill="#22c55e"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="expense"
                  name="Expenses"
                  fill="#ef4444"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-gray-800 dark:text-gray-200">
              Expenses by Category
            </h3>
            <span className="text-xs text-gray-400">{activeLabel}</span>
          </div>
          {expensePie.length === 0 ? (
            <div className="h-[160px] flex items-center justify-center">
              <p className="text-sm text-gray-400 text-center">
                No expenses in this period
              </p>
            </div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie
                    data={expensePie}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={70}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {expensePie.map((e, i) => (
                      <Cell key={i} fill={e.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v) => [`${currency} ${fmtNum(v)}`, ""]}
                    contentStyle={{
                      borderRadius: 8,
                      border: "none",
                      fontSize: 12,
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-2">
                {expensePie.map((cat) => (
                  <div
                    key={cat.name}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: cat.color }}
                      />
                      <span className="text-xs text-gray-600 dark:text-gray-400">
                        {cat.name}
                      </span>
                    </div>
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                      {currency} {fmtNum(cat.value)}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Recent transactions */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-semibold text-gray-800 dark:text-gray-200">
              Recent Transactions
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">{rangeDisplay}</p>
          </div>
          <button
            onClick={() => navigate("/transactions")}
            className="text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            View all
          </button>
        </div>
        {recentTx.length === 0 ? (
          <EmptyState
            icon={MdReceiptLong}
            title="No transactions in this period"
            subtitle="Try a different date range or add new transactions"
            action={
              <button
                onClick={() => navigate("/transactions")}
                className="btn-primary flex items-center gap-2 mt-2"
              >
                <MdAdd size={18} /> Add Transaction
              </button>
            }
          />
        ) : (
          <div className="space-y-1">
            {recentTx.map((tx) => (
              <div
                key={tx._id}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              >
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${tx.type === "income" ? "bg-green-100 dark:bg-green-900/30" : "bg-red-100 dark:bg-red-900/30"}`}
                >
                  {tx.type === "income" ? (
                    <MdTrendingUp
                      size={18}
                      className="text-green-600 dark:text-green-400"
                    />
                  ) : (
                    <MdTrendingDown
                      size={18}
                      className="text-red-500 dark:text-red-400"
                    />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                    {tx.description || tx.category}
                  </p>
                  <p className="text-xs text-gray-400">
                    {tx.category} · {fmtDate(tx.date)}
                  </p>
                </div>
                <span
                  className={`text-sm font-semibold flex-shrink-0 ${tx.type === "income" ? "text-green-600 dark:text-green-400" : "text-red-500 dark:text-red-400"}`}
                >
                  {tx.type === "income" ? "+" : "-"}{" "}
                  {formatCurrency(tx.amount, tx.currency)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
