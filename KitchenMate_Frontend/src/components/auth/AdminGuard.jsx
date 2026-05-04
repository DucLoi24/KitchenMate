import { Navigate } from 'react-router-dom'
import { useAuth } from './useAuth'

export function AdminGuard({ children }) {
  const { isAuthenticated, user } = useAuth()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  // Check if user has admin role
  const isAdmin = user?.is_superuser || user?.role === 'admin' || user?.is_staff

  if (!isAdmin) {
    // Redirect to home or show access denied
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-background)]">
        <div className="text-center p-8 max-w-md">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-[var(--color-background-alt)] flex items-center justify-center">
            <svg className="w-8 h-8 text-[var(--color-text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="font-display text-2xl font-semibold text-[var(--color-text)] mb-2">
            Không có quyền truy cập
          </h1>
          <p className="text-[var(--color-text-secondary)] mb-6">
            Bạn cần quyền quản trị viên để truy cập trang này.
          </p>
          <Navigate to="/" replace />
        </div>
      </div>
    )
  }

  return children
}

export default AdminGuard