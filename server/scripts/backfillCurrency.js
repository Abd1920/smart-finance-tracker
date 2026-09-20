// One-off migration: backfill currency:"LKR" on accounts, transactions and
// debts created before multi-currency support, so they no longer rely on
// the runtime "|| LKR" fallback and read the same as newly-created records.
//
// Run from the server/ folder:
//   node scripts/backfillCurrency.js
//
// Safe to run more than once - it only touches documents where `currency`
// is missing, so already-migrated or newly-created records are untouched.

require("dotenv").config();
const mongoose = require("mongoose");
const Account = require("../models/Account");
const Transaction = require("../models/Transaction");
const Debt = require("../models/Debt");

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB");

  const filter = { currency: { $exists: false } };
  const update = { $set: { currency: "LKR" } };

  const accountsResult = await Account.updateMany(filter, update);
  console.log(`Accounts updated: ${accountsResult.modifiedCount}`);

  const transactionsResult = await Transaction.updateMany(filter, update);
  console.log(`Transactions updated: ${transactionsResult.modifiedCount}`);

  const debtsResult = await Debt.updateMany(filter, update);
  console.log(`Debts updated: ${debtsResult.modifiedCount}`);

  console.log("Done.");
  await mongoose.disconnect();
  process.exit(0);
}

run().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
