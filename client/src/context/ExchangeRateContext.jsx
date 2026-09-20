import { createContext, useContext, useEffect, useState } from "react";
import exchangeRateService from "../services/exchangeRateService";

const ExchangeRateContext = createContext(null);

export const ExchangeRateProvider = ({ children }) => {
  const [rates, setRates] = useState(null);
  const [isFallback, setIsFallback] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await exchangeRateService.getRates();
        if (!cancelled) {
          setRates(data.rates);
          setIsFallback(!!data.isFallback);
        }
      } catch {
        // Leave rates null - consumers should treat this as "no conversion available"
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <ExchangeRateContext.Provider value={{ rates, isFallback, loading }}>
      {children}
    </ExchangeRateContext.Provider>
  );
};

export const useExchangeRates = () => {
  const ctx = useContext(ExchangeRateContext);
  if (!ctx) {
    throw new Error("useExchangeRates must be used within an ExchangeRateProvider");
  }
  return ctx;
};
