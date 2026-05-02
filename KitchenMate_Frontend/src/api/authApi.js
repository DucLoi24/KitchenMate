export const authApi = {
  login: async (email, password) => {
    const { default: axiosInstance } = await import('@/lib/axiosInstance')
    const { data } = await axiosInstance.post('/auth/login/', { email, password })
    // Backend returns {success, message, data: {user, tokens: {access, refresh}}}
    // Normalize to {user, access, refresh}
    return {
      user: data.data.user,
      access: data.data.tokens.access,
      refresh: data.data.tokens.refresh,
    }
  },

  register: async (userData) => {
    const { default: axiosInstance } = await import('@/lib/axiosInstance')
    const { data } = await axiosInstance.post('/auth/register/', userData)
    // Backend returns {success, message, data: {user, tokens: {access, refresh}}}
    // Normalize to {user, access, refresh}
    return {
      user: data.data.user,
      access: data.data.tokens.access,
      refresh: data.data.tokens.refresh,
    }
  },

  logout: () => {
    // Xóa auth-storage (Zustand persist key) thay vì access_token/refresh_token cũ
    localStorage.removeItem('auth-storage')
  },

  refreshToken: async (refresh) => {
    const { default: axiosInstance } = await import('@/lib/axiosInstance')
    const { data } = await axiosInstance.post('/auth/refresh/', { refresh })
    return data
  },

  getProfile: async () => {
    const { default: axiosInstance } = await import('@/lib/axiosInstance')
    const { data } = await axiosInstance.get('/accounts/me/')
    return data
  },

  updateProfile: async (profileData) => {
    const { default: axiosInstance } = await import('@/lib/axiosInstance')
    const { data } = await axiosInstance.patch('/accounts/me/', profileData)
    return data
  },

  forgotPassword: async (email) => {
    const { default: axiosInstance } = await import('@/lib/axiosInstance')
    const { data } = await axiosInstance.post('/auth/forgot-password/', { email })
    return data
  },

  resetPassword: async (uid, token, newPassword) => {
    const { default: axiosInstance } = await import('@/lib/axiosInstance')
    const { data } = await axiosInstance.post('/auth/reset-password/', {
      uid: uid,
      token,
      new_password: newPassword,
      new_password_confirm: newPassword,
    })
    return data
  },
}

export default authApi