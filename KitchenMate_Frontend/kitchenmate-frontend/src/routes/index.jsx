import { createBrowserRouter, Navigate } from 'react-router-dom';
import App from '../App';
import { MainLayout } from '../components/layout';
import AuthLayout from '../components/ui/AuthLayout';
import ProtectedRoute from '../components/auth/ProtectedRoute';
import AdminRoute from '../components/auth/AdminRoute';
import LoginPage from '../pages/LoginPage';
import RegisterPage from '../pages/RegisterPage';
import ForgotPasswordPage from '../pages/ForgotPasswordPage';
import ResetPasswordPage from '../pages/ResetPasswordPage';
import HomePage from '../pages/HomePage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
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
                <div className="p-4">
                  <h1 className="text-2xl font-bold text-gray-900">Khám phá</h1>
                </div>
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
                <div className="p-4">
                  <h1 className="text-2xl font-bold text-gray-900">Tủ lạnh số</h1>
                </div>
              </ProtectedRoute>
            ),
          },
          {
            path: '/profile',
            element: (
              <ProtectedRoute>
                <div className="p-4">
                  <h1 className="text-2xl font-bold text-gray-900">Hồ sơ</h1>
                </div>
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
                <div className="p-4">
                  <h1 className="text-2xl font-bold text-gray-900">Tạo công thức</h1>
                </div>
              </ProtectedRoute>
            ),
          },
        ],
      },
      {
        path: '/admin',
        element: (
          <AdminRoute>
            <div className="p-4">
              <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            </div>
          </AdminRoute>
        ),
      },
    ],
  },
]);