// One-off migration: backfill currency:"LKR" on accounts, transactions and
// debts created before multi-currency support.
//
// Uses the native MongoDB driver directly (not Mongoose) for a predictable,
// unambiguous connection - no schema, no immutable-field interference, no
// Mongoose connection-object quirks.
//
// Run from the server/ folder:
//   node scripts/backfillCurrency.js
//
// Safe to run more than once - it only touches documents where `currency`
// is missing, so already-migrated or newly-created records are untouched.

require("dotenv").config();
const { MongoClient } = require("mongodb");

async function run() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error("MONGO_URI is not set in the environment.");
    process.exit(1);
  }

  const redacted = uri.replace(/:[^:@]+@/, ":****@");
  console.log("URI being used (redacted):", redacted);

  const client = new MongoClient(uri);
  await client.connect();
  console.log("Connected to MongoDB");

  // Explicitly select the database by name, parsed straight out of the URI,
  // rather than relying on the driver to infer it.
  const match = uri.match(/\.net\/([^/?]+)\?/) || uri.match(/\/([^/?]+)\?/);
  const dbName = match ? match[1] : undefined;
  console.log("Database name parsed from URI:", dbName);

  if (!dbName) {
    console.error("Could not parse a database name out of the URI - aborting.");
    await client.close();
    process.exit(1);
  }

  const db = client.db(dbName);

  const filter = { currency: { $exists: false } };
  const update = { $set: { currency: "LKR" } };

  const accountsResult = await db.collection("accounts").updateMany(filter, update);
  console.log(`Accounts updated: ${accountsResult.modifiedCount}`);

  const transactionsResult = await db.collection("transactions").updateMany(filter, update);
  console.log(`Transactions updated: ${transactionsResult.modifiedCount}`);

  const debtsResult = await db.collection("debts").updateMany(filter, update);
  console.log(`Debts updated: ${debtsResult.modifiedCount}`);

  console.log("Done.");
  await client.close();
  process.exit(0);
}

run().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
