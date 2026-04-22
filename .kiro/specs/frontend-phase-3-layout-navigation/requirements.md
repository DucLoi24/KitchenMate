# Requirements Document

## Introduction

Phase 3 xây dựng hệ thống Layout & Navigation cho KitchenMate — ứng dụng chia sẻ công thức nấu ăn dành cho người dùng Việt Nam. Đây là "khung sườn UI" cho toàn bộ app, bao gồm ba layout chính (`MainLayout`, `AuthLayout`, `AdminLayout`), Navbar desktop, Bottom Navigation mobile, và tích hợp với hệ thống auth (Zustand `authStore`) đã có sẵn từ Phase 2.

Tất cả component được xây dựng theo nguyên tắc Mobile-First với Tailwind CSS, sử dụng React Router DOM v6 để quản lý routing và active state.

## Glossary

- **MainLayout**: Layout bao bọc các trang chính của app (trang chủ, khám phá, hồ sơ...) — có Navbar (desktop) và BottomNav (mobile)
- **AuthLayout**: Layout cho các trang xác thực (login, register, forgot-password) — không có Navbar
- **AdminLayout**: Layout cho các trang quản trị — có Sidebar có thể collapse
- **Navbar**: Thanh điều hướng ngang hiển thị trên desktop (`hidden md:flex`)
- **BottomNav**: Thanh điều hướng dưới cùng hiển thị trên mobile (`md:hidden`)
- **Sidebar**: Thanh điều hướng dọc dành cho AdminLayout, có thể collapse trên mobile
- **UserMenu**: Component dropdown menu hiển thị avatar + thông tin user + các action (Hồ sơ, Bộ sưu tập, Đăng xuất)
- **SearchBar**: Ô tìm kiếm công thức trên Navbar (chỉ UI, chưa gọi API)
- **AuthStore**: Zustand store quản lý trạng thái xác thực — cung cấp `user`, `isAuthenticated`, `logout`
- **useAuth**: Custom hook bọc AuthStore — cung cấp `user`, `isAuthenticated`, `logout()`
- **ProtectedRoute**: Component bảo vệ route — redirect về `/login` nếu chưa xác thực
- **AppRoutes**: Component cấu hình toàn bộ route của app
- **NavLink**: Component của React Router DOM v6 hỗ trợ active state tự động theo route hiện tại
- **Active Tab**: Tab/link đang được chọn, hiển thị màu `primary` (cam) để phân biệt với các tab khác

---

## Requirements

### Requirement 1: MainLayout — Cấu trúc layout chính

**User Story:** As a người dùng KitchenMate, I want các trang chính của app có cấu trúc nhất quán với header và navigation, so that tôi có thể điều hướng dễ dàng trên cả desktop lẫn mobile.

#### Acceptance Criteria

1. THE `MainLayout` SHALL bao bọc `children` bên trong một cấu trúc gồm: Navbar (desktop), vùng nội dung chính (`main`), và BottomNav (mobile).
2. WHEN `MainLayout` được render, THE `main` content area SHALL có padding-bottom đủ để nội dung không bị che khuất bởi BottomNav trên mobile (`pb-16 md:pb-0`).
3. THE `MainLayout` SHALL nhận prop `children` kiểu `PropTypes.node` và render `children` bên trong vùng nội dung chính.
4. WHEN màn hình có chiều rộng nhỏ hơn breakpoint `md` (768px), THE `MainLayout` SHALL hiển thị BottomNav và ẩn Navbar.
5. WHEN màn hình có chiều rộng từ breakpoint `md` (768px) trở lên, THE `MainLayout` SHALL hiển thị Navbar và ẩn BottomNav.
6. THE `MainLayout` SHALL áp dụng background màu `gray-50` cho toàn bộ trang (`min-h-screen bg-gray-50`).

---

### Requirement 2: AuthLayout — Layout xác thực

**User Story:** As a người dùng chưa đăng nhập, I want trang login/register có giao diện tập trung không bị phân tâm bởi navigation, so that tôi có thể hoàn thành việc đăng nhập/đăng ký nhanh chóng.

#### Acceptance Criteria

1. THE `AuthLayout` SHALL render `children` bên trong một container căn giữa màn hình theo cả chiều ngang lẫn chiều dọc.
2. THE `AuthLayout` SHALL KHÔNG hiển thị Navbar, BottomNav, hoặc Sidebar.
3. THE `AuthLayout` SHALL hiển thị logo "KitchenMate" và tagline "Chia sẻ công thức nấu ăn" phía trên form container.
4. THE `AuthLayout` SHALL áp dụng background gradient từ `primary/10` qua `white` đến `secondary/10`.
5. THE `AuthLayout` SHALL giới hạn chiều rộng form container tối đa `max-w-md` và có padding `p-4` trên mobile.
6. THE `AuthLayout` SHALL nhận prop `children` kiểu `PropTypes.node` và render bên trong card có `bg-white rounded-lg shadow-xl`.

---

### Requirement 3: AdminLayout — Layout quản trị

**User Story:** As a admin KitchenMate, I want trang quản trị có sidebar navigation để truy cập nhanh các chức năng quản lý, so that tôi có thể quản lý nội dung hiệu quả.

#### Acceptance Criteria

1. THE `AdminLayout` SHALL render `children` bên trong một layout hai cột gồm Sidebar (trái) và vùng nội dung chính (phải).
2. THE `AdminLayout` SHALL hiển thị Sidebar với các mục điều hướng: Dashboard (`/admin`), Duyệt công thức (`/admin/recipes/pending`), Duyệt nguyên liệu (`/admin/ingredients/pending`), Quản lý người dùng (`/admin/users`).
3. WHEN màn hình có chiều rộng nhỏ hơn breakpoint `md` (768px), THE `AdminLayout` SHALL ẩn Sidebar theo mặc định và hiển thị nút toggle để mở/đóng Sidebar.
4. WHEN người dùng nhấn nút toggle Sidebar trên mobile, THE `AdminLayout` SHALL chuyển đổi trạng thái hiển thị Sidebar (collapsed ↔ expanded).
5. WHEN Sidebar đang mở trên mobile, THE `AdminLayout` SHALL hiển thị overlay mờ phía sau Sidebar để người dùng có thể đóng bằng cách nhấn vào overlay.
6. THE `AdminLayout` SHALL hiển thị tên "KitchenMate Admin" ở đầu Sidebar.
7. THE `AdminLayout` SHALL highlight mục Sidebar tương ứng với route hiện tại bằng màu `primary`.

---

### Requirement 4: Navbar — Thanh điều hướng desktop

**User Story:** As a người dùng trên desktop, I want thanh điều hướng phía trên với logo, search bar, và các nút hành động, so that tôi có thể tìm kiếm công thức và truy cập tài khoản nhanh chóng.

#### Acceptance Criteria

1. THE `Navbar` SHALL chỉ hiển thị trên màn hình từ breakpoint `md` trở lên (`hidden md:flex`).
2. THE `Navbar` SHALL hiển thị logo "KitchenMate" ở phía bên trái, liên kết về trang chủ (`/`).
3. THE `Navbar` SHALL hiển thị `SearchBar` ở vị trí trung tâm với placeholder "Tìm kiếm công thức...".
4. WHEN người dùng nhập vào `SearchBar`, THE `SearchBar` SHALL cập nhật giá trị input (controlled component) mà không gọi API.
5. WHILE `isAuthenticated` là `true`, THE `Navbar` SHALL hiển thị nút "Tạo công thức" liên kết đến `/recipes/create` và component `UserMenu`.
6. WHILE `isAuthenticated` là `false`, THE `Navbar` SHALL hiển thị nút "Đăng nhập" liên kết đến `/login` và nút "Đăng ký" liên kết đến `/register`.
7. THE `Navbar` SHALL có chiều cao cố định `h-16` và background `bg-white` với `shadow-sm`.
8. THE `Navbar` SHALL đọc trạng thái xác thực từ `useAuth` hook (`isAuthenticated`, `user`).

---

### Requirement 5: UserMenu — Dropdown menu người dùng

**User Story:** As a người dùng đã đăng nhập, I want dropdown menu từ avatar để truy cập hồ sơ và đăng xuất, so that tôi có thể quản lý tài khoản mà không cần rời trang hiện tại.

#### Acceptance Criteria

1. THE `UserMenu` SHALL hiển thị avatar của user — ảnh thật nếu `user.avatar_url` tồn tại, ngược lại hiển thị chữ viết tắt từ `user.display_name` hoặc `user.username`.
2. WHEN người dùng nhấn vào avatar, THE `UserMenu` SHALL mở dropdown menu sử dụng `@headlessui/react Menu` component.
3. THE `UserMenu` dropdown SHALL hiển thị các mục: tên và email user (header), "Hồ sơ cá nhân" (link `/profile`), "Bộ sưu tập" (link `/collections`), "Đăng xuất" (button).
4. WHEN người dùng nhấn "Đăng xuất", THE `UserMenu` SHALL gọi `logout()` từ `useAuth` hook.
5. WHILE đang xử lý đăng xuất (`isLoggingOut` là `true`), THE `UserMenu` SHALL hiển thị text "Đang đăng xuất..." và disable nút đăng xuất.
6. THE `UserMenu` SHALL hiển thị tên user (`display_name` hoặc `username`) bên cạnh avatar trên màn hình `md` trở lên (`hidden md:block`).

---

### Requirement 6: BottomNav — Thanh điều hướng mobile

**User Story:** As a người dùng trên mobile, I want thanh điều hướng cố định ở dưới cùng màn hình với 5 tab chính, so that tôi có thể chuyển trang bằng ngón tay cái mà không cần cuộn lên đầu trang.

#### Acceptance Criteria

1. THE `BottomNav` SHALL chỉ hiển thị trên màn hình nhỏ hơn breakpoint `md` (`md:hidden`).
2. THE `BottomNav` SHALL được cố định ở dưới cùng màn hình (`fixed bottom-0 left-0 right-0`) với `bg-white` và `border-t`.
3. THE `BottomNav` SHALL hiển thị đúng 5 tab theo thứ tự: Trang chủ (`/`), Khám phá (`/explore`), Gợi ý (`/suggestions`), Tủ lạnh (`/pantry`), Hồ sơ (`/profile`).
4. THE `BottomNav` SHALL hiển thị icon và nhãn văn bản cho mỗi tab — icon từ thư viện `react-icons`.
5. WHEN route hiện tại khớp với đường dẫn của một tab, THE `BottomNav` SHALL hiển thị tab đó với màu `primary` (cam) để biểu thị trạng thái active.
6. WHEN route hiện tại không khớp với tab nào, THE `BottomNav` SHALL hiển thị tất cả tab với màu `gray-500` (inactive).
7. THE `BottomNav` SHALL sử dụng `useLocation` từ React Router DOM v6 để xác định route hiện tại và tính toán active state.
8. THE `BottomNav` SHALL hiển thị badge placeholder (chấm tròn màu đỏ) trên tab "Hồ sơ" — badge này chỉ là UI tĩnh, chưa có logic thực.
9. THE `BottomNav` SHALL có chiều cao `h-16` và mỗi tab có vùng nhấn tối thiểu `44x44px` để đảm bảo touch-friendly.

---

### Requirement 7: Tích hợp Layout vào AppRoutes

**User Story:** As a developer, I want các route được bọc bởi layout phù hợp, so that mỗi trang tự động có đúng cấu trúc UI mà không cần khai báo lại layout trong từng page component.

#### Acceptance Criteria

1. THE `AppRoutes` SHALL bọc các route trang chính (`/`, `/explore`, `/suggestions`, `/pantry`, `/profile`, `/my-recipes`, `/collections`) bằng `MainLayout`.
2. THE `AppRoutes` SHALL bọc các route xác thực (`/login`, `/register`, `/forgot-password`, `/reset-password`) bằng `AuthLayout`.
3. THE `AppRoutes` SHALL bọc các route admin (`/admin`, `/admin/*`) bằng `AdminLayout`.
4. WHEN người dùng chưa xác thực truy cập route được bảo vệ, THE `ProtectedRoute` SHALL redirect về `/login` — hành vi này không thay đổi so với Phase 2.
5. THE `AppRoutes` SHALL sử dụng nested routes của React Router DOM v6 (`<Route element={<Layout />}><Route path="..." /></Route>`) để tổ chức layout.

---

### Requirement 8: Responsive & Accessibility

**User Story:** As a người dùng KitchenMate, I want giao diện navigation hoạt động tốt trên mọi kích thước màn hình và dễ sử dụng, so that tôi có thể dùng app thoải mái dù đang dùng điện thoại hay máy tính.

#### Acceptance Criteria

1. THE Layout System SHALL áp dụng nguyên tắc Mobile-First — tất cả style mặc định cho màn hình 375px, sau đó override bằng `md:` và `lg:` prefix.
2. THE `BottomNav` SHALL đảm bảo mỗi tab có vùng nhấn (`touch target`) tối thiểu 44x44px theo chuẩn mobile UX.
3. THE `Navbar` `SearchBar` SHALL có `aria-label="Tìm kiếm công thức"` để hỗ trợ screen reader.
4. THE `UserMenu` SHALL sử dụng `@headlessui/react Menu` component để đảm bảo keyboard navigation và ARIA attributes đúng chuẩn.
5. THE `AdminLayout` Sidebar SHALL có `aria-label="Admin navigation"` trên phần tử `nav`.
6. WHEN `AdminLayout` Sidebar overlay được hiển thị trên mobile, THE overlay SHALL có `aria-hidden="true"` vì nó chỉ là yếu tố thị giác.
