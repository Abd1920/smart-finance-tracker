const mongoose = require("mongoose");

const debtSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    debtType: {
      type: String,
      enum: ["to_pay", "to_receive"],
      required: [true, "Debt type is required"],
    },
    personName: {
      type: String,
      required: [true, "Person name is required"],
      trim: true,
      maxlength: [50, "Name cannot exceed 50 characters"],
    },
    amount: {
      type: Number,
      required: [true, "Amount is required"],
      min: [0.01, "Amount must be greater than 0"],
    },
    // Currency the amount is recorded in — taken from the linked account's
    // currency at creation, or the user's primary currency if no account
    currency: {
      type: String,
      enum: ["LKR", "QAR", "USD", "SAR", "INR", "AED", "EUR", "GBP", "KRW"],
      default: "LKR",
    },
    description: {
      type: String,
      trim: true,
      maxlength: [200, "Description cannot exceed 200 characters"],
      default: "",
    },
    dueDate: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ["pending", "settled"],
      default: "pending",
    },
    settledAt: {
      type: Date,
      default: null,
    },
    // Account that received/gave money when debt was created
    linkedAccount: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Account",
      default: null,
    },
    // Account used when settling the debt
    settlementAccount: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Account",
      default: null,
    },
    accountAdjusted: {
      type: Boolean,
      default: false,
    },
    // Amount actually applied to settlementAccount's balance, in that
    // account's own currency (may differ from `amount` if settlementAccount
    // uses a different currency than the debt). Needed to reverse correctly
    // if the debt is un-settled.
    settlementAppliedAmount: {
      type: Number,
      default: null,
    },
  },
  { timestamps: true },
);

debtSchema.index({ user: 1, status: 1 });
debtSchema.index({ user: 1, debtType: 1 });

module.exports = mongoose.model("Debt", debtSchema);
