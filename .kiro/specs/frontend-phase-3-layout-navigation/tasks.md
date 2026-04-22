# Tasks — Frontend Phase 3: Layout & Navigation

## Task List

- [x] 1. Cài đặt fast-check cho property-based testing
  - [x] 1.1 Cài `fast-check` và `@testing-library/react` vào devDependencies
  - [x] 1.2 Kiểm tra `vitest.config.js` / `vite.config.js` đã cấu hình test environment `happy-dom`

- [x] 2. Cập nhật `UserMenu` component
  - [x] 2.1 Thay menu item "Cài đặt" (`/settings`) bằng "Bộ sưu tập" (`/collections`)
  - [x] 2.2 Đảm bảo avatar fallback initials lấy từ `display_name` trước, `username` sau

- [x] 3. Tạo `Navbar` component
  - [x] 3.1 Tạo file `src/components/layout/Navbar.jsx`
  - [x] 3.2 Implement SearchBar controlled input với `aria-label="Tìm kiếm công thức"`
  - [x] 3.3 Implement conditional render: auth actions vs guest actions
  - [x] 3.4 Đọc `isAuthenticated` và `user` từ `useAuth` hook

- [x] 4. Tạo `BottomNav` component
  - [x] 4.1 Tạo file `src/components/layout/BottomNav.jsx`
  - [x] 4.2 Implement 5 tabs với icons từ `react-icons`
  - [x] 4.3 Implement active state dùng `useLocation`
  - [x] 4.4 Thêm badge placeholder (chấm đỏ tĩnh) trên tab "Hồ sơ"
  - [x] 4.5 Đảm bảo touch target tối thiểu 44×44px cho mỗi tab

- [x] 5. Tạo `AdminSidebar` component
  - [x] 5.1 Tạo file `src/components/layout/AdminSidebar.jsx`
  - [x] 5.2 Implement nav items với `NavLink` và active highlight màu `primary`
  - [x] 5.3 Implement responsive: desktop luôn hiển thị, mobile slide-in qua `translate-x`
  - [x] 5.4 Thêm `aria-label="Admin navigation"` trên phần tử `nav`

- [x] 6. Cập nhật `MainLayout`
  - [x] 6.1 Thay placeholder Navbar bằng component `Navbar` thật
  - [x] 6.2 Thay placeholder BottomNav bằng component `BottomNav` thật
  - [x] 6.3 Đổi `{children}` thành `<Outlet />` để hỗ trợ nested routes
  - [x] 6.4 Xóa footer placeholder không cần thiết

- [x] 7. Tạo `AdminLayout`
  - [x] 7.1 Tạo file `src/layouts/AdminLayout.jsx`
  - [x] 7.2 Implement state `sidebarOpen` và toggle button cho mobile
  - [x] 7.3 Implement overlay khi sidebar mở trên mobile (`aria-hidden="true"`)
  - [x] 7.4 Render `<Outlet />` trong vùng nội dung chính

- [x] 8. Cập nhật `AuthLayout`
  - [x] 8.1 Đổi `{children}` thành `<Outlet />` để hỗ trợ nested routes

- [x] 9. Refactor `AppRoutes` sang nested routes
  - [x] 9.1 Bọc auth routes (`/login`, `/register`, `/forgot-password`, `/reset-password`) bằng `AuthLayout`
  - [x] 9.2 Bọc main routes bằng `MainLayout` với `ProtectedRoute` cho các route cần auth
  - [x] 9.3 Bọc admin routes bằng `AdminLayout`
  - [x] 9.4 Tạo placeholder page components cho các route chưa có (`ExplorePage`, `SuggestionsPage`, `PantryPage`, `ProfilePage`, `MyRecipesPage`, `CollectionsPage`, `CreateRecipePage`, các AdminPage)

- [x] 10. Cập nhật `src/layouts/index.js` export
  - [x] 10.1 Thêm export `AdminLayout`

- [x] 11. Viết unit tests (example-based)
  - [x] 11.1 `MainLayout.test.jsx` — cấu trúc render, CSS classes
  - [x] 11.2 `AuthLayout.test.jsx` — không có nav, logo text
  - [x] 11.3 `AdminLayout.test.jsx` — sidebar toggle, overlay
  - [x] 11.4 `Navbar.test.jsx` — conditional auth render, aria-label
  - [x] 11.5 `BottomNav.test.jsx` — 5 tabs, badge
  - [x] 11.6 `UserMenu.test.jsx` — menu items, logout handler, loading state

- [x] 12. Viết property-based tests (fast-check)
  - [x] 12.1 Property 1: Layout renders children — `MainLayout` và `AuthLayout`
  - [x] 12.2 Property 2: BottomNav active state theo route
  - [x] 12.3 Property 3: AdminSidebar toggle parity
  - [x] 12.4 Property 4: SearchBar controlled input
  - [x] 12.5 Property 5: UserMenu avatar render

- [x] 13. Kiểm tra tích hợp cuối
  - [x] 13.1 Chạy `npm run test` — tất cả tests pass
  - [x] 13.2 Kiểm tra không có lỗi import/export
  - [x] 13.3 Kiểm tra `AppRoutes` render đúng layout cho từng nhóm route
