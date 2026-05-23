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

    // Reverse the balance effect
    await adjustBalance(
      transaction.account,
      transaction.amount,
      transaction.type,
      "subtract",
    );

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

module.exports = {
  getTransactions,
  getTransaction,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  getMonthlySummary,
  getCategoryBreakdown,
};
