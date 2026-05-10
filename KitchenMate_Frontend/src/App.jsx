import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import { AuthProvider } from '@/components/auth/AuthContext'
import { AuthGuard } from '@/components/auth/AuthGuard'
import { AdminGuard } from '@/components/auth/AdminGuard'
import { LoginPage, RegisterPage, ForgotPasswordPage, GoogleOAuthCallbackPage } from '@/pages/auth'
import { ProfilePage, PublicProfilePage } from '@/pages/profile'
import { HomePage } from '@/pages/home'
import { ExplorePage } from '@/pages/explore'
import { RecipeDetailPage, RecipeEditorPage, MyRecipesPage } from '@/pages/recipe'
import { PantryPage } from '@/pages/pantry'
import { ShoppingPage } from '@/pages/shopping'
import { SuggestionPage } from '@/pages/suggestion'
import { Header } from '@/components/layout'
import { Sidebar } from '@/components/layout'
import { BottomNav } from '@/components/layout'
import { useState } from 'react'

// Lazy load collections pages
const CollectionsPage = lazy(() => import('@/pages/collections/CollectionsPage').then(m => ({ default: m.default || m.CollectionsPage })))
const CollectionDetailPage = lazy(() => import('@/pages/collections/CollectionDetailPage').then(m => ({ default: m.default || m.CollectionDetailPage })))

// Lazy load admin pages
const DashboardPage = lazy(() => import('@/pages/admin/DashboardPage').then(m => ({ default: m.default || m.DashboardPage })))
const RecipeManagementPage = lazy(() => import('@/pages/admin/RecipeManagementPage').then(m => ({ default: m.default || m.RecipeManagementPage })))
const IngredientManagementPage = lazy(() => import('@/pages/admin/IngredientManagementPage').then(m => ({ default: m.default || m.IngredientManagementPage })))
const UserManagementPage = lazy(() => import('@/pages/admin/UserManagementPage').then(m => ({ default: m.default || m.UserManagementPage })))
const CategoryManagementPage = lazy(() => import('@/pages/admin/CategoryManagementPage').then(m => ({ default: m.default || m.CategoryManagementPage })))
const ReportManagementPage = lazy(() => import('@/pages/admin/ReportManagementPage').then(m => ({ default: m.default || m.ReportManagementPage })))
const UnitManagementPage = lazy(() => import('@/pages/admin/UnitManagementPage').then(m => ({ default: m.default || m.UnitManagementPage })))

// Loading fallback
function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="w-10 h-10 border-4 border-[var(--color-border)] border-t-[var(--color-primary)] rounded-full animate-spin" />
    </div>
  )
}

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
                <Route path="/auth/google/callback" element={<GoogleOAuthCallbackPage />} />

                {/* Public routes */}
                <Route path="/" element={<HomePage />} />
                <Route path="/explore" element={<ExplorePage />} />
                <Route path="/recipe/:id" element={<RecipeDetailPage />} />

                {/* Protected routes - require login */}
                <Route path="/pantry" element={
                  <AuthGuard><PantryPage /></AuthGuard>
                } />
                <Route path="/shopping-list" element={
                  <AuthGuard><ShoppingPage /></AuthGuard>
                } />
                <Route path="/suggest" element={
                  <AuthGuard><SuggestionPage /></AuthGuard>
                } />
                <Route path="/collections" element={
                  <AuthGuard><Suspense fallback={<PageLoader />}><CollectionsPage /></Suspense></AuthGuard>
                } />
                <Route path="/collections/favorites" element={
                  <AuthGuard><Suspense fallback={<PageLoader />}><CollectionDetailPage /></Suspense></AuthGuard>
                } />
                <Route path="/collections/:id" element={
                  <AuthGuard><Suspense fallback={<PageLoader />}><CollectionDetailPage /></Suspense></AuthGuard>
                } />
                <Route path="/recipe/new" element={
                  <AuthGuard><RecipeEditorPage /></AuthGuard>
                } />
                <Route path="/my-recipes" element={
                  <AuthGuard><MyRecipesPage /></AuthGuard>
                } />
                <Route path="/recipe/:id/edit" element={
                  <AuthGuard><RecipeEditorPage /></AuthGuard>
                } />
                <Route path="/profile" element={
                  <AuthGuard><ProfilePage /></AuthGuard>
                } />
                <Route path="/profile/:userId" element={<PublicProfilePage />} />

                {/* Admin routes */}
                <Route path="/admin" element={
                  <AdminGuard><Suspense fallback={<PageLoader />}><DashboardPage /></Suspense></AdminGuard>
                } />
                <Route path="/admin/recipes" element={
                  <AdminGuard><Suspense fallback={<PageLoader />}><RecipeManagementPage /></Suspense></AdminGuard>
                } />
                <Route path="/admin/ingredients" element={
                  <AdminGuard><Suspense fallback={<PageLoader />}><IngredientManagementPage /></Suspense></AdminGuard>
                } />
                <Route path="/admin/users" element={
                  <AdminGuard><Suspense fallback={<PageLoader />}><UserManagementPage /></Suspense></AdminGuard>
                } />
                <Route path="/admin/categories" element={
                  <AdminGuard><Suspense fallback={<PageLoader />}><CategoryManagementPage /></Suspense></AdminGuard>
                } />
                <Route path="/admin/reports" element={
                  <AdminGuard><Suspense fallback={<PageLoader />}><ReportManagementPage /></Suspense></AdminGuard>
                } />
                <Route path="/admin/units" element={
                  <AdminGuard><Suspense fallback={<PageLoader />}><UnitManagementPage /></Suspense></AdminGuard>
                } />
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