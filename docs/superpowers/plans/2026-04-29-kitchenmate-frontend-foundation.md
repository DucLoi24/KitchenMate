# KitchenMate Frontend - Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Xây dựng foundation hoàn chỉnh cho KitchenMate frontend: project setup, design system, UI components, layout, authentication

**Architecture:** React 18 + Vite + Tailwind CSS (custom config). Component-driven architecture với Zustand cho state management và TanStack Query cho server state. Thiết kế theo Food/Cooking theme với màu ấm cúng.

**Tech Stack:** React 18, Vite, Tailwind CSS, Framer Motion, Lenis, Zustand, TanStack Query, React Router DOM v6, Axios, React Hook Form, Zod

---

## Phase 1: Project Setup

### Task 1.1: Initialize Vite + React Project

**Files:**
- Create: `KitchenMate_Frontend/kitchenmate-frontend/package.json`
- Create: `KitchenMate_Frontend/kitchenmate-frontend/vite.config.js`
- Create: `KitchenMate_Frontend/kitchenmate-frontend/index.html`
- Create: `KitchenMate_Frontend/kitchenmate-frontend/.env.example`

- [ ] **Step 1: Create package.json**

```json
{
  "name": "kitchenmate-frontend",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "lint": "eslint .",
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:e2e": "playwright test"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.28.0",
    "@tanstack/react-query": "^5.59.0",
    "axios": "^1.7.7",
    "zustand": "^5.0.0",
    "framer-motion": "^11.11.0",
    "react-hook-form": "^7.53.0",
    "@hookform/resolvers": "^3.9.0",
    "zod": "^3.23.8",
    "clsx": "^2.1.1",
    "tailwind-merge": "^2.5.4",
    "@tanstack/react-query-devtools": "^5.59.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.3.3",
    "vite": "^5.4.10",
    "tailwindcss": "^3.4.14",
    "postcss": "^8.4.47",
    "autoprefixer": "^10.4.20",
    "eslint": "^9.13.0",
    "eslint-plugin-react": "^7.37.1",
    "eslint-plugin-react-hooks": "^5.0.0",
    "vitest": "^2.1.4",
    "@testing-library/react": "^16.0.1",
    "@testing-library/jest-dom": "^6.6.2",
    "@playwright/test": "^1.48.0",
    "jsdom": "^25.0.1"
  }
}
```

- [ ] **Step 2: Create vite.config.js**

```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
})
```

- [ ] **Step 3: Create index.html**

```html
<!DOCTYPE html>
<html lang="vi">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content="KitchenMate - Quản lý nguyên liệu và gợi ý món ăn thông minh" />
    <title>KitchenMate</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

- [ ] **Step 4: Create .env.example**

```env
VITE_API_BASE_URL=http://localhost:8000/api
VITE_GOOGLE_CLIENT_ID=your-google-client-id
```

- [ ] **Step 5: Create tailwind.config.js**

```js
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#4A7C59',
          light: '#6B9E7A',
          dark: '#3A6147',
        },
        secondary: {
          DEFAULT: '#8B5A2B',
          light: '#A67B5B',
        },
        accent: {
          DEFAULT: '#D97706',
          light: '#F59E0B',
        },
        surface: '#FFFFFF',
        background: '#FAFAF5',
        dark: {
          bg: '#1A1A1A',
          surface: '#2D2D2D',
          text: '#F3F4F6',
        },
      },
      fontFamily: {
        display: ['Playfair Display', 'serif'],
        body: ['Nunito', 'sans-serif'],
      },
      borderRadius: {
        sm: '0.375rem',
        md: '0.5rem',
        lg: '0.75rem',
        xl: '1rem',
      },
      boxShadow: {
        card: '0 2px 8px rgba(0,0,0,0.08)',
        md: '0 4px 6px rgba(0,0,0,0.07)',
        lg: '0 10px 15px rgba(0,0,0,0.1)',
      },
    },
  },
  plugins: [],
}
```

- [ ] **Step 6: Create postcss.config.js**

```js
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

- [ ] **Step 7: Install dependencies**

```bash
cd KitchenMate_Frontend/kitchenmate-frontend
npm install
```

---

### Task 1.2: Project Structure & Entry Points

**Files:**
- Create: `KitchenMate_Frontend/kitchenmate-frontend/src/main.jsx`
- Create: `KitchenMate_Frontend/kitchenmate-frontend/src/App.jsx`
- Create: `KitchenMate_Frontend/kitchenmate-frontend/src/styles/index.css`

- [ ] **Step 1: Create src/main.jsx**

```jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import App from './App'
import './styles/index.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  </React.StrictMode>
)
```

- [ ] **Step 2: Create src/styles/index.css**

```css
@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700&family=Playfair+Display:wght@400;500;600;700&display=swap');

@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  html {
    font-family: 'Nunito', sans-serif;
    scroll-behavior: smooth;
  }

  body {
    @apply bg-background text-gray-800 antialiased;
  }
}

@layer components {
  .btn {
    @apply inline-flex items-center justify-center px-4 py-2 rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed;
  }

  .btn-primary {
    @apply btn bg-primary text-white hover:bg-primary-dark focus:ring-primary;
  }

  .btn-secondary {
    @apply btn bg-secondary text-white hover:bg-secondary-light focus:ring-secondary;
  }

  .btn-ghost {
    @apply btn bg-transparent text-gray-600 hover:bg-gray-100 focus:ring-gray-300;
  }

  .btn-outline {
    @apply btn border-2 border-primary text-primary hover:bg-primary hover:text-white focus:ring-primary;
  }

  .card {
    @apply bg-white rounded-xl shadow-card p-4;
  }

  .input {
    @apply w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200;
  }

  .label {
    @apply block text-sm font-medium text-gray-700 mb-1;
  }
}

@layer utilities {
  .text-balance {
    text-wrap: balance;
  }
}
```

- [ ] **Step 3: Create src/App.jsx**

```jsx
import { Routes, Route } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import Layout from './components/layout/MainLayout'
import ProtectedRoute from './components/auth/ProtectedRoute'
import AdminRoute from './components/auth/AdminRoute'
import Spinner from './components/ui/Spinner'

// Public routes
const Landing = lazy(() => import('./pages/Landing'))
const Login = lazy(() => import('./pages/Login'))
const Register = lazy(() => import('./pages/Register'))
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'))
const RecipeDetail = lazy(() => import('./pages/RecipeDetail'))

// Protected routes
const Home = lazy(() => import('./pages/Home'))
const CookMode = lazy(() => import('./pages/CookMode'))
const CreateRecipe = lazy(() => import('./pages/CreateRecipe'))
const EditRecipe = lazy(() => import('./pages/EditRecipe'))
const MyRecipes = lazy(() => import('./pages/MyRecipes'))
const Pantry = lazy(() => import('./pages/Pantry'))
const ShoppingList = lazy(() => import('./pages/ShoppingListPage'))
const Recommendations = lazy(() => import('./pages/Recommendations'))
const Profile = lazy(() => import('./pages/Profile'))
const EditProfile = lazy(() => import('./pages/EditProfile'))
const Collections = lazy(() => import('./pages/Collections'))
const CollectionDetail = lazy(() => import('./pages/CollectionDetail'))

// Admin routes
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'))
const AdminRecipes = lazy(() => import('./pages/AdminRecipes'))
const AdminIngredients = lazy(() => import('./pages/AdminIngredients'))
const AdminUsers = lazy(() => import('./pages/AdminUsers'))

function App() {
  return (
    <Suspense fallback={<Spinner fullScreen />}>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/recipes/:id" element={<RecipeDetail />} />

        {/* Protected routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route path="/home" element={<Home />} />
            <Route path="/recipes/:id/cook" element={<CookMode />} />
            <Route path="/recipes/create" element={<CreateRecipe />} />
            <Route path="/recipes/:id/edit" element={<EditRecipe />} />
            <Route path="/my-recipes" element={<MyRecipes />} />
            <Route path="/pantry" element={<Pantry />} />
            <Route path="/shopping-list" element={<ShoppingList />} />
            <Route path="/recommendations" element={<Recommendations />} />
            <Route path="/profile/:id" element={<Profile />} />
            <Route path="/profile/edit" element={<EditProfile />} />
            <Route path="/collections" element={<Collections />} />
            <Route path="/collections/:id" element={<CollectionDetail />} />
          </Route>
        </Route>

        {/* Admin routes */}
        <Route element={<AdminRoute />}>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/recipes" element={<AdminRecipes />} />
          <Route path="/admin/ingredients" element={<AdminIngredients />} />
          <Route path="/admin/users" element={<AdminUsers />} />
        </Route>

        {/* 404 */}
        <Route path="*" element={<div className="p-8 text-center">404 - Page not found</div>} />
      </Routes>
    </Suspense>
  )
}

export default App
```

---

### Task 1.3: Axios Instance with Interceptors

**Files:**
- Create: `KitchenMate_Frontend/kitchenmate-frontend/src/api/axiosInstance.js`

- [ ] **Step 1: Create axios instance with auth interceptors**

```js
import axios from 'axios'

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor - add auth token
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor - handle token refresh
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    // If 401 and not already retrying, try to refresh token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        const refreshToken = localStorage.getItem('refreshToken')
        if (refreshToken) {
          const response = await axios.post(`${axiosInstance.defaults.baseURL}/auth/refresh/`, {
            refresh: refreshToken,
          })

          const { access } = response.data
          localStorage.setItem('accessToken', access)

          originalRequest.headers.Authorization = `Bearer ${access}`
          return axiosInstance(originalRequest)
        }
      } catch (refreshError) {
        // Refresh failed, clear tokens and redirect to login
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        window.location.href = '/login'
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  }
)

export default axiosInstance
```

---

## Phase 2: UI Components

### Task 2.1: Core UI Components (Part 1)

**Files:**
- Create: `KitchenMate_Frontend/kitchenmate-frontend/src/components/ui/Button.jsx`
- Create: `KitchenMate_Frontend/kitchenmate-frontend/src/components/ui/Spinner.jsx`
- Create: `KitchenMate_Frontend/kitchenmate-frontend/src/components/ui/Skeleton.jsx`
- Create: `KitchenMate_Frontend/kitchenmate-frontend/src/components/ui/Avatar.jsx`
- Create: `KitchenMate_Frontend/kitchenmate-frontend/src/components/ui/Badge.jsx`

- [ ] **Step 1: Create Button component**

```jsx
import { forwardRef } from 'react'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

const variants = {
  primary: 'bg-primary text-white hover:bg-primary-dark focus:ring-primary',
  secondary: 'bg-secondary text-white hover:bg-secondary-light focus:ring-secondary',
  accent: 'bg-accent text-white hover:bg-accent-light focus:ring-accent',
  ghost: 'bg-transparent text-gray-600 hover:bg-gray-100 focus:ring-gray-300',
  outline: 'border-2 border-primary text-primary hover:bg-primary hover:text-white focus:ring-primary',
  danger: 'bg-red-500 text-white hover:bg-red-600 focus:ring-red-400',
}

const sizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2',
  lg: 'px-6 py-3 text-lg',
  icon: 'p-2',
}

const Button = forwardRef(({
  children,
  variant = 'primary',
  size = 'md',
  className,
  disabled,
  loading,
  leftIcon,
  rightIcon,
  ...props
}, ref) => {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={twMerge(clsx(
        'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-200',
        'focus:outline-none focus:ring-2 focus:ring-offset-2',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        variants[variant],
        sizes[size],
        className
      ))}
      {...props}
    >
      {loading ? <Spinner size="sm" /> : leftIcon}
      {children}
      {!loading && rightIcon}
    </button>
  )
})

Button.displayName = 'Button'
export default Button
```

- [ ] **Step 2: Create Spinner component**

```jsx
import { clsx } from 'clsx'

const sizes = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
  full: 'w-full h-full',
}

export default function Spinner({ size = 'md', className, fullScreen }) {
  if (fullScreen) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm z-50">
        <Spinner size={size} />
      </div>
    )
  }

  return (
    <div
      className={clsx(
        'animate-spin rounded-full border-2 border-gray-200 border-t-primary',
        sizes[size],
        className
      )}
      role="status"
      aria-label="Loading"
    >
      <span className="sr-only">Loading...</span>
    </div>
  )
}
```

- [ ] **Step 3: Create Skeleton component**

```jsx
import { clsx } from 'clsx'

export function Skeleton({ className, ...props }) {
  return (
    <div
      className={clsx('animate-pulse bg-gray-200 rounded', className)}
      {...props}
    />
  )
}

export function RecipeCardSkeleton() {
  return (
    <div className="card overflow-hidden">
      <Skeleton className="w-full h-48 rounded-t-xl" />
      <div className="p-4 space-y-3">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <div className="flex items-center gap-2">
          <Skeleton className="w-8 h-8 rounded-full" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>
    </div>
  )
}

export function ListSkeleton({ count = 3 }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-4 bg-white rounded-lg shadow-card">
          <Skeleton className="w-12 h-12 rounded-lg" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <Skeleton className="w-20 h-8 rounded" />
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 4: Create Avatar component**

```jsx
import { clsx } from 'clsx'
import img from '../assets/default-avatar.png'

const sizes = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-16 h-16 text-lg',
  xl: 'w-24 h-24 text-xl',
}

export default function Avatar({ src, alt, size = 'md', className }) {
  const [error, setError] = React.useState(false)

  return (
    <img
      src={error ? img : src}
      alt={alt || 'Avatar'}
      onError={() => setError(true)}
      className={clsx(
        'rounded-full object-cover bg-gray-100',
        sizes[size],
        className
      )}
    />
  )
}
```

- [ ] **Step 5: Create Badge component**

```jsx
import { clsx } from 'clsx'

const variants = {
  default: 'bg-gray-100 text-gray-700',
  primary: 'bg-primary/10 text-primary',
  secondary: 'bg-secondary/10 text-secondary',
  accent: 'bg-accent/10 text-accent',
  success: 'bg-green-100 text-green-700',
  warning: 'bg-yellow-100 text-yellow-700',
  error: 'bg-red-100 text-red-700',
}

const sizes = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-sm',
}

export default function Badge({ children, variant = 'default', size = 'sm', className }) {
  return (
    <span
      className={clsx(
        'inline-flex items-center font-medium rounded-full',
        variants[variant],
        sizes[size],
        className
      )}
    >
      {children}
    </span>
  )
}
```

### Task 2.2: Core UI Components (Part 2)

**Files:**
- Create: `KitchenMate_Frontend/kitchenmate-frontend/src/components/ui/Input.jsx`
- Create: `KitchenMate_Frontend/kitchenmate-frontend/src/components/ui/Textarea.jsx`
- Create: `KitchenMate_Frontend/kitchenmate-frontend/src/components/ui/Select.jsx`
- Create: `KitchenMate_Frontend/kitchenmate-frontend/src/components/ui/Modal.jsx`
- Create: `KitchenMate_Frontend/kitchenmate-frontend/src/components/ui/BottomSheet.jsx`
- Create: `KitchenMate_Frontend/kitchenmate-frontend/src/components/ui/Toast.jsx`
- Create: `KitchenMate_Frontend/kitchenmate-frontend/src/components/ui/EmptyState.jsx`

- [ ] **Step 1: Create Input component**

```jsx
import { forwardRef } from 'react'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

const Input = forwardRef(({
  label,
  error,
  className,
  wrapperClassName,
  ...props
}, ref) => {
  return (
    <div className={twMerge(clsx('w-full', wrapperClassName))}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      <input
        ref={ref}
        className={twMerge(clsx(
          'w-full px-4 py-2.5 border rounded-lg transition-all duration-200',
          'focus:outline-none focus:ring-2 focus:border-transparent',
          error
            ? 'border-red-400 focus:ring-red-200'
            : 'border-gray-200 focus:ring-primary/20 focus:border-primary',
          'placeholder:text-gray-400',
          className
        ))}
        {...props}
      />
      {error && (
        <p className="mt-1 text-sm text-red-500">{error}</p>
      )}
    </div>
  )
})

Input.displayName = 'Input'
export default Input
```

- [ ] **Step 2: Create Textarea component**

```jsx
import { forwardRef } from 'react'
import { clsx } from 'clsx'

const Textarea = forwardRef(({
  label,
  error,
  className,
  ...props
}, ref) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        className={clsx(
          'w-full px-4 py-2.5 border rounded-lg transition-all duration-200 resize-none',
          'focus:outline-none focus:ring-2 focus:border-transparent',
          error
            ? 'border-red-400 focus:ring-red-200'
            : 'border-gray-200 focus:ring-primary/20 focus:border-primary',
          'placeholder:text-gray-400',
          className
        )}
        {...props}
      />
      {error && (
        <p className="mt-1 text-sm text-red-500">{error}</p>
      )}
    </div>
  )
})

Textarea.displayName = 'Textarea'
export default Textarea
```

- [ ] **Step 3: Create Select component**

```jsx
import { forwardRef } from 'react'
import { clsx } from 'clsx'

const Select = forwardRef(({
  label,
  error,
  options = [],
  placeholder = 'Chọn...',
  className,
  ...props
}, ref) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      <select
        ref={ref}
        className={clsx(
          'w-full px-4 py-2.5 border rounded-lg transition-all duration-200 appearance-none bg-white',
          'focus:outline-none focus:ring-2 focus:border-transparent',
          error
            ? 'border-red-400 focus:ring-red-200'
            : 'border-gray-200 focus:ring-primary/20 focus:border-primary',
          className
        )}
        {...props}
      >
        <option value="" disabled>{placeholder}</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && (
        <p className="mt-1 text-sm text-red-500">{error}</p>
      )}
    </div>
  )
})

Select.displayName = 'Select'
export default Select
```

- [ ] **Step 4: Create Modal component**

```jsx
import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { clsx } from 'clsx'
import { X } from 'lucide-react'
import Button from './Button'

const sizes = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  full: 'max-w-full mx-4',
}

export default function Modal({ isOpen, onClose, title, children, size = 'md', showClose = true }) {
  const overlayRef = useRef(null)

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = ''
    }
  }, [isOpen, onClose])

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            ref={overlayRef}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className={clsx(
              'relative w-full bg-white rounded-xl shadow-lg overflow-hidden',
              sizes[size]
            )}
          >
            {(title || showClose) && (
              <div className="flex items-center justify-between p-4 border-b">
                {title && <h2 className="text-lg font-semibold">{title}</h2>}
                {showClose && (
                  <Button variant="ghost" size="icon" onClick={onClose} className="ml-auto">
                    <X size={20} />
                  </Button>
                )}
              </div>
            )}
            <div className="p-4">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
```

- [ ] **Step 5: Create BottomSheet component**

```jsx
import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { clsx } from 'clsx'
import { X } from 'lucide-react'
import Button from './Button'

export default function BottomSheet({ isOpen, onClose, title, children, height = 'auto' }) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={clsx(
              'fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-lg',
              'max-h-[85vh] overflow-y-auto'
            )}
            style={{ height }}
          >
            <div className="sticky top-0 bg-white z-10 flex items-center justify-between p-4 border-b">
              {title && <h2 className="text-lg font-semibold">{title}</h2>}
              <Button variant="ghost" size="icon" onClick={onClose} className="ml-auto">
                <X size={20} />
              </Button>
            </div>
            <div className="p-4">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
```

- [ ] **Step 6: Create Toast component**

```jsx
import { create } from 'zustand'
import { motion, AnimatePresence } from 'framer-motion'
import { clsx } from 'clsx'
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react'

const icons = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertCircle,
  info: Info,
}

const colors = {
  success: 'bg-green-50 border-green-200 text-green-800',
  error: 'bg-red-50 border-red-200 text-red-800',
  warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
  info: 'bg-blue-50 border-blue-200 text-blue-800',
}

const useToastStore = create((set) => ({
  toasts: [],
  add: (toast) => set((state) => ({
    toasts: [...state.toasts, { id: Date.now(), ...toast }],
  })),
  remove: (id) => set((state) => ({
    toasts: state.toasts.filter((t) => t.id !== id),
  })),
}))

export function ToastContainer() {
  const { toasts, remove } = useToastStore()

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => {
          const Icon = icons[toast.type] || Info
          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              className={clsx(
                'pointer-events-auto flex items-center gap-3 p-4 rounded-lg border shadow-lg',
                colors[toast.type] || colors.info
              )}
            >
              <Icon size={20} className="shrink-0" />
              <p className="flex-1 text-sm font-medium">{toast.message}</p>
              <button onClick={() => remove(toast.id)} className="shrink-0">
                <X size={16} />
              </button>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}

export const toast = {
  success: (message) => useToastStore.getState().add({ message, type: 'success' }),
  error: (message) => useToastStore.getState().add({ message, type: 'error' }),
  warning: (message) => useToastStore.getState().add({ message, type: 'warning' }),
  info: (message) => useToastStore.getState().add({ message, type: 'info' }),
}
```

- [ ] **Step 7: Create EmptyState component**

```jsx
import { clsx } from 'clsx'
import Button from './Button'

export default function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  actionLabel,
  className,
}) {
  return (
    <div className={clsx('flex flex-col items-center justify-center py-12 px-4 text-center', className)}>
      {Icon && (
        <div className="w-16 h-16 mb-4 rounded-full bg-gray-100 flex items-center justify-center">
          <Icon size={32} className="text-gray-400" />
        </div>
      )}
      <h3 className="text-lg font-semibold text-gray-800 mb-2">{title}</h3>
      {description && (
        <p className="text-gray-500 mb-4 max-w-sm">{description}</p>
      )}
      {action && actionLabel && (
        <Button onClick={action}>{actionLabel}</Button>
      )}
    </div>
  )
}
```

---

## Phase 3: Layout Components

### Task 3.1: Main Layout & Navigation

**Files:**
- Create: `KitchenMate_Frontend/kitchenmate-frontend/src/components/layout/MainLayout.jsx`
- Create: `KitchenMate_Frontend/kitchenmate-frontend/src/components/layout/BottomNav.jsx`
- Create: `KitchenMate_Frontend/kitchenmate-frontend/src/components/layout/Navbar.jsx`

- [ ] **Step 1: Create BottomNav component**

```jsx
import { NavLink, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Home, Refrigerator, Plus, FolderHeart, User } from 'lucide-react'
import { clsx } from 'clsx'

const navItems = [
  { to: '/home', icon: Home, label: 'Trang chủ' },
  { to: '/pantry', icon: Refrigerator, label: 'Tủ lạnh' },
  { to: '/recipes/create', icon: Plus, label: 'Tạo', isCreate: true },
  { to: '/collections', icon: FolderHeart, label: 'Bộ sưu tập' },
  { to: '/profile/edit', icon: User, label: 'Tôi' },
]

export default function BottomNav() {
  const location = useLocation()

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 md:hidden z-40">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.to
          const Icon = item.icon

          if (item.isCreate) {
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className="flex items-center justify-center w-12 h-12 -mt-4 rounded-full bg-primary text-white shadow-lg"
              >
                <Icon size={24} />
              </NavLink>
            )
          }

          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={clsx(
                'flex flex-col items-center justify-center gap-1 flex-1 h-full transition-colors',
                isActive ? 'text-primary' : 'text-gray-400 hover:text-gray-600'
              )}
            >
              <Icon size={22} />
              <span className="text-xs font-medium">{item.label}</span>
              {isActive && (
                <motion.div
                  layoutId="bottomNavIndicator"
                  className="absolute bottom-1 w-8 h-1 bg-primary rounded-full"
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}
            </NavLink>
          )
        })}
      </div>
    </nav>
  )
}
```

- [ ] **Step 2: Create Navbar component**

```jsx
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Search, Bell, Menu, X, LogOut, Settings, User } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuthStore } from '../../stores/authStore'
import Avatar from '../ui/Avatar'
import Button from '../ui/Button'

export default function Navbar() {
  const [searchQuery, setSearchQuery] = useState('')
  const [showUserMenu, setShowUserMenu] = useState(false)
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/home?search=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-gray-100">
      <div className="flex items-center justify-between h-16 px-4">
        {/* Logo */}
        <Link to="/home" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-white font-bold text-lg">K</span>
          </div>
          <span className="font-display text-xl font-semibold text-primary hidden sm:block">
            KitchenMate
          </span>
        </Link>

        {/* Search */}
        <form onSubmit={handleSearch} className="flex-1 max-w-md mx-4 hidden md:block">
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm công thức..."
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>
        </form>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {/* Mobile search */}
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => navigate('/home')}>
            <Search size={20} />
          </Button>

          {/* Notifications */}
          {user && (
            <Button variant="ghost" size="icon" className="relative">
              <Bell size={20} />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
            </Button>
          )}

          {/* User menu */}
          {user ? (
            <div className="relative">
              <button onClick={() => setShowUserMenu(!showUserMenu)}>
                <Avatar src={user.avatar_url} size="sm" />
              </button>

              <AnimatePresence>
                {showUserMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden"
                  >
                    <div className="p-3 border-b border-gray-100">
                      <p className="font-medium">{user.full_name}</p>
                      <p className="text-sm text-gray-500">{user.email}</p>
                    </div>
                    <div className="py-2">
                      <Link
                        to="/profile/edit"
                        className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 transition-colors"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <Settings size={18} />
                        <span>Cài đặt</span>
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-2 text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <LogOut size={18} />
                        <span>Đăng xuất</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => navigate('/login')}>
                Đăng nhập
              </Button>
              <Button size="sm" onClick={() => navigate('/register')}>
                Đăng ký
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
```

- [ ] **Step 3: Create MainLayout component**

```jsx
import { Outlet } from 'react-router-dom'
import BottomNav from './BottomNav'
import Navbar from './Navbar'
import { ToastContainer } from '../ui/Toast'

export default function MainLayout() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pb-20 md:pb-8">
        <Outlet />
      </main>
      <BottomNav />
      <ToastContainer />
    </div>
  )
}
```

---

## Phase 4: Authentication

### Task 4.1: Auth Store & API

**Files:**
- Create: `KitchenMate_Frontend/kitchenmate-frontend/src/stores/authStore.js`
- Create: `KitchenMate_Frontend/kitchenmate-frontend/src/api/authApi.js`
- Create: `KitchenMate_Frontend/kitchenmate-frontend/src/components/auth/ProtectedRoute.jsx`
- Create: `KitchenMate_Frontend/kitchenmate-frontend/src/components/auth/AdminRoute.jsx`

- [ ] **Step 1: Create authStore**

```js
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import axiosInstance from '../api/axiosInstance'
import authApi from '../api/authApi'

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,

      setUser: (user) => set({ user, isAuthenticated: !!user }),

      login: async (email, password) => {
        set({ isLoading: true })
        try {
          const response = await authApi.login(email, password)
          const { access, refresh, user } = response.data
          localStorage.setItem('accessToken', access)
          localStorage.setItem('refreshToken', refresh)
          set({
            user,
            accessToken: access,
            refreshToken: refresh,
            isAuthenticated: true,
            isLoading: false,
          })
          return { success: true }
        } catch (error) {
          set({ isLoading: false })
          return {
            success: false,
            error: error.response?.data?.error?.message || 'Đăng nhập thất bại',
          }
        }
      },

      register: async (data) => {
        set({ isLoading: true })
        try {
          await authApi.register(data)
          set({ isLoading: false })
          return { success: true }
        } catch (error) {
          set({ isLoading: false })
          return {
            success: false,
            error: error.response?.data?.error?.message || 'Đăng ký thất bại',
          }
        }
      },

      logout: () => {
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
        })
      },

      refreshToken: async () => {
        const refreshToken = get().refreshToken
        if (!refreshToken) return false

        try {
          const response = await axiosInstance.post('/auth/refresh/', {
            refresh: refreshToken,
          })
          const { access } = response.data
          localStorage.setItem('accessToken', access)
          set({ accessToken: access })
          return true
        } catch (error) {
          get().logout()
          return false
        }
      },

      updateProfile: async (data) => {
        try {
          const response = await authApi.updateProfile(data)
          set({ user: response.data })
          return { success: true }
        } catch (error) {
          return {
            success: false,
            error: error.response?.data?.error?.message || 'Cập nhật thất bại',
          }
        }
      },

      fetchUser: async () => {
        try {
          const response = await authApi.getProfile()
          set({ user: response.data })
        } catch (error) {
          get().logout()
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)

export default useAuthStore
```

- [ ] **Step 2: Create authApi**

```js
import axiosInstance from './axiosInstance'

const authApi = {
  login: (email, password) =>
    axiosInstance.post('/auth/login/', { email, password }),

  register: (data) =>
    axiosInstance.post('/auth/register/', data),

  logout: (refreshToken) =>
    axiosInstance.post('/auth/logout/', { refresh }),

  refreshToken: (refresh) =>
    axiosInstance.post('/auth/refresh/', { refresh }),

  forgotPassword: (email) =>
    axiosInstance.post('/auth/forgot-password/', { email }),

  resetPassword: (data) =>
    axiosInstance.post('/auth/reset-password/', data),

  getProfile: () =>
    axiosInstance.get('/accounts/profile/'),

  updateProfile: (data) =>
    axiosInstance.put('/accounts/profile/', data),

  uploadAvatar: (formData) =>
    axiosInstance.post('/accounts/avatar/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
}

export default authApi
```

- [ ] **Step 3: Create ProtectedRoute component**

```jsx
import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'
import Spinner from '../ui/Spinner'

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuthStore()
  const location = useLocation()

  if (isLoading) {
    return <Spinner fullScreen />
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return children
}
```

- [ ] **Step 4: Create AdminRoute component**

```jsx
import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'
import MainLayout from '../layout/MainLayout'
import Spinner from '../ui/Spinner'

export default function AdminRoute({ children }) {
  const { user, isAuthenticated, isLoading } = useAuthStore()

  if (isLoading) {
    return <Spinner fullScreen />
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (!user?.is_staff) {
    return <Navigate to="/home" replace />
  }

  return (
    <MainLayout>
      {children}
    </MainLayout>
  )
}
```

### Task 4.2: Auth Pages

**Files:**
- Create: `KitchenMate_Frontend/kitchenmate-frontend/src/pages/Login.jsx`
- Create: `KitchenMate_Frontend/kitchenmate-frontend/src/pages/Register.jsx`
- Create: `KitchenMate_Frontend/kitchenmate-frontend/src/pages/ForgotPassword.jsx`

- [ ] **Step 1: Create Login page**

```jsx
import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { Mail, Lock, Eye, EyeOff } from 'lucide-react'
import { useAuthStore } from '../stores/authStore'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import { toast } from '../components/ui/Toast'

const loginSchema = z.object({
  email: z.string().email('Email không hợp lệ'),
  password: z.string().min(6, 'Mật khẩu ít nhất 6 ký tự'),
})

export default function Login() {
  const [showPassword, setShowPassword] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const { login, isLoading } = useAuthStore()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data) => {
    const result = await login(data.email, data.password)
    if (result.success) {
      toast.success('Đăng nhập thành công!')
      const from = location.state?.from?.pathname || '/home'
      navigate(from, { replace: true })
    } else {
      toast.error(result.error)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-primary mx-auto mb-4 flex items-center justify-center">
            <span className="text-white font-bold text-3xl">K</span>
          </div>
          <h1 className="text-2xl font-display font-bold text-gray-800">Chào mừng bạn!</h1>
          <p className="text-gray-500 mt-2">Đăng nhập để tiếp tục với KitchenMate</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="card space-y-4">
          <div className="relative">
            <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input
              {...register('email')}
              type="email"
              placeholder="Email"
              className="pl-10"
              error={errors.email?.message}
            />
          </div>

          <div className="relative">
            <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input
              {...register('password')}
              type={showPassword ? 'text' : 'password'}
              placeholder="Mật khẩu"
              className="pl-10 pr-10"
              error={errors.password?.message}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <div className="text-right">
            <Link to="/forgot-password" className="text-sm text-primary hover:underline">
              Quên mật khẩu?
            </Link>
          </div>

          <Button type="submit" className="w-full" loading={isLoading}>
            Đăng nhập
          </Button>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center">
              <span className="px-4 bg-white text-sm text-gray-500">hoặc</span>
            </div>
          </div>

          <Button variant="outline" type="button" className="w-full">
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Đăng nhập với Google
          </Button>

          <p className="text-center text-sm text-gray-500 mt-4">
            Chưa có tài khoản?{' '}
            <Link to="/register" className="text-primary font-medium hover:underline">
              Đăng ký ngay
            </Link>
          </p>
        </form>
      </motion.div>
    </div>
  )
}
```

- [ ] **Step 2: Create Register page**

```jsx
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { Mail, Lock, Eye, EyeOff, User } from 'lucide-react'
import { useAuthStore } from '../stores/authStore'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import { toast } from '../components/ui/Toast'

const registerSchema = z.object({
  username: z.string().min(3, 'Tên người dùng ít nhất 3 ký tự'),
  email: z.string().email('Email không hợp lệ'),
  password: z.string().min(6, 'Mật khẩu ít nhất 6 ký tự'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Mật khẩu không khớp',
  path: ['confirmPassword'],
})

export default function Register() {
  const [showPassword, setShowPassword] = useState(false)
  const navigate = useNavigate()
  const { register: registerUser, isLoading } = useAuthStore()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(registerSchema),
  })

  const onSubmit = async (data) => {
    const result = await registerUser({
      username: data.username,
      email: data.email,
      password: data.password,
    })
    if (result.success) {
      toast.success('Đăng ký thành công! Vui lòng đăng nhập.')
      navigate('/login')
    } else {
      toast.error(result.error)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-primary mx-auto mb-4 flex items-center justify-center">
            <span className="text-white font-bold text-3xl">K</span>
          </div>
          <h1 className="text-2xl font-display font-bold text-gray-800">Tạo tài khoản mới</h1>
          <p className="text-gray-500 mt-2">Tham gia cùng KitchenMate</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="card space-y-4">
          <div className="relative">
            <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input
              {...register('username')}
              placeholder="Tên người dùng"
              className="pl-10"
              error={errors.username?.message}
            />
          </div>

          <div className="relative">
            <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input
              {...register('email')}
              type="email"
              placeholder="Email"
              className="pl-10"
              error={errors.email?.message}
            />
          </div>

          <div className="relative">
            <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input
              {...register('password')}
              type={showPassword ? 'text' : 'password'}
              placeholder="Mật khẩu"
              className="pl-10 pr-10"
              error={errors.password?.message}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <div className="relative">
            <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input
              {...register('confirmPassword')}
              type={showPassword ? 'text' : 'password'}
              placeholder="Xác nhận mật khẩu"
              className="pl-10"
              error={errors.confirmPassword?.message}
            />
          </div>

          <Button type="submit" className="w-full" loading={isLoading}>
            Đăng ký
          </Button>

          <p className="text-center text-sm text-gray-500 mt-4">
            Đã có tài khoản?{' '}
            <Link to="/login" className="text-primary font-medium hover:underline">
              Đăng nhập
            </Link>
          </p>
        </form>
      </motion.div>
    </div>
  )
}
```

- [ ] **Step 3: Create ForgotPassword page**

```jsx
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { Mail, ArrowLeft } from 'lucide-react'
import authApi from '../api/authApi'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import { toast } from '../components/ui/Toast'

const forgotSchema = z.object({
  email: z.string().email('Email không hợp lệ'),
})

export default function ForgotPassword() {
  const [sent, setSent] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(forgotSchema),
  })

  const onSubmit = async (data) => {
    try {
      await authApi.forgotPassword(data.email)
      setSent(true)
      toast.success('Đã gửi hướng dẫn đặt lại mật khẩu đến email của bạn')
    } catch (error) {
      toast.error('Đã xảy ra lỗi. Vui lòng thử lại.')
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <Link
          to="/login"
          className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-6"
        >
          <ArrowLeft size={18} />
          Quay lại đăng nhập
        </Link>

        <div className="card">
          <h1 className="text-xl font-semibold mb-2">Quên mật khẩu?</h1>
          <p className="text-gray-500 mb-6">
            {sent
              ? 'Kiểm tra email để đặt lại mật khẩu'
              : 'Nhập email để nhận hướng dẫn đặt lại mật khẩu'}
          </p>

          {!sent ? (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="relative">
                <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <Input
                  {...register('email')}
                  type="email"
                  placeholder="Email"
                  className="pl-10"
                  error={errors.email?.message}
                />
              </div>

              <Button type="submit" className="w-full" loading={isSubmitting}>
                Gửi yêu cầu
              </Button>
            </form>
          ) : (
            <div className="text-center py-4">
              <div className="w-16 h-16 rounded-full bg-green-100 mx-auto mb-4 flex items-center justify-center">
                <Mail size={32} className="text-green-600" />
              </div>
              <p className="text-gray-600">
                Email đã được gửi. Vui lòng kiểm tra hộp thư của bạn.
              </p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}
```

---

## Phase 5: Landing Page

### Task 5.1: Landing Page

**Files:**
- Create: `KitchenMate_Frontend/kitchenmate-frontend/src/pages/Landing.jsx`
- Create: `KitchenMate_Frontend/kitchenmate-frontend/src/assets/hero.png`

- [ ] **Step 1: Create Landing page**

```jsx
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Search, Refrigerator, ChefHat, ShoppingCart, Star, ArrowRight } from 'lucide-react'
import Button from '../components/ui/Button'

const features = [
  {
    icon: Refrigerator,
    title: 'Tủ lạnh thông minh',
    description: 'Quản lý nguyên liệu hiện có, luôn biết bạn đang có gì trong bếp',
  },
  {
    icon: Search,
    title: 'Gợi ý món ăn',
    description: 'Nhận gợi ý công thức phù hợp với những gì bạn có sẵn',
  },
  {
    icon: ChefHat,
    title: 'Chia sẻ công thức',
    description: 'Lưu giữ và chia sẻ công thức nấu ăn với cộng đồng',
  },
  {
    icon: ShoppingCart,
    title: 'Danh sách đi chợ',
    description: 'Tự động tạo danh sách mua sắm, đồng bộ với tủ lạnh',
  },
]

const stats = [
  { value: '10,000+', label: 'Công thức' },
  { value: '50,000+', label: 'Người dùng' },
  { value: '4.8', label: 'Đánh giá trung bình' },
]

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-sm border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-white font-bold text-lg">K</span>
            </div>
            <span className="font-display text-xl font-semibold text-primary">
              KitchenMate
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login">
              <Button variant="ghost" size="sm">Đăng nhập</Button>
            </Link>
            <Link to="/register">
              <Button size="sm">Bắt đầu ngay</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-gray-800 leading-tight mb-6">
                Hôm nay ăn gì?
                <span className="text-primary block mt-2">KitchenMate biết!</span>
              </h1>
              <p className="text-lg text-gray-600 mb-8">
                Ứng dụng quản lý nguyên liệu và gợi ý món ăn thông minh.
                Tận dụng tối đa những gì bạn có, nấu những gì bạn thích.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link to="/register">
                  <Button size="lg" rightIcon={<ArrowRight size={20} />}>
                    Bắt đầu miễn phí
                  </Button>
                </Link>
                <Link to="/home">
                  <Button variant="outline" size="lg">
                    Khám phá công thức
                  </Button>
                </Link>
              </div>

              {/* Stats */}
              <div className="flex gap-8 mt-12">
                {stats.map((stat) => (
                  <div key={stat.label}>
                    <div className="text-2xl font-bold text-primary">{stat.value}</div>
                    <div className="text-sm text-gray-500">{stat.label}</div>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative"
            >
              <div className="relative z-10">
                <img
                  src="/hero.png"
                  alt="KitchenMate Hero"
                  className="w-full rounded-2xl shadow-2xl"
                  onError={(e) => {
                    e.target.style.display = 'none'
                  }}
                />
              </div>
              <div className="absolute -bottom-4 -right-4 w-full h-full bg-primary/10 rounded-2xl -z-0" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-display font-bold text-gray-800 mb-4">
              Tại sao chọn KitchenMate?
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Giải pháp toàn diện cho việc quản lý bếp và tìm kiếm công thức nấu ăn
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="card hover:shadow-lg transition-shadow"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <feature.icon size={24} className="text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-600 text-sm">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-primary">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-display font-bold text-white mb-4">
              Sẵn sàng bắt đầu?
            </h2>
            <p className="text-white/80 mb-8 max-w-2xl mx-auto">
              Tham gia cùng hàng nghìn người nội trợ đang sử dụng KitchenMate
              để quản lý bếp hiệu quả hơn
            </p>
            <Link to="/register">
              <Button
                size="lg"
                className="bg-white text-primary hover:bg-gray-100"
                rightIcon={<ArrowRight size={20} />}
              >
                Đăng ký miễn phí
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-gray-100">
        <div className="max-w-6xl mx-auto px-4 text-center text-gray-500 text-sm">
          <p>© 2024 KitchenMate. Xây dựng với ❤️ cho những người yêu nấu ăn.</p>
        </div>
      </footer>
    </div>
  )
}
```

---

## Phase 6: Recipe Components

### Task 6.1: RecipeCard Component

**Files:**
- Create: `KitchenMate_Frontend/kitchenmate-frontend/src/components/recipe/RecipeCard.jsx`
- Create: `KitchenMate_Frontend/kitchenmate-frontend/src/components/recipe/RecipeCardSkeleton.jsx`

- [ ] **Step 1: Create RecipeCard component**

```jsx
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Clock, ChefHat, Star } from 'lucide-react'
import Avatar from '../ui/Avatar'
import Badge from '../ui/Badge'

const difficultyColors = {
  EASY: 'success',
  MEDIUM: 'warning',
  HARD: 'error',
}

export default function RecipeCard({ recipe, index = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Link to={`/recipes/${recipe.id}`}>
        <article className="card overflow-hidden hover:shadow-lg transition-all duration-300 group">
          {/* Thumbnail */}
          <div className="relative aspect-[4/3] overflow-hidden rounded-t-xl">
            <img
              src={recipe.thumbnail_url || '/placeholder-recipe.jpg'}
              alt={recipe.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
              onError={(e) => {
                e.target.src = '/placeholder-recipe.jpg'
              }}
            />
            <div className="absolute top-3 right-3">
              <Badge variant={difficultyColors[recipe.difficulty]} size="sm">
                {recipe.difficulty === 'EASY' ? 'Dễ' : recipe.difficulty === 'MEDIUM' ? 'Trung bình' : 'Khó'}
              </Badge>
            </div>
          </div>

          {/* Content */}
          <div className="p-4">
            <h3 className="font-semibold text-gray-800 mb-2 line-clamp-2 group-hover:text-primary transition-colors">
              {recipe.title}
            </h3>

            <p className="text-sm text-gray-500 mb-3 line-clamp-2">
              {recipe.description}
            </p>

            {/* Meta */}
            <div className="flex items-center justify-between text-sm text-gray-500">
              <div className="flex items-center gap-1">
                <Clock size={14} />
                <span>{recipe.prep_time || 30} phút</span>
              </div>
              {recipe.avg_rating && (
                <div className="flex items-center gap-1">
                  <Star size={14} className="text-yellow-400 fill-yellow-400" />
                  <span>{recipe.avg_rating.toFixed(1)}</span>
                </div>
              )}
            </div>

            {/* Author */}
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
              <Avatar
                src={recipe.user?.avatar_url}
                size="sm"
              />
              <span className="text-sm text-gray-600">{recipe.user?.full_name || recipe.user_name}</span>
            </div>
          </div>
        </article>
      </Link>
    </motion.div>
  )
}
```

- [ ] **Step 2: Create RecipeCardSkeleton (reuse from Skeleton component)**

```jsx
// Already created in Task 2.1 as RecipeCardSkeleton function
// Just export it from the Skeleton file
export { RecipeCardSkeleton } from '../ui/Skeleton'
```

---

## Phase 7: Home Page

### Task 7.1: Home Page with Recipe Feed

**Files:**
- Create: `KitchenMate_Frontend/kitchenmate-frontend/src/pages/Home.jsx`
- Create: `KitchenMate_Frontend/kitchenmate-frontend/src/api/recipeApi.js`

- [ ] **Step 1: Create recipeApi**

```js
import axiosInstance from './axiosInstance'

const recipeApi = {
  getRecipes: (params) =>
    axiosInstance.get('/recipes/', { params }),

  getRecipe: (id) =>
    axiosInstance.get(`/recipes/${id}/`),

  getMyRecipes: (params) =>
    axiosInstance.get('/recipes/my-recipes/', { params }),

  getRecipeStats: (id) =>
    axiosInstance.get(`/recipes/${id}/stats/`),

  createRecipe: (data) =>
    axiosInstance.post('/recipes/', data),

  updateRecipe: (id, data) =>
    axiosInstance.put(`/recipes/${id}/`, data),

  partialUpdateRecipe: (id, data) =>
    axiosInstance.patch(`/recipes/${id}/`, data),

  deleteRecipe: (id) =>
    axiosInstance.delete(`/recipes/${id}/`),

  publishRecipe: (id) =>
    axiosInstance.post(`/recipes/${id}/publish/`),
}

export default recipeApi
```

- [ ] **Step 2: Create Home page**

```jsx
import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Search, Filter, X } from 'lucide-react'
import recipeApi from '../api/recipeApi'
import RecipeCard from '../components/recipe/RecipeCard'
import { RecipeCardSkeleton } from '../components/ui/Skeleton'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import BottomSheet from '../components/ui/BottomSheet'
import EmptyState from '../components/ui/EmptyState'

const difficultyOptions = [
  { value: '', label: 'Tất cả' },
  { value: 'EASY', label: 'Dễ' },
  { value: 'MEDIUM', label: 'Trung bình' },
  { value: 'HARD', label: 'Khó' },
]

export default function Home() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [showFilters, setShowFilters] = useState(false)

  const search = searchParams.get('search') || ''
  const difficulty = searchParams.get('difficulty') || ''

  const { data, isLoading, error } = useQuery({
    queryKey: ['recipes', { search, difficulty }],
    queryFn: () => recipeApi.getRecipes({
      ...(search && { search }),
      ...(difficulty && { difficulty }),
    }),
  })

  const recipes = data?.data?.results || []

  const updateFilter = (key, value) => {
    const newParams = new URLSearchParams(searchParams)
    if (value) {
      newParams.set(key, value)
    } else {
      newParams.delete(key)
    }
    setSearchParams(newParams)
  }

  const clearFilters = () => {
    setSearchParams({})
  }

  const hasFilters = search || difficulty

  return (
    <div className="min-h-screen">
      {/* Search & Filter Header */}
      <div className="sticky top-16 z-30 bg-white border-b border-gray-100 p-4">
        <div className="max-w-6xl mx-auto space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => updateFilter('search', e.target.value)}
              placeholder="Tìm kiếm công thức..."
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>

          {/* Filter Bar */}
          <div className="flex items-center justify-between">
            <div className="flex gap-2 overflow-x-auto pb-2">
              {difficultyOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => updateFilter('difficulty', opt.value)}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                    difficulty === opt.value
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowFilters(true)}
              className="shrink-0"
            >
              <Filter size={18} />
            </Button>
          </div>

          {/* Active filters */}
          {hasFilters && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm text-gray-500">Kết quả:</span>
              {search && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">
                  "{search}"
                  <X
                    size={14}
                    className="cursor-pointer"
                    onClick={() => updateFilter('search', '')}
                  />
                </span>
              )}
              {difficulty && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">
                  {difficultyOptions.find((o) => o.value === difficulty)?.label}
                  <X
                    size={14}
                    className="cursor-pointer"
                    onClick={() => updateFilter('difficulty', '')}
                  />
                </span>
              )}
              <button
                onClick={clearFilters}
                className="text-sm text-gray-500 hover:text-gray-700 underline"
              >
                Xóa tất cả
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Recipe Grid */}
      <div className="max-w-6xl mx-auto p-4">
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <RecipeCardSkeleton key={i} />
            ))}
          </div>
        ) : error ? (
          <EmptyState
            title="Đã xảy ra lỗi"
            description="Không thể tải công thức. Vui lòng thử lại."
            action={() => window.location.reload()}
            actionLabel="Tải lại"
          />
        ) : recipes.length === 0 ? (
          <EmptyState
            title="Không tìm thấy công thức"
            description={hasFilters ? 'Thử thay đổi bộ lọc để xem thêm kết quả.' : 'Hãy là người đầu tiên tạo công thức!'}
            action={hasFilters ? clearFilters : undefined}
            actionLabel={hasFilters ? 'Xóa bộ lọc' : undefined}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {recipes.map((recipe, index) => (
              <RecipeCard key={recipe.id} recipe={recipe} index={index} />
            ))}
          </div>
        )}
      </div>

      {/* Filter Bottom Sheet (Mobile) */}
      <BottomSheet
        isOpen={showFilters}
        onClose={() => setShowFilters(false)}
        title="Bộ lọc"
      >
        <div className="space-y-4">
          <div>
            <label className="label">Độ khó</label>
            <div className="grid grid-cols-3 gap-2">
              {difficultyOptions.slice(1).map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => {
                    updateFilter('difficulty', opt.value)
                    setShowFilters(false)
                  }}
                  className={`p-3 rounded-lg border text-center transition-colors ${
                    difficulty === opt.value
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </BottomSheet>
    </div>
  )
}
```

---

## Phase 8: Recipe Detail & Cook Mode

### Task 8.1: Recipe Detail Page

**Files:**
- Create: `KitchenMate_Frontend/kitchenmate-frontend/src/pages/RecipeDetail.jsx`
- Create: `KitchenMate_Frontend/kitchenmate-frontend/src/components/recipe/StarRating.jsx`

- [ ] **Step 1: Create StarRating component**

```jsx
import { useState } from 'react'
import { clsx } from 'clsx'
import { Star } from 'lucide-react'

export default function StarRating({
  value = 0,
  onChange,
  max = 5,
  size = 20,
  readonly = false,
  className,
}) {
  const [hoverValue, setHoverValue] = useState(0)

  const displayValue = hoverValue || value

  return (
    <div
      className={clsx('flex items-center gap-1', className)}
      onMouseLeave={() => setHoverValue(0)}
    >
      {Array.from({ length: max }).map((_, index) => {
        const starValue = index + 1
        const filled = starValue <= displayValue

        return (
          <button
            key={index}
            type="button"
            disabled={readonly}
            onClick={() => !readonly && onChange?.(starValue)}
            onMouseEnter={() => !readonly && setHoverValue(starValue)}
            className={clsx(
              'transition-colors',
              readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110'
            )}
          >
            <Star
              size={size}
              className={clsx(
                filled ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
              )}
            />
          </button>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 2: Create RecipeDetail page**

```jsx
import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Clock, ChefHat, Users, Play, Heart, Share2, ShoppingCart, ArrowLeft } from 'lucide-react'
import recipeApi from '../api/recipeApi'
import collectionApi from '../api/collectionApi'
import { useAuthStore } from '../stores/authStore'
import Avatar from '../components/ui/Avatar'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import { toast } from '../components/ui/Toast'
import Spinner from '../components/ui/Spinner'

const difficultyLabels = {
  EASY: 'Dễ',
  MEDIUM: 'Trung bình',
  HARD: 'Khó',
}

export default function RecipeDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { isAuthenticated } = useAuthStore()
  const [showAllSteps, setShowAllSteps] = useState(false)

  const { data, isLoading, error } = useQuery({
    queryKey: ['recipe', id],
    queryFn: () => recipeApi.getRecipe(id),
    enabled: !!id,
  })

  const recipe = data?.data

  if (isLoading) return <Spinner fullScreen />
  if (error || !recipe) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Không tìm thấy công thức</h2>
          <Button onClick={() => navigate('/home')}>Quay lại trang chủ</Button>
        </div>
      </div>
    )
  }

  const visibleSteps = showAllSteps ? recipe.steps : recipe.steps?.slice(0, 3)
  const hasMoreSteps = recipe.steps?.length > 3

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Image */}
      <div className="relative h-64 md:h-80 lg:h-96">
        <img
          src={recipe.thumbnail_url || '/placeholder-recipe.jpg'}
          alt={recipe.title}
          className="w-full h-full object-cover"
          onError={(e) => { e.target.src = '/placeholder-recipe.jpg' }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

        {/* Back button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 left-4 bg-white/80 backdrop-blur-sm"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft size={20} />
        </Button>

        {/* Actions */}
        <div className="absolute top-4 right-4 flex gap-2">
          {isAuthenticated && (
            <>
              <Button variant="ghost" size="icon" className="bg-white/80 backdrop-blur-sm">
                <Heart size={20} />
              </Button>
              <Button variant="ghost" size="icon" className="bg-white/80 backdrop-blur-sm">
                <Share2 size={20} />
              </Button>
            </>
          )}
        </div>

        {/* Title overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
          <div className="max-w-4xl mx-auto">
            <Badge variant="warning" className="mb-2">
              {difficultyLabels[recipe.difficulty]}
            </Badge>
            <h1 className="text-2xl md:text-3xl font-display font-bold mb-2">
              {recipe.title}
            </h1>
            <div className="flex items-center gap-4 text-white/80">
              <div className="flex items-center gap-2">
                <Avatar src={recipe.user?.avatar_url} size="sm" />
                <span>{recipe.user?.full_name}</span>
              </div>
              {recipe.avg_rating && (
                <div className="flex items-center gap-1">
                  <span className="text-yellow-400">★</span>
                  <span>{recipe.avg_rating.toFixed(1)}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Meta info */}
        <div className="flex items-center gap-6 mb-6 p-4 bg-white rounded-xl shadow-card">
          <div className="flex items-center gap-2">
            <Clock size={20} className="text-gray-400" />
            <div>
              <div className="text-sm text-gray-500">Thời gian</div>
              <div className="font-medium">{recipe.prep_time || 30} phút</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ChefHat size={20} className="text-gray-400" />
            <div>
              <div className="text-sm text-gray-500">Độ khó</div>
              <div className="font-medium">{difficultyLabels[recipe.difficulty]}</div>
            </div>
          </div>
          {recipe.view_count !== undefined && (
            <div className="flex items-center gap-2">
              <Users size={20} className="text-gray-400" />
              <div>
                <div className="text-sm text-gray-500">Lượt xem</div>
                <div className="font-medium">{recipe.view_count}</div>
              </div>
            </div>
          )}
        </div>

        {/* Description */}
        {recipe.description && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-2">Mô tả</h2>
            <p className="text-gray-600">{recipe.description}</p>
          </div>
        )}

        {/* Ingredients */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">Nguyên liệu</h2>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/recipes/${id}/cook`)}
              leftIcon={<ShoppingCart size={16} />}
            >
              Mua nguyên liệu
            </Button>
          </div>
          <ul className="bg-white rounded-xl shadow-card divide-y divide-gray-100">
            {recipe.recipe_ingredients?.map((item) => (
              <li key={item.id} className="p-4 flex items-center justify-between">
                <span className="text-gray-800">{item.ingredient_name}</span>
                <span className="text-gray-500">
                  {item.quantity} {item.unit}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Steps */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-3">Các bước thực hiện</h2>
          <div className="space-y-4">
            {visibleSteps?.map((step, index) => (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-xl shadow-card p-4"
              >
                <div className="flex gap-4">
                  <div className="shrink-0 w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-semibold">
                    {step.step_number}
                  </div>
                  <div className="flex-1">
                    <p className="text-gray-800">{step.instruction}</p>
                    {step.media_url && (
                      <img
                        src={step.media_url}
                        alt={`Bước ${step.step_number}`}
                        className="mt-3 rounded-lg w-full max-h-64 object-cover"
                        loading="lazy"
                      />
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
          {hasMoreSteps && !showAllSteps && (
            <Button
              variant="ghost"
              className="w-full mt-4"
              onClick={() => setShowAllSteps(true)}
            >
              Xem tất cả {recipe.steps.length} bước
            </Button>
          )}
        </div>

        {/* Cook Mode CTA */}
        <div className="fixed bottom-20 left-4 right-4 md:static md:mt-6">
          <Button
            size="lg"
            className="w-full md:w-auto"
            leftIcon={<Play size={20} />}
            onClick={() => navigate(`/recipes/${id}/cook`)}
          >
            Bắt đầu nấu
          </Button>
        </div>
      </div>
    </div>
  )
}
```

### Task 8.2: Cook Mode Page

**Files:**
- Create: `KitchenMate_Frontend/kitchenmate-frontend/src/pages/CookMode.jsx`

- [ ] **Step 1: Create CookMode page**

```jsx
import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, X, Clock } from 'lucide-react'
import recipeApi from '../api/recipeApi'
import Button from '../components/ui/Button'
import Spinner from '../components/ui/Spinner'

export default function CookMode() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [currentStep, setCurrentStep] = useState(0)
  const [showTimer, setShowTimer] = useState(false)
  const [timerSeconds, setTimerSeconds] = useState(0)
  const timerRef = useRef(null)

  const { data, isLoading, error } = useQuery({
    queryKey: ['recipe', id],
    queryFn: () => recipeApi.getRecipe(id),
    enabled: !!id,
  })

  const recipe = data?.data
  const steps = recipe?.steps || []

  // Wake lock to keep screen on
  useEffect(() => {
    let wakeLock = null
    const requestWakeLock = async () => {
      if ('wakeLock' in navigator) {
        try {
          wakeLock = await navigator.wakeLock.request('screen')
        } catch (err) {
          console.log('Wake lock error:', err)
        }
      }
    }
    requestWakeLock()

    return () => {
      if (wakeLock) {
        wakeLock.release()
      }
    }
  }, [])

  // Timer logic
  useEffect(() => {
    if (showTimer && timerSeconds > 0) {
      timerRef.current = setInterval(() => {
        setTimerSeconds((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current)
            setShowTimer(false)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [showTimer, timerSeconds])

  const startTimer = (minutes) => {
    setTimerSeconds(minutes * 60)
    setShowTimer(true)
  }

  const goNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const goPrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleExit = () => {
    navigate(`/recipes/${id}`)
  }

  if (isLoading) return <Spinner fullScreen />
  if (error || !recipe) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        <div className="text-center">
          <p>Không tìm th được công thức</p>
          <Button onClick={() => navigate('/home')} className="mt-4">
            Quay lại
          </Button>
        </div>
      </div>
    )
  }

  const currentStepData = steps[currentStep]

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between p-4 border-b border-gray-800">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleExit}
            className="text-white hover:bg-gray-800"
          >
            <X size={24} />
          </Button>
          <div>
            <h1 className="font-semibold">{recipe.title}</h1>
            <p className="text-sm text-gray-400">
              Bước {currentStep + 1} / {steps.length}
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => startTimer(5)}
          className="text-white"
          leftIcon={<Clock size={16} />}
        >
          Hẹn giờ
        </Button>
      </header>

      {/* Progress bar */}
      <div className="h-1 bg-gray-800">
        <motion.div
          className="h-full bg-primary"
          initial={{ width: 0 }}
          animate={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      {/* Timer overlay */}
      <AnimatePresence>
        {showTimer && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
          >
            <div className="text-center">
              <div className="text-8xl font-bold mb-4">
                {Math.floor(timerSeconds / 60)}:{(timerSeconds % 60).toString().padStart(2, '0')}
              </div>
              <Button onClick={() => setShowTimer(false)}>Đóng</Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main content */}
      <main className="flex-1 flex items-center justify-center p-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            transition={{ duration: 0.3 }}
            className="max-w-2xl w-full text-center"
          >
            <div className="text-6xl font-bold text-primary mb-6">
              {currentStepData?.step_number}
            </div>
            <p className="text-2xl leading-relaxed mb-8">
              {currentStepData?.instruction}
            </p>
            {currentStepData?.media_url && (
              <img
                src={currentStepData.media_url}
                alt={`Bước ${currentStepData.step_number}`}
                className="max-h-64 mx-auto rounded-xl object-contain"
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Navigation */}
      <footer className="p-6 border-t border-gray-800">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={goPrev}
            disabled={currentStep === 0}
            className="text-white disabled:text-gray-600"
            leftIcon={<ChevronLeft size={24} />}
          >
            Trước
          </Button>

          {/* Step indicators */}
          <div className="flex gap-2">
            {steps.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentStep(index)}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentStep ? 'bg-primary' : 'bg-gray-600'
                }`}
              />
            ))}
          </div>

          {currentStep < steps.length - 1 ? (
            <Button
              onClick={goNext}
              className="text-white"
              rightIcon={<ChevronRight size={24} />}
            >
              Tiếp theo
            </Button>
          ) : (
            <Button
              onClick={handleExit}
              className="bg-green-600 hover:bg-green-700"
            >
              Hoàn thành
            </Button>
          )}
        </div>
      </footer>
    </div>
  )
}
```

---

## Phase 9: Pantry & Shopping List

### Task 9.1: Pantry API & Store

**Files:**
- Create: `KitchenMate_Frontend/kitchenmate-frontend/src/api/pantryApi.js`
- Create: `KitchenMate_Frontend/kitchenmate-frontend/src/stores/pantryStore.js`

- [ ] **Step 1: Create pantryApi**

```js
import axiosInstance from './axiosInstance'

const pantryApi = {
  getPantry: () =>
    axiosInstance.get('/kitchen/pantry/'),

  addToPantry: (data) =>
    axiosInstance.post('/kitchen/pantry/', data),

  updatePantryItem: (id, data) =>
    axiosInstance.put(`/kitchen/pantry/${id}/`, data),

  partialUpdatePantryItem: (id, data) =>
    axiosInstance.patch(`/kitchen/pantry/${id}/`, data),

  deletePantryItem: (id) =>
    axiosInstance.delete(`/kitchen/pantry/${id}/`),
}

export default pantryApi
```

- [ ] **Step 2: Create pantryStore**

```js
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import pantryApi from '../api/pantryApi'
import { toast } from '../components/ui/Toast'

const usePantryStore = create(
  persist(
    (set, get) => ({
      items: [],
      isLoading: false,
      error: null,

      fetchPantry: async () => {
        set({ isLoading: true, error: null })
        try {
          const response = await pantryApi.getPantry()
          set({ items: response.data?.results || [], isLoading: false })
        } catch (error) {
          set({ error: error.message, isLoading: false })
        }
      },

      addItem: async (ingredientId, quantity, unit) => {
        try {
          const response = await pantryApi.addToPantry({
            ingredient: ingredientId,
            quantity,
            unit,
          })
          set((state) => ({
            items: [...state.items, response.data],
          }))
          toast.success('Đã thêm vào tủ lạnh')
          return { success: true }
        } catch (error) {
          toast.error('Không thể thêm nguyên liệu')
          return { success: false }
        }
      },

      updateItem: async (id, data) => {
        try {
          const response = await pantryApi.partialUpdatePantryItem(id, data)
          set((state) => ({
            items: state.items.map((item) =>
              item.id === id ? response.data : item
            ),
          }))
          return { success: true }
        } catch (error) {
          toast.error('Không thể cập nhật')
          return { success: false }
        }
      },

      removeItem: async (id) => {
        try {
          await pantryApi.deletePantryItem(id)
          set((state) => ({
            items: state.items.filter((item) => item.id !== id),
          }))
          toast.success('Đã xóa khỏi tủ lạnh')
          return { success: true }
        } catch (error) {
          toast.error('Không thể xóa')
          return { success: false }
        }
      },
    }),
    {
      name: 'pantry-storage',
      partialize: (state) => ({ items: state.items }),
    }
  )
)

export default usePantryStore
```

### Task 9.2: Pantry Page

**Files:**
- Create: `KitchenMate_Frontend/kitchenmate-frontend/src/pages/Pantry.jsx`
- Create: `KitchenMate_Frontend/kitchenmate-frontend/src/components/kitchen/PantryItem.jsx`

- [ ] **Step 1: Create PantryItem component**

```jsx
import { useState } from 'react'
import { motion } from 'framer-motion'
import { Edit2, Trash2, Check, X } from 'lucide-react'
import usePantryStore from '../../stores/pantryStore'
import Button from '../ui/Button'
import Input from '../ui/Input'
import { clsx } from 'clsx'

export default function PantryItem({ item, index }) {
  const [isEditing, setIsEditing] = useState(false)
  const [editQuantity, setEditQuantity] = useState(item.quantity)
  const { updateItem, removeItem } = usePantryStore()

  const handleSave = async () => {
    const result = await updateItem(item.id, { quantity: editQuantity })
    if (result.success) {
      setIsEditing(false)
    }
  }

  const handleDelete = async () => {
    if (window.confirm('Bạn có chắc muốn xóa?')) {
      await removeItem(item.id)
    }
  }

  const categoryColors = {
    PROTEIN: 'bg-red-100 text-red-700',
    CARB: 'bg-amber-100 text-amber-700',
    VEG: 'bg-green-100 text-green-700',
    SPICE: 'bg-orange-100 text-orange-700',
    STAPLE: 'bg-gray-100 text-gray-700',
    OTHER: 'bg-purple-100 text-purple-700',
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="flex items-center justify-between p-4 bg-white rounded-xl shadow-card"
    >
      <div className="flex-1">
        <div className="flex items-center gap-3">
          <h3 className="font-medium">{item.ingredient?.name}</h3>
          <span
            className={clsx(
              'px-2 py-0.5 rounded-full text-xs font-medium',
              categoryColors[item.ingredient?.category] || categoryColors.OTHER
            )}
          >
            {item.ingredient?.category}
          </span>
        </div>
        {isEditing ? (
          <div className="flex items-center gap-2 mt-2">
            <Input
              type="number"
              value={editQuantity}
              onChange={(e) => setEditQuantity(parseFloat(e.target.value) || 0)}
              className="w-24"
              min="0"
              step="0.1"
            />
            <span className="text-gray-500">{item.unit}</span>
          </div>
        ) : (
          <p className="text-sm text-gray-500 mt-1">
            {item.quantity} {item.unit}
          </p>
        )}
      </div>

      <div className="flex items-center gap-2">
        {isEditing ? (
          <>
            <Button variant="ghost" size="icon" onClick={handleSave}>
              <Check size={18} className="text-green-600" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setIsEditing(false)}>
              <X size={18} className="text-red-500" />
            </Button>
          </>
        ) : (
          <>
            <Button variant="ghost" size="icon" onClick={() => setIsEditing(true)}>
              <Edit2 size={18} />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleDelete}>
              <Trash2 size={18} className="text-red-500" />
            </Button>
          </>
        )}
      </div>
    </motion.div>
  )
}
```

- [ ] **Step 2: Create Pantry page**

```jsx
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Plus, Lightbulb } from 'lucide-react'
import usePantryStore from '../stores/pantryStore'
import PantryItem from '../components/kitchen/PantryItem'
import { ListSkeleton } from '../components/ui/Skeleton'
import Button from '../components/ui/Button'
import BottomSheet from '../components/ui/BottomSheet'
import Input from '../components/ui/Input'
import Select from '../components/ui/Select'
import EmptyState from '../components/ui/EmptyState'
import ingredientApi from '../api/ingredientApi'

export default function Pantry() {
  const navigate = useNavigate()
  const { items, isLoading, fetchPantry, addItem } = usePantryStore()
  const [showAddSheet, setShowAddSheet] = useState(false)
  const [selectedIngredient, setSelectedIngredient] = useState(null)
  const [quantity, setQuantity] = useState(1)
  const [unit, setUnit] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetchPantry()
  }, [fetchPantry])

  const { data: ingredientsData } = useQuery({
    queryKey: ['ingredients', searchQuery],
    queryFn: () => ingredientApi.getIngredients({ search: searchQuery }),
    enabled: searchQuery.length >= 2,
  })

  const ingredients = ingredientsData?.data?.results || []

  const handleAdd = async () => {
    if (!selectedIngredient || !quantity || !unit) return
    const result = await addItem(selectedIngredient.id, quantity, unit)
    if (result.success) {
      setShowAddSheet(false)
      setSelectedIngredient(null)
      setQuantity(1)
      setUnit('')
    }
  }

  const handleRecommend = () => {
    navigate('/recommendations')
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="sticky top-16 z-30 bg-white border-b border-gray-100 p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">Tủ lạnh của tôi</h1>
            <p className="text-sm text-gray-500">{items.length} nguyên liệu</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRecommend}
              leftIcon={<Lightbulb size={16} />}
            >
              Gợi ý
            </Button>
            <Button
              size="sm"
              onClick={() => setShowAddSheet(true)}
              leftIcon={<Plus size={16} />}
            >
              Thêm
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto p-4">
        {isLoading ? (
          <ListSkeleton count={5} />
        ) : items.length === 0 ? (
          <EmptyState
            title="Tủ lạnh trống"
            description="Hãy thêm nguyên liệu bạn có để nhận gợi ý món ăn phù hợp"
            action={() => setShowAddSheet(true)}
            actionLabel="Thêm nguyên liệu"
          />
        ) : (
          <div className="space-y-3">
            {items.map((item, index) => (
              <PantryItem key={item.id} item={item} index={index} />
            ))}
          </div>
        )}
      </div>

      {/* Add Ingredient Bottom Sheet */}
      <BottomSheet
        isOpen={showAddSheet}
        onClose={() => setShowAddSheet(false)}
        title="Thêm nguyên liệu"
      >
        <div className="space-y-4">
          {/* Search */}
          <div>
            <label className="label">Tìm nguyên liệu</label>
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Nhập tên nguyên liệu..."
            />
          </div>

          {/* Results */}
          {ingredients.length > 0 && !selectedIngredient && (
            <div className="max-h-48 overflow-y-auto border rounded-lg">
              {ingredients.map((ing) => (
                <button
                  key={ing.id}
                  onClick={() => setSelectedIngredient(ing)}
                  className="w-full text-left p-3 hover:bg-gray-50 border-b last:border-b-0"
                >
                  <div className="font-medium">{ing.name}</div>
                  <div className="text-sm text-gray-500">{ing.category}</div>
                </button>
              ))}
            </div>
          )}

          {/* Selected */}
          {selectedIngredient && (
            <div className="p-3 bg-primary/10 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{selectedIngredient.name}</div>
                  <div className="text-sm text-gray-500">{selectedIngredient.category}</div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedIngredient(null)}
                >
                  Đổi
                </Button>
              </div>
            </div>
          )}

          {/* Quantity & Unit */}
          {selectedIngredient && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Số lượng"
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(parseFloat(e.target.value) || 0)}
                  min="0"
                  step="0.1"
                />
                <Input
                  label="Đơn vị"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  placeholder="kg, g, quả..."
                />
              </div>
              <Button onClick={handleAdd} className="w-full">
                Thêm vào tủ lạnh
              </Button>
            </>
          )}
        </div>
      </BottomSheet>
    </div>
  )
}
```

### Task 9.3: Shopping List API & Page

**Files:**
- Create: `KitchenMate_Frontend/kitchenmate-frontend/src/api/shoppingApi.js`
- Create: `KitchenMate_Frontend/kitchenmate-frontend/src/pages/ShoppingListPage.jsx`
- Create: `KitchenMate_Frontend/kitchenmate-frontend/src/components/kitchen/ShoppingListItem.jsx`

- [ ] **Step 1: Create shoppingApi**

```js
import axiosInstance from './axiosInstance'

const shoppingApi = {
  getShoppingList: () =>
    axiosInstance.get('/kitchen/shopping-list/'),

  addToShoppingList: (data) =>
    axiosInstance.post('/kitchen/shopping-list/', data),

  removeFromShoppingList: (id) =>
    axiosInstance.delete(`/kitchen/shopping-list/${id}/`),

  markPurchased: (id) =>
    axiosInstance.post(`/kitchen/shopping-list/${id}/mark-purchased/`),

  markUnpurchased: (id) =>
    axiosInstance.post(`/kitchen/shopping-list/${id}/mark-unpurchased/`),
}

export default shoppingApi
```

- [ ] **Step 2: Create ShoppingListItem component**

```jsx
import { useState } from 'react'
import { motion } from 'framer-motion'
import { Check, Trash2 } from 'lucide-react'
import { clsx } from 'clsx'
import shoppingApi from '../../api/shoppingApi'
import { toast } from '../../components/ui/Toast'

export default function ShoppingListItem({ item, index, onUpdate }) {
  const [isRemoving, setIsRemoving] = useState(false)

  const handleToggle = async () => {
    try {
      if (item.is_purchased) {
        await shoppingApi.markUnpurchased(item.id)
      } else {
        await shoppingApi.markPurchased(item.id)
      }
      onUpdate()
      toast.success(item.is_purchased ? 'Đã bỏ đánh dấu' : 'Đã mua - đã thêm vào tủ lạnh')
    } catch (error) {
      toast.error('Có lỗi xảy ra')
    }
  }

  const handleDelete = async () => {
    setIsRemoving(true)
    try {
      await shoppingApi.removeFromShoppingList(item.id)
      onUpdate()
      toast.success('Đã xóa')
    } catch (error) {
      toast.error('Không thể xóa')
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ delay: index * 0.03 }}
      className={clsx(
        'flex items-center gap-3 p-4 bg-white rounded-xl shadow-card transition-all',
        item.is_purchased && 'opacity-60'
      )}
    >
      {/* Checkbox */}
      <button
        onClick={handleToggle}
        className={clsx(
          'shrink-0 w-7 h-7 rounded-full border-2 flex items-center justify-center transition-colors',
          item.is_purchased
            ? 'bg-green-500 border-green-500 text-white'
            : 'border-gray-300 hover:border-primary'
        )}
      >
        {item.is_purchased && <Check size={16} />}
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className={clsx(
          'font-medium',
          item.is_purchased && 'line-through text-gray-400'
        )}>
          {item.ingredient?.name}
        </p>
        <p className="text-sm text-gray-500">
          {item.quantity} {item.unit}
        </p>
      </div>

      {/* Delete */}
      <button
        onClick={handleDelete}
        disabled={isRemoving}
        className="shrink-0 p-2 text-gray-400 hover:text-red-500 transition-colors"
      >
        <Trash2 size={18} />
      </button>
    </motion.div>
  )
}
```

- [ ] **Step 3: Create ShoppingListPage**

```jsx
import { useEffect, useState, useCallback } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { AnimatePresence } from 'framer-motion'
import { Plus } from 'lucide-react'
import shoppingApi from '../api/shoppingApi'
import ShoppingListItem from '../components/kitchen/ShoppingListItem'
import { ListSkeleton } from '../components/ui/Skeleton'
import Button from '../components/ui/Button'
import BottomSheet from '../components/ui/BottomSheet'
import Input from '../components/ui/Input'
import EmptyState from '../components/ui/EmptyState'
import ingredientApi from '../api/ingredientApi'

export default function ShoppingListPage() {
  const queryClient = useQueryClient()
  const [showAddSheet, setShowAddSheet] = useState(false)
  const [selectedIngredient, setSelectedIngredient] = useState(null)
  const [quantity, setQuantity] = useState(1)
  const [unit, setUnit] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['shopping-list'],
    queryFn: shoppingApi.getShoppingList,
  })

  const items = data?.data?.results || []

  const handleUpdate = useCallback(() => {
    refetch()
    queryClient.invalidateQueries(['pantry'])
  }, [refetch, queryClient])

  const { data: ingredientsData } = useQuery({
    queryKey: ['ingredients', searchQuery],
    queryFn: () => ingredientApi.getIngredients({ search: searchQuery }),
    enabled: searchQuery.length >= 2,
  })

  const ingredients = ingredientsData?.data?.results || []

  const handleAdd = async () => {
    if (!selectedIngredient || !quantity || !unit) return
    try {
      await shoppingApi.addToShoppingList({
        ingredient: selectedIngredient.id,
        quantity,
        unit,
      })
      setShowAddSheet(false)
      setSelectedIngredient(null)
      setQuantity(1)
      setUnit('')
      handleUpdate()
    } catch (error) {
      // error handled
    }
  }

  const unpurchased = items.filter((i) => !i.is_purchased)
  const purchased = items.filter((i) => i.is_purchased)

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="sticky top-16 z-30 bg-white border-b border-gray-100 p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">Danh sách đi chợ</h1>
            <p className="text-sm text-gray-500">
              {unpurchased.length} mục chưa mua
            </p>
          </div>
          <Button
            size="sm"
            onClick={() => setShowAddSheet(true)}
            leftIcon={<Plus size={16} />}
          >
            Thêm
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto p-4">
        {isLoading ? (
          <ListSkeleton count={5} />
        ) : items.length === 0 ? (
          <EmptyState
            title="Danh sách trống"
            description="Thêm nguyên liệu cần mua hoặc thêm từ công thức"
            action={() => setShowAddSheet(true)}
            actionLabel="Thêm nguyên liệu"
          />
        ) : (
          <div className="space-y-6">
            {/* Unpurchased */}
            {unpurchased.length > 0 && (
              <section>
                <h2 className="text-sm font-medium text-gray-500 mb-3">
                  Cần mua ({unpurchased.length})
                </h2>
                <div className="space-y-2">
                  <AnimatePresence>
                    {unpurchased.map((item, index) => (
                      <ShoppingListItem
                        key={item.id}
                        item={item}
                        index={index}
                        onUpdate={handleUpdate}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              </section>
            )}

            {/* Purchased */}
            {purchased.length > 0 && (
              <section>
                <h2 className="text-sm font-medium text-gray-500 mb-3">
                  Đã mua ({purchased.length})
                </h2>
                <div className="space-y-2">
                  <AnimatePresence>
                    {purchased.map((item, index) => (
                      <ShoppingListItem
                        key={item.id}
                        item={item}
                        index={index}
                        onUpdate={handleUpdate}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              </section>
            )}
          </div>
        )}
      </div>

      {/* Add Bottom Sheet */}
      <BottomSheet
        isOpen={showAddSheet}
        onClose={() => setShowAddSheet(false)}
        title="Thêm vào danh sách"
      >
        <div className="space-y-4">
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm nguyên liệu..."
          />

          {ingredients.length > 0 && !selectedIngredient && (
            <div className="max-h-48 overflow-y-auto border rounded-lg">
              {ingredients.map((ing) => (
                <button
                  key={ing.id}
                  onClick={() => setSelectedIngredient(ing)}
                  className="w-full text-left p-3 hover:bg-gray-50 border-b last:border-b-0"
                >
                  <div className="font-medium">{ing.name}</div>
                </button>
              ))}
            </div>
          )}

          {selectedIngredient && (
            <div className="p-3 bg-primary/10 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="font-medium">{selectedIngredient.name}</div>
                <Button variant="ghost" size="sm" onClick={() => setSelectedIngredient(null)}>
                  Đổi
                </Button>
              </div>
            </div>
          )}

          {selectedIngredient && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Số lượng"
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(parseFloat(e.target.value) || 0)}
                  min="0"
                />
                <Input
                  label="Đơn vị"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  placeholder="kg, g, quả..."
                />
              </div>
              <Button onClick={handleAdd} className="w-full">
                Thêm vào danh sách
              </Button>
            </>
          )}
        </div>
      </BottomSheet>
    </div>
  )
}
```

---

## Phase 10: Recommendation Page

### Task 10.1: Recommendation API & Page

**Files:**
- Create: `KitchenMate_Frontend/kitchenmate-frontend/src/api/recommendationApi.js`
- Create: `KitchenMate_Frontend/kitchenmate-frontend/src/pages/Recommendations.jsx`

- [ ] **Step 1: Create recommendationApi**

```js
import axiosInstance from './axiosInstance'

const recommendationApi = {
  getRecommendations: (mode, excludeIngredients = []) =>
    axiosInstance.post('/recommendations/suggest/', {
      mode,
      exclude_ingredients: excludeIngredients,
    }),
}

export default recommendationApi
```

- [ ] **Step 2: Create Recommendations page**

```jsx
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ChefHat, AlertCircle, CheckCircle } from 'lucide-react'
import recommendationApi from '../api/recommendationApi'
import usePantryStore from '../stores/pantryStore'
import { RecipeCardSkeleton } from '../components/ui/Skeleton'
import Button from '../components/ui/Button'
import EmptyState from '../components/ui/EmptyState'
import Badge from '../components/ui/Badge'

export default function Recommendations() {
  const [mode, setMode] = useState('COOK_NOW')
  const { items: pantryItems } = usePantryStore()

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['recommendations', mode],
    queryFn: () => recommendationApi.getRecommendations(mode),
    enabled: pantryItems.length > 0,
  })

  const results = data?.data || []

  if (pantryItems.length === 0) {
    return (
      <div className="min-h-screen">
        <div className="max-w-4xl mx-auto p-4">
          <EmptyState
            icon={ChefHat}
            title="Tủ lạnh trống"
            description="Hãy thêm nguyên liệu vào tủ lạnh trước để nhận gợi ý món ăn"
            actionLabel="Thêm nguyên liệu"
            action={() => window.location.href = '/pantry'}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="sticky top-16 z-30 bg-white border-b border-gray-100 p-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-xl font-semibold mb-4">Gợi ý món ăn</h1>

          {/* Mode Toggle */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-gray-100 rounded-xl">
            <button
              onClick={() => setMode('COOK_NOW')}
              className={`py-3 px-4 rounded-lg font-medium transition-colors ${
                mode === 'COOK_NOW'
                  ? 'bg-white text-primary shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Nấu ngay
            </button>
            <button
              onClick={() => setMode('ADD_MORE')}
              className={`py-3 px-4 rounded-lg font-medium transition-colors ${
                mode === 'ADD_MORE'
                  ? 'bg-white text-primary shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Thêm chút nữa
            </button>
          </div>

          <p className="text-sm text-gray-500 mt-3">
            {mode === 'COOK_NOW'
              ? 'Những món có đủ 100% nguyên liệu trong tủ lạnh'
              : 'Những món còn thiếu 1-2 nguyên liệu phụ'}
          </p>
        </div>
      </div>

      {/* Results */}
      <div className="max-w-6xl mx-auto p-4">
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <RecipeCardSkeleton key={i} />
            ))}
          </div>
        ) : error ? (
          <EmptyState
            title="Đã xảy ra lỗi"
            description="Không thể tải gợi ý. Vui lòng thử lại."
            action={refetch}
            actionLabel="Thử lại"
          />
        ) : results.length === 0 ? (
          <EmptyState
            icon={ChefHat}
            title="Không có gợi ý"
            description={
              mode === 'COOK_NOW'
                ? 'Thêm nguyên liệu vào tủ lạnh để nhận gợi ý'
                : 'Không có món nào phù hợp với tiêu chí này'
            }
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {results.map((item, index) => (
              <motion.div
                key={item.recipe.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Link to={`/recipes/${item.recipe.id}`}>
                  <div className="card overflow-hidden hover:shadow-lg transition-all group">
                    <div className="relative aspect-[4/3]">
                      <img
                        src={item.recipe.thumbnail_url || '/placeholder-recipe.jpg'}
                        alt={item.recipe.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => { e.target.src = '/placeholder-recipe.jpg' }}
                      />
                      {/* Score badge */}
                      <div className="absolute top-3 right-3">
                        <Badge variant="primary">
                          {item.score} điểm
                        </Badge>
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold group-hover:text-primary transition-colors">
                        {item.recipe.title}
                      </h3>

                      {/* Missing ingredients */}
                      {item.missing_ingredients?.length > 0 && (
                        <div className="mt-3 flex items-start gap-2">
                          <AlertCircle size={16} className="text-orange-500 shrink-0 mt-0.5" />
                          <div className="text-sm">
                            <p className="text-gray-500">Còn thiếu:</p>
                            <p className="text-orange-600">
                              {item.missing_ingredients.map((i) => i.name).join(', ')}
                            </p>
                          </div>
                        </div>
                      )}

                      {item.missing_ingredients?.length === 0 && (
                        <div className="mt-3 flex items-center gap-2 text-green-600">
                          <CheckCircle size={16} />
                          <span className="text-sm">Đủ nguyên liệu!</span>
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
```

---

## Implementation Complete

**Foundation plan đã hoàn thành với các phase:**

1. ✅ Project Setup (Vite, Tailwind, config)
2. ✅ UI Components (Button, Input, Modal, Toast, etc.)
3. ✅ Layout Components (MainLayout, BottomNav, Navbar)
4. ✅ Authentication (Stores, API, ProtectedRoute, Login/Register)
5. ✅ Landing Page
6. ✅ Recipe Components (RecipeCard, StarRating)
7. ✅ Home Page with Recipe Feed + Search/Filter
8. ✅ Recipe Detail + Cook Mode
9. ✅ Pantry Page + Store
10. ✅ Shopping List Page + Store
11. ✅ Recommendation Page

**Tiếp theo:** Feature plan cho Recipe Create, Social (Collections, Reviews), Profile, và Admin Panel sẽ được tạo sau khi Foundation hoàn thành.
