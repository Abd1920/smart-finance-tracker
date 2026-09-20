const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const { getExchangeRates } = require("../utils/exchangeRateService");

// GET /api/exchange-rates
router.get("/", protect, async (req, res, next) => {
  try {
    const { rates, isFallback, fetchedAt } = await getExchangeRates();
    res.status(200).json({
      success: true,
      rates,
      isFallback,
      fetchedAt,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
