import { useState, useCallback } from 'react'

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return !!localStorage.getItem('access_token')
  })

  const login = useCallback((token) => {
    localStorage.setItem('access_token', token)
    setIsAuthenticated(true)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    setIsAuthenticated(false)
  }, [])

  return { isAuthenticated, login, logout }
}

export default useAuth