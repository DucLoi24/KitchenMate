# Implementation Plan: Frontend Phase 1-2 (Setup & Authentication)

## Overview

Tài liệu này mô tả các tasks implementation cho Phase 1 (Setup & Cấu hình dự án) và Phase 2 (Authentication) của KitchenMate Frontend. Các tasks được chia nhỏ thành các bước cụ thể, có thể thực hiện độc lập, xây dựng dần từ setup cơ bản đến authentication hoàn chỉnh.

**Tech Stack**: React 18 + Vite, Tailwind CSS, React Router v6, Axios, React Query, Zustand

**Implementation Language**: JavaScript (Functional Components + Hooks)

## Tasks

- [x] 1. Khởi tạo dự án và cấu hình cơ bản
  - Tạo dự án React với Vite template
  - Cấu hình cấu trúc thư mục chuẩn (api/, components/, pages/, stores/, hooks/, utils/, routes/, assets/, layouts/)
  - Tạo file .env với VITE_API_BASE_URL=http://localhost:8000/api
  - Cấu hình .gitignore (node_modules/, dist/, .env)
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [x] 2. Cài đặt và cấu hình dependencies
  - [x] 2.1 Cài đặt và cấu hình Tailwind CSS
    - Cài đặt tailwindcss, postcss, autoprefixer
    - Tạo tailwind.config.js với custom theme (primary: #FF6B35, secondary: #4CAF50)
    - Cài đặt @tailwindcss/forms plugin
    - Cấu hình index.css với Tailwind directives
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

  - [x] 2.2 Cài đặt routing và state management libraries
    - Cài đặt react-router-dom v6
    - Cài đặt zustand và zustand/middleware
    - Cài đặt @tanstack/react-query v5
    - _Requirements: 3.1, 5.1, 8.1_

  - [x] 2.3 Cài đặt HTTP client và form libraries
    - Cài đặt axios
    - Cài đặt react-hook-form và @hookform/resolvers
    - Cài đặt zod cho validation
    - _Requirements: 4.1, 6.6_

  - [x] 2.4 Cài đặt UI libraries
    - Cài đặt react-hot-toast
    - Cài đặt react-icons
    - Cài đặt @headlessui/react
    - Cài đặt react-image-crop
    - Cài đặt swiper
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 3. Cấu hình Vite và React Query Provider
  - [x] 3.1 Cấu hình vite.config.js
    - Thêm proxy configuration cho /api/* → http://localhost:8000/api/
    - Cấu hình build options với code splitting (vendor, ui chunks)
    - Cấu hình server port 3000
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

  - [x] 3.2 Setup React Query Provider trong main.jsx
    - Tạo QueryClient với staleTime 5 phút, cacheTime 10 phút, retry 1
    - Wrap App component với QueryClientProvider
    - Thêm ReactQueryDevtools cho development
    - _Requirements: 5.2, 5.3, 5.4, 5.5_

- [x] 4. Tạo Auth Store với Zustand
  - Tạo src/stores/authStore.js
  - Implement state: user, accessToken, refreshToken, isAuthenticated
  - Implement actions: login(), logout(), setUser(), setAccessToken()
  - Cấu hình persist middleware để lưu tokens vào localStorage
  - Implement logic load tokens từ localStorage khi app khởi động
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 8.8_

- [x] 5. Tạo Axios Instance với Interceptors
  - [x] 5.1 Tạo axiosInstance.js với base configuration
    - Tạo axios instance với baseURL từ env
    - Cấu hình timeout 30 giây
    - Cấu hình default headers (Content-Type: application/json)
    - _Requirements: 4.1, 4.6_

  - [x] 5.2 Implement Request Interceptor
    - Tự động attach Authorization header với accessToken từ Auth Store
    - _Requirements: 4.2_

  - [x] 5.3 Implement Response Interceptor với Token Refresh
    - Catch 401 errors và trigger token refresh
    - Implement request queuing để tránh multiple refresh calls
    - Retry original request với token mới sau khi refresh thành công
    - Logout và redirect về /login nếu refresh thất bại
    - _Requirements: 4.3, 4.4, 4.5, 14.1, 14.2, 14.3, 14.4, 14.5, 14.6_

- [x] 6. Tạo Auth API Functions
  - Tạo src/api/authApi.js
  - Implement authApi.register(userData)
  - Implement authApi.login(credentials)
  - Implement authApi.logout(refreshToken)
  - Implement authApi.forgotPassword(email)
  - Implement authApi.resetPassword(token, newPassword)
  - Implement authApi.getCurrentUser()
  - Implement authApi.updateProfile(userData)
  - _Requirements: 9.6, 10.5, 11.3, 11.9, 15.2_

- [x] 7. Tạo Validation Schemas
  - Tạo src/utils/validators.js
  - Implement loginSchema (email, password validation)
  - Implement registerSchema (username, email, password, confirm_password với regex checks)
  - Implement forgotPasswordSchema (email validation)
  - Implement resetPasswordSchema (new_password, confirm_password với regex checks)
  - _Requirements: 9.3, 9.4, 9.5, 10.3, 10.4, 11.2, 11.7, 11.8_

- [x] 8. Tạo Error Handler Utility
  - Tạo src/utils/errorHandler.js
  - Implement handleApiError() function xử lý network errors, server errors (5xx), client errors (4xx), timeout errors
  - Tích hợp với react-hot-toast để hiển thị error messages
  - _Requirements: 16.3, 16.4, 16.5_

- [x] 9. Tạo Common Components
  - [x] 9.1 Tạo Button component
    - Tạo src/components/common/Button.jsx
    - Support variants (primary, secondary, outline), sizes (sm, md, lg)
    - Support loading state với spinner
    - Support disabled state
    - _Requirements: 16.1, 16.2_

  - [x] 9.2 Tạo Input component
    - Tạo src/components/common/Input.jsx
    - Support types (text, email, password)
    - Support error state với error message display
    - Support disabled state
    - Đảm bảo min height 44px cho mobile touch
    - _Requirements: 16.3, 17.3_

  - [x] 9.3 Tạo LoadingSpinner component
    - Tạo src/components/common/LoadingSpinner.jsx
    - Support sizes (sm, md, lg)
    - Sử dụng Tailwind animate-spin
    - _Requirements: 16.1_

- [x] 10. Checkpoint - Kiểm tra foundation setup
  - Ensure all tests pass, ask the user if questions arise.

- [x] 11. Tạo Layout Components
  - [x] 11.1 Tạo AuthLayout
    - Tạo src/layouts/AuthLayout.jsx
    - Centered form layout với background gradient
    - Logo ở trên cùng
    - Không có navbar/footer
    - Responsive cho mobile (max-width 400px, padding 16px)
    - _Requirements: 3.4, 17.1, 17.2_

  - [x] 11.2 Tạo MainLayout (skeleton)
    - Tạo src/layouts/MainLayout.jsx
    - Placeholder cho Navbar (desktop) và BottomNav (mobile)
    - Main content area với proper spacing
    - _Requirements: 3.5_

- [x] 12. Tạo Protected Route Components
  - [x] 12.1 Tạo ProtectedRoute component
    - Tạo src/routes/ProtectedRoute.jsx
    - Check isAuthenticated từ Auth Store
    - Redirect về /login nếu chưa đăng nhập
    - Lưu current location vào state để redirect về sau khi login
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_

  - [x] 12.2 Tạo AdminRoute component
    - Tạo src/routes/AdminRoute.jsx
    - Check isAuthenticated và user.is_staff/is_superuser
    - Redirect về /login nếu chưa đăng nhập
    - Redirect về / với toast error nếu không phải admin
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5_

- [x] 13. Tạo Register Form và Page
  - [x] 13.1 Tạo RegisterForm component
    - Tạo src/components/forms/RegisterForm.jsx
    - Implement form với react-hook-form và registerSchema
    - Fields: username, email, password, confirm_password
    - Hiển thị validation errors dưới mỗi field
    - Loading state khi submit (disable inputs và button)
    - Call authApi.register() khi submit
    - Hiển thị toast success và redirect về /login khi thành công
    - Hiển thị toast error khi thất bại (email/username đã tồn tại)
    - _Requirements: 9.2, 9.3, 9.4, 9.5, 9.6, 9.7, 9.8, 9.9_

  - [x] 13.2 Tạo RegisterPage
    - Tạo src/pages/auth/RegisterPage.jsx
    - Sử dụng AuthLayout
    - Render RegisterForm
    - Link "Đã có tài khoản? Đăng nhập" dẫn về /login
    - _Requirements: 9.1_

- [x] 14. Tạo Login Form và Page
  - [x] 14.1 Tạo LoginForm component
    - Tạo src/components/forms/LoginForm.jsx
    - Implement form với react-hook-form và loginSchema
    - Fields: email, password
    - Hiển thị validation errors dưới mỗi field
    - Loading state khi submit (disable inputs và button)
    - Call authApi.login() khi submit
    - Lưu tokens và user vào Auth Store khi thành công
    - Redirect về previous page hoặc home khi thành công
    - Hiển thị toast error "Email hoặc mật khẩu không đúng" khi thất bại
    - Link "Quên mật khẩu?" dẫn đến /forgot-password
    - _Requirements: 10.2, 10.3, 10.4, 10.5, 10.6, 10.7, 10.8, 10.9, 10.10_

  - [x] 14.2 Tạo LoginPage
    - Tạo src/pages/auth/LoginPage.jsx
    - Sử dụng AuthLayout
    - Render LoginForm
    - Link "Chưa có tài khoản? Đăng ký" dẫn về /register
    - _Requirements: 10.1_

- [x] 15. Tạo Forgot Password Form và Page
  - [x] 15.1 Tạo ForgotPasswordForm component
    - Tạo src/components/forms/ForgotPasswordForm.jsx
    - Implement form với react-hook-form và forgotPasswordSchema
    - Field: email
    - Call authApi.forgotPassword() khi submit
    - Hiển thị toast "Đã gửi email hướng dẫn reset mật khẩu" khi thành công
    - _Requirements: 11.2, 11.3, 11.4_

  - [x] 15.2 Tạo ForgotPasswordPage
    - Tạo src/pages/auth/ForgotPasswordPage.jsx
    - Sử dụng AuthLayout
    - Render ForgotPasswordForm
    - Link "Quay lại đăng nhập" dẫn về /login
    - _Requirements: 11.1_

- [x] 16. Tạo Reset Password Form và Page
  - [x] 16.1 Tạo ResetPasswordForm component
    - Tạo src/components/forms/ResetPasswordForm.jsx
    - Implement form với react-hook-form và resetPasswordSchema
    - Fields: new_password, confirm_password
    - Nhận token từ query parameter
    - Call authApi.resetPassword() với token và new_password
    - Hiển thị toast success và redirect về /login khi thành công
    - Hiển thị toast error "Link reset mật khẩu không hợp lệ hoặc đã hết hạn" khi thất bại
    - _Requirements: 11.6, 11.7, 11.8, 11.9, 11.10, 11.11_

  - [x] 16.2 Tạo ResetPasswordPage
    - Tạo src/pages/auth/ResetPasswordPage.jsx
    - Sử dụng AuthLayout
    - Parse token từ URL query parameter
    - Render ResetPasswordForm với token
    - _Requirements: 11.5_

- [x] 17. Tạo Logout Functionality
  - [x] 17.1 Tạo useAuth custom hook
    - Tạo src/hooks/useAuth.js
    - Implement logout() function
    - Call authApi.logout() với refreshToken
    - Call authStore.logout() để xóa tokens và user data
    - Xóa tokens khỏi localStorage
    - Redirect về /login
    - Hiển thị toast "Đã đăng xuất thành công"
    - Xử lý trường hợp logout API thất bại (vẫn xóa tokens local)
    - _Requirements: 15.2, 15.3, 15.4, 15.5, 15.6, 15.7_

  - [x] 17.2 Tạo UserMenu component với logout button
    - Tạo src/components/layout/UserMenu.jsx
    - Dropdown menu với avatar
    - Menu items: Profile, Settings, Logout
    - Click "Đăng xuất" gọi useAuth().logout()
    - _Requirements: 15.1_

- [x] 18. Setup Routing Configuration
  - [x] 18.1 Tạo AppRoutes component
    - Tạo src/routes/AppRoutes.jsx
    - Configure routes với React Router v6
    - Public routes: /, /login, /register, /forgot-password, /reset-password
    - Protected routes: /profile, /my-recipes (wrapped với ProtectedRoute)
    - 404 NotFoundPage
    - _Requirements: 3.2, 3.3_

  - [x] 18.2 Tạo HomePage placeholder
    - Tạo src/pages/HomePage.jsx
    - Simple placeholder với "Trang chủ KitchenMate"
    - Sử dụng MainLayout

  - [x] 18.3 Tạo NotFoundPage
    - Tạo src/pages/NotFoundPage.jsx
    - 404 message với link về home

- [x] 19. Setup App.jsx và main.jsx
  - [x] 19.1 Configure App.jsx
    - Import và render AppRoutes
    - Wrap với BrowserRouter
    - Add Toaster component từ react-hot-toast với config (position: top-right, duration: 3s)
    - _Requirements: 16.6, 16.7, 16.8_

  - [x] 19.2 Configure main.jsx
    - Wrap App với QueryClientProvider
    - Add ReactQueryDevtools
    - Import index.css

- [ ] 20. Implement Responsive Design cho Auth Pages
  - Apply responsive styles cho tất cả auth forms
  - Form max-width 400px trên desktop
  - Form padding 16px trên mobile
  - Input và button min-height 44px
  - Test trên màn hình 375px (iPhone SE)
  - Font size tối thiểu 14px cho labels và errors
  - _Requirements: 17.1, 17.2, 17.3, 17.4, 17.5, 17.6_

- [x] 21. Implement Security Best Practices
  - [x] 21.1 Token security
    - Verify tokens không được log ra console trong production
    - Verify tokens chỉ được gửi qua Authorization header
    - Verify tokens được xóa hoàn toàn khi logout
    - _Requirements: 18.1, 18.2, 18.3, 18.4, 18.5, 18.6, 18.7_

  - [x] 21.2 Add Content Security Policy
    - Thêm CSP meta tag vào index.html
    - Configure CSP cho script, style, img, connect sources

- [x] 22. Final Checkpoint - End-to-end Testing
  - Test complete registration flow
  - Test complete login flow
  - Test forgot password flow
  - Test reset password flow
  - Test logout flow
  - Test protected route access (authenticated vs unauthenticated)
  - Test token refresh flow (manually expire token)
  - Test responsive design trên mobile, tablet, desktop
  - Test error handling (network error, server error, validation error)
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks được sắp xếp theo thứ tự dependency: setup → core infrastructure → components → pages → integration
- Mỗi task build trên các tasks trước đó
- Checkpoints ở task 10 và 22 để validate progress
- Không có property-based test tasks vì spec này chủ yếu là UI/UX và configuration
- Testing sẽ được thực hiện thông qua manual testing và integration testing
- Tất cả code sử dụng JavaScript (không TypeScript)
- Mobile-first approach cho tất cả styling
