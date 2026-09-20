const Transaction = require("../models/Transaction");
const Account = require("../models/Account");
const { getExchangeRates, convert } = require("../utils/exchangeRateService");

// Convert an amount from its own currency to the target currency, falling
// back to the raw amount if a rate is missing (shouldn't normally happen).
const toPrimary = (amount, fromCurrency, primaryCurrency, rates) => {
  try {
    return convert(amount, fromCurrency || "LKR", primaryCurrency, rates);
  } catch {
    return amount;
  }
};

// Helper - adjust account balance when a transaction is created/edited/deleted
const adjustBalance = async (accountId, amount, type, direction) => {
  // direction: 'add' or 'subtract'
  const delta =
    type === "income"
      ? direction === "add"
        ? amount
        : -amount
      : direction === "add"
        ? -amount
        : amount;

  await Account.findByIdAndUpdate(accountId, {
    $inc: { currentBalance: delta },
  });
};

// @desc    Get all transactions with filtering, search, pagination
// @route   GET /api/transactions
// @access  Private
const getTransactions = async (req, res, next) => {
  try {
    const {
      type,
      category,
      account,
      startDate,
      endDate,
      month,
      year,
      minAmount,
      maxAmount,
      search,
      page = 1,
      limit = 20,
      sort = "date",
      order = "desc",
    } = req.query;

    const filter = { user: req.user._id };

    // For transfers, only show the debit (from) side to avoid duplicate entries
    filter.$nor = [{ type: "transfer", isDebit: false }];

    if (type) filter.type = type;
    if (category) filter.category = { $regex: category, $options: "i" };
    if (account) filter.account = account;

    // Date filters
    if (month && year) {
      const m = parseInt(month) - 1;
      const y = parseInt(year);
      filter.date = {
        $gte: new Date(y, m, 1),
        $lt: new Date(y, m + 1, 1),
      };
    } else if (year) {
      filter.date = {
        $gte: new Date(parseInt(year), 0, 1),
        $lt: new Date(parseInt(year) + 1, 0, 1),
      };
    } else if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    // Amount range
    if (minAmount || maxAmount) {
      filter.amount = {};
      if (minAmount) filter.amount.$gte = parseFloat(minAmount);
      if (maxAmount) filter.amount.$lte = parseFloat(maxAmount);
    }

    // Search by description or category
    if (search) {
      filter.$or = [
        { description: { $regex: search, $options: "i" } },
        { category: { $regex: search, $options: "i" } },
      ];
    }

    const sortObj = { [sort]: order === "asc" ? 1 : -1 };
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [transactions, total] = await Promise.all([
      Transaction.find(filter)
        .populate("account", "name type color currency")
        .populate("toAccount", "name type color currency")
        .sort(sortObj)
        .skip(skip)
        .limit(parseInt(limit)),
      Transaction.countDocuments(filter),
    ]);

    // Totals for filtered results, converted to the user's primary currency
    // Calculate totals excluding debt-generated transactions (same filter as category breakdown)
    const totalsFilter = {
      ...filter,
      isDebtTransaction: { $ne: true },
    };

    const primaryCurrency = req.user.currency || "LKR";
    const { rates } = await getExchangeRates();
    const totalsDocs = await Transaction.find(totalsFilter).select("type amount currency");

    let income = 0;
    let expense = 0;
    for (const t of totalsDocs) {
      const converted = toPrimary(t.amount, t.currency, primaryCurrency, rates);
      if (t.type === "income") income += converted;
      else if (t.type === "expense") expense += converted;
    }

    res.status(200).json({
      success: true,
      count: transactions.length,
      total,
      pages: Math.ceil(total / parseInt(limit)),
      currentPage: parseInt(page),
      income,
      expense,
      balance: income - expense,
      primaryCurrency,
      transactions,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single transaction
// @route   GET /api/transactions/:id
// @access  Private
const getTransaction = async (req, res, next) => {
  try {
    const transaction = await Transaction.findOne({
      _id: req.params.id,
      user: req.user._id,
    }).populate("account", "name type color");

    if (!transaction) {
      return res
        .status(404)
        .json({ success: false, message: "Transaction not found" });
    }

    res.status(200).json({ success: true, transaction });
  } catch (error) {
    next(error);
  }
};

// @desc    Create transaction + update account balance
// @route   POST /api/transactions
// @access  Private
const createTransaction = async (req, res, next) => {
  try {
    const { type, amount, category, account, date, description } = req.body;

    if (!type || !amount || !category || !account) {
      return res.status(400).json({
        success: false,
        message: "Type, amount, category, and account are required",
      });
    }

    // Verify account belongs to user
    const accountDoc = await Account.findOne({
      _id: account,
      user: req.user._id,
      isActive: true,
    });
    if (!accountDoc) {
      return res
        .status(404)
        .json({ success: false, message: "Account not found" });
    }

    const transaction = await Transaction.create({
      user: req.user._id,
      type,
      amount: parseFloat(amount),
      currency: accountDoc.currency,
      category,
      account,
      date: date || new Date(),
      description: description || "",
    });

    // Update account balance
    await adjustBalance(account, parseFloat(amount), type, "add");

    const populated = await transaction.populate("account", "name type color");

    res.status(201).json({ success: true, transaction: populated });
  } catch (error) {
    next(error);
  }
};

// @desc    Update transaction + recalculate balance
// @route   PUT /api/transactions/:id
// @access  Private
const updateTransaction = async (req, res, next) => {
  try {
    const transaction = await Transaction.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!transaction) {
      return res
        .status(404)
        .json({ success: false, message: "Transaction not found" });
    }

    const { type, amount, category, account, date, description } = req.body;

    // Reverse old transaction effect on old account
    await adjustBalance(
      transaction.account,
      transaction.amount,
      transaction.type,
      "subtract",
    );

    // If account changed, verify new account
    const newAccountId = account || transaction.account;
    let newAccountDoc = null;
    if (account && account !== String(transaction.account)) {
      newAccountDoc = await Account.findOne({
        _id: account,
        user: req.user._id,
        isActive: true,
      });
      if (!newAccountDoc) {
        // Re-apply old effect and bail
        await adjustBalance(
          transaction.account,
          transaction.amount,
          transaction.type,
          "add",
        );
        return res
          .status(404)
          .json({ success: false, message: "Account not found" });
      }
    }

    // Apply updates
    transaction.type = type || transaction.type;
    transaction.amount = amount ? parseFloat(amount) : transaction.amount;
    transaction.category = category || transaction.category;
    transaction.account = newAccountId;
    // Transaction currency always tracks its account's currency
    if (newAccountDoc) transaction.currency = newAccountDoc.currency;
    transaction.date = date || transaction.date;
    transaction.description =
      description !== undefined ? description : transaction.description;

    await transaction.save();

    // Apply new transaction effect on (possibly new) account
    await adjustBalance(
      newAccountId,
      transaction.amount,
      transaction.type,
      "add",
    );

    const populated = await transaction.populate("account", "name type color");

    res.status(200).json({ success: true, transaction: populated });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete transaction + reverse balance
// @route   DELETE /api/transactions/:id
// @access  Private
const deleteTransaction = async (req, res, next) => {
  try {
    const transaction = await Transaction.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!transaction) {
      return res
        .status(404)
        .json({ success: false, message: "Transaction not found" });
    }

    // Skip balance reversal for debt-generated transactions
    // Debt deletion already handles balance reversal - reversing again causes double adjustment
    if (!transaction.isDebtTransaction) {
      await adjustBalance(
        transaction.account,
        transaction.amount,
        transaction.type,
        "subtract",
      );
    }

    await transaction.deleteOne();

    res
      .status(200)
      .json({ success: true, message: "Transaction deleted successfully" });
  } catch (error) {
    next(error);
  }
};

// @desc    Get monthly summary for dashboard charts
// @route   GET /api/transactions/summary
// @access  Private
const getMonthlySummary = async (req, res, next) => {
  try {
    const year = parseInt(req.query.year) || new Date().getFullYear();
    const primaryCurrency = req.user.currency || "LKR";
    const { rates } = await getExchangeRates();

    const docs = await Transaction.find({
      user: req.user._id,
      date: {
        $gte: new Date(year, 0, 1),
        $lt: new Date(year + 1, 0, 1),
      },
    }).select("type amount currency date");

    // Build 12-month array
    const months = [
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
    const result = months.map((month) => ({ month, income: 0, expense: 0 }));

    for (const t of docs) {
      if (t.type !== "income" && t.type !== "expense") continue;
      const monthIndex = new Date(t.date).getMonth();
      const converted = toPrimary(t.amount, t.currency, primaryCurrency, rates);
      result[monthIndex][t.type] += converted;
    }

    res.status(200).json({ success: true, summary: result });
  } catch (error) {
    next(error);
  }
};

// @desc    Get category breakdown
// @route   GET /api/transactions/categories
// @access  Private
const getCategoryBreakdown = async (req, res, next) => {
  try {
    const { type = "expense", month, year, startDate, endDate } = req.query;
    const filter = {
      user: req.user._id,
      type,
      // Exclude debt-generated transactions from category breakdown
      isDebtTransaction: { $ne: true },
      // Exclude transfer credit side (only show debit side to avoid duplicates)
      $nor: [{ type: "transfer", isDebit: false }],
    };

    if (startDate && endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      filter.date = { $gte: new Date(startDate), $lte: end };
    } else if (month && year) {
      const m = parseInt(month) - 1;
      const y = parseInt(year);
      filter.date = { $gte: new Date(y, m, 1), $lt: new Date(y, m + 1, 1) };
    }

    const primaryCurrency = req.user.currency || "LKR";
    const { rates } = await getExchangeRates();
    const docs = await Transaction.find(filter).select("category amount currency");

    const totalsByCategory = {};
    for (const t of docs) {
      const converted = toPrimary(t.amount, t.currency, primaryCurrency, rates);
      if (!totalsByCategory[t.category]) {
        totalsByCategory[t.category] = { total: 0, count: 0 };
      }
      totalsByCategory[t.category].total += converted;
      totalsByCategory[t.category].count += 1;
    }

    const breakdown = Object.entries(totalsByCategory)
      .map(([category, { total, count }]) => ({ _id: category, total, count }))
      .sort((a, b) => b.total - a.total);

    res.status(200).json({ success: true, breakdown });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a transfer between two accounts
// @route   POST /api/transactions/transfer
// @access  Private
const createTransfer = async (req, res, next) => {
  try {
    const { fromAccount, toAccount, amount, date, description } = req.body;

    if (!fromAccount || !toAccount || !amount) {
      return res.status(400).json({
        success: false,
        message: "From account, to account, and amount are required",
      });
    }

    if (fromAccount === toAccount) {
      return res.status(400).json({
        success: false,
        message: "From and To accounts must be different",
      });
    }

    const parsedAmount = parseFloat(amount);

    // Verify both accounts belong to user
    const [fromAcc, toAcc] = await Promise.all([
      Account.findOne({ _id: fromAccount, user: req.user._id, isActive: true }),
      Account.findOne({ _id: toAccount, user: req.user._id, isActive: true }),
    ]);

    if (!fromAcc)
      return res
        .status(404)
        .json({ success: false, message: "Source account not found" });
    if (!toAcc)
      return res
        .status(404)
        .json({ success: false, message: "Destination account not found" });

    // Generate a unique reference to link both transactions
    const transferRef = `TRF-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    const transferDate = date || new Date();
    const transferDesc =
      description || `Transfer from ${fromAcc.name} to ${toAcc.name}`;

    // Cross-currency: convert the amount into the destination account's
    // currency so the credit side reflects what actually lands there.
    // Each linked transaction stores its own amount in its own currency.
    // Accounts created before multi-currency support have no `currency`
    // stored yet, so normalize missing values to LKR before comparing.
    const fromCurrency = fromAcc.currency || "LKR";
    const toCurrency = toAcc.currency || "LKR";
    let receivedAmount = parsedAmount;
    if (fromCurrency !== toCurrency) {
      const { rates } = await getExchangeRates();
      receivedAmount = convert(parsedAmount, fromCurrency, toCurrency, rates);
    }

    // Create two linked transactions - debit (from) and credit (to)
    const [debitTx, creditTx] = await Promise.all([
      Transaction.create({
        user: req.user._id,
        type: "transfer",
        amount: parsedAmount,
        currency: fromCurrency,
        category: "Transfer",
        account: fromAccount,
        toAccount: toAccount,
        transferRef,
        isDebit: true, // this is the FROM side - shown in list
        date: transferDate,
        description: transferDesc,
      }),
      Transaction.create({
        user: req.user._id,
        type: "transfer",
        amount: receivedAmount,
        currency: toCurrency,
        category: "Transfer",
        account: toAccount,
        toAccount: fromAccount,
        transferRef,
        isDebit: false, // this is the TO side - hidden from list
        date: transferDate,
        description: transferDesc,
      }),
    ]);

    // Update both account balances - each in its own currency
    await Promise.all([
      Account.findByIdAndUpdate(fromAccount, {
        $inc: { currentBalance: -parsedAmount },
      }),
      Account.findByIdAndUpdate(toAccount, {
        $inc: { currentBalance: receivedAmount },
      }),
    ]);

    const populated = await debitTx.populate(
      "account toAccount",
      "name type color currency",
    );

    res
      .status(201)
      .json({ success: true, transaction: populated, transferRef });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a transfer (both linked transactions)
// @route   DELETE /api/transactions/transfer/:transferRef
// @access  Private
const deleteTransfer = async (req, res, next) => {
  try {
    const { transferRef } = req.params;

    const transactions = await Transaction.find({
      transferRef,
      user: req.user._id,
    });

    if (!transactions || transactions.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Transfer not found" });
    }

    // Each side of a transfer may hold a different amount (cross-currency),
    // so reverse each transaction by its own stored amount rather than
    // assuming both sides match.
    for (const t of transactions) {
      const delta = t.isDebit ? t.amount : -t.amount;
      await Account.findByIdAndUpdate(t.account, {
        $inc: { currentBalance: delta },
      });
    }

    await Transaction.deleteMany({ transferRef, user: req.user._id });

    res
      .status(200)
      .json({ success: true, message: "Transfer deleted successfully" });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getTransactions,
  getTransaction,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  getMonthlySummary,
  getCategoryBreakdown,
  createTransfer,
  deleteTransfer,
};
