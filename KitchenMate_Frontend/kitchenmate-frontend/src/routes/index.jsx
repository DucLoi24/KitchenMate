import { createBrowserRouter, Navigate } from 'react-router-dom';
import App from '../App';
import { MainLayout } from '../components/layout';
import AuthLayout from '../components/ui/AuthLayout';
import ProtectedRoute from '../components/auth/ProtectedRoute';
import AdminRoute from '../components/auth/AdminRoute';
import AdminLayout from '../components/layout/AdminLayout';
import LoginPage from '../pages/LoginPage';
import RegisterPage from '../pages/RegisterPage';
import ForgotPasswordPage from '../pages/ForgotPasswordPage';
import ResetPasswordPage from '../pages/ResetPasswordPage';
import HomePage from '../pages/HomePage';
import CreateRecipePage from '../pages/CreateRecipePage';
import RecipeDetailPage from '../pages/RecipeDetailPage';
import CookModePage from '../pages/CookModePage';
import ExplorePage from '../pages/ExplorePage';
import AdminDashboard from '../pages/admin/AdminDashboard';
import AdminPendingRecipes from '../pages/admin/AdminPendingRecipes';
import AdminPendingIngredients from '../pages/admin/AdminPendingIngredients';
import AdminUsers from '../pages/admin/AdminUsers';
import ProfilePage from '../pages/ProfilePage';
import MyRecipesPage from '../pages/MyRecipesPage';
import PantryPage from '../pages/PantryPage';
import ShoppingListPage from '../pages/ShoppingListPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      {
        path: '/cook-mode/:id',
        element: <CookModePage />,
      },
      {
        index: true,
        element: <Navigate to="/home" replace />,
      },
      {
        element: <AuthLayout />,
        children: [
          { path: '/login', element: <LoginPage /> },
          { path: '/register', element: <RegisterPage /> },
          { path: '/forgot-password', element: <ForgotPasswordPage /> },
          { path: '/reset-password', element: <ResetPasswordPage /> },
        ],
      },
      {
        element: <MainLayout />,
        children: [
          {
            path: '/home',
            element: <HomePage />,
          },
          {
            path: '/explore',
            element: (
              <ProtectedRoute>
                <ExplorePage />
              </ProtectedRoute>
            ),
          },
          {
            path: '/suggestions',
            element: (
              <ProtectedRoute>
                <div className="p-4">
                  <h1 className="text-2xl font-bold text-gray-900">Gợi ý món ăn</h1>
                </div>
              </ProtectedRoute>
            ),
          },
          {
            path: '/pantry',
            element: (
              <ProtectedRoute>
                <PantryPage />
              </ProtectedRoute>
            ),
          },
          {
            path: '/shopping-list',
            element: (
              <ProtectedRoute>
                <ShoppingListPage />
              </ProtectedRoute>
            ),
          },
          {
            path: '/profile/:id',
            element: (
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            ),
          },
          {
            path: '/my-recipes',
            element: (
              <ProtectedRoute>
                <MyRecipesPage />
              </ProtectedRoute>
            ),
          },
          {
            path: '/collections',
            element: (
              <ProtectedRoute>
                <div className="p-4">
                  <h1 className="text-2xl font-bold text-gray-900">Bộ sưu tập</h1>
                </div>
              </ProtectedRoute>
            ),
          },
          {
            path: '/recipes/create',
            element: (
              <ProtectedRoute>
                <CreateRecipePage />
              </ProtectedRoute>
            ),
          },
          {
            path: '/recipes/:id',
            element: (
              <ProtectedRoute>
                <RecipeDetailPage />
              </ProtectedRoute>
            ),
          },
        ],
      },
      {
        path: '/admin',
        element: (
          <AdminRoute>
            <AdminLayout />
          </AdminRoute>
        ),
        children: [
          { index: true, element: <AdminDashboard /> },
          { path: 'recipes/pending', element: <AdminPendingRecipes /> },
          { path: 'ingredients/pending', element: <AdminPendingIngredients /> },
          { path: 'users', element: <AdminUsers /> },
        ],
      },
    ],
  },
]);