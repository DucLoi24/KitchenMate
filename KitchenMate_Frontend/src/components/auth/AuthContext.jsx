import { createContext, useEffect, useMemo, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { authApi } from '@/api/authApi'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, accessToken, setAuth, logout: clearAuth, updateUser } = useAuthStore()
  const isAuthenticated = !!accessToken

  useEffect(() => {
    // Zustand persist tự khôi phục accessToken từ auth-storage.
    // Chỉ cần verify token còn hợp lệ bằng cách gọi getProfile.
    const initAuth = async () => {
      const { accessToken: storedToken } = useAuthStore.getState()
      if (!storedToken) return

      useAuthStore.getState().setLoading(true)
      try {
        const userData = await authApi.getProfile()
        updateUser(userData.data)
      } catch (err) {
        // Token hết hạn hoặc không hợp lệ → axiosInstance sẽ tự refresh.
        // Nếu refresh cũng thất bại, interceptor sẽ redirect về /login.
        // Chỉ clear nếu lỗi không phải 401 (401 đã được interceptor xử lý).
        if (err?.response?.status !== 401) {
          clearAuth()
        }
      } finally {
        useAuthStore.getState().setLoading(false)
      }
    }
    initAuth()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const login = useCallback(async (email, password) => {
    const data = await authApi.login(email, password)
    setAuth(data.user, data.access, data.refresh)
    const intended = location.state?.from || '/'
    navigate(intended, { replace: true })
    return data
  }, [location.state, navigate, setAuth])

  const register = useCallback(async (userData) => {
    const data = await authApi.register(userData)
    setAuth(data.user, data.access, data.refresh)
    navigate('/', { replace: true })
    return data
  }, [navigate, setAuth])

  const logout = useCallback(() => {
    authApi.logout()
    clearAuth()
    navigate('/login')
  }, [clearAuth, navigate])

  const refreshUser = useCallback(async () => {
    try {
      const userData = await authApi.getProfile()
      // Backend returns {success, data: {user, ...}} - extract user from data.data
      updateUser(userData.data)
      return userData.data
    } catch (error) {
      logout()
      throw error
    }
  }, [updateUser, logout])

  const value = useMemo(() => ({
    user,
    accessToken,
    isAuthenticated,
    login,
    register,
    logout,
    updateUser,
    refreshUser,
  }), [user, accessToken, isAuthenticated, login, register, logout, updateUser, refreshUser])

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export default AuthContext