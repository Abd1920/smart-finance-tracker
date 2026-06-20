const Debt = require("../models/Debt");
const Account = require("../models/Account");
const Transaction = require("../models/Transaction");

const adjustBalance = async (accountId, amount, direction) => {
  if (!accountId) return;
  const delta = direction === "add" ? amount : -amount;
  await Account.findByIdAndUpdate(accountId, {
    $inc: { currentBalance: delta },
  });
};

// isDebtTransaction: true - prevents balance reversal when deleted from Transactions page
const createDebtTransaction = async ({
  userId,
  accountId,
  type,
  amount,
  description,
  category,
}) => {
  if (!accountId) return;
  await Transaction.create({
    user: userId,
    type,
    amount,
    category,
    account: accountId,
    description,
    date: new Date(),
    isDebtTransaction: true,
  });
};

// @desc    Get all debts
// @route   GET /api/debts
const getDebts = async (req, res, next) => {
  try {
    const { debtType, status } = req.query;
    const filter = { user: req.user._id };
    if (debtType) filter.debtType = debtType;
    if (status) filter.status = status;

    const debts = await Debt.find(filter)
      .populate("linkedAccount", "name type color")
      .populate("settlementAccount", "name type color")
      .sort({ createdAt: -1 });

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

// @desc    Create debt + adjust account + create transaction
// @route   POST /api/debts
const createDebt = async (req, res, next) => {
  try {
    const {
      debtType,
      personName,
      amount,
      description,
      dueDate,
      linkedAccount,
    } = req.body;

    if (!debtType || !personName || !amount) {
      return res.status(400).json({
        success: false,
        message: "Debt type, person name, and amount are required",
      });
    }

    if (linkedAccount) {
      const acc = await Account.findOne({
        _id: linkedAccount,
        user: req.user._id,
        isActive: true,
      });
      if (!acc)
        return res
          .status(404)
          .json({ success: false, message: "Account not found" });
    }

    const parsedAmount = parseFloat(amount);

    const debt = await Debt.create({
      user: req.user._id,
      debtType,
      personName,
      amount: parsedAmount,
      description: description || "",
      dueDate: dueDate || null,
      linkedAccount: linkedAccount || null,
      accountAdjusted: !!linkedAccount,
    });

    if (linkedAccount) {
      if (debtType === "to_pay") {
        // Borrowed → account increases + Income transaction
        await adjustBalance(linkedAccount, parsedAmount, "add");
        await createDebtTransaction({
          userId: req.user._id,
          accountId: linkedAccount,
          type: "income",
          amount: parsedAmount,
          category: "Other",
          description: description
            ? `Borrowed from ${personName} - ${description}`
            : `Borrowed from ${personName}`,
        });
      } else {
        // Lent → account decreases + Expense transaction
        await adjustBalance(linkedAccount, parsedAmount, "subtract");
        await createDebtTransaction({
          userId: req.user._id,
          accountId: linkedAccount,
          type: "expense",
          amount: parsedAmount,
          category: "Other",
          description: description
            ? `Lent to ${personName} - ${description}`
            : `Lent to ${personName}`,
        });
      }
    }

    const populated = await debt.populate("linkedAccount", "name type color");
    res.status(201).json({ success: true, debt: populated });
  } catch (error) {
    next(error);
  }
};

// @desc    Update debt details
// @route   PUT /api/debts/:id
const updateDebt = async (req, res, next) => {
  try {
    const debt = await Debt.findOne({ _id: req.params.id, user: req.user._id });
    if (!debt)
      return res
        .status(404)
        .json({ success: false, message: "Debt not found" });

    const { personName, amount, description, dueDate, debtType } = req.body;
    if (personName) debt.personName = personName;
    if (amount) debt.amount = parseFloat(amount);
    if (description !== undefined) debt.description = description;
    if (dueDate !== undefined) debt.dueDate = dueDate || null;
    if (debtType) debt.debtType = debtType;

    await debt.save();
    const populated = await debt.populate([
      "linkedAccount",
      "settlementAccount",
    ]);
    res.status(200).json({ success: true, debt: populated });
  } catch (error) {
    next(error);
  }
};

// @desc    Settle debt + adjust settlement account + create transaction
// @route   PUT /api/debts/:id/settle
const settleDebt = async (req, res, next) => {
  try {
    const debt = await Debt.findOne({ _id: req.params.id, user: req.user._id });
    if (!debt)
      return res
        .status(404)
        .json({ success: false, message: "Debt not found" });

    const wasSettled = debt.status === "settled";

    if (!wasSettled) {
      // === SETTLING ===
      const { settlementAccount } = req.body;

      if (settlementAccount) {
        const acc = await Account.findOne({
          _id: settlementAccount,
          user: req.user._id,
          isActive: true,
        });
        if (!acc)
          return res
            .status(404)
            .json({ success: false, message: "Settlement account not found" });

        debt.settlementAccount = settlementAccount;

        if (debt.debtType === "to_pay") {
          // Repaying → account decreases + Expense transaction
          await adjustBalance(settlementAccount, debt.amount, "subtract");
          await createDebtTransaction({
            userId: req.user._id,
            accountId: settlementAccount,
            type: "expense",
            amount: debt.amount,
            category: "Other",
            description: debt.description
              ? `Repaid to ${debt.personName} - ${debt.description}`
              : `Repaid to ${debt.personName}`,
          });
        } else {
          // Received repayment → account increases + Income transaction
          await adjustBalance(settlementAccount, debt.amount, "add");
          await createDebtTransaction({
            userId: req.user._id,
            accountId: settlementAccount,
            type: "income",
            amount: debt.amount,
            category: "Other",
            description: debt.description
              ? `Received from ${debt.personName} - ${debt.description}`
              : `Received from ${debt.personName}`,
          });
        }
      }

      debt.status = "settled";
      debt.settledAt = new Date();
    } else {
      // === UN-SETTLING ===
      // Reverse settlement account effect only
      if (debt.settlementAccount) {
        if (debt.debtType === "to_pay") {
          await adjustBalance(debt.settlementAccount, debt.amount, "add");
        } else {
          await adjustBalance(debt.settlementAccount, debt.amount, "subtract");
        }
        debt.settlementAccount = null;
      }
      debt.status = "pending";
      debt.settledAt = null;
    }

    await debt.save();
    const populated = await debt.populate([
      "linkedAccount",
      "settlementAccount",
    ]);
    res.status(200).json({ success: true, debt: populated });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete debt + reverse balance only if pending
// @route   DELETE /api/debts/:id
const deleteDebt = async (req, res, next) => {
  try {
    const debt = await Debt.findOne({ _id: req.params.id, user: req.user._id });
    if (!debt)
      return res
        .status(404)
        .json({ success: false, message: "Debt not found" });

    // Only reverse linkedAccount if debt is PENDING
    // Settled debts already had their balance adjusted during settlement
    // Deleting a settled record = history removal only, no balance changes
    if (
      debt.linkedAccount &&
      debt.accountAdjusted &&
      debt.status === "pending"
    ) {
      if (debt.debtType === "to_pay") {
        await adjustBalance(debt.linkedAccount, debt.amount, "subtract");
      } else {
        await adjustBalance(debt.linkedAccount, debt.amount, "add");
      }
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
