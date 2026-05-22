# KitchenMate Backend — Cấu hình hệ thống

## Biến môi trường (.env)

Tất cả cấu hình nhạy cảm được đọc từ file `.env` tại thư mục gốc của backend. Xem file `.env.example` để biết danh sách đầy đủ.

### Biến bắt buộc

| Biến | Mô tả | Ví dụ |
|---|---|---|
| `SECRET_KEY` | Django secret key (bắt buộc đổi trong production) | `django-insecure-...` |
| `DB_NAME` | Tên database PostgreSQL | `kitchenmate_db` |
| `DB_USER` | Username PostgreSQL | `postgres` |
| `DB_PASSWORD` | Password PostgreSQL | `yourpassword` |
| `DB_HOST` | Host PostgreSQL | `localhost` |
| `DB_PORT` | Port PostgreSQL | `5432` |

### Biến tùy chọn (có giá trị mặc định)

| Biến | Mặc định | Mô tả |
|---|---|---|
| `DEBUG` | `True` | Chế độ debug (đặt `False` trong production) |
| `ALLOWED_HOSTS` | `localhost,127.0.0.1` | Danh sách host được phép |
| `DB_ENGINE` | `django.db.backends.postgresql` | Database engine |
| `JWT_ACCESS_TOKEN_LIFETIME` | `60` | Thời gian sống access token (phút) |
| `JWT_REFRESH_TOKEN_LIFETIME` | `1440` | Thời gian sống refresh token (phút = 24 giờ) |
| `OLLAMA_BASE_URL` | `http://localhost:11434` | URL Ollama server |
| `OLLAMA_MODEL` | `gemma4:e2b` | Model AI đang dùng |
| `OLLAMA_TIMEOUT` | `30` | Timeout gọi Ollama (giây) |
| `FRONTEND_URL` | `http://localhost:5173` | URL frontend (dùng cho link reset password) |
| `EMAIL_BACKEND` | `console` | Backend gửi email |
| `EMAIL_HOST` | `smtp.gmail.com` | SMTP server |
| `EMAIL_PORT` | `587` | SMTP port |
| `EMAIL_USE_TLS` | `True` | Dùng TLS |
| `EMAIL_HOST_USER` | `` | Email gửi |
| `EMAIL_HOST_PASSWORD` | `` | Password email |
| `DEFAULT_FROM_EMAIL` | `KitchenMate <noreply@kitchenmate.vn>` | Tên hiển thị email gửi |
| `USE_S3` | `False` | Dùng AWS S3 thay vì local storage |
| `AWS_ACCESS_KEY_ID` | `` | AWS Access Key (nếu USE_S3=True) |
| `AWS_SECRET_ACCESS_KEY` | `` | AWS Secret Key (nếu USE_S3=True) |
| `AWS_STORAGE_BUCKET_NAME` | `` | S3 Bucket name |
| `AWS_S3_REGION_NAME` | `ap-southeast-1` | AWS Region |

---

## Django Settings chi tiết

### Database

```python
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'kitchenmate_db',
        'USER': 'postgres',
        'PASSWORD': '...',
        'HOST': 'localhost',
        'PORT': '5432',
    }
}
```

### JWT Configuration

```python
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=60),
    'REFRESH_TOKEN_LIFETIME': timedelta(minutes=1440),  # 24 giờ
    'ROTATE_REFRESH_TOKENS': True,      # Tạo refresh token mới sau mỗi lần refresh
    'BLACKLIST_AFTER_ROTATION': True,   # Blacklist refresh token cũ
    'AUTH_HEADER_TYPES': ('Bearer',),
}
```

### REST Framework

```python
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticatedOrReadOnly',
    ),
    'DEFAULT_FILTER_BACKENDS': (
        'django_filters.rest_framework.DjangoFilterBackend',
        'rest_framework.filters.SearchFilter',
        'rest_framework.filters.OrderingFilter',
    ),
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
    'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema',
    'EXCEPTION_HANDLER': 'core.exceptions.custom_exception_handler',
}
```

### CORS

```python
CORS_ALLOWED_ORIGINS = [
    'http://localhost:5173',  # Vite dev server
    'http://localhost:3000',  # CRA dev server
]
CORS_ALLOW_CREDENTIALS = True
```

### File Upload

```python
IMAGE_UPLOAD_MAX_SIZE = 5 * 1024 * 1024  # 5MB
VIDEO_UPLOAD_MAX_SIZE = 50 * 1024 * 1024  # 50MB
ALLOWED_IMAGE_EXTENSIONS = {'jpg', 'jpeg', 'png', 'webp'}

IMAGE_SIZES = {
    'avatar':    {'max_width': 400,  'max_height': 400,  'quality': 85},
    'thumbnail': {'max_width': 800,  'max_height': 600,  'quality': 85},
    'step':      {'max_width': 1200, 'max_height': 900,  'quality': 80},
    'cooksnap':  {'max_width': 1200, 'max_height': 900,  'quality': 80},
}
```

### Internationalization

```python
LANGUAGE_CODE = 'vi'
TIME_ZONE = 'Asia/Ho_Chi_Minh'
USE_I18N = True
USE_TZ = True
```

### Static & Media Files

```python
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'

MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'
```

---

## Installed Apps

### Django Apps (built-in)
- `django.contrib.admin`
- `django.contrib.auth`
- `django.contrib.contenttypes`
- `django.contrib.sessions`
- `django.contrib.messages`
- `django.contrib.staticfiles`

### Third-party Apps
| App | Mô tả |
|---|---|
| `rest_framework` | Django REST Framework |
| `rest_framework_simplejwt` | JWT Authentication |
| `rest_framework_simplejwt.token_blacklist` | Blacklist refresh tokens |
| `corsheaders` | CORS headers |
| `django_filters` | Filter backend |
| `drf_spectacular` | OpenAPI documentation |

### Local Apps
| App | Mô tả |
|---|---|
| `apps.accounts` | Quản lý người dùng |
| `apps.ingredients` | Danh mục nguyên liệu |
| `apps.recipes` | Công thức nấu ăn |
| `apps.kitchen` | Tủ lạnh số & danh sách đi chợ |
| `apps.social` | Đánh giá & bộ sưu tập |
| `apps.admin_panel` | Quản trị hệ thống |

---

## Middleware Stack

```python
MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'corsheaders.middleware.CorsMiddleware',      # CORS — phải đặt trước CommonMiddleware
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]
```

**Lưu ý:** `CorsMiddleware` phải đặt trước `CommonMiddleware` để xử lý preflight OPTIONS request đúng cách.

---

## URL Routing

```
/admin/                          → Django Admin
/api/schema/                     → OpenAPI Schema
/api/docs/                       → Swagger UI
/api/redoc/                      → ReDoc

/api/auth/                       → apps.accounts.urls (auth endpoints)
/api/accounts/                   → apps.accounts.profile_urls (profile)
/api/accounts/                   → apps.accounts.upload_urls (avatar upload)
/api/ingredients/                → apps.ingredients.urls
/api/recipes/                    → apps.recipes.urls
/api/recipes/                    → apps.recipes.upload_urls (thumbnail + step upload)
/api/kitchen/                    → apps.kitchen.urls (pantry + shopping list)
/api/recommendations/            → apps.kitchen.recommendation_urls
/api/social/                     → apps.social.urls (reviews + collections)
/api/social/                     → apps.social.upload_urls (cooksnap upload)
/api/admin/                      → apps.admin_panel.urls

/media/                          → Serve media files (chỉ trong DEBUG=True)
```

---

## pytest.ini

```ini
[pytest]
DJANGO_SETTINGS_MODULE = core.settings
python_files = tests/test_*.py apps/*/tests*.py
markers =
    unit: Unit tests
    integration: Integration tests
    performance: Performance tests
```

**Chạy tests:**
```bash
# Tất cả tests
pytest

# Chỉ unit tests
pytest -m unit

# Chỉ integration tests
pytest -m integration

# Chỉ performance tests
pytest -m performance

# Với coverage report
pytest --cov=. --cov-report=html
```
