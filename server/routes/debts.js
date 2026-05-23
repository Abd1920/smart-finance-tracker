const express = require("express");
const {
  getDebts,
  createDebt,
  updateDebt,
  settleDebt,
  deleteDebt,
} = require("../controllers/debtController");
const { protect } = require("../middleware/auth");

const router = express.Router();
router.use(protect);

router.route("/").get(getDebts).post(createDebt);
router.route("/:id").put(updateDebt).delete(deleteDebt);
router.put("/:id/settle", settleDebt);

module.exports = router;
