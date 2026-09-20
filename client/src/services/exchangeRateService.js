import api from "./api";

const exchangeRateService = {
  getRates: async () => {
    const res = await api.get("/exchange-rates");
    return res.data; // { success, rates, isFallback, fetchedAt }
  },
};

export default exchangeRateService;
