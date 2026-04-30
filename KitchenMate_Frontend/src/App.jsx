import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from '@/components/auth/AuthContext'
import { AuthGuard } from '@/components/auth/AuthGuard'
import { LoginPage, RegisterPage, ForgotPasswordPage } from '@/pages/auth'
import { ProfilePage, PublicProfilePage } from '@/pages/profile'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="min-h-screen bg-[var(--color-background)]">
          <Routes>
            {/* Auth routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />

            {/* Protected routes - wrap with AuthGuard */}
            <Route
              path="/"
              element={
                <AuthGuard>
                  <HomePage />
                </AuthGuard>
              }
            />
            <Route
              path="/profile"
              element={
                <AuthGuard>
                  <ProfilePage />
                </AuthGuard>
              }
            />
            <Route path="/profile/:userId" element={<PublicProfilePage />} />
          </Routes>
        </div>
      </AuthProvider>
    </BrowserRouter>
  )
}

function HomePage() {
  return (
    <>
      <header className="bg-white border-b border-[var(--color-border)]">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="font-display text-2xl font-semibold text-[var(--color-primary)]">
            KitchenMate
          </h1>
          <nav className="flex items-center gap-4">
            <span className="text-sm text-[var(--color-text-secondary)]">Xin chào!</span>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <div className="max-w-5xl mx-auto px-4 py-8">
          <p className="text-[var(--color-text-secondary)]">
            KitchenMate Frontend sẵn sàng phát triển. Đăng nhập thành công!
          </p>
        </div>
      </main>

      <footer className="border-t border-[var(--color-border)] py-6 mt-auto">
        <div className="max-w-5xl mx-auto px-4 text-center text-sm text-[var(--color-text-muted)]">
          KitchenMate © 2026
        </div>
      </footer>
    </>
  )
}

export default App