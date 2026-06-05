# KitchenMate Backend

Backend API cho ứng dụng quản lý nguyên liệu và gợi ý món ăn thông minh KitchenMate.

## Giới thiệu

KitchenMate Backend cung cấp RESTful API cho phép người dùng quản lý tủ lạnh số, danh sách đi chợ, công thức nấu ăn và nhận gợi ý món ăn thông minh dựa trên nguyên liệu hiện có. Hệ thống tích hợp AI moderation (Ollama Local LLM) để kiểm duyệt nội dung tự động.

## Tech Stack

- **Framework**: Django 5.2 + Django REST Framework 3.16
- **Database**: PostgreSQL
- **Authentication**: JWT (Simple JWT)
- **API Documentation**: drf-spectacular 0.29 (Swagger UI + ReDoc)
- **AI Moderation**: Ollama Local LLM (gemma4:e2b)
- **Testing**: pytest + Hypothesis (property-based testing)

---

## Yêu cầu hệ thống

- **Python** 3.11+
- **PostgreSQL** 14+
- **Git**
- (Tùy chọn) **Ollama** — để chạy AI moderation local

---

## Cài đặt

### 1. Clone repository

```bash
git clone <repo-url>
cd KitchenMate_Backend
```

### 2. Tạo virtual environment

```bash
python -m venv venv
```

### 3. Kích hoạt virtual environment

**Linux / macOS:**
```bash
source venv/bin/activate
```

**Windows:**
```bash
venv\Scripts\activate
```

### 4. Cài đặt dependencies

```bash
pip install -r requirements.txt
```

---

## Cấu hình môi trường

### Copy file cấu hình mẫu

```bash
cp .env.example .env
```

### Điền các biến bắt buộc trong file `.env`

```env
# Bắt buộc
SECRET_KEY=your-secret-key-here        # Django secret key (chuỗi ngẫu nhiên dài)
DB_NAME=kitchenmate_db                 # Tên database PostgreSQL
DB_USER=postgres                       # Username PostgreSQL
DB_PASSWORD=your-password              # Mật khẩu PostgreSQL

# Tùy chọn (có giá trị mặc định)
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
DB_HOST=localhost
DB_PORT=5432
```

### Giải thích các biến quan trọng

| Biến | Mô tả | Bắt buộc |
|------|-------|----------|
| `SECRET_KEY` | Django secret key — dùng để ký JWT và session. Phải là chuỗi ngẫu nhiên, bí mật | Có |
| `DB_NAME` | Tên database PostgreSQL đã tạo | Có |
| `DB_USER` | Username kết nối PostgreSQL | Có |
| `DB_PASSWORD` | Mật khẩu kết nối PostgreSQL | Có |
| `DEBUG` | `True` cho development, `False` cho production | Không |
| `OLLAMA_BASE_URL` | URL của Ollama server (mặc định: `http://localhost:11434`) | Không |
| `OLLAMA_MODEL` | Model AI dùng để moderation (mặc định: `gemma4:e2b`) | Không |
| `EMAIL_HOST_USER` | Gmail dùng để gửi email reset mật khẩu | Không |
| `FRONTEND_URL` | URL frontend — dùng để tạo link reset mật khẩu | Không |

> **Lưu ý:** Không bao giờ commit file `.env` lên git.

---

## Database

### 1. Tạo database PostgreSQL

```sql
CREATE DATABASE kitchenmate_db;
```

### 2. Chạy migrations

```bash
python manage.py migrate
```

### 3. Tạo superuser (Admin)

```bash
python manage.py createsuperuser
```

---

## Chạy development server

```bash
python manage.py runserver
```

Server chạy tại: `http://127.0.0.1:8000/`

---

## Chạy tests

### Toàn bộ test suite

```bash
pytest
```

### Chỉ unit tests

```bash
pytest -m unit
```

### Chỉ integration tests

```bash
pytest -m integration
```

### Chỉ performance tests

```bash
pytest -m performance
```

---

## API Documentation

Sau khi chạy server, truy cập:

- **Swagger UI** (tương tác): `http://127.0.0.1:8000/api/docs/`
- **ReDoc** (đọc tài liệu): `http://127.0.0.1:8000/api/redoc/`
- **OpenAPI Schema** (JSON/YAML): `http://127.0.0.1:8000/api/schema/`

---

## API Endpoints

### Authentication

| Method | Endpoint | Mô tả | Auth Required |
|--------|----------|-------|:---:|
| POST | `/api/auth/register/` | Đăng ký tài khoản mới | No |
| POST | `/api/auth/login/` | Đăng nhập, nhận JWT tokens | No |
| POST | `/api/auth/refresh/` | Làm mới access token | No |
| POST | `/api/auth/logout/` | Đăng xuất (blacklist refresh token) | Yes |
| POST | `/api/auth/forgot-password/` | Yêu cầu reset mật khẩu qua email | No |
| POST | `/api/auth/reset-password/` | Đặt lại mật khẩu bằng token | No |

### Accounts & Profile

| Method | Endpoint | Mô tả | Auth Required |
|--------|----------|-------|:---:|
| GET | `/api/accounts/me/` | Xem profile của mình | Yes |
| PATCH | `/api/accounts/me/` | Cập nhật profile | Yes |
| POST | `/api/accounts/me/change-password/` | Đổi mật khẩu | Yes |
| POST | `/api/accounts/me/avatar/` | Upload ảnh đại diện | Yes |
| GET | `/api/accounts/{id}/` | Xem profile công khai | No |
| GET | `/api/accounts/{id}/recipes/` | Danh sách công thức PUBLIC của user | No |
| GET | `/api/accounts/{id}/stats/` | Thống kê user, gồm số followers/following | No |
| POST | `/api/accounts/{id}/follow/` | Theo dõi user khác | Yes |
| DELETE | `/api/accounts/{id}/follow/` | Hủy theo dõi user khác | Yes |
| GET | `/api/accounts/{id}/followers/` | Danh sách người theo dõi user | No |
| GET | `/api/accounts/{id}/following/` | Danh sách user đang theo dõi | No |

### Ingredients

| Method | Endpoint | Mô tả | Auth Required |
|--------|----------|-------|:---:|
| GET | `/api/ingredients/` | Danh sách nguyên liệu (APPROVED) | No |
| POST | `/api/ingredients/` | Thêm nguyên liệu mới (AI moderation) | Yes |
| GET | `/api/ingredients/search/?q=` | Tìm kiếm nguyên liệu | No |

### Recipes

| Method | Endpoint | Mô tả | Auth Required |
|--------|----------|-------|:---:|
| GET | `/api/recipes/` | Danh sách công thức PUBLIC | No |
| POST | `/api/recipes/` | Tạo công thức mới (PRIVATE) | Yes |
| GET | `/api/recipes/{id}/` | Chi tiết công thức | No / Owner |
| PUT | `/api/recipes/{id}/` | Cập nhật công thức (chỉ PRIVATE) | Owner |
| PATCH | `/api/recipes/{id}/` | Cập nhật một phần (chỉ PRIVATE) | Owner |
| DELETE | `/api/recipes/{id}/` | Xóa công thức | Owner |
| GET | `/api/recipes/my-recipes/` | Công thức của tôi | Yes |
| POST | `/api/recipes/{id}/publish/` | Gửi duyệt qua AI moderation | Owner |
| GET | `/api/recipes/{id}/stats/` | Thống kê công thức | No / Owner |
| POST | `/api/recipes/{id}/thumbnail/` | Upload ảnh đại diện công thức | Owner |
| POST | `/api/recipes/{id}/steps/{step_id}/media/` | Upload nhiều ảnh/video cho một bước nấu | Owner |
| GET | `/api/recipes/categories/` | Danh sách danh mục công thức active | No |
| POST | `/api/recipes/categories/` | Tạo danh mục công thức | Admin |
| PATCH | `/api/recipes/categories/{slug}/` | Cập nhật danh mục công thức | Admin |
| DELETE | `/api/recipes/categories/{slug}/` | Vô hiệu hóa danh mục công thức | Admin |
| POST | `/api/recipes/categories/{slug}/restore/` | Khôi phục danh mục công thức | Admin |
| POST | `/api/recipes/categories/{slug}/move/` | Đổi thứ tự ưu tiên lên/xuống | Admin |

### Kitchen (Pantry & Shopping List)

| Method | Endpoint | Mô tả | Auth Required |
|--------|----------|-------|:---:|
| GET | `/api/kitchen/pantry/` | Danh sách tủ lạnh | Yes |
| POST | `/api/kitchen/pantry/` | Thêm nguyên liệu vào tủ lạnh | Yes |
| GET | `/api/kitchen/pantry/{id}/` | Chi tiết một mục tủ lạnh | Owner |
| PUT | `/api/kitchen/pantry/{id}/` | Cập nhật mục tủ lạnh | Owner |
| PATCH | `/api/kitchen/pantry/{id}/` | Cập nhật một phần | Owner |
| DELETE | `/api/kitchen/pantry/{id}/` | Xóa khỏi tủ lạnh | Owner |
| GET | `/api/kitchen/shopping-list/` | Danh sách đi chợ | Yes |
| POST | `/api/kitchen/shopping-list/` | Thêm vào danh sách đi chợ | Yes |
| PUT | `/api/kitchen/shopping-list/{id}/` | Cập nhật số lượng và đơn vị của item chưa mua | Owner |
| PATCH | `/api/kitchen/shopping-list/{id}/` | Cập nhật một phần item chưa mua | Owner |
| DELETE | `/api/kitchen/shopping-list/{id}/` | Xóa khỏi danh sách | Owner |
| POST | `/api/kitchen/shopping-list/{id}/mark-purchased/` | Đánh dấu đã mua + đồng bộ tủ lạnh (atomic) | Owner |
| POST | `/api/kitchen/shopping-list/{id}/mark-unpurchased/` | Bỏ đánh dấu đã mua + trừ khỏi tủ lạnh (atomic) | Owner |

> **Ghi chú:** Shopping item chỉ được sửa khi chưa mua. `unit` phải thuộc danh sách đơn vị hợp lệ của nguyên liệu nếu nguyên liệu đã cấu hình allowed units. `mark-purchased` và `mark-unpurchased` thực hiện atomic transaction; nếu bất kỳ bước nào thất bại, toàn bộ thao tác sẽ rollback.

### Recommendations

| Method | Endpoint | Mô tả | Auth Required |
|--------|----------|-------|:---:|
| POST | `/api/recommendations/suggest/` | Gợi ý món ăn (Tier-3 Scoring) | Yes |

### Social (Reviews & Collections)

| Method | Endpoint | Mô tả | Auth Required |
|--------|----------|-------|:---:|
| GET | `/api/recipes/{recipe_id}/reviews/` | Danh sách đánh giá | No |
| POST | `/api/recipes/{recipe_id}/reviews/` | Thêm đánh giá (rating 1–5) | Yes |
| PUT | `/api/recipes/{recipe_id}/reviews/{id}/` | Cập nhật đánh giá | Owner |
| PATCH | `/api/recipes/{recipe_id}/reviews/{id}/` | Cập nhật một phần | Owner |
| DELETE | `/api/recipes/{recipe_id}/reviews/{id}/` | Xóa đánh giá | Owner |
| GET | `/api/social/collections/` | Danh sách bộ sưu tập | Yes |
| POST | `/api/social/collections/` | Tạo bộ sưu tập mới | Yes |
| DELETE | `/api/social/collections/{id}/` | Xóa bộ sưu tập | Owner |
| POST | `/api/social/collections/{id}/add-recipe/` | Thêm công thức vào bộ sưu tập | Owner |
| DELETE | `/api/social/collections/{id}/remove-recipe/` | Gỡ công thức khỏi bộ sưu tập | Owner |
| POST | `/api/social/reviews/{id}/upload/cooksnap/` | Upload ảnh nấu thử | Owner |

### Admin Panel

| Method | Endpoint | Mô tả | Auth Required |
|--------|----------|-------|:---:|
| GET | `/admin/` | Django Admin Panel | Admin |
| GET | `/api/admin/ingredients/` | Danh sách nguyên liệu (hỗ trợ `?search=`) | Admin |
| POST | `/api/admin/ingredients/{id}/approve/` | Duyệt nguyên liệu | Admin |
| POST | `/api/admin/ingredients/{id}/reject/` | Từ chối nguyên liệu + tạo thông báo | Admin |
| POST | `/api/admin/ingredients/{id}/restore/` | Khôi phục nguyên liệu bị từ chối | Admin |
| GET | `/api/admin/recipes/` | Danh sách tất cả công thức, hỗ trợ lọc `visibility`, `search`, `ordering` | Admin |
| GET | `/api/admin/recipes/pending/` | Danh sách công thức chờ duyệt | Admin |
| POST | `/api/admin/recipes/{id}/approve/` | Duyệt công thức | Admin |
| POST | `/api/admin/recipes/{id}/reject/` | Từ chối công thức + lưu lý do + tạo thông báo | Admin |
| POST | `/api/admin/recipes/{id}/unpublish/` | Chuyển công thức công khai về riêng tư + tạo thông báo | Superuser |
| GET | `/api/admin/users/list/` | Danh sách tất cả người dùng | Admin |
| POST | `/api/admin/users/{id}/block/` | Khoá tài khoản (superuser only, bao gồm session invalidation) | Superuser |
| POST | `/api/admin/users/{id}/unblock/` | Mở khoá tài khoản | Admin |
| POST | `/api/admin/users/{id}/set-admin/` | Phân quyền / xoá quyền admin (superuser only) | Superuser |

> **Ghi chú:** 
> - Ingredient `reject` chấp nhận `reason` và tạo thông báo `INGREDIENT_REJECTED` cho contributor.
> - Recipe `reject` và `unpublish` chấp nhận `reason`, lưu vào `rejection_reason`, và tạo thông báo `WARNING` cho chủ công thức.
> - `block` action yêu cầu superuser và sẽ xoá tất cả session của user bị khoá ngay lập tức. 
> - `set-admin` action chỉ superuser mới có quyền thực hiện.
> - Google OAuth không bao giờ link với email đã tồn tại để tránh privilege escalation.

---

## Cấu trúc Project

```
KitchenMate_Backend/
├── apps/                          # Django apps
│   ├── accounts/                 # Quản lý user, authentication, JWT
│   ├── ingredients/              # Quản lý nguyên liệu + AI moderation
│   ├── recipes/                  # Quản lý công thức nấu ăn
│   ├── kitchen/                  # Tủ lạnh số, danh sách đi chợ
│   ├── social/                   # Reviews, collections
│   ├── recommendations/          # Gợi ý món ăn (Tier-3 Scoring)
│   └── admin_panel/              # API quản trị duyệt nội dung
├── core/                          # Django project settings
│   ├── settings.py
│   ├── urls.py
│   ├── exceptions.py
│   └── wsgi.py
├── media/                         # User uploaded files (avatar, thumbnail, cooksnap)
├── manage.py
├── requirements.txt
├── pytest.ini
├── .env.example
├── .gitignore
├── TODO.md                        # Danh sách công việc theo phase
└── README.md
```

---

## Lưu ý quan trọng

- Luôn sử dụng `.select_related()` và `.prefetch_related()` để tối ưu query, tránh N+1 problem
- Sử dụng `transaction.atomic()` cho các thao tác cần đảm bảo tính toàn vẹn dữ liệu (ví dụ: `mark-purchased`)
- Không bao giờ commit file `.env` lên git
- Media files gồm avatar, thumbnail, ảnh/video bước nấu, cooksnap; development serve qua Django, production nên dùng CDN hoặc S3
- AI moderation dùng Ollama local; nếu Ollama không chạy, công thức public sẽ giữ trạng thái chờ duyệt để admin xử lý, còn các luồng AI đồng bộ có thể trả lỗi tùy endpoint
- Để tạo `SECRET_KEY` ngẫu nhiên: `python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"`
