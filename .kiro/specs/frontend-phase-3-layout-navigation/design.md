# Design Document — Frontend Phase 3: Layout & Navigation

## Overview

Phase 3 xây dựng "khung sườn UI" cho toàn bộ KitchenMate Frontend. Mục tiêu là tạo ra ba layout chính (`MainLayout`, `AuthLayout`, `AdminLayout`) cùng các navigation component (`Navbar`, `BottomNav`, `AdminSidebar`, `UserMenu`) và tích hợp chúng vào hệ thống routing thông qua nested routes của React Router DOM v6.

Toàn bộ hệ thống tuân theo nguyên tắc **Mobile-First** với Tailwind CSS. Trạng thái xác thực được đọc từ Zustand `authStore` thông qua custom hook `useAuth`.

### Phạm vi thay đổi

| File | Trạng thái |
|------|-----------|
| `src/layouts/MainLayout.jsx` | Cập nhật — dùng Navbar + BottomNav thật |
| `src/layouts/AuthLayout.jsx` | Giữ nguyên — đã đúng |
| `src/layouts/AdminLayout.jsx` | Mới |
| `src/components/layout/Navbar.jsx` | Mới |
| `src/components/layout/BottomNav.jsx` | Mới |
| `src/components/layout/AdminSidebar.jsx` | Mới |
| `src/components/layout/UserMenu.jsx` | Cập nhật — sửa menu items |
| `src/routes/AppRoutes.jsx` | Refactor — nested routes |

---

## Architecture

### Sơ đồ tổng quan

```
App.jsx (BrowserRouter)
└── AppRoutes.jsx
    ├── <Route element={<AuthLayout />}>
    │   ├── /login
    │   ├── /register
    │   ├── /forgot-password
    │   └── /reset-password
    │
    ├── <Route element={<MainLayout />}>
    │   ├── /                    (public)
    │   ├── /explore             (public)
    │   ├── /suggestions         (public)
    │   ├── /pantry              (protected)
    │   ├── /profile             (protected)
    │   ├── /my-recipes          (protected)
    │   ├── /collections         (protected)
    │   └── /recipes/create      (protected)
    │
    ├── <Route element={<AdminLayout />}>
    │   ├── /admin
    │   ├── /admin/recipes/pending
    │   ├── /admin/ingredients/pending
    │   └── /admin/users
    │
    └── * → NotFoundPage
```

### Luồng dữ liệu Auth

```
authStore (Zustand + persist)
    └── useAuth() hook
            ├── Navbar.jsx       ← isAuthenticated, user
            ├── UserMenu.jsx     ← user, logout()
            └── ProtectedRoute   ← isAuthenticated
```

### Responsive Strategy

```
Mobile (< 768px / md)          Desktop (≥ 768px / md)
─────────────────────          ──────────────────────
Navbar: hidden                 Navbar: flex (h-16)
BottomNav: fixed bottom        BottomNav: hidden
AdminSidebar: hidden (toggle)  AdminSidebar: always visible
```

---

## Components and Interfaces

### 1. `MainLayout`

**Props:**
```jsx
MainLayout({ children: PropTypes.node })
```

**Cấu trúc render:**
```
<div className="min-h-screen bg-gray-50 flex flex-col">
  <Navbar />                          ← hidden md:flex
  <main className="flex-1 pb-16 md:pb-0">
    {children}
  </main>
  <BottomNav />                       ← md:hidden fixed bottom-0
</div>
```

**Lưu ý thiết kế:**
- `pb-16` trên `main` để nội dung không bị BottomNav che khuất trên mobile
- `md:pb-0` reset padding khi Navbar hiển thị thay thế
- Không có footer trong MainLayout (footer chỉ là placeholder cũ, bỏ đi)

---

### 2. `AuthLayout`

**Không thay đổi** — đã đáp ứng đầy đủ requirements:
- Background gradient `from-primary/10 via-white to-secondary/10`
- Logo + tagline phía trên
- Form container `max-w-md` với card `bg-white rounded-lg shadow-xl`
- Không có Navbar/BottomNav

---

### 3. `AdminLayout`

**Props:**
```jsx
AdminLayout({ children: PropTypes.node })
```

**State nội bộ:**
```jsx
const [sidebarOpen, setSidebarOpen] = useState(false) // mobile toggle
```

**Cấu trúc render:**
```
<div className="min-h-screen bg-gray-100 flex">
  {/* Overlay mobile */}
  {sidebarOpen && (
    <div
      className="fixed inset-0 bg-black/50 z-20 md:hidden"
      aria-hidden="true"
      onClick={() => setSidebarOpen(false)}
    />
  )}

  {/* Sidebar */}
  <AdminSidebar
    isOpen={sidebarOpen}
    onClose={() => setSidebarOpen(false)}
  />

  {/* Main content */}
  <div className="flex-1 flex flex-col min-w-0">
    {/* Mobile header với toggle button */}
    <header className="md:hidden bg-white shadow-sm h-14 flex items-center px-4">
      <button onClick={() => setSidebarOpen(true)}>☰</button>
      <span>KitchenMate Admin</span>
    </header>
    <main className="flex-1 p-6">{children}</main>
  </div>
</div>
```

---

### 4. `Navbar`

**Props:** Không có (đọc state từ `useAuth`)

**Cấu trúc render:**
```
<nav className="hidden md:flex bg-white shadow-sm h-16 ...">
  {/* Logo */}
  <Link to="/">KitchenMate</Link>

  {/* SearchBar — controlled input */}
  <input
    type="search"
    value={searchQuery}
    onChange={(e) => setSearchQuery(e.target.value)}
    placeholder="Tìm kiếm công thức..."
    aria-label="Tìm kiếm công thức"
  />

  {/* Auth actions */}
  {isAuthenticated ? (
    <>
      <Link to="/recipes/create">Tạo công thức</Link>
      <UserMenu />
    </>
  ) : (
    <>
      <Link to="/login">Đăng nhập</Link>
      <Link to="/register">Đăng ký</Link>
    </>
  )}
</nav>
```

**State nội bộ:**
```jsx
const [searchQuery, setSearchQuery] = useState('')
```

**Lưu ý:** SearchBar chỉ là controlled input UI — chưa gọi API. Sẽ tích hợp search logic ở phase sau.

---

### 5. `UserMenu`

**Props:** Không có (đọc state từ `useAuth`)

**Thay đổi so với skeleton hiện tại:**
- Bỏ menu item "Cài đặt" (`/settings`) — không có trong requirements
- Thêm menu item "Bộ sưu tập" (`/collections`) — theo requirements 5.3

**Menu items:**
```
[Header]  display_name / email
─────────────────────────────
Hồ sơ cá nhân  →  /profile
Bộ sưu tập     →  /collections
─────────────────────────────
Đăng xuất      →  logout()
```

**Avatar logic:**
```
user.avatar_url → <img>
  else → chữ viết tắt từ display_name hoặc username
```

---

### 6. `BottomNav`

**Props:** Không có (dùng `useLocation`)

**5 tabs (theo thứ tự):**

| Tab | Path | Icon (react-icons) |
|-----|------|--------------------|
| Trang chủ | `/` | `HiHome` |
| Khám phá | `/explore` | `HiSearch` |
| Gợi ý | `/suggestions` | `HiLightBulb` |
| Tủ lạnh | `/pantry` | `HiArchive` |
| Hồ sơ | `/profile` | `HiUser` |

**Active state logic:**
```jsx
const location = useLocation()
const isActive = (path) =>
  path === '/' ? location.pathname === '/' : location.pathname.startsWith(path)
```

**Badge:** Tab "Hồ sơ" có badge đỏ tĩnh (UI only, chưa có logic).

**Touch target:** Mỗi tab có `min-h-[44px] min-w-[44px]` để đảm bảo 44×44px.

---

### 7. `AdminSidebar`

**Props:**
```jsx
AdminSidebar({
  isOpen: PropTypes.bool,
  onClose: PropTypes.func,
})
```

**Nav items:**
```
Dashboard              →  /admin
Duyệt công thức        →  /admin/recipes/pending
Duyệt nguyên liệu      →  /admin/ingredients/pending
Quản lý người dùng     →  /admin/users
```

**Active state:** Dùng `NavLink` với `className` callback để highlight route hiện tại bằng màu `primary`.

**Responsive:**
- Desktop (`md:`): luôn hiển thị, `w-64`
- Mobile: ẩn mặc định, slide-in khi `isOpen=true` qua `translate-x`

```jsx
<aside
  className={`
    fixed md:static inset-y-0 left-0 z-30
    w-64 bg-white shadow-lg
    transform transition-transform duration-200
    ${isOpen ? 'translate-x-0' : '-translate-x-full'}
    md:translate-x-0
  `}
  aria-label="Admin navigation"
>
```

---

### 8. `AppRoutes` — Nested Routes

**Cấu trúc mới:**
```jsx
<Routes>
  {/* Auth routes */}
  <Route element={<AuthLayout />}>
    <Route path="/login" element={<LoginPage />} />
    <Route path="/register" element={<RegisterPage />} />
    <Route path="/forgot-password" element={<ForgotPasswordPage />} />
    <Route path="/reset-password" element={<ResetPasswordPage />} />
  </Route>

  {/* Main routes */}
  <Route element={<MainLayout />}>
    <Route path="/" element={<HomePage />} />
    <Route path="/explore" element={<ExplorePage />} />
    <Route path="/suggestions" element={<SuggestionsPage />} />
    <Route path="/pantry" element={<ProtectedRoute><PantryPage /></ProtectedRoute>} />
    <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
    <Route path="/my-recipes" element={<ProtectedRoute><MyRecipesPage /></ProtectedRoute>} />
    <Route path="/collections" element={<ProtectedRoute><CollectionsPage /></ProtectedRoute>} />
    <Route path="/recipes/create" element={<ProtectedRoute><CreateRecipePage /></ProtectedRoute>} />
  </Route>

  {/* Admin routes */}
  <Route element={<AdminLayout />}>
    <Route path="/admin" element={<AdminDashboardPage />} />
    <Route path="/admin/recipes/pending" element={<AdminRecipesPendingPage />} />
    <Route path="/admin/ingredients/pending" element={<AdminIngredientsPendingPage />} />
    <Route path="/admin/users" element={<AdminUsersPage />} />
  </Route>

  {/* 404 */}
  <Route path="*" element={<NotFoundPage />} />
</Routes>
```

**Lưu ý quan trọng:** Khi dùng nested routes, `AuthLayout`, `MainLayout`, `AdminLayout` phải render `<Outlet />` thay vì `{children}`. Các page component placeholder sẽ được tạo mới nếu chưa tồn tại.

---

## Data Models

### Auth State (từ `authStore`)

```typescript
interface AuthState {
  user: User | null
  accessToken: string | null
  refreshToken: string | null
  isAuthenticated: boolean
}

interface User {
  id: string           // UUID
  username: string
  display_name: string
  email: string
  avatar_url: string | null
  role: 'user' | 'admin'
}
```

### Navigation Config

```javascript
// BottomNav tabs
const BOTTOM_NAV_TABS = [
  { path: '/',           label: 'Trang chủ', icon: HiHome,       badge: false },
  { path: '/explore',    label: 'Khám phá',  icon: HiSearch,     badge: false },
  { path: '/suggestions',label: 'Gợi ý',    icon: HiLightBulb,  badge: false },
  { path: '/pantry',     label: 'Tủ lạnh',  icon: HiArchive,    badge: false },
  { path: '/profile',    label: 'Hồ sơ',    icon: HiUser,       badge: true  },
]

// Admin sidebar items
const ADMIN_NAV_ITEMS = [
  { path: '/admin',                       label: 'Dashboard',           icon: HiViewGrid },
  { path: '/admin/recipes/pending',       label: 'Duyệt công thức',     icon: HiClipboardList },
  { path: '/admin/ingredients/pending',   label: 'Duyệt nguyên liệu',   icon: HiBeaker },
  { path: '/admin/users',                 label: 'Quản lý người dùng',  icon: HiUsers },
]
```

---

## Correctness Properties

*A property là một đặc tính hoặc hành vi phải đúng trong mọi lần thực thi hợp lệ của hệ thống — về cơ bản là một phát biểu hình thức về những gì hệ thống phải làm. Properties là cầu nối giữa đặc tả dạng ngôn ngữ tự nhiên và đảm bảo tính đúng đắn có thể kiểm chứng tự động.*


### Property 1: Layout renders children

*For any* React node hợp lệ được truyền vào prop `children` của `MainLayout` hoặc `AuthLayout`, node đó phải xuất hiện trong DOM được render bên trong vùng nội dung chính.

**Validates: Requirements 1.3, 2.1**

### Property 2: BottomNav active state theo route

*For any* path trong danh sách 5 tabs của `BottomNav`, khi `useLocation` trả về path đó, tab tương ứng phải có class active (`text-primary`), và tất cả các tab còn lại phải có class inactive (`text-gray-500`).

**Validates: Requirements 6.5, 6.6**

### Property 3: AdminSidebar toggle parity

*For any* số nguyên dương n, khi người dùng nhấn nút toggle Sidebar n lần liên tiếp, trạng thái `sidebarOpen` phải bằng `true` nếu n lẻ và `false` nếu n chẵn (bắt đầu từ trạng thái đóng).

**Validates: Requirements 3.4**

### Property 4: SearchBar controlled input

*For any* chuỗi ký tự được nhập vào `SearchBar` trong `Navbar`, giá trị hiển thị của input element phải bằng đúng chuỗi đó sau khi sự kiện `onChange` được xử lý.

**Validates: Requirements 4.4**

### Property 5: UserMenu avatar render

*For any* user object, nếu `user.avatar_url` tồn tại thì `UserMenu` phải render một `<img>` element; nếu `user.avatar_url` là null/undefined thì `UserMenu` phải render chữ viết tắt (initials) lấy từ `display_name` hoặc `username`.

**Validates: Requirements 5.1**

---

## Error Handling

### Layout-level errors

| Tình huống | Xử lý |
|-----------|-------|
| `children` là `null` hoặc `undefined` | React render nothing — không crash |
| `user` là `null` khi `isAuthenticated=true` | `UserMenu` dùng fallback initials "U", không crash |
| `useLocation` trả về path không có trong tabs | BottomNav hiển thị tất cả inactive — không crash |
| `logout()` API thất bại | `useAuth` đã xử lý: vẫn clear local state và redirect |
| `avatar_url` là URL broken | `<img>` onError fallback về initials |

### Navigation errors

| Tình huống | Xử lý |
|-----------|-------|
| Route không tồn tại | `AppRoutes` catch-all `*` → `NotFoundPage` |
| Protected route khi chưa auth | `ProtectedRoute` redirect về `/login` với `state.from` |
| Admin route khi không phải admin | Phase sau xử lý — hiện tại chưa có role guard |

---

## Testing Strategy

### Công cụ

- **Test runner:** Vitest (đã cài sẵn trong project)
- **DOM testing:** `@testing-library/react` + `happy-dom` (đã có trong devDependencies)
- **Property-based testing:** `fast-check` — thư viện PBT cho JavaScript/TypeScript

> Lý do chọn `fast-check`: tích hợp tốt với Vitest, hỗ trợ arbitrary generators cho React nodes và strings, cú pháp rõ ràng.

### Cấu trúc test

```
src/test/
├── layouts/
│   ├── MainLayout.test.jsx
│   ├── AuthLayout.test.jsx
│   └── AdminLayout.test.jsx
└── components/layout/
    ├── Navbar.test.jsx
    ├── BottomNav.test.jsx
    └── UserMenu.test.jsx
```

### Unit Tests (Example-based)

Các test cụ thể cần viết:

**MainLayout:**
- Render đúng cấu trúc (Navbar + main + BottomNav)
- `main` có class `pb-16 md:pb-0`
- Root div có class `min-h-screen bg-gray-50`

**AuthLayout:**
- Không render Navbar/BottomNav
- Hiển thị text "KitchenMate" và "Chia sẻ công thức nấu ăn"
- Form container có class `max-w-md`

**AdminLayout:**
- Sidebar ẩn mặc định trên mobile (sidebarOpen=false)
- Overlay xuất hiện khi sidebarOpen=true
- Click overlay đóng sidebar

**Navbar:**
- Hiển thị "Tạo công thức" + UserMenu khi isAuthenticated=true
- Hiển thị "Đăng nhập" + "Đăng ký" khi isAuthenticated=false
- SearchBar có `aria-label="Tìm kiếm công thức"`

**UserMenu:**
- Dropdown hiển thị đúng menu items (Hồ sơ, Bộ sưu tập, Đăng xuất)
- Click "Đăng xuất" gọi logout()
- Hiển thị "Đang đăng xuất..." khi isLoggingOut=true

**BottomNav:**
- Render đúng 5 tabs với đúng labels
- Badge đỏ xuất hiện trên tab "Hồ sơ"

### Property Tests (PBT với fast-check)

Mỗi property test chạy tối thiểu **100 iterations**.

```javascript
// Tag format: Feature: frontend-phase-3-layout-navigation, Property {n}: {text}
```

**Property 1 — Layout renders children** (`MainLayout.test.jsx`, `AuthLayout.test.jsx`):
```javascript
// Feature: frontend-phase-3-layout-navigation, Property 1: Layout renders children
fc.assert(fc.property(fc.string(), (content) => {
  const { getByText } = render(<MainLayout>{content}</MainLayout>)
  expect(getByText(content)).toBeInTheDocument()
}), { numRuns: 100 })
```

**Property 2 — BottomNav active state** (`BottomNav.test.jsx`):
```javascript
// Feature: frontend-phase-3-layout-navigation, Property 2: BottomNav active state theo route
const paths = ['/', '/explore', '/suggestions', '/pantry', '/profile']
fc.assert(fc.property(fc.constantFrom(...paths), (activePath) => {
  // mock useLocation trả về activePath
  // kiểm tra tab tương ứng có text-primary, các tab khác có text-gray-500
}), { numRuns: 100 })
```

**Property 3 — AdminSidebar toggle parity** (`AdminLayout.test.jsx`):
```javascript
// Feature: frontend-phase-3-layout-navigation, Property 3: AdminSidebar toggle parity
fc.assert(fc.property(fc.integer({ min: 1, max: 20 }), async (n) => {
  // click toggle n lần
  // kiểm tra sidebarOpen === (n % 2 === 1)
}), { numRuns: 100 })
```

**Property 4 — SearchBar controlled input** (`Navbar.test.jsx`):
```javascript
// Feature: frontend-phase-3-layout-navigation, Property 4: SearchBar controlled input
fc.assert(fc.property(fc.string(), (inputValue) => {
  // fireEvent.change với inputValue
  // kiểm tra input.value === inputValue
}), { numRuns: 100 })
```

**Property 5 — UserMenu avatar render** (`UserMenu.test.jsx`):
```javascript
// Feature: frontend-phase-3-layout-navigation, Property 5: UserMenu avatar render
const userWithAvatar = fc.record({ avatar_url: fc.webUrl(), display_name: fc.string() })
const userWithoutAvatar = fc.record({ avatar_url: fc.constant(null), username: fc.string({ minLength: 2 }) })
fc.assert(fc.property(fc.oneof(userWithAvatar, userWithoutAvatar), (user) => {
  // kiểm tra img xuất hiện nếu có avatar_url, initials nếu không
}), { numRuns: 100 })
```

### Lưu ý về PBT

- Không dùng PBT cho CSS responsive tests (1.4, 1.5) — đây là CSS class tĩnh, không có input variation
- Không dùng PBT cho accessibility attribute tests (8.3, 8.5) — là string literal cố định
- Không dùng PBT cho conditional render tests (4.5, 4.6) — chỉ có 2 trạng thái boolean
