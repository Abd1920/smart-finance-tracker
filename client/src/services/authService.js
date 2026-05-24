import api from "./api";

const authService = {
  sendVerification: async (data) => {
    const res = await api.post("/auth/send-verification", data);
    return res.data;
  },

  verifyEmail: async (email, otp) => {
    const res = await api.post("/auth/verify-email", { email, otp });
    return res.data;
  },

  login: async (data) => {
    const res = await api.post("/auth/login", data);
    return res.data;
  },

  googleAuth: async (credential, accessToken, userInfo) => {
    const res = await api.post("/auth/google", {
      credential,
      accessToken,
      userInfo,
    });
    return res.data;
  },

  forgotPassword: async (email) => {
    const res = await api.post("/auth/forgot-password", { email });
    return res.data;
  },

  resetPassword: async (token, password, confirmPassword) => {
    const res = await api.post(`/auth/reset-password/${token}`, {
      password,
      confirmPassword,
    });
    return res.data;
  },

  getProfile: async () => {
    const res = await api.get("/auth/profile");
    return res.data;
  },

  uploadAvatar: async (file) => {
    const formData = new FormData();
    formData.append("avatar", file);
    const res = await api.post("/auth/avatar", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  },

  removeAvatar: async () => {
    const res = await api.delete("/auth/avatar");
    return res.data;
  },

  updateProfile: async (data) => {
    const res = await api.put("/auth/profile", data);
    return res.data;
  },

  changePassword: async (data) => {
    const res = await api.put("/auth/change-password", data);
    return res.data;
  },
};

export default authService;
