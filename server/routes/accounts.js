const express = require("express");
const {
  getAccounts,
  getAccount,
  createAccount,
  updateAccount,
  deleteAccount,
  resetBalance,
} = require("../controllers/accountController");
const { protect } = require("../middleware/auth");

const router = express.Router();
router.use(protect);

router.route("/").get(getAccounts).post(createAccount);

router.put("/:id/reset-balance", resetBalance);

router.route("/:id").get(getAccount).put(updateAccount).delete(deleteAccount);

module.exports = router;
