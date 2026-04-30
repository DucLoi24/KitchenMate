import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './AuthContext'

export function AuthGuard({ children }) {
  const { isAuthenticated, isLoading } = useAuth()
  const location = useLocation()

  // Show loading state if auth is being checked
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-background)]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-3 border-[var(--color-border)] border-t-[var(--color-primary)] rounded-full animate-spin" />
          <p className="text-[var(--color-text-secondary)] text-sm">Đang tải...</p>
        </div>
      </div>
    )
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return children
}

export default AuthGuard