import api from "./api";

const accountService = {
  getAll: async () => {
    const res = await api.get("/accounts");
    return res.data;
  },

  create: async (data) => {
    const res = await api.post("/accounts", data);
    return res.data;
  },

  update: async (id, data) => {
    const res = await api.put(`/accounts/${id}`, data);
    return res.data;
  },

  delete: async (id) => {
    const res = await api.delete(`/accounts/${id}`);
    return res.data;
  },
};

export default accountService;
