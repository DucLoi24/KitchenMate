# Requirements Document

## Introduction

Tài liệu này mô tả các yêu cầu cho Phase 1 (Setup & Cấu hình dự án) và Phase 2 (Authentication) của KitchenMate Frontend. Đây là nền tảng cơ bản cho ứng dụng web chia sẻ công thức nấu ăn và quản lý tủ lạnh thông minh, sử dụng ReactJS + Vite kết nối với Backend API đã hoàn thiện.

## Glossary

- **Frontend_App**: Ứng dụng React được xây dựng bằng Vite
- **Backend_API**: RESTful API Django đã hoàn thiện tại http://localhost:8000/api/
- **Auth_Store**: Zustand store quản lý trạng thái xác thực người dùng
- **Access_Token**: JWT token ngắn hạn để xác thực API requests
- **Refresh_Token**: JWT token dài hạn để làm mới Access_Token
- **Axios_Instance**: HTTP client được cấu hình sẵn với interceptors
- **Protected_Route**: Route component yêu cầu người dùng đã đăng nhập
- **Admin_Route**: Route component yêu cầu người dùng có quyền admin
- **React_Query_Provider**: Provider cung cấp caching và data fetching cho toàn bộ app
- **Tailwind_Theme**: Cấu hình màu sắc và style tùy chỉnh (cam/xanh lá)
- **Form_Validator**: Zod schema để validate dữ liệu form
- **Toast_Notification**: Thông báo ngắn hiển thị kết quả thao tác

## Requirements

### Requirement 1: Khởi tạo dự án React với Vite

**User Story:** Là một developer, tôi muốn khởi tạo dự án React với Vite, để có môi trường phát triển nhanh và hiện đại.

#### Acceptance Criteria

1. THE Frontend_App SHALL được tạo bằng Vite với template React
2. THE Frontend_App SHALL sử dụng JavaScript (không bắt buộc TypeScript)
3. THE Frontend_App SHALL có cấu trúc thư mục chuẩn với các folder: api/, components/, pages/, stores/, hooks/, utils/, routes/, assets/
4. THE Frontend_App SHALL có file .env với biến VITE_API_BASE_URL=http://localhost:8000/api
5. THE Frontend_App SHALL có file .gitignore bao gồm node_modules/, dist/, .env

### Requirement 2: Cài đặt và cấu hình Tailwind CSS

**User Story:** Là một developer, tôi muốn sử dụng Tailwind CSS, để xây dựng giao diện responsive nhanh chóng.

#### Acceptance Criteria

1. THE Frontend_App SHALL cài đặt Tailwind CSS v3 với PostCSS và Autoprefixer
2. THE Frontend_App SHALL cấu hình Tailwind_Theme với màu chính cam (#FF6B35) và xanh lá (#4CAF50)
3. THE Frontend_App SHALL sử dụng mobile-first approach trong tất cả các component
4. THE Tailwind_Theme SHALL bao gồm custom breakpoints phù hợp với thiết bị di động

### Requirement 3: Cài đặt React Router v6

**User Story:** Là một developer, tôi muốn cấu hình React Router, để quản lý điều hướng giữa các trang.

#### Acceptance Criteria

1. THE Frontend_App SHALL cài đặt React Router DOM v6
2. THE Frontend_App SHALL cấu hình nested routes với layout components
3. THE Frontend_App SHALL hỗ trợ các route: /, /login, /register, /forgot-password, /reset-password
4. THE Frontend_App SHALL có AuthLayout cho trang đăng nhập/đăng ký (không có navbar)
5. THE Frontend_App SHALL có MainLayout cho các trang chính (có navbar và footer)

### Requirement 4: Cấu hình Axios với Interceptors

**User Story:** Là một developer, tôi muốn cấu hình Axios instance, để tự động xử lý authentication và errors.

#### Acceptance Criteria

1. THE Axios_Instance SHALL có base URL từ biến môi trường VITE_API_BASE_URL
2. WHEN một request được gửi đi, THE Axios_Instance SHALL tự động đính kèm Access_Token vào header Authorization
3. WHEN nhận response 401 Unauthorized, THE Axios_Instance SHALL tự động gọi API refresh token
4. IF refresh token thành công, THEN THE Axios_Instance SHALL retry request ban đầu với token mới
5. IF refresh token thất bại, THEN THE Axios_Instance SHALL xóa tokens và redirect về trang /login
6. THE Axios_Instance SHALL có timeout 30 giây cho mỗi request

### Requirement 5: Cấu hình React Query Provider

**User Story:** Là một developer, tôi muốn sử dụng React Query, để cache và quản lý API data hiệu quả.

#### Acceptance Criteria

1. THE Frontend_App SHALL cài đặt TanStack Query v5
2. THE React_Query_Provider SHALL bọc toàn bộ app component tree
3. THE React_Query_Provider SHALL cấu hình staleTime là 5 phút
4. THE React_Query_Provider SHALL cấu hình cacheTime là 10 phút
5. THE React_Query_Provider SHALL cấu hình retry 1 lần khi request thất bại

### Requirement 6: Cài đặt các thư viện UI và form validation

**User Story:** Là một developer, tôi muốn cài đặt các thư viện hỗ trợ UI, để xây dựng giao diện đẹp và trải nghiệm tốt.

#### Acceptance Criteria

1. THE Frontend_App SHALL cài đặt react-hot-toast cho notifications
2. THE Frontend_App SHALL cài đặt react-icons cho icon library
3. THE Frontend_App SHALL cài đặt @headlessui/react cho accessible UI components
4. THE Frontend_App SHALL cài đặt react-image-crop cho crop ảnh avatar
5. THE Frontend_App SHALL cài đặt swiper cho carousel/slider
6. THE Frontend_App SHALL cài đặt React Hook Form và Zod cho form validation
7. THE Frontend_App SHALL cài đặt Zustand cho global state management

### Requirement 7: Cấu hình Vite với proxy API

**User Story:** Là một developer, tôi muốn cấu hình proxy trong Vite, để tránh CORS issues trong môi trường development.

#### Acceptance Criteria

1. THE Frontend_App SHALL có file vite.config.js với cấu hình proxy
2. WHEN Frontend_App gửi request đến /api/*, THE proxy SHALL forward request đến http://localhost:8000/api/
3. THE proxy SHALL preserve cookies và headers trong quá trình forward
4. THE proxy SHALL có changeOrigin: true để tránh CORS issues

### Requirement 8: Tạo Auth Store với Zustand

**User Story:** Là một developer, tôi muốn tạo Auth Store, để quản lý trạng thái đăng nhập của người dùng.

#### Acceptance Criteria

1. THE Auth_Store SHALL lưu trữ user object, Access_Token, Refresh_Token, và isAuthenticated flag
2. THE Auth_Store SHALL có action login() nhận tokens và user data từ API response
3. THE Auth_Store SHALL có action logout() xóa tokens và user data
4. THE Auth_Store SHALL có action setUser() cập nhật thông tin user
5. THE Auth_Store SHALL có action refreshAccessToken() làm mới Access_Token
6. THE Auth_Store SHALL persist Access_Token và Refresh_Token vào localStorage
7. WHEN Frontend_App khởi động, THE Auth_Store SHALL tự động load tokens từ localStorage
8. WHEN tokens được xóa, THE Auth_Store SHALL xóa dữ liệu trong localStorage

### Requirement 9: Trang Đăng ký người dùng

**User Story:** Là một người dùng mới, tôi muốn đăng ký tài khoản, để sử dụng các tính năng của KitchenMate.

#### Acceptance Criteria

1. THE Frontend_App SHALL có trang /register với form đăng ký
2. THE form SHALL có các trường: username, email, password, confirm_password
3. THE Form_Validator SHALL validate email đúng định dạng
4. THE Form_Validator SHALL validate password tối thiểu 8 ký tự
5. THE Form_Validator SHALL validate password và confirm_password phải khớp nhau
6. WHEN form hợp lệ và user submit, THE Frontend_App SHALL gọi POST /api/auth/register/
7. IF đăng ký thành công, THEN THE Frontend_App SHALL hiển thị Toast_Notification thành công và redirect về /login
8. IF đăng ký thất bại, THEN THE Frontend_App SHALL hiển thị lỗi từ Backend_API (email đã tồn tại, username đã dùng)
9. WHILE form đang submit, THE Frontend_App SHALL hiển thị loading state và disable nút submit

### Requirement 10: Trang Đăng nhập

**User Story:** Là một người dùng đã đăng ký, tôi muốn đăng nhập, để truy cập vào tài khoản của mình.

#### Acceptance Criteria

1. THE Frontend_App SHALL có trang /login với form đăng nhập
2. THE form SHALL có các trường: email, password
3. THE Form_Validator SHALL validate email không được để trống
4. THE Form_Validator SHALL validate password không được để trống
5. WHEN form hợp lệ và user submit, THE Frontend_App SHALL gọi POST /api/auth/login/
6. IF đăng nhập thành công, THEN THE Auth_Store SHALL lưu Access_Token, Refresh_Token và user data
7. IF đăng nhập thành công, THEN THE Frontend_App SHALL redirect về trang trước đó hoặc trang chủ /
8. IF đăng nhập thất bại, THEN THE Frontend_App SHALL hiển thị lỗi "Email hoặc mật khẩu không đúng"
9. THE form SHALL có link "Quên mật khẩu?" dẫn đến /forgot-password
10. WHILE form đang submit, THE Frontend_App SHALL hiển thị loading state và disable nút submit

### Requirement 11: Tính năng Quên mật khẩu

**User Story:** Là một người dùng quên mật khẩu, tôi muốn reset mật khẩu, để có thể đăng nhập lại.

#### Acceptance Criteria

1. THE Frontend_App SHALL có trang /forgot-password với form nhập email
2. THE Form_Validator SHALL validate email đúng định dạng
3. WHEN user submit email, THE Frontend_App SHALL gọi POST /api/auth/forgot-password/
4. IF request thành công, THEN THE Frontend_App SHALL hiển thị thông báo "Đã gửi email hướng dẫn reset mật khẩu"
5. THE Frontend_App SHALL có trang /reset-password với query parameter token
6. THE /reset-password form SHALL có các trường: new_password, confirm_password
7. THE Form_Validator SHALL validate new_password tối thiểu 8 ký tự
8. THE Form_Validator SHALL validate new_password và confirm_password phải khớp nhau
9. WHEN user submit form reset, THE Frontend_App SHALL gọi POST /api/auth/reset-password/ với token và new_password
10. IF reset thành công, THEN THE Frontend_App SHALL hiển thị Toast_Notification và redirect về /login
11. IF token không hợp lệ hoặc hết hạn, THEN THE Frontend_App SHALL hiển thị lỗi "Link reset mật khẩu không hợp lệ hoặc đã hết hạn"

### Requirement 12: Protected Routes

**User Story:** Là một developer, tôi muốn bảo vệ các route yêu cầu đăng nhập, để người dùng chưa xác thực không thể truy cập.

#### Acceptance Criteria

1. THE Frontend_App SHALL có component Protected_Route
2. WHEN người dùng chưa đăng nhập truy cập Protected_Route, THE Frontend_App SHALL redirect về /login
3. THE Frontend_App SHALL lưu URL hiện tại vào state để redirect về sau khi đăng nhập thành công
4. WHEN người dùng đã đăng nhập truy cập Protected_Route, THE Frontend_App SHALL render component con bình thường
5. THE Protected_Route SHALL kiểm tra isAuthenticated từ Auth_Store

### Requirement 13: Admin Routes

**User Story:** Là một developer, tôi muốn bảo vệ các route admin, để chỉ admin mới có thể truy cập.

#### Acceptance Criteria

1. THE Frontend_App SHALL có component Admin_Route
2. WHEN người dùng chưa đăng nhập truy cập Admin_Route, THE Frontend_App SHALL redirect về /login
3. WHEN người dùng đã đăng nhập nhưng không phải admin truy cập Admin_Route, THE Frontend_App SHALL redirect về trang chủ / và hiển thị Toast_Notification "Bạn không có quyền truy cập"
4. WHEN người dùng là admin truy cập Admin_Route, THE Frontend_App SHALL render component con bình thường
5. THE Admin_Route SHALL kiểm tra user.is_staff hoặc user.is_superuser từ Auth_Store

### Requirement 14: Tự động làm mới Access Token

**User Story:** Là một người dùng, tôi muốn session của mình được duy trì tự động, để không phải đăng nhập lại liên tục.

#### Acceptance Criteria

1. WHEN Access_Token hết hạn và API trả về 401, THE Axios_Instance SHALL tự động gọi POST /api/auth/refresh/ với Refresh_Token
2. IF refresh thành công, THEN THE Axios_Instance SHALL cập nhật Access_Token mới vào Auth_Store
3. IF refresh thành công, THEN THE Axios_Instance SHALL retry request ban đầu với Access_Token mới
4. IF Refresh_Token hết hạn hoặc không hợp lệ, THEN THE Axios_Instance SHALL gọi Auth_Store.logout()
5. IF Refresh_Token hết hạn, THEN THE Frontend_App SHALL redirect về /login và hiển thị Toast_Notification "Phiên đăng nhập đã hết hạn"
6. THE Axios_Instance SHALL đảm bảo chỉ có một refresh token request được gửi đi tại một thời điểm (tránh race condition)

### Requirement 15: Tính năng Đăng xuất

**User Story:** Là một người dùng đã đăng nhập, tôi muốn đăng xuất, để bảo mật tài khoản khi không sử dụng.

#### Acceptance Criteria

1. THE Frontend_App SHALL có nút "Đăng xuất" trong dropdown menu của avatar
2. WHEN user click nút đăng xuất, THE Frontend_App SHALL gọi POST /api/auth/logout/ với Refresh_Token
3. WHEN logout API được gọi, THE Auth_Store SHALL xóa Access_Token, Refresh_Token và user data
4. WHEN logout API được gọi, THE Frontend_App SHALL xóa tokens khỏi localStorage
5. WHEN logout hoàn tất, THE Frontend_App SHALL redirect về trang /login
6. WHEN logout hoàn tất, THE Frontend_App SHALL hiển thị Toast_Notification "Đã đăng xuất thành công"
7. IF logout API thất bại, THE Frontend_App SHALL vẫn xóa tokens local và redirect về /login

### Requirement 16: Xử lý lỗi và Loading States

**User Story:** Là một người dùng, tôi muốn thấy trạng thái loading và thông báo lỗi rõ ràng, để biết ứng dụng đang xử lý hay có vấn đề gì.

#### Acceptance Criteria

1. WHILE form đang submit, THE Frontend_App SHALL hiển thị loading spinner trên nút submit
2. WHILE form đang submit, THE Frontend_App SHALL disable tất cả input fields và nút submit
3. WHEN API trả về lỗi validation, THE Frontend_App SHALL hiển thị lỗi bên dưới field tương ứng
4. WHEN API trả về lỗi server (500), THE Frontend_App SHALL hiển thị Toast_Notification "Có lỗi xảy ra, vui lòng thử lại"
5. WHEN API trả về lỗi network, THE Frontend_App SHALL hiển thị Toast_Notification "Không thể kết nối đến server"
6. THE Toast_Notification SHALL tự động đóng sau 3 giây
7. THE Toast_Notification thành công SHALL có màu xanh lá
8. THE Toast_Notification lỗi SHALL có màu đỏ

### Requirement 17: Responsive Design cho Authentication

**User Story:** Là một người dùng mobile, tôi muốn các trang đăng nhập/đăng ký hiển thị tốt trên điện thoại, để dễ dàng sử dụng.

#### Acceptance Criteria

1. THE form đăng ký/đăng nhập SHALL có width tối đa 400px trên desktop
2. THE form đăng ký/đăng nhập SHALL có padding 16px trên mobile
3. THE input fields SHALL có height tối thiểu 44px để dễ touch trên mobile
4. THE nút submit SHALL có height tối thiểu 44px để dễ touch trên mobile
5. THE form SHALL hiển thị tốt trên màn hình 375px (iPhone SE)
6. THE form labels và error messages SHALL có font size tối thiểu 14px trên mobile

### Requirement 18: Bảo mật Token Management

**User Story:** Là một developer, tôi muốn quản lý tokens an toàn, để bảo vệ tài khoản người dùng.

#### Acceptance Criteria

1. THE Access_Token SHALL được lưu trong memory (Auth_Store state) và localStorage
2. THE Refresh_Token SHALL được lưu trong localStorage với key "refresh_token"
3. THE Frontend_App SHALL không log tokens ra console trong production build
4. WHEN user đóng tab browser, THE tokens SHALL vẫn được giữ trong localStorage
5. WHEN user clear localStorage, THE Auth_Store SHALL tự động logout
6. THE Axios_Instance SHALL không gửi tokens trong URL query parameters
7. THE Axios_Instance SHALL chỉ gửi tokens qua Authorization header

