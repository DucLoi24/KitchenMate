# Tài liệu Yêu cầu — Phase 12: Documentation

## Giới thiệu

Phase 12 hoàn thiện tài liệu hóa cho KitchenMate Backend — phase cuối cùng trước khi chuyển sang Deployment (Phase 13). Gồm hai phần chính: **API Documentation** tự động qua `drf-spectacular` (OpenAPI 3.0 + Swagger UI + ReDoc) và **README** hướng dẫn cài đặt, cấu hình, vận hành dự án.

Mục tiêu là đảm bảo bất kỳ developer mới nào cũng có thể clone repo, cài đặt, chạy server và khám phá toàn bộ API chỉ bằng cách đọc tài liệu — không cần hỏi thêm.

Dự án sử dụng Django 5.2 + Django REST Framework 3.16 + `drf-spectacular` 0.29 (đã có trong `requirements.txt`). Tất cả 192 tests từ Phase 1–11 phải tiếp tục pass sau khi thêm documentation.

## Bảng thuật ngữ

- **DRF_Spectacular**: Thư viện `drf-spectacular==0.29.0` — tự động generate OpenAPI 3.0 schema từ ViewSet và Serializer của DRF.
- **OpenAPI_Schema**: File JSON/YAML mô tả toàn bộ API theo chuẩn OpenAPI 3.0, được generate tại endpoint `/api/schema/`.
- **Swagger_UI**: Giao diện web tương tác để khám phá và thử nghiệm API, phục vụ tại `/api/docs/`.
- **ReDoc**: Giao diện web tài liệu API dạng đọc (read-only), phục vụ tại `/api/redoc/`.
- **Docstring**: Chuỗi tài liệu Python (triple-quoted string) đặt ngay sau khai báo class/method, được `drf-spectacular` dùng để tạo mô tả trong OpenAPI schema.
- **@extend_schema**: Decorator của `drf-spectacular` dùng để bổ sung metadata (summary, description, parameters, responses) cho từng action/endpoint.
- **README**: File `README.md` ở root của thư mục `KitchenMate_Backend/`, hướng dẫn cài đặt và vận hành dự án.
- **ViewSet**: Class DRF xử lý một nhóm endpoint liên quan (ví dụ: `RecipeViewSet`, `IngredientViewSet`).
- **Serializer**: Class DRF định nghĩa cấu trúc dữ liệu input/output của API.
- **JWT_Token**: JSON Web Token dùng cho xác thực, gồm `access` token (ngắn hạn) và `refresh` token (dài hạn).
- **SPECTACULAR_SETTINGS**: Dict cấu hình `drf-spectacular` trong `settings.py` của Django.

---

## Yêu cầu

### Yêu cầu 1: Cài đặt và cấu hình drf-spectacular

**User Story:** Là developer, tôi muốn `drf-spectacular` được cấu hình đúng trong Django settings, để hệ thống có thể tự động generate OpenAPI schema từ code hiện có.

#### Tiêu chí chấp nhận

1. THE Django_Settings SHALL thêm `'drf_spectacular'` vào `INSTALLED_APPS`.
2. THE Django_Settings SHALL định nghĩa `SPECTACULAR_SETTINGS` với ít nhất các trường: `TITLE`, `DESCRIPTION`, `VERSION`, `SERVE_INCLUDE_SCHEMA`.
3. WHEN `drf-spectacular` được cấu hình, THE Django_Settings SHALL đặt `DEFAULT_SCHEMA_CLASS` trong `REST_FRAMEWORK` thành `'drf_spectacular.openapi.AutoSchema'`.
4. THE SPECTACULAR_SETTINGS SHALL đặt `TITLE` là `'KitchenMate API'`, `VERSION` là `'1.0.0'`, `SERVE_INCLUDE_SCHEMA` là `False`.
5. IF `drf_spectacular` chưa có trong `INSTALLED_APPS`, THEN THE Django_App SHALL raise `ImproperlyConfigured` khi khởi động.

---

### Yêu cầu 2: Endpoint OpenAPI Schema

**User Story:** Là developer, tôi muốn có endpoint để tải OpenAPI schema, để tích hợp với các công cụ generate client code hoặc test tự động.

#### Tiêu chí chấp nhận

1. WHEN developer gửi `GET /api/schema/`, THE API SHALL trả về OpenAPI 3.0 schema dạng YAML với HTTP 200.
2. WHEN developer gửi `GET /api/schema/?format=json`, THE API SHALL trả về OpenAPI 3.0 schema dạng JSON với HTTP 200.
3. THE OpenAPI_Schema SHALL chứa đầy đủ tất cả các endpoint đã định nghĩa trong `urls.py` của dự án (accounts, ingredients, recipes, kitchen, social, admin_panel, recommendations).
4. THE OpenAPI_Schema SHALL chứa thông tin xác thực JWT (Bearer token) trong phần `securitySchemes`.
5. WHEN developer chưa xác thực gửi `GET /api/schema/`, THE API SHALL vẫn trả về schema với HTTP 200 (schema endpoint là public).

---

### Yêu cầu 3: Swagger UI tại /api/docs/

**User Story:** Là developer, tôi muốn có Swagger UI để khám phá và thử nghiệm API trực tiếp trên trình duyệt, để giảm thời gian đọc tài liệu tĩnh.

#### Tiêu chí chấp nhận

1. WHEN developer truy cập `GET /api/docs/`, THE API SHALL trả về trang Swagger UI với HTTP 200.
2. THE Swagger_UI SHALL hiển thị đầy đủ tất cả các endpoint được nhóm theo tag (accounts, ingredients, recipes, kitchen, social, admin).
3. THE Swagger_UI SHALL cho phép developer nhập JWT Bearer token để thử nghiệm các endpoint yêu cầu xác thực.
4. WHEN developer nhấn "Try it out" và gửi request từ Swagger UI, THE Swagger_UI SHALL hiển thị response thực tế từ server.
5. THE Swagger_UI SHALL hiển thị request body schema và response schema cho từng endpoint.

---

### Yêu cầu 4: ReDoc tại /api/redoc/

**User Story:** Là developer, tôi muốn có ReDoc để đọc tài liệu API dạng đẹp và dễ điều hướng, để chia sẻ với team hoặc stakeholder không cần thử nghiệm trực tiếp.

#### Tiêu chí chấp nhận

1. WHEN developer truy cập `GET /api/redoc/`, THE API SHALL trả về trang ReDoc với HTTP 200.
2. THE ReDoc SHALL hiển thị đầy đủ mô tả, parameters, request body và response schema cho từng endpoint.
3. THE ReDoc SHALL có sidebar điều hướng theo nhóm endpoint (tag).
4. WHEN developer chưa xác thực truy cập `/api/redoc/`, THE API SHALL vẫn trả về trang ReDoc với HTTP 200 (ReDoc là public).

---

### Yêu cầu 5: Docstring cho ViewSet

**User Story:** Là developer, tôi muốn tất cả ViewSet có docstring mô tả rõ ràng, để Swagger UI và ReDoc hiển thị tài liệu có nghĩa thay vì để trống.

#### Tiêu chí chấp nhận

1. THE RecipeViewSet SHALL có class-level docstring mô tả mục đích và danh sách các action (list, create, retrieve, update, destroy, my_recipes, publish).
2. THE IngredientViewSet SHALL có class-level docstring mô tả mục đích và các action (list, create, search).
3. THE PantryViewSet SHALL có class-level docstring mô tả mục đích quản lý tủ lạnh số.
4. THE ShoppingListViewSet SHALL có class-level docstring mô tả mục đích và action đặc biệt `mark_purchased`.
5. THE ReviewViewSet SHALL có class-level docstring mô tả mục đích quản lý đánh giá công thức.
6. THE CollectionViewSet SHALL có class-level docstring mô tả mục đích quản lý bộ sưu tập.
7. THE RecommendationViewSet SHALL có class-level docstring mô tả thuật toán Tier-3 Scoring và hai mode COOK_NOW/ADD_MORE.
8. FOR ALL custom action methods (publish, mark_purchased, suggest, approve, reject, search), THE ViewSet SHALL có method-level docstring mô tả input, output và business logic.

---

### Yêu cầu 6: Docstring cho Serializer

**User Story:** Là developer, tôi muốn các Serializer quan trọng có docstring, để OpenAPI schema hiển thị mô tả rõ ràng cho từng model schema.

#### Tiêu chí chấp nhận

1. THE RecipeCreateSerializer SHALL có class-level docstring mô tả cấu trúc input (nested ingredients, steps) và hành vi create.
2. THE RecipeDetailSerializer SHALL có class-level docstring mô tả các trường computed (avg_rating) và nested serializers.
3. THE PantrySerializer SHALL có class-level docstring mô tả cấu trúc output với nested ingredient.
4. THE ReviewSerializer SHALL có class-level docstring mô tả ràng buộc rating [1–5] và unique constraint (user, recipe).
5. THE RegisterSerializer SHALL có class-level docstring mô tả các trường bắt buộc và validation password.

---

### Yêu cầu 7: README — Hướng dẫn cài đặt

**User Story:** Là developer mới, tôi muốn có hướng dẫn cài đặt từng bước rõ ràng, để có thể chạy được dự án trên máy local trong vòng 15 phút.

#### Tiêu chí chấp nhận

1. THE README SHALL có section "Yêu cầu hệ thống" liệt kê: Python 3.11+, PostgreSQL 14+, Git.
2. THE README SHALL có section "Cài đặt" với các bước tuần tự: clone repo, tạo virtualenv, kích hoạt virtualenv, cài dependencies từ `requirements.txt`.
3. THE README SHALL có section "Cấu hình môi trường" hướng dẫn copy `.env.example` thành `.env` và điền các biến bắt buộc: `SECRET_KEY`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`.
4. THE README SHALL có section "Database" hướng dẫn tạo database PostgreSQL, chạy `python manage.py migrate`, tạo superuser bằng `python manage.py createsuperuser`.
5. THE README SHALL có section "Chạy development server" với lệnh `python manage.py runserver` và URL mặc định `http://127.0.0.1:8000/`.
6. THE README SHALL có section "Chạy tests" với lệnh `pytest` và hướng dẫn chạy theo nhóm (`pytest -m unit`, `pytest -m integration`, `pytest -m performance`).
7. THE README SHALL có section "API Documentation" với link tới Swagger UI (`/api/docs/`) và ReDoc (`/api/redoc/`).

---

### Yêu cầu 8: README — API Endpoints Overview

**User Story:** Là developer, tôi muốn có bảng tổng hợp tất cả API endpoints trong README, để nhanh chóng tìm endpoint cần dùng mà không cần mở Swagger UI.

#### Tiêu chí chấp nhận

1. THE README SHALL có section "API Endpoints" liệt kê đầy đủ tất cả endpoint theo nhóm: Authentication, Accounts, Ingredients, Recipes, Kitchen, Social, Recommendations, Admin.
2. FOR ALL endpoint trong README, THE README SHALL hiển thị: HTTP method, URL path, mô tả ngắn, và yêu cầu xác thực (Auth Required: Yes/No).
3. THE README SHALL có bảng tóm tắt Authentication endpoints: `POST /api/auth/register/`, `POST /api/auth/login/`, `POST /api/auth/refresh/`, `POST /api/auth/logout/`, `POST /api/auth/forgot-password/`, `POST /api/auth/reset-password/`.
4. THE README SHALL có bảng tóm tắt Recipe endpoints bao gồm cả `POST /api/recipes/{id}/publish/` và `GET /api/recipes/{id}/stats/`.
5. THE README SHALL có bảng tóm tắt Kitchen endpoints bao gồm `POST /api/kitchen/shopping-list/{id}/mark-purchased/` với ghi chú về atomic transaction.

---

### Yêu cầu 9: Tương thích ngược và không phá vỡ tests hiện có

**User Story:** Là developer, tôi muốn việc thêm documentation không làm hỏng bất kỳ test nào đang pass, để đảm bảo tính ổn định của hệ thống.

#### Tiêu chí chấp nhận

1. AFTER thêm `drf_spectacular` vào `INSTALLED_APPS` và cấu hình `SPECTACULAR_SETTINGS`, THE Test_Suite SHALL vẫn pass toàn bộ 192 tests hiện có.
2. WHEN thêm docstring vào ViewSet và Serializer, THE Test_Suite SHALL không có test nào bị fail do thay đổi docstring.
3. THE URL patterns cho `/api/schema/`, `/api/docs/`, `/api/redoc/` SHALL không xung đột với bất kỳ URL pattern nào đã có trong dự án.
4. WHEN chạy `python manage.py check`, THE Django_App SHALL không báo bất kỳ lỗi cấu hình nào liên quan đến `drf_spectacular`.
