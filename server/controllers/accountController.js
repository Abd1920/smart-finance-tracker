const Account = require("../models/Account");

// @desc    Get all accounts for logged-in user
// @route   GET /api/accounts
// @access  Private
const getAccounts = async (req, res, next) => {
  try {
    const accounts = await Account.find({
      user: req.user._id,
      isActive: true,
    }).sort({ createdAt: -1 });

    const totalBalance = accounts.reduce(
      (sum, acc) => sum + acc.currentBalance,
      0,
    );

    res.status(200).json({
      success: true,
      count: accounts.length,
      totalBalance,
      accounts,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single account
// @route   GET /api/accounts/:id
// @access  Private
const getAccount = async (req, res, next) => {
  try {
    const account = await Account.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!account) {
      return res
        .status(404)
        .json({ success: false, message: "Account not found" });
    }

    res.status(200).json({ success: true, account });
  } catch (error) {
    next(error);
  }
};

// @desc    Create account
// @route   POST /api/accounts
// @access  Private
const createAccount = async (req, res, next) => {
  try {
    const { name, type, initialBalance, color, icon } = req.body;

    if (!name || !type) {
      return res
        .status(400)
        .json({ success: false, message: "Name and type are required" });
    }

    const account = await Account.create({
      user: req.user._id,
      name,
      type,
      initialBalance: initialBalance || 0,
      color: color || "#3b82f6",
      icon: icon || "bank",
    });

    res.status(201).json({ success: true, account });
  } catch (error) {
    next(error);
  }
};

// @desc    Update account
// @route   PUT /api/accounts/:id
// @access  Private
const updateAccount = async (req, res, next) => {
  try {
    const account = await Account.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!account) {
      return res
        .status(404)
        .json({ success: false, message: "Account not found" });
    }

    const { name, type, color, icon, initialBalance } = req.body;

    // If initialBalance changed, adjust currentBalance by the difference
    if (
      initialBalance !== undefined &&
      initialBalance !== account.initialBalance
    ) {
      const diff = initialBalance - account.initialBalance;
      account.currentBalance = account.currentBalance + diff;
      account.initialBalance = initialBalance;
    }

    if (name) account.name = name;
    if (type) account.type = type;
    if (color) account.color = color;
    if (icon) account.icon = icon;

    await account.save();

    res.status(200).json({ success: true, account });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete account (soft delete)
// @route   DELETE /api/accounts/:id
// @access  Private
const deleteAccount = async (req, res, next) => {
  try {
    const account = await Account.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!account) {
      return res
        .status(404)
        .json({ success: false, message: "Account not found" });
    }

    account.isActive = false;
    await account.save();

    res
      .status(200)
      .json({ success: true, message: "Account deleted successfully" });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAccounts,
  getAccount,
  createAccount,
  updateAccount,
  deleteAccount,
};
