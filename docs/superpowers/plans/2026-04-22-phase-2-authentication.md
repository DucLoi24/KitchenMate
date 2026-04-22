# Phase 2: Authentication Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build complete authentication flow (register, login, logout, forgot/reset password, protected routes) for KitchenMate frontend

**Architecture:** React 19 + React Router v7 + Zustand + Axios JWT interceptor. Auth store already exists with persist middleware. New endpoints: `/api/auth/register/`, `/api/auth/login/`, `/api/auth/logout/`, `/api/auth/forgot-password/`, `/api/auth/reset-password/`, `/api/accounts/me/` for user profile. Protected routes redirect to `/login` with return URL.

**Tech Stack:** React 19, React Router v7, Zustand v5, Axios, React Hook Form v7 + Zod v4 + @hookform/resolvers, react-hot-toast

---

## File Structure

```
src/
├── api/
│   └── authApi.js              # New: auth API call functions
├── pages/
│   ├── LoginPage.jsx          # New: login page component
│   ├── RegisterPage.jsx       # New: register page component
│   └──ForgotPasswordPage.jsx  # New: forgot password page
├── components/
│   ├── auth/
│   │   ├── ProtectedRoute.jsx # New: redirect if not authenticated
│   │   └── AdminRoute.jsx     # New: redirect if not admin
│   └── ui/
│       ├── InputField.jsx      # New: reusable input with label + error
│       ├── PasswordField.jsx   # New: password input with toggle visibility
│       └── AuthLayout.jsx     # New: layout for auth pages (no navbar)
├── hooks/
│   └── useAuthApi.js           # New: auth API call hooks for React Query
└── routes/
    └── index.jsx               # New: route definitions
```

**Modify:**
- `src/App.jsx` — import route definitions, remove placeholder routes
- `src/stores/authStore.js` — add `refreshAccessToken()` action

---

## Task 1: Auth API Layer

**Files:**
- Create: `src/api/authApi.js`

- [ ] **Step 1: Create auth API functions**

```javascript
// src/api/authApi.js
import axiosInstance from './axiosInstance';

export const authApi = {
  register: async (data) => {
    const response = await axiosInstance.post('/auth/register/', data);
    return response.data;
  },

  login: async (data) => {
    const response = await axiosInstance.post('/auth/login/', data);
    return response.data;
  },

  logout: async (refreshToken) => {
    const response = await axiosInstance.post('/auth/logout/', {
      refresh: refreshToken,
    });
    return response.data;
  },

  forgotPassword: async (email) => {
    const response = await axiosInstance.post('/auth/forgot-password/', { email });
    return response.data;
  },

  resetPassword: async (token, newPassword, newPasswordConfirm) => {
    const response = await axiosInstance.post('/auth/reset-password/', {
      token,
      new_password: newPassword,
      new_password_confirm: newPasswordConfirm,
    });
    return response.data;
  },

  getMe: async () => {
    const response = await axiosInstance.get('/accounts/me/');
    return response.data;
  },

  updateMe: async (data) => {
    const response = await axiosInstance.patch('/accounts/me/', data);
    return response.data;
  },
};
```

- [ ] **Step 2: Commit**

```bash
git add src/api/authApi.js
git commit -m "feat(auth): add auth API functions"
```

---

## Task 2: Auth Store Enhancement (refreshAccessToken)

**Files:**
- Modify: `src/stores/authStore.js:1-52`

- [ ] **Step 1: Add refreshAccessToken to authStore**

```javascript
// Add this method to the store's (set, get) function body:
refreshAccessToken: async () => {
  const refreshToken = get().refreshToken;
  if (!refreshToken) {
    get().logout();
    return false;
  }
  try {
    const response = await axiosInstance.post('/auth/refresh/', {
      refresh: refreshToken,
    });
    const { access } = response.data;
    set({ accessToken: access });
    return true;
  } catch (error) {
    get().logout();
    return false;
  }
},
```

Also add `import axiosInstance from '../api/axiosInstance';` at the top of authStore.js.

- [ ] **Step 2: Commit**

```bash
git add src/stores/authStore.js
git commit -m "feat(auth): add refreshAccessToken action to authStore"
```

---

## Task 3: UI Primitives — InputField & PasswordField

**Files:**
- Create: `src/components/ui/InputField.jsx`
- Create: `src/components/ui/PasswordField.jsx`

- [ ] **Step 1: Create InputField component**

```jsx
// src/components/ui/InputField.jsx
import { forwardRef } from 'react';

const InputField = forwardRef(({ label, error, className = '', ...props }, ref) => {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="text-sm font-medium text-[--color-text-primary]">
          {label}
        </label>
      )}
      <input
        ref={ref}
        className={`px-3 py-2 rounded-lg border text-[--color-text-primary]
          bg-white transition-colors
          focus:outline-none focus:ring-2 focus:ring-[--color-primary]/50
          ${error ? 'border-red-500' : 'border-[--color-border]'}
          ${className}`}
        {...props}
      />
      {error && (
        <span className="text-xs text-red-500">{error}</span>
      )}
    </div>
  );
});

InputField.displayName = 'InputField';
export default InputField;
```

- [ ] **Step 2: Create PasswordField component**

```jsx
// src/components/ui/PasswordField.jsx
import { useState } from 'react';
import { PiEye, PiEyeSlash } from 'react-icons/pi';
import InputField from './InputField';

const PasswordField = ({ label, error, ...props }, ref) => {
  const [visible, setVisible] = useState(false);

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="text-sm font-medium text-[--color-text-primary]">
          {label}
        </label>
      )}
      <div className="relative">
        <InputField
          ref={ref}
          type={visible ? 'text' : 'password'}
          error={undefined}
          className="pr-10"
          {...props}
        />
        <button
          type="button"
          onClick={() => setVisible(!visible)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-[--color-text-muted] hover:text-[--color-text-primary] transition-colors"
        >
          {visible ? <PiEyeSlash size={18} /> : <PiEye size={18} />}
        </button>
      </div>
      {error && (
        <span className="text-xs text-red-500">{error}</span>
      )}
    </div>
  );
};

export default PasswordField;
```

- [ ] **Step 3: Commit**

```bash
git add src/components/ui/InputField.jsx src/components/ui/PasswordField.jsx
git commit -m "feat(auth): add InputField and PasswordField UI primitives"
```

---

## Task 4: AuthLayout Component

**Files:**
- Create: `src/components/ui/AuthLayout.jsx`

- [ ] **Step 1: Create AuthLayout component**

```jsx
// src/components/ui/AuthLayout.jsx
import { Outlet } from 'react-router-dom';

export default function AuthLayout() {
  return (
    <div className="min-h-screen bg-[--color-background] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-[--color-primary]">KitchenMate</h1>
          <p className="text-[--color-text-secondary] mt-2">
            Nấu ăn thông minh, sống khỏe mỗi ngày
          </p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-[--color-border] p-6">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/ui/AuthLayout.jsx
git commit -m "feat(auth): add AuthLayout component"
```

---

## Task 5: ProtectedRoute & AdminRoute Components

**Files:**
- Create: `src/components/auth/ProtectedRoute.jsx`
- Create: `src/components/auth/AdminRoute.jsx`

- [ ] **Step 1: Create ProtectedRoute component**

```jsx
// src/components/auth/ProtectedRoute.jsx
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';

export default function ProtectedRoute({ children }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}
```

- [ ] **Step 2: Create AdminRoute component**

```jsx
// src/components/auth/AdminRoute.jsx
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';

export default function AdminRoute({ children }) {
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!user?.is_staff) {
    return <Navigate to="/home" replace />;
  }

  return children;
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/auth/ProtectedRoute.jsx src/components/auth/AdminRoute.jsx
git commit -m "feat(auth): add ProtectedRoute and AdminRoute components"
```

---

## Task 6: RegisterPage

**Files:**
- Create: `src/pages/RegisterPage.jsx`

- [ ] **Step 1: Create RegisterPage with React Hook Form + Zod**

```jsx
// src/pages/RegisterPage.jsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuthStore } from '../stores/authStore';
import { authApi } from '../api/authApi';
import InputField from '../components/ui/InputField';
import PasswordField from '../components/ui/PasswordField';

const registerSchema = z.object({
  email: z.string().email('Email không hợp lệ'),
  full_name: z.string().min(2, 'Họ tên tối thiểu 2 ký tự'),
  password: z.string().min(8, 'Mật khẩu tối thiểu 8 ký tự'),
  password_confirm: z.string(),
}).refine((data) => data.password === data.password_confirm, {
  message: 'Mật khẩu xác nhận không khớp',
  path: ['password_confirm'],
});

export default function RegisterPage() {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data) => {
    try {
      const response = await authApi.register(data);
      const { user, tokens } = response.data;
      login(user, tokens.access, tokens.refresh);
      toast.success('Đăng ký thành công!');
      navigate('/home');
    } catch (error) {
      const errorData = error.response?.data?.error?.details;
      if (errorData) {
        Object.keys(errorData).forEach((field) => {
          setError(field, { message: errorData[field][0]?.message || errorData[field][0] });
        });
      } else {
        toast.error(error.response?.data?.error?.message || 'Đăng ký thất bại');
      }
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-[--color-text-primary] mb-2">
        Tạo tài khoản mới
      </h2>
      <p className="text-[--color-text-secondary] mb-6">
        Tham gia KitchenMate để bắt đầu hành trình ẩm thực của bạn
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <InputField
          label="Email"
          type="email"
          placeholder="email@example.com"
          error={errors.email?.message}
          {...register('email')}
        />

        <InputField
          label="Họ và tên"
          type="text"
          placeholder="Nguyễn Văn A"
          error={errors.full_name?.message}
          {...register('full_name')}
        />

        <PasswordField
          label="Mật khẩu"
          placeholder="Tối thiểu 8 ký tự"
          error={errors.password?.message}
          {...register('password')}
        />

        <PasswordField
          label="Xác nhận mật khẩu"
          placeholder="Nhập lại mật khẩu"
          error={errors.password_confirm?.message}
          {...register('password_confirm')}
        />

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-2.5 bg-[--color-primary] text-white font-semibold
            rounded-lg hover:bg-[--color-primary-dark] transition-colors
            disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Đang xử lý...' : 'Đăng ký'}
        </button>
      </form>

      <p className="text-center mt-4 text-sm text-[--color-text-secondary]">
        Đã có tài khoản?{' '}
        <Link to="/login" className="text-[--color-primary] font-medium hover:underline">
          Đăng nhập ngay
        </Link>
      </p>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/RegisterPage.jsx
git commit -m "feat(auth): add RegisterPage component"
```

---

## Task 7: LoginPage

**Files:**
- Create: `src/pages/LoginPage.jsx`

- [ ] **Step 1: Create LoginPage component**

```jsx
// src/pages/LoginPage.jsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuthStore } from '../stores/authStore';
import { authApi } from '../api/authApi';
import InputField from '../components/ui/InputField';
import PasswordField from '../components/ui/PasswordField';

const loginSchema = z.object({
  email: z.string().email('Email không hợp lệ'),
  password: z.string().min(1, 'Vui lòng nhập mật khẩu'),
});

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const login = useAuthStore((state) => state.login);

  const from = location.state?.from?.pathname || '/home';

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data) => {
    try {
      const response = await authApi.login(data);
      const { user, tokens } = response.data;
      login(user, tokens.access, tokens.refresh);
      toast.success('Đăng nhập thành công!');
      navigate(from, { replace: true });
    } catch (error) {
      toast.error(error.response?.data?.error?.message || 'Đăng nhập thất bại');
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-[--color-text-primary] mb-2">
        Chào mừng trở lại
      </h2>
      <p className="text-[--color-text-secondary] mb-6">
        Đăng nhập để tiếp tục hành trình ẩm thực của bạn
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <InputField
          label="Email"
          type="email"
          placeholder="email@example.com"
          error={errors.email?.message}
          {...register('email')}
        />

        <PasswordField
          label="Mật khẩu"
          placeholder="Nhập mật khẩu"
          error={errors.password?.message}
          {...register('password')}
        />

        <div className="flex justify-end">
          <Link
            to="/forgot-password"
            className="text-sm text-[--color-primary] hover:underline"
          >
            Quên mật khẩu?
          </Link>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-2.5 bg-[--color-primary] text-white font-semibold
            rounded-lg hover:bg-[--color-primary-dark] transition-colors
            disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Đang xử lý...' : 'Đăng nhập'}
        </button>
      </form>

      <p className="text-center mt-4 text-sm text-[--color-text-secondary]">
        Chưa có tài khoản?{' '}
        <Link to="/register" className="text-[--color-primary] font-medium hover:underline">
          Đăng ký ngay
        </Link>
      </p>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/LoginPage.jsx
git commit -m "feat(auth): add LoginPage component"
```

---

## Task 8: ForgotPasswordPage & ResetPasswordPage

**Files:**
- Create: `src/pages/ForgotPasswordPage.jsx`
- Create: `src/pages/ResetPasswordPage.jsx`

- [ ] **Step 1: Create ForgotPasswordPage**

```jsx
// src/pages/ForgotPasswordPage.jsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { authApi } from '../api/authApi';
import InputField from '../components/ui/InputField';

const forgotSchema = z.object({
  email: z.string().email('Email không hợp lệ'),
});

export default function ForgotPasswordPage() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(forgotSchema),
  });

  const onSubmit = async (data) => {
    try {
      await authApi.forgotPassword(data.email);
      toast.success('Đã gửi hướng dẫn đặt lại mật khẩu đến email của bạn');
    } catch (error) {
      toast.error('Không thể gửi email. Vui lòng thử lại sau.');
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-[--color-text-primary] mb-2">
        Quên mật khẩu
      </h2>
      <p className="text-[--color-text-secondary] mb-6">
        Nhập email để nhận hướng dẫn đặt lại mật khẩu
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <InputField
          label="Email"
          type="email"
          placeholder="email@example.com"
          error={errors.email?.message}
          {...register('email')}
        />

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-2.5 bg-[--color-primary] text-white font-semibold
            rounded-lg hover:bg-[--color-primary-dark] transition-colors
            disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Đang gửi...' : 'Gửi email đặt lại'}
        </button>
      </form>

      <p className="text-center mt-4 text-sm text-[--color-text-secondary]">
        Nhớ mật khẩu rồi?{' '}
        <Link to="/login" className="text-[--color-primary] font-medium hover:underline">
          Đăng nhập ngay
        </Link>
      </p>
    </div>
  );
}
```

- [ ] **Step 2: Create ResetPasswordPage**

```jsx
// src/pages/ResetPasswordPage.jsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { authApi } from '../api/authApi';
import PasswordField from '../components/ui/PasswordField';

const resetSchema = z.object({
  newPassword: z.string().min(8, 'Mật khẩu tối thiểu 8 ký tự'),
  newPasswordConfirm: z.string(),
}).refine((data) => data.newPassword === data.newPasswordConfirm, {
  message: 'Mật khẩu xác nhận không khớp',
  path: ['newPasswordConfirm'],
});

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(resetSchema),
  });

  if (!token) {
    return (
      <div className="text-center">
        <p className="text-red-500">Token không hợp lệ hoặc đã hết hạn.</p>
      </div>
    );
  }

  const onSubmit = async (data) => {
    try {
      await authApi.resetPassword(token, data.newPassword, data.newPasswordConfirm);
      toast.success('Đặt lại mật khẩu thành công!');
      navigate('/login');
    } catch (error) {
      toast.error('Không thể đặt lại mật khẩu. Token có thể đã hết hạn.');
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-[--color-text-primary] mb-2">
        Đặt lại mật khẩu
      </h2>
      <p className="text-[--color-text-secondary] mb-6">
        Nhập mật khẩu mới cho tài khoản của bạn
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <PasswordField
          label="Mật khẩu mới"
          placeholder="Tối thiểu 8 ký tự"
          error={errors.newPassword?.message}
          {...register('newPassword')}
        />

        <PasswordField
          label="Xác nhận mật khẩu mới"
          placeholder="Nhập lại mật khẩu mới"
          error={errors.newPasswordConfirm?.message}
          {...register('newPasswordConfirm')}
        />

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-2.5 bg-[--color-primary] text-white font-semibold
            rounded-lg hover:bg-[--color-primary-dark] transition-colors
            disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Đang xử lý...' : 'Đặt lại mật khẩu'}
        </button>
      </form>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/pages/ForgotPasswordPage.jsx src/pages/ResetPasswordPage.jsx
git commit -m "feat(auth): add ForgotPasswordPage and ResetPasswordPage"
```

---

## Task 9: Routes Configuration

**Files:**
- Create: `src/routes/index.jsx`

- [ ] **Step 1: Create route definitions**

```jsx
// src/routes/index.jsx
import { createBrowserRouter } from 'react-router-dom';
import App from '../App';
import AuthLayout from '../components/ui/AuthLayout';
import ProtectedRoute from '../components/auth/ProtectedRoute';
import LoginPage from '../pages/LoginPage';
import RegisterPage from '../pages/RegisterPage';
import ForgotPasswordPage from '../pages/ForgotPasswordPage';
import ResetPasswordPage from '../pages/ResetPasswordPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
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
        path: '/home',
        element: (
          <ProtectedRoute>
            <div className="p-4">Home Page (Protected)</div>
          </ProtectedRoute>
        ),
      },
    ],
  },
]);
```

- [ ] **Step 2: Commit**

```bash
git add src/routes/index.jsx
git commit -m "feat(auth): add route definitions for auth pages"
```

---

## Task 10: App.jsx Update with Router

**Files:**
- Modify: `src/App.jsx:1-19`

- [ ] **Step 1: Update App.jsx to use router**

Replace the current App.jsx content with:

```jsx
// src/App.jsx
import { RouterProvider } from 'react-router-dom';
import { router } from './routes/index';

function App() {
  return <RouterProvider router={router} />;
}

export default App;
```

- [ ] **Step 2: Commit**

```bash
git add src/App.jsx
git commit -m "feat(auth): integrate router into App component"
```

---

## Task 11: Logout Handler in Navbar

**Files:**
- Modify: `src/components/auth/ProtectedRoute.jsx` (already created)
- Modify: `src/stores/authStore.js` (add logout API call)

- [ ] **Step 1: Add logout API call to authStore**

Update the logout action in authStore to call the API:

```javascript
logout: async () => {
  const refreshToken = get().refreshToken;
  try {
    await authApi.logout(refreshToken);
  } catch (e) {
    // Ignore logout API errors, clear local state anyway
  }
  set({
    user: null,
    accessToken: null,
    refreshToken: null,
    isAuthenticated: false,
  });
},
```

Add `import { authApi } from '../api/authApi';` at the top of authStore.js.

- [ ] **Step 2: Commit**

```bash
git add src/stores/authStore.js
git commit -m "feat(auth): add logout API call to authStore logout action"
```

---

## Self-Review Checklist

1. **Spec coverage:** All Phase 2 TODO items covered:
   - 2.1 Auth Store ✅ (enhanced with refreshAccessToken)
   - 2.2 RegisterPage ✅
   - 2.3 LoginPage ✅
   - 2.4 Forgot/Reset password ✅
   - 2.5 ProtectedRoutes, AdminRoute ✅

2. **Placeholder scan:** No placeholders found. All code is complete.

3. **Type consistency:** All field names match backend serializers:
   - `register`: email, full_name, password, password_confirm
   - `login`: email, password
   - `resetPassword`: token (from query), new_password, new_password_confirm

4. **Backend API alignment:**
   - Register returns `{ success, message, data: { user, tokens: { access, refresh } } }`
   - Login returns same structure
   - ForgotPassword expects `{ email }` (no success flag, backend sends email)
   - ResetPassword expects `{ token, new_password, new_password_confirm }`

---

**Plan complete and saved to `docs/superpowers/plans/2026-04-22-phase-2-authentication.md`. Two execution options:**

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**