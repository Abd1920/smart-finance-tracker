const Transaction = require("../models/Transaction");
const Account = require("../models/Account");

// Helper — adjust account balance when a transaction is created/edited/deleted
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
        .populate("account", "name type color")
        .populate("toAccount", "name type color")
        .sort(sortObj)
        .skip(skip)
        .limit(parseInt(limit)),
      Transaction.countDocuments(filter),
    ]);

    // Totals for filtered results
    const totals = await Transaction.aggregate([
      { $match: filter },
      {
        $group: {
          _id: "$type",
          total: { $sum: "$amount" },
        },
      },
    ]);

    const income = totals.find((t) => t._id === "income")?.total || 0;
    const expense = totals.find((t) => t._id === "expense")?.total || 0;

    res.status(200).json({
      success: true,
      count: transactions.length,
      total,
      pages: Math.ceil(total / parseInt(limit)),
      currentPage: parseInt(page),
      income,
      expense,
      balance: income - expense,
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
    if (account && account !== String(transaction.account)) {
      const accountDoc = await Account.findOne({
        _id: account,
        user: req.user._id,
        isActive: true,
      });
      if (!accountDoc) {
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
    // Debt deletion already handles balance reversal — reversing again causes double adjustment
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

    const summary = await Transaction.aggregate([
      {
        $match: {
          user: req.user._id,
          date: {
            $gte: new Date(year, 0, 1),
            $lt: new Date(year + 1, 0, 1),
          },
        },
      },
      {
        $group: {
          _id: { month: { $month: "$date" }, type: "$type" },
          total: { $sum: "$amount" },
        },
      },
      { $sort: { "_id.month": 1 } },
    ]);

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
    const result = months.map((month, i) => {
      const inc = summary.find(
        (s) => s._id.month === i + 1 && s._id.type === "income",
      );
      const exp = summary.find(
        (s) => s._id.month === i + 1 && s._id.type === "expense",
      );
      return {
        month,
        income: inc?.total || 0,
        expense: exp?.total || 0,
      };
    });

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
    const { type = "expense", month, year } = req.query;
    const filter = { user: req.user._id, type };

    if (month && year) {
      const m = parseInt(month) - 1;
      const y = parseInt(year);
      filter.date = { $gte: new Date(y, m, 1), $lt: new Date(y, m + 1, 1) };
    }

    const breakdown = await Transaction.aggregate([
      { $match: filter },
      {
        $group: {
          _id: "$category",
          total: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
      { $sort: { total: -1 } },
    ]);

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

    // Create two linked transactions — debit (from) and credit (to)
    const [debitTx, creditTx] = await Promise.all([
      Transaction.create({
        user: req.user._id,
        type: "transfer",
        amount: parsedAmount,
        category: "Transfer",
        account: fromAccount,
        toAccount: toAccount,
        transferRef,
        isDebit: true, // this is the FROM side — shown in list
        date: transferDate,
        description: transferDesc,
      }),
      Transaction.create({
        user: req.user._id,
        type: "transfer",
        amount: parsedAmount,
        category: "Transfer",
        account: toAccount,
        toAccount: fromAccount,
        transferRef,
        isDebit: false, // this is the TO side — hidden from list
        date: transferDate,
        description: transferDesc,
      }),
    ]);

    // Update both account balances
    await Promise.all([
      Account.findByIdAndUpdate(fromAccount, {
        $inc: { currentBalance: -parsedAmount },
      }),
      Account.findByIdAndUpdate(toAccount, {
        $inc: { currentBalance: parsedAmount },
      }),
    ]);

    const populated = await debitTx.populate(
      "account toAccount",
      "name type color",
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

    // Find the debit side (from account) to reverse balances
    // Both transactions have the same amount, just reverse both effects
    const tx = transactions[0];
    const parsedAmount = tx.amount;

    // Get the two accounts from the two transactions
    const accountIds = transactions.map((t) => t.account.toString());
    const uniqueAccounts = [...new Set(accountIds)];

    // Reverse: one account gets +amount, other gets -amount back to original
    // The debit tx's account loses the amount — so add it back
    // The credit tx's account gains the amount — so subtract it back
    // We identify which is which by toAccount reference
    for (const t of transactions) {
      const isDebit =
        t.toAccount && t.account.toString() !== t.toAccount.toString();
      if (isDebit) {
        await Account.findByIdAndUpdate(t.account, {
          $inc: { currentBalance: parsedAmount },
        });
        await Account.findByIdAndUpdate(t.toAccount, {
          $inc: { currentBalance: -parsedAmount },
        });
        break;
      }
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
