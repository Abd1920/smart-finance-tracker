const express = require("express");
const {
  getTransactions,
  getTransaction,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  getMonthlySummary,
  getCategoryBreakdown,
  createTransfer,
  deleteTransfer,
} = require("../controllers/transactionController");
const { protect } = require("../middleware/auth");

const router = express.Router();
router.use(protect);

router.get("/summary", getMonthlySummary);
router.get("/categories", getCategoryBreakdown);

// Transfer routes
router.post("/transfer", createTransfer);
router.delete("/transfer/:transferRef", deleteTransfer);

router.route("/").get(getTransactions).post(createTransaction);

router
  .route("/:id")
  .get(getTransaction)
  .put(updateTransaction)
  .delete(deleteTransaction);

module.exports = router;
