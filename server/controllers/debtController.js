const Debt = require("../models/Debt");

// @desc    Get all debts with optional filters
// @route   GET /api/debts
// @access  Private
const getDebts = async (req, res, next) => {
  try {
    const { debtType, status } = req.query;
    const filter = { user: req.user._id };

    if (debtType) filter.debtType = debtType;
    if (status) filter.status = status;

    const debts = await Debt.find(filter).sort({ createdAt: -1 });

    // Summary totals
    const totalToPay = debts
      .filter((d) => d.debtType === "to_pay" && d.status === "pending")
      .reduce((s, d) => s + d.amount, 0);
    const totalToReceive = debts
      .filter((d) => d.debtType === "to_receive" && d.status === "pending")
      .reduce((s, d) => s + d.amount, 0);

    res.status(200).json({
      success: true,
      count: debts.length,
      totalToPay,
      totalToReceive,
      debts,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create debt
// @route   POST /api/debts
// @access  Private
const createDebt = async (req, res, next) => {
  try {
    const { debtType, personName, amount, description, dueDate } = req.body;

    if (!debtType || !personName || !amount) {
      return res.status(400).json({
        success: false,
        message: "Debt type, person name, and amount are required",
      });
    }

    const debt = await Debt.create({
      user: req.user._id,
      debtType,
      personName,
      amount: parseFloat(amount),
      description: description || "",
      dueDate: dueDate || null,
    });

    res.status(201).json({ success: true, debt });
  } catch (error) {
    next(error);
  }
};

// @desc    Update debt
// @route   PUT /api/debts/:id
// @access  Private
const updateDebt = async (req, res, next) => {
  try {
    const debt = await Debt.findOne({ _id: req.params.id, user: req.user._id });
    if (!debt) {
      return res
        .status(404)
        .json({ success: false, message: "Debt not found" });
    }

    const { personName, amount, description, dueDate, debtType } = req.body;

    if (personName) debt.personName = personName;
    if (amount) debt.amount = parseFloat(amount);
    if (description !== undefined) debt.description = description;
    if (dueDate !== undefined) debt.dueDate = dueDate || null;
    if (debtType) debt.debtType = debtType;

    await debt.save();
    res.status(200).json({ success: true, debt });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark debt as settled
// @route   PUT /api/debts/:id/settle
// @access  Private
const settleDebt = async (req, res, next) => {
  try {
    const debt = await Debt.findOne({ _id: req.params.id, user: req.user._id });
    if (!debt) {
      return res
        .status(404)
        .json({ success: false, message: "Debt not found" });
    }

    debt.status = debt.status === "settled" ? "pending" : "settled";
    debt.settledAt = debt.status === "settled" ? new Date() : null;
    await debt.save();

    res.status(200).json({ success: true, debt });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete debt
// @route   DELETE /api/debts/:id
// @access  Private
const deleteDebt = async (req, res, next) => {
  try {
    const debt = await Debt.findOne({ _id: req.params.id, user: req.user._id });
    if (!debt) {
      return res
        .status(404)
        .json({ success: false, message: "Debt not found" });
    }

    await debt.deleteOne();
    res
      .status(200)
      .json({ success: true, message: "Debt deleted successfully" });
  } catch (error) {
    next(error);
  }
};

module.exports = { getDebts, createDebt, updateDebt, settleDebt, deleteDebt };
