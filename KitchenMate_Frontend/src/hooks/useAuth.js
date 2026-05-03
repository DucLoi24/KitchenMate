import { useState, useCallback } from 'react'

function getAccessToken() {
  try {
    const raw = localStorage.getItem('auth-storage')
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return parsed?.state?.accessToken || null
  } catch {
    return null
  }
}

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => !!getAccessToken())

  const login = useCallback((token) => {
    // Zustand persist handles storage, but also set raw key for compatibility
    localStorage.setItem('access_token', token)
    setIsAuthenticated(true)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('auth-storage')
    setIsAuthenticated(false)
  }, [])

  return { isAuthenticated, login, logout }
}

export default useAuth