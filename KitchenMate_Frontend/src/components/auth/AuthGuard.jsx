import { Navigate, useLocation } from 'react-router-dom'
import { useAuthContext } from './useAuthContext'
import { GuestCTA } from './GuestCTA'

export function AuthGuard({ children, fallback = 'modal' }) {
  const { isAuthenticated } = useAuthContext()
  const location = useLocation()

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
