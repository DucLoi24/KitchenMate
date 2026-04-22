# KitchenMate Backend — Development Guide

## Yêu cầu hệ thống

| Phần mềm | Phiên bản tối thiểu |
|---|---|
| Python | 3.11+ |
| PostgreSQL | 14+ |
| Ollama | Latest (cho AI Moderation) |
| Git | 2.x+ |

---

## Cài đặt môi trường phát triển

### 1. Clone repository

```bash
git clone <repository-url>
cd KitchenMate_Backend
```

### 2. Tạo và kích hoạt virtual environment

```bash
# Tạo venv
python -m venv venv

# Kích hoạt (Windows)
venv\Scripts\activate

# Kích hoạt (Linux/Mac)
source venv/bin/activate
```

### 3. Cài đặt dependencies

```bash
pip install -r requirements.txt
```

### 4. Cấu hình môi trường

```bash
# Copy file mẫu
cp .env.example .env

# Chỉnh sửa .env với thông tin thực tế
```

Các biến bắt buộc phải điền trong `.env`:
```env
SECRET_KEY=your-secret-key-here
DB_NAME=kitchenmate_db
DB_USER=postgres
DB_PASSWORD=yourpassword
DB_HOST=localhost
DB_PORT=5432
```

### 5. Tạo database PostgreSQL

```bash
# Kết nối PostgreSQL
psql -U postgres

# Tạo database
CREATE DATABASE kitchenmate_db;
\q
```

### 6. Chạy migrations

```bash
python manage.py migrate
```

### 7. Tạo superuser

```bash
python manage.py createsuperuser
# Nhập email, username, full_name, password
```

### 8. Chạy development server

```bash
python manage.py runserver
```

Server chạy tại: `http://localhost:8000`

---

## Cài đặt Ollama (AI Moderation)

### 1. Cài đặt Ollama

Tải và cài đặt từ: https://ollama.ai

### 2. Tải model

```bash
ollama pull gemma4:e2b
```

### 3. Kiểm tra kết nối

```bash
curl http://localhost:11434/api/generate -d '{
  "model": "gemma4:e2b",
  "prompt": "Hello",
  "stream": false
}'
```

### 4. Cấu hình trong .env

```env
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=gemma4:e2b
OLLAMA_TIMEOUT=30
```

**Lưu ý:** Nếu Ollama không chạy, hệ thống vẫn hoạt động bình thường nhờ graceful degradation:
- Recipe publish → trả về 503 (user biết để thử lại sau)
- Ingredient create → lưu PENDING (không block user)

---

## Cấu hình Email (Password Reset)

### Development (Console Backend)

Mặc định, email được in ra console thay vì gửi thực sự:
```env
EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend
```

### Production (Gmail SMTP)

```env
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password
DEFAULT_FROM_EMAIL=KitchenMate <noreply@kitchenmate.vn>
```

**Lưu ý:** Dùng App Password của Gmail, không dùng mật khẩu tài khoản thông thường.

---

## Workflow phát triển

### Tạo migration sau khi thay đổi model

```bash
python manage.py makemigrations
python manage.py migrate
```

### Kiểm tra migration

```bash
# Xem danh sách migrations
python manage.py showmigrations

# Xem SQL của migration
python manage.py sqlmigrate accounts 0001_initial
```

### Django Shell

```bash
python manage.py shell

# Ví dụ
from apps.recipes.models import Recipe
Recipe.objects.filter(visibility='PUBLIC').count()
```

### Tạo dữ liệu mẫu (nếu cần)

```bash
# Tạo superuser
python manage.py createsuperuser

# Truy cập Django Admin
http://localhost:8000/admin/
```

---

## API Documentation

Sau khi chạy server, truy cập:

| URL | Mô tả |
|---|---|
| `http://localhost:8000/api/docs/` | Swagger UI — test API trực tiếp |
| `http://localhost:8000/api/redoc/` | ReDoc — đọc tài liệu |
| `http://localhost:8000/api/schema/` | OpenAPI 3.0 JSON schema |

---

## Chạy Tests

```bash
# Tất cả tests
pytest

# Verbose
pytest -v

# Chỉ unit tests
pytest -m unit

# Chỉ integration tests
pytest -m integration

# Chỉ performance tests
pytest -m performance

# Với coverage
pytest --cov=. --cov-report=html
# Xem: htmlcov/index.html

# Chạy nhanh (bỏ performance tests)
pytest -m "not performance"

# Chạy một file cụ thể
pytest tests/test_phase11_unit_models.py -v
```

---

## Coding Standards

### Python Style

- Dùng **black** để format code:
  ```bash
  black .
  ```
- Dùng **flake8** để lint:
  ```bash
  flake8 .
  ```

### Docstrings

Viết docstring cho tất cả ViewSet, Service, và function phức tạp:

```python
class RecipeViewSet(viewsets.GenericViewSet):
    """
    ViewSet quản lý công thức nấu ăn.
    
    Actions:
        list    — AllowAny. Chỉ trả về PUBLIC recipes.
        create  — IsAuthenticated. Tạo recipe mới với visibility=PRIVATE.
        ...
    """
```

### Query Optimization

Luôn dùng `select_related()` và `prefetch_related()`:

```python
# ✅ Đúng
Recipe.objects.select_related('user').prefetch_related('recipe_ingredients__ingredient')

# ❌ Sai — gây N+1 query
Recipe.objects.all()
```

### Error Handling

Không bao giờ để lộ raw 500 error. Luôn return JSON:

```python
# ✅ Đúng
try:
    ...
except Exception:
    return Response(
        {'success': False, 'error': {'message': 'Có lỗi xảy ra. Vui lòng thử lại.'}},
        status=status.HTTP_500_INTERNAL_SERVER_ERROR
    )

# ❌ Sai — để exception propagate lên
```

### Transaction

Dùng `transaction.atomic()` cho các thao tác liên quan đến nhiều bảng:

```python
from django.db import transaction

with transaction.atomic():
    # Tất cả thao tác trong đây là atomic
    item.is_purchased = True
    item.save()
    pantry_item.quantity += item.quantity
    pantry_item.save()
```

---

## Git Workflow

```bash
# Tạo feature branch
git checkout -b feature/ten-tinh-nang

# Commit thường xuyên
git add .
git commit -m "feat: thêm endpoint gợi ý món ăn"

# Push và tạo PR
git push origin feature/ten-tinh-nang
```

### Commit message convention

```
feat: thêm tính năng mới
fix: sửa bug
refactor: cải thiện code không thay đổi behavior
test: thêm/sửa tests
docs: cập nhật tài liệu
chore: cập nhật dependencies, config
```

---

## Troubleshooting

### Lỗi kết nối PostgreSQL

```
django.db.utils.OperationalError: could not connect to server
```

**Giải pháp:**
1. Kiểm tra PostgreSQL đang chạy: `pg_ctl status`
2. Kiểm tra thông tin kết nối trong `.env`
3. Kiểm tra database đã tồn tại: `psql -U postgres -l`

### Lỗi migration

```
django.db.utils.ProgrammingError: relation "..." does not exist
```

**Giải pháp:**
```bash
python manage.py migrate --run-syncdb
# hoặc
python manage.py migrate --fake-initial
```

### Lỗi JWT Token

```
{"detail": "Given token not valid for any token type"}
```

**Giải pháp:** Access token đã hết hạn (mặc định 60 phút). Dùng refresh token để lấy token mới.

### Ollama không phản hồi

```
ModerationServiceError: Không thể kết nối tới Ollama
```

**Giải pháp:**
1. Kiểm tra Ollama đang chạy: `ollama list`
2. Kiểm tra model đã tải: `ollama list`
3. Khởi động lại: `ollama serve`

### Tests fail do database

```
django.db.utils.OperationalError: no such table
```

**Giải pháp:**
```bash
# pytest-django tự tạo test database, nhưng cần migrate trước
python manage.py migrate
pytest
```
