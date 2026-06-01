import { useState } from "react";
import { MdSearch, MdFilterList, MdClose } from "react-icons/md";
import { INCOME_CATEGORIES, EXPENSE_CATEGORIES } from "../../utils/categories";

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 5 }, (_, i) => currentYear - i);

const TransactionFilters = ({ filters, onChange, onReset, accounts }) => {
  const [showFilters, setShowFilters] = useState(false);

  const allCategories = [
    ...new Set([...INCOME_CATEGORIES, ...EXPENSE_CATEGORIES]),
  ];

  // Only count filters the USER explicitly selected - not defaults like month/year/page/limit
  const activeFilterCount =
    [filters.search, filters.type, filters.category, filters.account].filter(
      (v) => v !== "" && v !== undefined && v !== null,
    ).length +
    (filters.month && filters.month !== new Date().getMonth() + 1 ? 1 : 0) +
    (filters.year && filters.year !== new Date().getFullYear() ? 1 : 0);

  return (
    <div className="space-y-3">
      {/* Search + filter toggle */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <MdSearch
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            placeholder="Search transactions..."
            value={filters.search || ""}
            onChange={(e) =>
              onChange({ ...filters, search: e.target.value, page: 1 })
            }
            className="input pl-10"
          />
        </div>

        <button
          onClick={() => setShowFilters((v) => !v)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
            showFilters
              ? "bg-primary-50 border-primary-300 text-primary-700 dark:bg-primary-900/20 dark:border-primary-700 dark:text-primary-400"
              : "border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
          }`}
        >
          <MdFilterList size={18} />
          Filters
          {activeFilterCount > 0 && (
            <span className="w-5 h-5 bg-primary-600 text-white text-xs rounded-full flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </button>

        {activeFilterCount > 0 && (
          <button
            onClick={onReset}
            className="flex items-center gap-1 px-3 py-2.5 rounded-lg text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 border border-red-200 dark:border-red-800 transition-colors"
          >
            <MdClose size={16} /> Clear
          </button>
        )}
      </div>

      {/* Expanded filters */}
      {showFilters && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700">
          {/* Type */}
          <div>
            <label className="label text-xs">Type</label>
            <select
              value={filters.type || ""}
              onChange={(e) =>
                onChange({ ...filters, type: e.target.value, page: 1 })
              }
              className="input text-sm py-2"
            >
              <option value="">All Types</option>
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>
          </div>

          {/* Category */}
          <div>
            <label className="label text-xs">Category</label>
            <select
              value={filters.category || ""}
              onChange={(e) =>
                onChange({ ...filters, category: e.target.value, page: 1 })
              }
              className="input text-sm py-2"
            >
              <option value="">All Categories</option>
              {allCategories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Account */}
          <div>
            <label className="label text-xs">Account</label>
            <select
              value={filters.account || ""}
              onChange={(e) =>
                onChange({ ...filters, account: e.target.value, page: 1 })
              }
              className="input text-sm py-2"
            >
              <option value="">All Accounts</option>
              {accounts?.map((a) => (
                <option key={a._id} value={a._id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>

          {/* Month */}
          <div>
            <label className="label text-xs">Month</label>
            <select
              value={filters.month || ""}
              onChange={(e) =>
                onChange({
                  ...filters,
                  month: e.target.value,
                  year: e.target.value
                    ? filters.year || new Date().getFullYear()
                    : "",
                  page: 1,
                })
              }
              className="input text-sm py-2"
            >
              <option value="">All Months</option>
              {MONTHS.map((m, i) => (
                <option key={m} value={i + 1}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          {/* Year */}
          <div>
            <label className="label text-xs">Year</label>
            <select
              value={filters.year || ""}
              onChange={(e) =>
                onChange({ ...filters, year: e.target.value, page: 1 })
              }
              className="input text-sm py-2"
            >
              <option value="">All Years</option>
              {YEARS.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          {/* Reset button inside panel */}
          <div className="flex items-end">
            <button
              onClick={onReset}
              className="btn-secondary w-full text-sm py-2"
            >
              Reset
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionFilters;
