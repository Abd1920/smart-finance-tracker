export const CURRENCIES = ["LKR", "QAR", "USD", "SAR", "INR", "AED", "EUR", "GBP", "KRW"];

export const CURRENCY_SYMBOLS = {
  LKR: "Rs",
  QAR: "QR",
  USD: "$",
  SAR: "SR",
  INR: "₹",
  AED: "AED",
  EUR: "€",
  GBP: "£",
  KRW: "₩",
};

export const formatCurrency = (amount, currency = "LKR") => {
  const symbol = CURRENCY_SYMBOLS[currency] || currency;
  const value = Number(amount || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${symbol} ${value}`;
};
