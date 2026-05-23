const express = require("express");
const {
  getAccounts,
  getAccount,
  createAccount,
  updateAccount,
  deleteAccount,
} = require("../controllers/accountController");
const { protect } = require("../middleware/auth");

const router = express.Router();

router.use(protect); // all account routes are protected

router.route("/").get(getAccounts).post(createAccount);

router.route("/:id").get(getAccount).put(updateAccount).delete(deleteAccount);

module.exports = router;
