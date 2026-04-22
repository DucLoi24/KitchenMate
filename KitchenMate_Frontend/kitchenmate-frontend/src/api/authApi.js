import axiosInstance from './axiosInstance';

export const authApi = {
  register: async (data) => {
    const response = await axiosInstance.post('/auth/register/', data);
    return response.data;
  },

  login: async (data) => {
    const response = await axiosInstance.post('/auth/login/', data);
    return response.data;
  },

  logout: async (refreshToken) => {
    const response = await axiosInstance.post('/auth/logout/', {
      refresh: refreshToken,
    });
    return response.data;
  },

  forgotPassword: async (email) => {
    const response = await axiosInstance.post('/auth/forgot-password/', { email });
    return response.data;
  },

  resetPassword: async (token, newPassword, newPasswordConfirm) => {
    const response = await axiosInstance.post('/auth/reset-password/', {
      token,
      new_password: newPassword,
      new_password_confirm: newPasswordConfirm,
    });
    return response.data;
  },

  getMe: async () => {
    const response = await axiosInstance.get('/accounts/me/');
    return response.data;
  },

  updateMe: async (data) => {
    const response = await axiosInstance.patch('/accounts/me/', data);
    return response.data;
  },
};