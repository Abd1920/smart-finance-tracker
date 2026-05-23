import api from './api';

const transactionService = {
  getAll: async (params = {}) => {
    const res = await api.get('/transactions', { params });
    return res.data;
  },

  create: async (data) => {
    const res = await api.post('/transactions', data);
    return res.data;
  },

  update: async (id, data) => {
    const res = await api.put(`/transactions/${id}`, data);
    return res.data;
  },

  delete: async (id) => {
    const res = await api.delete(`/transactions/${id}`);
    return res.data;
  },

  getMonthlySummary: async (year) => {
    const res = await api.get('/transactions/summary', { params: { year } });
    return res.data;
  },

  getCategoryBreakdown: async (params = {}) => {
    const res = await api.get('/transactions/categories', { params });
    return res.data;
  },
};

export default transactionService;
