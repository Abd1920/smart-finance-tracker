const mongoose = require("mongoose");

const accountSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: {
      type: String,
      required: [true, "Account name is required"],
      trim: true,
      maxlength: [50, "Account name cannot exceed 50 characters"],
    },
    type: {
      type: String,
      required: [true, "Account type is required"],
      enum: ["bank", "cash", "credit_card", "savings", "wallet"],
    },
    initialBalance: {
      type: Number,
      required: [true, "Initial balance is required"],
      default: 0,
    },
    currentBalance: {
      type: Number,
      default: 0,
    },
    color: {
      type: String,
      default: "#3b82f6",
    },
    icon: {
      type: String,
      default: "bank",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

// Set currentBalance = initialBalance on create
accountSchema.pre("save", function (next) {
  if (this.isNew) {
    this.currentBalance = this.initialBalance;
  }
  next();
});

module.exports = mongoose.model("Account", accountSchema);
