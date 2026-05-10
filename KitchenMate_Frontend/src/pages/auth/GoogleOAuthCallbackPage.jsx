import { useEffect } from 'react'
import { Loader2 } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'

/**
 * Google OAuth Callback Page
 *
 * This page handles the OAuth callback from the backend after Google login.
 * It reads tokens from URL params, sets auth state, and redirects to home.
 *
 * Note: This page is opened by redirect (not popup) when using window.location.href approach.
 */
export function GoogleOAuthCallbackPage() {
  const setAuth = useAuthStore((state) => state.setAuth)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const access = params.get('access')
    const refresh = params.get('refresh')
    const userStr = params.get('user')

    if (!access || !refresh || !userStr) {
      // Missing params - redirect to login
      window.location.replace('/login')
      return
    }

    try {
      const user = JSON.parse(decodeURIComponent(userStr))

      // Set auth state
      setAuth(user, access, refresh)

      // Redirect to home
      window.location.replace('/')
    } catch (err) {
      console.error('OAuth callback error:', err)
      window.location.replace('/login')
    }
  }, [setAuth])

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-background)] px-4">
      <div className="bg-[var(--color-surface)] rounded-[var(--radius-xl)] p-8 shadow-[var(--shadow-xl)] border border-[var(--color-border)] text-center max-w-sm w-full">
        <Loader2 className="w-16 h-16 mx-auto mb-4 text-[var(--color-primary)] animate-spin" />
        <h2 className="font-display text-xl font-semibold text-[var(--color-text)] mb-2">
          Đăng nhập thành công!
        </h2>
        <p className="text-[var(--color-text-secondary)]">
          Đang chuyển hướng về trang chủ...
        </p>
      </div>
    </div>
  )
}

export default GoogleOAuthCallbackPage