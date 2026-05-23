const express = require("express");
const {
  getTransactions,
  getTransaction,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  getMonthlySummary,
  getCategoryBreakdown,
} = require("../controllers/transactionController");
const { protect } = require("../middleware/auth");

const router = express.Router();
router.use(protect);

router.get("/summary", getMonthlySummary);
router.get("/categories", getCategoryBreakdown);

router.route("/").get(getTransactions).post(createTransaction);

router
  .route("/:id")
  .get(getTransaction)
  .put(updateTransaction)
  .delete(deleteTransaction);

module.exports = router;
