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
    return data
  },

  logout: () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
  },

  refreshToken: async (refresh) => {
    const { default: axiosInstance } = await import('@/lib/axiosInstance')
    const { data } = await axiosInstance.post('/auth/refresh/', { refresh })
    return data
  },

  getProfile: async () => {
    const { default: axiosInstance } = await import('@/lib/axiosInstance')
    const { data } = await axiosInstance.get('/auth/profile/')
    return data
  },

  updateProfile: async (profileData) => {
    const { default: axiosInstance } = await import('@/lib/axiosInstance')
    const { data } = await axiosInstance.patch('/auth/profile/', profileData)
    return data
  },

  forgotPassword: async (email) => {
    const { default: axiosInstance } = await import('@/lib/axiosInstance')
    const { data } = await axiosInstance.post('/auth/forgot-password/', { email })
    return data
  },

  resetPassword: async (token, newPassword) => {
    const { default: axiosInstance } = await import('@/lib/axiosInstance')
    const { data } = await axiosInstance.post('/auth/reset-password/', {
      token,
      password: newPassword,
    })
    return data
  },
}

export default authApi