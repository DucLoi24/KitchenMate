import { createContext, useContext, useEffect, useMemo, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { authApi } from '@/api/authApi'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, accessToken, isAuthenticated, setAuth, logout: clearAuth, updateUser } = useAuthStore()

  // Initialize auth state from stored tokens on mount
  useEffect(() => {
    const initAuth = async () => {
      useAuthStore.getState().setLoading(true)
      const storedToken = localStorage.getItem('access_token')
      if (storedToken && !user) {
        try {
          const userData = await authApi.getProfile()
          setAuth(userData, storedToken, localStorage.getItem('refresh_token'))
        } catch {
          // Token invalid or expired - clear auth
          clearAuth()
          localStorage.removeItem('access_token')
          localStorage.removeItem('refresh_token')
        }
      }
      useAuthStore.getState().setLoading(false)
    }
    initAuth()
  }, [user, setAuth, clearAuth])

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
      updateUser(userData)
      return userData
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

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export default AuthContext