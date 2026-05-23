import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import transactionService from "../../services/transactionService";
import accountService from "../../services/accountService";
import Spinner from "../../components/shared/Spinner";
import SummaryCard from "../../components/shared/SummaryCard";
import {
  MdTrendingUp,
  MdTrendingDown,
  MdAccountBalance,
  MdBarChart,
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
  Legend,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";

const currentYear = new Date().getFullYear();
const currentMonth = new Date().getMonth() + 1;
const YEARS = Array.from({ length: 5 }, (_, i) => currentYear - i);
const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const Reports = () => {
  const { user } = useAuth();
  const currency = user?.currency || "LKR";

  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [period, setPeriod] = useState("monthly"); // monthly | yearly

  const [monthlySummary, setMonthlySummary] = useState([]);
  const [expenseBreakdown, setExpenseBreakdown] = useState([]);
  const [incomeBreakdown, setIncomeBreakdown] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [totals, setTotals] = useState({ income: 0, expense: 0 });
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params =
        period === "monthly"
          ? { month: selectedMonth, year: selectedYear }
          : { year: selectedYear };

      const [summaryRes, expenseRes, incomeRes, accountsRes, totalsRes] =
        await Promise.all([
          transactionService.getMonthlySummary(selectedYear),
          transactionService.getCategoryBreakdown({
            type: "expense",
            ...params,
          }),
          transactionService.getCategoryBreakdown({
            type: "income",
            ...params,
          }),
          accountService.getAll(),
          transactionService.getAll({ ...params, limit: 1 }),
        ]);

      setMonthlySummary(summaryRes.summary);
      setExpenseBreakdown(
        expenseRes.breakdown.map((b) => ({
          name: b._id,
          value: b.total,
          color: CATEGORY_COLORS[b._id] || "#94a3b8",
        })),
      );
      setIncomeBreakdown(
        incomeRes.breakdown.map((b) => ({
          name: b._id,
          value: b.total,
          color: CATEGORY_COLORS[b._id] || "#94a3b8",
        })),
      );
      setAccounts(accountsRes.accounts);
      setTotals({ income: totalsRes.income, expense: totalsRes.expense });
    } catch {
      // fail silently — charts just show empty
    } finally {
      setLoading(false);
    }
  }, [selectedYear, selectedMonth, period]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const fmt = (v) =>
    Number(v).toLocaleString("en-LK", { minimumFractionDigits: 2 });

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl shadow-lg p-3 text-xs">
        <p className="font-semibold text-gray-700 dark:text-gray-300 mb-2">
          {label}
        </p>
        {payload.map((p) => (
          <p key={p.name} style={{ color: p.color }}>
            {p.name}: {currency} {fmt(p.value)}
          </p>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            Reports
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Financial analysis and insights
          </p>
        </div>

        {/* Period controls */}
        <div className="flex gap-2 flex-wrap">
          <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
            {["monthly", "yearly"].map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium capitalize transition-colors ${
                  period === p
                    ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
          {period === "monthly" && (
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="input py-1.5 text-sm w-auto"
            >
              {MONTHS.map((m, i) => (
                <option key={m} value={i + 1}>
                  {m}
                </option>
              ))}
            </select>
          )}
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="input py-1.5 text-sm w-auto"
          >
            {YEARS.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <Spinner size="lg" className="h-64" />
      ) : (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <SummaryCard
              title="Total Income"
              amount={totals.income}
              icon={MdTrendingUp}
              color="green"
              currency={currency}
              subtitle={
                period === "monthly"
                  ? `${MONTHS[selectedMonth - 1]} ${selectedYear}`
                  : String(selectedYear)
              }
            />
            <SummaryCard
              title="Total Expenses"
              amount={totals.expense}
              icon={MdTrendingDown}
              color="red"
              currency={currency}
              subtitle={
                period === "monthly"
                  ? `${MONTHS[selectedMonth - 1]} ${selectedYear}`
                  : String(selectedYear)
              }
            />
            <SummaryCard
              title="Net Savings"
              amount={totals.income - totals.expense}
              icon={MdAccountBalance}
              color={totals.income >= totals.expense ? "blue" : "orange"}
              currency={currency}
              subtitle="Income − Expenses"
            />
          </div>

          {/* Annual bar chart */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-gray-800 dark:text-gray-200">
                Monthly Trends - {selectedYear}
              </h3>
              <MdBarChart size={20} className="text-gray-400" />
            </div>
            {monthlySummary.every((m) => m.income === 0 && m.expense === 0) ? (
              <p className="text-center text-gray-400 py-12 text-sm">
                No data for {selectedYear}
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={monthlySummary} barSize={12} barGap={3}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#f0f0f0"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                  />
                  <Tooltip content={<CustomTooltip />} />
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

          {/* Savings line chart */}
          <div className="card">
            <h3 className="text-base font-semibold text-gray-800 dark:text-gray-200 mb-4">
              Savings Trend - {selectedYear}
            </h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart
                data={monthlySummary.map((m) => ({
                  ...m,
                  savings: m.income - m.expense,
                }))}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#f0f0f0"
                  vertical={false}
                />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="savings"
                  name="Savings"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Pie charts row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Expense breakdown */}
            <div className="card">
              <h3 className="text-base font-semibold text-gray-800 dark:text-gray-200 mb-4">
                Expense Breakdown
              </h3>
              {expenseBreakdown.length === 0 ? (
                <p className="text-center text-gray-400 py-8 text-sm">
                  No expense data
                </p>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie
                        data={expenseBreakdown}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {expenseBreakdown.map((e, i) => (
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
                    {expenseBreakdown.slice(0, 6).map((cat) => (
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

            {/* Income breakdown */}
            <div className="card">
              <h3 className="text-base font-semibold text-gray-800 dark:text-gray-200 mb-4">
                Income Breakdown
              </h3>
              {incomeBreakdown.length === 0 ? (
                <p className="text-center text-gray-400 py-8 text-sm">
                  No income data
                </p>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie
                        data={incomeBreakdown}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {incomeBreakdown.map((e, i) => (
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
                    {incomeBreakdown.slice(0, 6).map((cat) => (
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

          {/* Account balances */}
          {accounts.length > 0 && (
            <div className="card">
              <h3 className="text-base font-semibold text-gray-800 dark:text-gray-200 mb-4">
                Account Balances
              </h3>
              <div className="space-y-3">
                {accounts.map((acc) => {
                  const total = accounts.reduce(
                    (s, a) => s + Math.max(a.currentBalance, 0),
                    0,
                  );
                  const pct =
                    total > 0
                      ? (Math.max(acc.currentBalance, 0) / total) * 100
                      : 0;
                  return (
                    <div key={acc._id}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          {acc.name}
                        </span>
                        <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                          {currency} {fmt(acc.currentBalance)}
                        </span>
                      </div>
                      <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${pct}%`,
                            backgroundColor: acc.color,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Reports;
