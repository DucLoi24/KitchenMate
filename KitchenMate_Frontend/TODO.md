# KitchenMate Frontend - TODO List

## Tổng quan dự án
Xây dựng Frontend cho KitchenMate sử dụng ReactJS + Tailwind CSS, kết nối với Backend API đã hoàn thiện (Phase 1-12).

**Backend API Base URL**: `http://localhost:8000/api/`
**Tài liệu API**: `http://localhost:8000/api/docs/` (Swagger UI)

---

## Phase 1: Setup & Cấu hình dự án

### 1.1 Khởi tạo dự án
- [x] Tạo dự án React với Vite: `npm create vite@latest kitchenmate-frontend -- --template react`
- [x] Cài đặt Tailwind CSS v3 (v4)
- [x] Cài đặt React Router DOM v6
- [x] Cài đặt Axios (HTTP client)
- [x] Cài đặt React Query (TanStack Query v5) — cache & fetch API data
- [x] Cài đặt React Hook Form + Zod (form validation)
- [x] Cài đặt Zustand (global state management — auth, user info)
- [x] Cài đặt các thư viện UI hỗ trợ:
  - `react-hot-toast` (notifications)
  - `react-icons` (icon library)
  - `@headlessui/react` (accessible UI components — modal, dropdown)
  - `react-image-crop` hoặc `react-easy-crop` (crop ảnh avatar)
  - `swiper` (carousel/slider cho trang chủ)

### 1.2 Cấu hình dự án
- [x] Cấu hình `vite.config.js` — proxy API để tránh CORS trong dev
- [x] Tạo file `.env` với `VITE_API_BASE_URL=http://localhost:8000/api`
- [x] Tạo cấu trúc thư mục chuẩn:
  ```
  src/
  ├── api/          # Axios instances + API call functions
  ├── assets/       # Ảnh, icon tĩnh
  ├── components/   # Reusable UI components
  ├── contexts/     # React Context (AuthContext)
  ├── hooks/        # Custom hooks
  ├── pages/        # Page components (route-level)
  ├── stores/       # Zustand stores
  ├── utils/        # Helper functions
  └── routes/       # Route definitions
  ```
- [x] Cấu hình Axios instance (`src/api/axiosInstance.js`):
  - Base URL từ env
  - Interceptor tự động đính kèm JWT token vào header
  - Interceptor xử lý 401 → tự động refresh token hoặc logout
- [x] Cấu hình React Query Provider bọc toàn bộ app
- [x] Cấu hình React Router với layout lồng nhau (nested routes)
- [x] Cấu hình Tailwind theme — màu sắc chính của KitchenMate (cam/xanh lá)

---

## Phase 2: Authentication (Đăng ký / Đăng nhập)

**API sử dụng**: `/api/auth/`

### 2.1 Auth Store (Zustand)
- [x] Tạo `src/stores/authStore.js`:
  - State: `user`, `accessToken`, `refreshToken`, `isAuthenticated`
  - Actions: `login()`, `logout()`, `setUser()`, `refreshAccessToken()`
  - Persist token vào `localStorage`

### 2.2 Trang Đăng ký (`/register`)
- [x] Form: Username, Email, Mật khẩu, Xác nhận mật khẩu
- [x] Validation với Zod (email format, password min 8 ký tự, password match)
- [x] Gọi `POST /api/auth/register/`
- [x] Hiển thị lỗi từ server (email đã tồn tại, username đã dùng)
- [x] Redirect sang `/login` sau khi đăng ký thành công

### 2.3 Trang Đăng nhập (`/login`)
- [x] Form: Email, Mật khẩu
- [x] Gọi `POST /api/auth/login/` → lưu `access` + `refresh` token
- [x] Redirect về trang trước đó hoặc trang chủ
- [x] Link "Quên mật khẩu"

### 2.4 Quên mật khẩu
- [x] Trang `/forgot-password`: nhập email → gọi `POST /api/auth/forgot-password/`
- [x] Trang `/reset-password?token=...`: nhập mật khẩu mới → gọi `POST /api/auth/reset-password/`

### 2.5 Protected Routes
- [x] Tạo component `ProtectedRoute` — redirect về `/login` nếu chưa đăng nhập
- [x] Tạo component `AdminRoute` — redirect nếu không phải admin
- [x] Tự động refresh token khi access token hết hạn (interceptor Axios)
- [x] Logout: gọi `POST /api/auth/logout/` + xóa token khỏi store

---

## Phase 3: Layout & Navigation

### 3.1 Layout chính
- [x] Component `MainLayout`:
  - Header/Navbar (logo, search bar, nav links, avatar dropdown)
  - Main content area
  - Bottom navigation bar (mobile — 5 tab: Trang chủ, Khám phá, Gợi ý, Tủ lạnh, Hồ sơ)
- [x] Component `AuthLayout` (cho trang login/register — không có navbar)
- [x] Component `AdminLayout` (sidebar cho trang admin)

### 3.2 Navbar (Desktop)
- [x] Logo KitchenMate (trái)
- [x] Search bar ở giữa (tìm kiếm công thức)
- [x] Nút "Tạo công thức" (nếu đã đăng nhập)
- [x] Avatar + dropdown menu (Hồ sơ, Bộ sưu tập, Đăng xuất)
- [x] Nút Đăng nhập / Đăng ký (nếu chưa đăng nhập)

### 3.3 Bottom Navigation (Mobile)
- [x] 5 tab: Trang chủ, Khám phá, Gợi ý món ăn, Tủ lạnh số, Hồ sơ
- [x] Active state cho tab hiện tại
- [x] Badge thông báo (nếu có)
- [x] Guest: protected tabs redirect to /login với toast message
- [x] Logged in: badge notification trên Hồ sơ tab

---

## Phase 4: Trang chủ & Khám phá công thức

**API sử dụng**: `GET /api/recipes/`

### 4.1 Trang chủ (`/`)
- [ ] Banner/Hero section (ảnh đẹp + tagline)
- [ ] Section "Công thức mới nhất" — danh sách RecipeCard (pagination/infinite scroll)
- [ ] Section "Công thức phổ biến" (sort theo rating hoặc save_count)
- [ ] Skeleton loading khi đang fetch data

### 4.2 Component `RecipeCard`
- [ ] Ảnh thumbnail (lazy loading)
- [ ] Tên món ăn, tác giả, thời gian, độ khó
- [ ] Điểm rating trung bình (sao)
- [ ] Nút "Lưu/Yêu thích" (toggle — gọi API collection)
- [ ] Responsive: 1 cột mobile, 2 cột tablet, 3-4 cột desktop

### 4.3 Trang Khám phá (`/explore`)
- [ ] Thanh tìm kiếm (search theo title)
- [ ] Bộ lọc:
  - Độ khó: EASY / MEDIUM / HARD
  - Thời gian: dưới 15 phút, 15-30 phút, 30-60 phút, trên 60 phút
  - Tìm theo nguyên liệu (autocomplete từ `/api/ingredients/search/`)
- [ ] Danh sách kết quả với pagination
- [ ] Trạng thái "Không tìm thấy kết quả"

---

## Phase 5: Chi tiết công thức & Cook Mode

**API sử dụng**: `GET /api/recipes/{id}/`, `GET /api/recipes/{id}/stats/`

### 5.1 Trang chi tiết công thức (`/recipes/:id`)
- [ ] Ảnh thumbnail lớn + thông tin tổng quan (tên, tác giả, thời gian, độ khó, rating)
- [ ] Thống kê: lượt xem, lượt lưu, điểm rating
- [ ] Danh sách nguyên liệu (có checkbox để chọn nguyên liệu thiếu)
- [ ] Nút "Thêm nguyên liệu thiếu vào danh sách đi chợ" → gọi `POST /api/kitchen/shopping-list/`
- [ ] Danh sách các bước thực hiện (có ảnh/video minh họa)
- [ ] Nút "Bắt đầu nấu" → vào Cook Mode
- [ ] Nút "Lưu vào bộ sưu tập"
- [ ] Section đánh giá & bình luận (Phase 8)

### 5.2 Cook Mode (giao diện nấu ăn)
- [ ] Giao diện tối giản, font chữ lớn, nền tối
- [ ] Hiển thị từng bước một (có nút Trước/Tiếp theo)
- [ ] Progress bar hiển thị đang ở bước mấy / tổng số bước
- [ ] Ảnh/video minh họa cho từng bước
- [ ] Bộ đếm thời gian (timer) cho từng bước (nếu có)
- [ ] Giữ màn hình luôn sáng (Wake Lock API)
- [ ] Nút thoát Cook Mode
- [ ] Sau bước cuối: màn hình chúc mừng + đề xuất đánh giá

---

## Phase 6: Tạo & Quản lý công thức

**API sử dụng**: `POST /api/recipes/`, `PUT/PATCH /api/recipes/{id}/`, `POST /api/recipes/{id}/publish/`

### 6.1 Trang tạo công thức (`/recipes/create`)
- [ ] Form thông tin cơ bản: Tiêu đề, Mô tả, Thời gian (phút), Độ khó, Danh mục
- [ ] Upload ảnh thumbnail (gọi `POST /api/recipes/upload/thumbnail/`)
- [ ] Section thêm nguyên liệu:
  - Autocomplete tìm kiếm nguyên liệu (`GET /api/ingredients/search/?q=`)
  - Nhập số lượng + đơn vị
  - Nút "Đề xuất nguyên liệu mới" nếu không tìm thấy
- [ ] Section soạn thảo các bước:
  - Thêm/xóa/sắp xếp bước (drag & drop)
  - Nhập nội dung hướng dẫn cho từng bước
  - Upload ảnh/video cho từng bước (`POST /api/recipes/upload/step-media/`)
- [ ] Toggle trạng thái: Riêng tư / Công khai
- [ ] Nút "Lưu nháp" (PRIVATE) và "Đăng công khai" (trigger AI moderation)
- [ ] Hiển thị thông báo kết quả AI (duyệt ngay / chờ admin / bị từ chối)

### 6.2 Trang chỉnh sửa công thức (`/recipes/:id/edit`)
- [ ] Load dữ liệu công thức hiện tại vào form
- [ ] Tương tự trang tạo mới
- [ ] Chỉ hiển thị với owner của công thức

### 6.3 Đề xuất nguyên liệu mới
- [ ] Modal "Thêm nguyên liệu mới": nhập tên + chọn category
- [ ] Gọi `POST /api/ingredients/` → hiển thị thông báo "Đang chờ duyệt"

---

## Phase 7: Tủ lạnh số & Danh sách đi chợ

**API sử dụng**: `/api/kitchen/pantry/`, `/api/kitchen/shopping-list/`

### 7.1 Trang Tủ lạnh số (`/pantry`)
- [ ] Danh sách nguyên liệu đang có (nhóm theo category)
- [ ] Thanh tìm kiếm lọc nhanh theo tên
- [ ] Thêm nguyên liệu: autocomplete + nhập số lượng + đơn vị
- [ ] Chỉnh sửa số lượng inline (click để sửa trực tiếp)
- [ ] Xóa nguyên liệu (swipe to delete trên mobile)
- [ ] Nút "Gợi ý món ăn" → chuyển sang trang gợi ý
- [ ] Trạng thái trống: hướng dẫn thêm nguyên liệu đầu tiên

### 7.2 Trang Danh sách đi chợ (`/shopping-list`)
- [ ] Danh sách nguyên liệu cần mua (phân biệt đã mua / chưa mua)
- [ ] Checkbox "Đã mua" → gọi `POST /api/kitchen/shopping-list/{id}/mark-purchased/`
  - Hiển thị loading state trong khi transaction đang xử lý
  - Gạch ngang nguyên liệu sau khi đánh dấu
  - Toast thông báo "Đã thêm vào tủ lạnh"
- [ ] Thêm nguyên liệu thủ công (autocomplete)
- [ ] Xóa nguyên liệu khỏi danh sách
- [ ] Nút "Xóa tất cả đã mua"

---

## Phase 8: Gợi ý món ăn (Matching Engine)

**API sử dụng**: `POST /api/recommendations/suggest/`

### 8.1 Trang Gợi ý món ăn (`/suggestions`)
- [ ] Chọn chế độ gợi ý:
  - "Nấu Ngay" (COOK_NOW) — có đủ 100% nguyên liệu
  - "Thêm Chút Nữa" (ADD_MORE) — thiếu tối đa 1-2 nguyên liệu phụ
- [ ] Phần "Loại trừ nguyên liệu": autocomplete chọn nguyên liệu không muốn ăn
- [ ] Nút "Tìm món ăn" → gọi API
- [ ] Hiển thị danh sách kết quả (RecipeCard mở rộng):
  - Điểm phù hợp
  - Danh sách nguyên liệu còn thiếu (nếu có)
  - Nút "Thêm nguyên liệu thiếu vào giỏ đi chợ"
- [ ] Trạng thái tủ lạnh trống → hướng dẫn thêm nguyên liệu
- [ ] Skeleton loading trong khi tính toán

---

## Phase 9: Tương tác xã hội (Reviews & Collections)

**API sử dụng**: `/api/social/`

### 9.1 Đánh giá & Bình luận
- [ ] Section reviews ở cuối trang chi tiết công thức
- [ ] Hiển thị điểm rating trung bình + phân bố sao (1-5)
- [ ] Danh sách reviews (avatar, tên, sao, nội dung, ảnh cooksnap, ngày đăng)
- [ ] Form đánh giá (chỉ khi đã đăng nhập):
  - Chọn số sao (1-5) bằng star rating component
  - Nhập bình luận (textarea)
  - Upload ảnh "trả bài" (cooksnap) → gọi `POST /api/social/reviews/{id}/upload-cooksnap/`
  - Gọi `POST /api/social/recipes/{recipe_id}/reviews/`
- [ ] Sửa/xóa review của chính mình

### 9.2 Bộ sưu tập (`/collections`)
- [ ] Trang danh sách bộ sưu tập của tôi
- [ ] Tạo bộ sưu tập mới (modal nhập tên)
- [ ] Xem chi tiết bộ sưu tập (danh sách RecipeCard)
- [ ] Gỡ công thức khỏi bộ sưu tập
- [ ] Xóa bộ sưu tập
- [ ] Modal "Lưu vào bộ sưu tập" (chọn hoặc tạo mới) — dùng ở nhiều nơi

---

## Phase 10: Hồ sơ cá nhân

**API sử dụng**: `/api/accounts/`

### 10.1 Trang hồ sơ cá nhân (`/profile/:id`)
- [ ] Ảnh đại diện, tên hiển thị, bio
- [ ] Thống kê: số công thức, tổng lượt thích, rating trung bình
- [ ] Danh sách công thức đã đăng (chỉ PUBLIC nếu xem người khác)
- [ ] Nút "Chỉnh sửa hồ sơ" (chỉ hiện với chính mình)

### 10.2 Chỉnh sửa hồ sơ
- [ ] Modal hoặc trang riêng `/profile/edit`
- [ ] Upload ảnh đại diện → gọi `POST /api/accounts/upload/avatar/`
  - Preview ảnh trước khi upload
  - Crop ảnh thành hình vuông
- [ ] Cập nhật tên hiển thị, bio → gọi `PATCH /api/accounts/me/`
- [ ] Đổi mật khẩu (form riêng)

### 10.3 Trang "Công thức của tôi" (`/my-recipes`)
- [ ] Danh sách tất cả công thức (cả PRIVATE, PUBLIC, PENDING)
- [ ] Badge trạng thái (Riêng tư / Công khai / Chờ duyệt)
- [ ] Nút Chỉnh sửa / Xóa / Công khai hóa
- [ ] Filter theo trạng thái

---

## Phase 11: Trang Admin

**API sử dụng**: `/api/admin/`

### 11.1 Dashboard Admin (`/admin`)
- [ ] Tổng quan: số công thức chờ duyệt, số nguyên liệu chờ duyệt, số user bị khóa
- [ ] Sidebar navigation

### 11.2 Duyệt công thức (`/admin/recipes/pending`)
- [ ] Danh sách công thức PENDING
- [ ] Xem chi tiết nội dung (tiêu đề, mô tả, các bước)
- [ ] Nút "Duyệt" → `POST /api/admin/recipes/{id}/approve/`
- [ ] Nút "Từ chối" → `POST /api/admin/recipes/{id}/reject/`

### 11.3 Duyệt nguyên liệu (`/admin/ingredients/pending`)
- [ ] Danh sách nguyên liệu PENDING (tên, category, người đề xuất)
- [ ] Nút "Duyệt" → `POST /api/admin/ingredients/{id}/approve/`
- [ ] Nút "Từ chối" → `POST /api/admin/ingredients/{id}/reject/`
- [ ] Chỉnh sửa tên (sửa lỗi chính tả) trước khi duyệt

### 11.4 Quản lý người dùng (`/admin/users`)
- [ ] Danh sách user (tên, email, ngày tạo, trạng thái)
- [ ] Tìm kiếm theo tên/email
- [ ] Nút "Khóa tài khoản" → `POST /api/admin/users/{id}/block/`
- [ ] Nút "Mở khóa" → `POST /api/admin/users/{id}/unblock/`

---

## Phase 12: UX & Polish

### 12.1 Loading & Error States
- [ ] Skeleton loading cho tất cả danh sách (RecipeCard, IngredientList...)
- [ ] Error boundary component
- [ ] Trang 404 Not Found
- [ ] Trang 403 Forbidden
- [ ] Empty state components (tủ lạnh trống, chưa có công thức...)

### 12.2 Toast Notifications
- [ ] Thành công: lưu công thức, đánh dấu đã mua, cập nhật hồ sơ...
- [ ] Lỗi: validation, server error, network error
- [ ] Info: công thức đang chờ duyệt

### 12.3 Responsive & Mobile UX
- [ ] Kiểm tra toàn bộ trang trên màn hình 375px (iPhone SE)
- [ ] Touch-friendly: nút tối thiểu 44x44px
- [ ] Swipe gestures cho danh sách (xóa nguyên liệu)
- [ ] Pull-to-refresh cho danh sách chính

### 12.4 Performance
- [ ] Lazy loading ảnh (Intersection Observer hoặc `loading="lazy"`)
- [ ] Code splitting theo route (React.lazy + Suspense)
- [ ] Debounce cho search/autocomplete input (300ms)
- [ ] Infinite scroll hoặc pagination cho danh sách dài

---

## Phase 13: Testing & Deployment

### 13.1 Testing
- [ ] Viết unit test cho các utility functions (`src/utils/`)
- [ ] Viết component test cho các form (React Testing Library)
- [ ] Test auth flow (login, logout, token refresh)
- [ ] Test Check-to-Pantry flow (mark purchased → pantry update)

### 13.2 Build & Deployment
- [ ] Cấu hình `.env.production` với API URL production
- [ ] Build production: `npm run build`
- [ ] Kiểm tra bundle size (target < 500KB gzipped)
- [ ] Deploy lên Vercel / Netlify hoặc serve qua Nginx

---

## Thứ tự ưu tiên thực hiện

1. **Phase 1** — Setup dự án (nền tảng)
2. **Phase 2** — Authentication (bắt buộc cho mọi tính năng)
3. **Phase 3** — Layout & Navigation (khung sườn UI)
4. **Phase 4** — Trang chủ & Khám phá (tính năng cốt lõi đầu tiên)
5. **Phase 5** — Chi tiết công thức & Cook Mode
6. **Phase 7** — Tủ lạnh số & Danh sách đi chợ
7. **Phase 8** — Gợi ý món ăn (tính năng đặc trưng)
8. **Phase 6** — Tạo & Quản lý công thức
9. **Phase 9** — Tương tác xã hội
10. **Phase 10** — Hồ sơ cá nhân
11. **Phase 11** — Trang Admin
12. **Phase 12** — UX Polish
13. **Phase 13** — Testing & Deployment

---

## Ghi chú kỹ thuật

### API Endpoints tham khảo
| Tính năng | Method | Endpoint |
|-----------|--------|----------|
| Đăng ký | POST | `/api/auth/register/` |
| Đăng nhập | POST | `/api/auth/login/` |
| Refresh token | POST | `/api/auth/refresh/` |
| Đăng xuất | POST | `/api/auth/logout/` |
| Thông tin tôi | GET | `/api/accounts/me/` |
| Cập nhật profile | PATCH | `/api/accounts/me/` |
| Upload avatar | POST | `/api/accounts/upload/avatar/` |
| Danh sách công thức | GET | `/api/recipes/` |
| Chi tiết công thức | GET | `/api/recipes/{id}/` |
| Tạo công thức | POST | `/api/recipes/` |
| Công khai công thức | POST | `/api/recipes/{id}/publish/` |
| Upload thumbnail | POST | `/api/recipes/upload/thumbnail/` |
| Upload step media | POST | `/api/recipes/upload/step-media/` |
| Tìm nguyên liệu | GET | `/api/ingredients/search/?q=` |
| Đề xuất nguyên liệu | POST | `/api/ingredients/` |
| Xem tủ lạnh | GET | `/api/kitchen/pantry/` |
| Thêm vào tủ lạnh | POST | `/api/kitchen/pantry/` |
| Xem danh sách đi chợ | GET | `/api/kitchen/shopping-list/` |
| Đánh dấu đã mua | POST | `/api/kitchen/shopping-list/{id}/mark-purchased/` |
| Gợi ý món ăn | POST | `/api/recommendations/suggest/` |
| Xem reviews | GET | `/api/social/recipes/{id}/reviews/` |
| Tạo review | POST | `/api/social/recipes/{id}/reviews/` |
| Upload cooksnap | POST | `/api/social/reviews/{id}/upload-cooksnap/` |
| Danh sách bộ sưu tập | GET | `/api/social/collections/` |
| Thêm vào bộ sưu tập | POST | `/api/social/collections/{id}/add-recipe/` |
| Thống kê công thức | GET | `/api/recipes/{id}/stats/` |

### Lưu ý quan trọng
- Tất cả API cần auth phải đính kèm header: `Authorization: Bearer <access_token>`
- Khi nhận lỗi 401, tự động gọi `/api/auth/refresh/` để lấy token mới
- Ảnh upload phải validate: chỉ chấp nhận jpg/png/webp, tối đa 5MB
- Debounce autocomplete search 300ms để tránh spam API
- Sử dụng React Query để cache data, tránh gọi API lặp lại không cần thiết

---

**Tạo lúc**: Phase 12 Backend hoàn thiện (192 tests pass)
**Bắt đầu từ**: Phase 1 Frontend Setup
