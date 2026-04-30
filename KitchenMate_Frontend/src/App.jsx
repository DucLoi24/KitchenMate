import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from '@/components/auth/AuthContext'
import { AuthGuard } from '@/components/auth/AuthGuard'
import { LoginPage, RegisterPage, ForgotPasswordPage } from '@/pages/auth'
import { ProfilePage, PublicProfilePage } from '@/pages/profile'
import { HomePage } from '@/pages/home'
import { Header } from '@/components/layout'
import { Sidebar } from '@/components/layout'
import { BottomNav } from '@/components/layout'
import { useState } from 'react'

// Lazy load pages for performance
const PantryPage = () => <div className="p-6 text-[var(--color-text)]">Tủ lạnh - Cần đăng nhập</div>
const ShoppingPage = () => <div className="p-6 text-[var(--color-text)]">Danh sách đi chợ - Cần đăng nhập</div>
const SuggestPage = () => <div className="p-6 text-[var(--color-text)]">Gợi ý món ăn - Cần đăng nhập</div>
const CollectionsPage = () => <div className="p-6 text-[var(--color-text)]">Bộ sưu tập - Cần đăng nhập</div>
const CreateRecipePage = () => <div className="p-6 text-[var(--color-text)]">Tạo công thức - Cần đăng nhập</div>

function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="min-h-screen bg-[var(--color-background)]">
          <Header
            onMenuToggle={() => setIsSidebarOpen(!isSidebarOpen)}
            isSidebarOpen={isSidebarOpen}
          />
          <div className="flex min-w-0">
            <Sidebar isOpen={isSidebarOpen} />
            <main className="flex-1 min-w-0">
              <Routes>
                {/* Auth routes */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />

                {/* Public routes */}
                <Route path="/" element={<HomePage />} />

                {/* Protected routes - require login */}
                <Route path="/pantry" element={
                  <AuthGuard><PantryPage /></AuthGuard>
                } />
                <Route path="/shopping-list" element={
                  <AuthGuard><ShoppingPage /></AuthGuard>
                } />
                <Route path="/suggest" element={
                  <AuthGuard><SuggestPage /></AuthGuard>
                } />
                <Route path="/collections" element={
                  <AuthGuard><CollectionsPage /></AuthGuard>
                } />
                <Route path="/recipe/new" element={
                  <AuthGuard><CreateRecipePage /></AuthGuard>
                } />
                <Route path="/profile" element={
                  <AuthGuard><ProfilePage /></AuthGuard>
                } />
                <Route path="/profile/:userId" element={<PublicProfilePage />} />
              </Routes>
            </main>
          </div>
          <BottomNav />
        </div>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App