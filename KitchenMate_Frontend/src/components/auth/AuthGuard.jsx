import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './useAuth'
import { GuestCTA } from './GuestCTA'

export function AuthGuard({ children, fallback = 'modal' }) {
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

  // Show modal CTA if not authenticated
  if (!isAuthenticated) {
    if (fallback === 'modal') {
      // Extract context from pathname
      const pathContext = getContextFromPath(location.pathname)
      return (
        <div className="relative min-h-[60vh]">
          <GuestCTA context={pathContext} onClose={() => window.history.back()} />
        </div>
      )
    }
    // Legacy redirect behavior
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return children
}

function getContextFromPath(pathname) {
  if (pathname.startsWith('/pantry')) return 'pantry'
  if (pathname.startsWith('/shopping')) return 'shopping'
  if (pathname.startsWith('/suggest')) return 'suggest'
  if (pathname.startsWith('/recipe/new')) return 'create-recipe'
  if (pathname.startsWith('/collections')) return 'collections'
  if (pathname.startsWith('/profile')) return 'profile'
  return null
}

export default AuthGuard
