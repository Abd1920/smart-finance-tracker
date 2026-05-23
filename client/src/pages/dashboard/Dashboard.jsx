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
} from "react-icons/md";
import { CATEGORY_COLORS } from "../../utils/categories";
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

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const currency = user?.currency || "LKR";

  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  // Show welcome toast if coming from login/register
  useEffect(() => {
    const msg = sessionStorage.getItem("welcomeMsg");
    if (msg) {
      toast.success(msg);
      sessionStorage.removeItem("welcomeMsg");
    }
  }, []);

  const [loading, setLoading] = useState(true);
  const [accounts, setAccounts] = useState([]);
  const [totalBalance, setTotalBalance] = useState(0);
  const [monthlyTotals, setMonthlyTotals] = useState({ income: 0, expense: 0 });
  const [recentTx, setRecentTx] = useState([]);
  const [monthlySummary, setMonthlySummary] = useState([]);
  const [expensePie, setExpensePie] = useState([]);
  const [debtSummary, setDebtSummary] = useState({
    totalToPay: 0,
    totalToReceive: 0,
  });

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [accRes, txRes, recentRes, summaryRes, pieRes, debtRes] =
        await Promise.all([
          accountService.getAll(),
          transactionService.getAll({
            month: currentMonth,
            year: currentYear,
            limit: 1,
          }),
          transactionService.getAll({ limit: 5, sort: "date", order: "desc" }),
          transactionService.getMonthlySummary(currentYear),
          transactionService.getCategoryBreakdown({
            type: "expense",
            month: currentMonth,
            year: currentYear,
          }),
          debtService.getAll(),
        ]);

      setAccounts(accRes.accounts);
      setTotalBalance(accRes.totalBalance);
      setMonthlyTotals({ income: txRes.income, expense: txRes.expense });
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
      // silent fail
    } finally {
      setLoading(false);
    }
  }, [currentMonth, currentYear]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "morning";
    if (h < 17) return "afternoon";
    return "evening";
  };

  const fmt = (v) =>
    Number(v).toLocaleString("en-LK", { minimumFractionDigits: 2 });
  const fmtDate = (d) =>
    new Date(d).toLocaleDateString("en-LK", { day: "numeric", month: "short" });

  if (loading) return <Spinner size="lg" className="h-64" />;

  return (
    <div className="space-y-6">
      {/* Welcome banner */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl p-5 text-white">
        <h2 className="text-lg font-semibold mb-0.5">
          Good {greeting()}, {user?.fullName?.split(" ")[0]}! 👋
        </h2>
        <p className="text-primary-100 text-sm">
          Here's your financial overview for{" "}
          {new Date().toLocaleDateString("en-LK", {
            month: "long",
            year: "numeric",
          })}
          .
        </p>
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
          title="Income This Month"
          amount={monthlyTotals.income}
          icon={MdTrendingUp}
          color="green"
          currency={currency}
          subtitle={new Date().toLocaleString("en-LK", { month: "long" })}
        />
        <SummaryCard
          title="Expenses This Month"
          amount={monthlyTotals.expense}
          icon={MdTrendingDown}
          color="red"
          currency={currency}
          subtitle={new Date().toLocaleString("en-LK", { month: "long" })}
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

        {/* Add account shortcut */}
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
        {/* Bar chart */}
        <div className="card lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-gray-800 dark:text-gray-200">
              Income vs Expenses
            </h3>
            <span className="text-xs text-gray-400">{currentYear}</span>
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
                  formatter={(v) => [`${currency} ${fmt(v)}`, ""]}
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

        {/* Expense pie */}
        <div className="card">
          <h3 className="text-base font-semibold text-gray-800 dark:text-gray-200 mb-4">
            Expenses by Category
          </h3>
          {expensePie.length === 0 ? (
            <div className="h-[160px] flex items-center justify-center">
              <p className="text-sm text-gray-400 text-center">
                No expenses this month
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
                    formatter={(v) => [`${currency} ${fmt(v)}`, ""]}
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
                      {currency} {fmt(cat.value)}
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
          <h3 className="text-base font-semibold text-gray-800 dark:text-gray-200">
            Recent Transactions
          </h3>
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
            title="No transactions yet"
            subtitle="Add your first transaction to get started"
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
                  {tx.type === "income" ? "+" : "-"} {currency} {fmt(tx.amount)}
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
