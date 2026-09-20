const SUPPORTED_CURRENCIES = [
  "LKR",
  "QAR",
  "USD",
  "SAR",
  "INR",
  "AED",
  "EUR",
  "GBP",
  "KRW",
];

// Fallback rates used if the live API is unreachable.
// Format matches the live API: rates[X] = "1 X = rates[X] LKR"
const FALLBACK_RATES = {
  LKR: 1,
  QAR: 90.13,
  USD: 328.5,
  SAR: 87.6,
  INR: 3.94,
  AED: 89.45,
  EUR: 356.2,
  GBP: 417.8,
  KRW: 0.222,
};

const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

let cache = {
  rates: null,
  fetchedAt: 0,
  isFallback: false,
};

async function fetchLiveRates() {
  const response = await fetch("https://open.er-api.com/v6/latest/LKR");
  if (!response.ok) {
    throw new Error(`Exchange rate API responded with ${response.status}`);
  }
  const data = await response.json();
  if (data.result !== "success" || !data.rates) {
    throw new Error("Exchange rate API returned an unexpected payload");
  }

  // data.rates is "1 LKR = data.rates[X] X" — invert to match our format
  // where rates[X] = "1 X = rates[X] LKR"
  const rates = {};
  for (const currency of SUPPORTED_CURRENCIES) {
    if (currency === "LKR") {
      rates.LKR = 1;
    } else if (data.rates[currency]) {
      rates[currency] = 1 / data.rates[currency];
    }
  }

  // If any supported currency was missing from the live response, fall back
  // to the known rate for that one currency rather than failing entirely.
  for (const currency of SUPPORTED_CURRENCIES) {
    if (!rates[currency]) {
      rates[currency] = FALLBACK_RATES[currency];
    }
  }

  return rates;
}

async function getExchangeRates() {
  const isStale = Date.now() - cache.fetchedAt > CACHE_TTL_MS;

  if (cache.rates && !isStale) {
    return { rates: cache.rates, isFallback: cache.isFallback, fetchedAt: cache.fetchedAt };
  }

  try {
    const rates = await fetchLiveRates();
    cache = { rates, fetchedAt: Date.now(), isFallback: false };
  } catch (error) {
    console.error("Exchange rate fetch failed, using fallback rates:", error.message);
    // Keep serving stale cached rates if we have them; otherwise use fallback.
    if (!cache.rates) {
      cache = { rates: FALLBACK_RATES, fetchedAt: Date.now(), isFallback: true };
    } else {
      cache = { ...cache, isFallback: true };
    }
  }

  return { rates: cache.rates, isFallback: cache.isFallback, fetchedAt: cache.fetchedAt };
}

// amount * rates[from] / rates[to]
// Legacy accounts/transactions/debts created before multi-currency support
// don't have a `currency` field in the database, so it reads as undefined.
// Treat that as LKR (the app's original, only currency) rather than crashing.
function convert(amount, fromCurrency, toCurrency, rates) {
  const from = fromCurrency || "LKR";
  const to = toCurrency || "LKR";
  if (from === to) return amount;
  const fromRate = rates[from];
  const toRate = rates[to];
  if (!fromRate || !toRate) {
    throw new Error(`Missing exchange rate for ${from} or ${to}`);
  }
  return (amount * fromRate) / toRate;
}

module.exports = {
  SUPPORTED_CURRENCIES,
  FALLBACK_RATES,
  getExchangeRates,
  convert,
};
