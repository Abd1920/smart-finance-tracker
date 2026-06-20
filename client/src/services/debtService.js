import api from "./api";

const debtService = {
  getAll: async (params = {}) => {
    const res = await api.get("/debts", { params });
    return res.data;
  },

  create: async (data) => {
    const res = await api.post("/debts", data);
    return res.data;
  },

  update: async (id, data) => {
    const res = await api.put(`/debts/${id}`, data);
    return res.data;
  },

  settle: async (id, settlementAccount = null) => {
    const res = await api.put(`/debts/${id}/settle`, { settlementAccount });
    return res.data;
  },

  delete: async (id) => {
    const res = await api.delete(`/debts/${id}`);
    return res.data;
  },
};

export default debtService;
