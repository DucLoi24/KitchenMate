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

  getPublicProfile: async (userId) => {
    const { default: axiosInstance } = await import('@/lib/axiosInstance')
    const { data } = await axiosInstance.get(`/accounts/${userId}/`)
    return data
  },

  getUserStats: async (userId) => {
    const { default: axiosInstance } = await import('@/lib/axiosInstance')
    const { data } = await axiosInstance.get(`/accounts/${userId}/stats/`)
    return data
  },

  getUserRecipes: async (userId) => {
    const { default: axiosInstance } = await import('@/lib/axiosInstance')
    const { data } = await axiosInstance.get(`/accounts/${userId}/recipes/`)
    return data
  },

  followUser: async (userId) => {
    const { default: axiosInstance } = await import('@/lib/axiosInstance')
    const { data } = await axiosInstance.post(`/accounts/${userId}/follow/`)
    return data
  },

  unfollowUser: async (userId) => {
    const { default: axiosInstance } = await import('@/lib/axiosInstance')
    const { data } = await axiosInstance.delete(`/accounts/${userId}/follow/`)
    return data
  },

  getFollowers: async (userId, page = 1) => {
    const { default: axiosInstance } = await import('@/lib/axiosInstance')
    const { data } = await axiosInstance.get(`/accounts/${userId}/followers/`, {
      params: { page },
    })
    return data
  },

  getFollowing: async (userId, page = 1) => {
    const { default: axiosInstance } = await import('@/lib/axiosInstance')
    const { data } = await axiosInstance.get(`/accounts/${userId}/following/`, {
      params: { page },
    })
    return data
  },

  searchUsers: async (params = {}) => {
    const { default: axiosInstance } = await import('@/lib/axiosInstance')
    const { data } = await axiosInstance.get('/accounts/search/', { params })
    return data
  },

  updateProfile: async (profileData) => {
    const { default: axiosInstance } = await import('@/lib/axiosInstance')
    const { data } = await axiosInstance.patch('/accounts/me/', profileData)
    return data
  },

  uploadAvatar: async (formData) => {
    const { default: axiosInstance } = await import('@/lib/axiosInstance')
    const { data } = await axiosInstance.post('/accounts/me/avatar/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return data
  },

  forgotPassword: async (email) => {
    const { default: axiosInstance } = await import('@/lib/axiosInstance')
    const { data } = await axiosInstance.post('/auth/forgot-password/', { email })
    return data
  },

  resetPassword: async ({ uid, token, password, password_confirm }) => {
    const { default: axiosInstance } = await import('@/lib/axiosInstance')
    const { data } = await axiosInstance.post('/auth/reset-password/', {
      uid,
      token,
      new_password: password,
      new_password_confirm: password_confirm,
    })
    return data
  },
}

export default authApi
