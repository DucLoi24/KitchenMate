# KitchenMate

KitchenMate là ứng dụng web tiếng Việt giúp quản lý nguyên liệu trong tủ lạnh, lập danh sách đi chợ, chia sẻ công thức nấu ăn, và gợi ý món phù hợp với nguyên liệu hiện có.

Project gồm backend Django REST API và frontend React/Vite. Backend dùng PostgreSQL, JWT, DRF, và Ollama local LLM cho kiểm duyệt nội dung tự động.

## Tính năng chính

- Quản lý tài khoản: đăng ký, đăng nhập JWT, refresh token, logout, đặt lại mật khẩu, Google OAuth.
- Quản lý công thức: tạo, chỉnh sửa, đăng công thức, upload ảnh, duyệt công thức trước khi public.
- Quản lý nguyên liệu: danh mục nguyên liệu, đơn vị đo, tìm kiếm, kiểm duyệt nguyên liệu do người dùng đề xuất.
- Tủ lạnh số: lưu nguyên liệu hiện có, số lượng, đơn vị, hạn sử dụng.
- Danh sách đi chợ: đánh dấu đã mua và đồng bộ vào tủ lạnh bằng transaction atomic.
- Gợi ý món ăn: thuật toán Tier-3 Scoring dựa trên nguyên liệu trong tủ lạnh, độ rủi ro khi thiếu nguyên liệu, và món đã thích.
- Tính năng xã hội: đánh giá, bộ sưu tập, ảnh nấu thử, báo cáo nội dung, thông báo.
- Admin panel: duyệt nội dung, quản lý người dùng, nguyên liệu, đơn vị, công thức, và báo cáo.

## Tech Stack

| Phần | Công nghệ |
| --- | --- |
| Backend | Django 5.2, Django REST Framework 3.16 |
| Database | PostgreSQL 14+ |
| Auth | JWT với djangorestframework-simplejwt, Google OAuth |
| API Docs | drf-spectacular, Swagger UI, ReDoc |
| AI Moderation | Ollama local LLM, model `gemma4:e2b` |
| Backend tests | pytest, pytest-django, Hypothesis |
| Frontend | React 19, Vite 8, Tailwind CSS v4 |
| Frontend state/data | React Query, Zustand, Jotai, React Hook Form, Zod |
| UI/animation | Framer Motion, GSAP, Lenis, lucide-react |
| Frontend tests | Vitest, Testing Library, Playwright |

## Cấu trúc thư mục

```text
KitchenMate/
├── KitchenMate_Backend/
│   ├── apps/
│   │   ├── accounts/          # Người dùng, JWT, profile, OAuth
│   │   ├── ingredients/       # Nguyên liệu, đơn vị đo, AI moderation
│   │   ├── recipes/           # Công thức, bước nấu, upload ảnh
│   │   ├── kitchen/           # Tủ lạnh, danh sách đi chợ, gợi ý món
│   │   ├── social/            # Review, collection, cooksnap
│   │   ├── reports/           # Báo cáo nội dung, thông báo
│   │   └── admin_panel/       # API quản trị
│   ├── core/                  # Settings, URL routing, permissions, services
│   ├── docs/                  # Tài liệu kỹ thuật backend
│   ├── tests/                 # Integration/performance tests
│   └── README.md
├── KitchenMate_Frontend/
│   ├── src/
│   │   ├── api/               # API clients
│   │   ├── components/        # UI, auth, layout, feature components
│   │   ├── hooks/             # Custom hooks
│   │   ├── lib/               # axiosInstance, helpers
│   │   ├── pages/             # Route pages
│   │   ├── stores/            # Client state
│   │   └── utils/
│   ├── FRONTEND_DESIGN.md
│   └── package.json
└── README.md
```

## Yêu cầu hệ thống

- Python 3.11+
- PostgreSQL 14+
- Node.js `20.19+`, `22.12+`, hoặc `24+`
- npm
- Git
- Ollama nếu chạy luồng AI moderation local

KitchenMate dùng PostgreSQL. Không dùng SQLite cho môi trường phát triển của project này.

## Cài đặt nhanh

Clone repository:

```powershell
git clone <repo-url>
cd KitchenMate
```

### 1. Chạy backend

Tạo virtual environment và cài dependencies:

```powershell
cd KitchenMate_Backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

Trên Linux/macOS, dùng:

```bash
source venv/bin/activate
```

Tạo file môi trường:

```powershell
Copy-Item .env.example .env
```

Cập nhật các biến bắt buộc trong `KitchenMate_Backend/.env`:

```env
SECRET_KEY=your-secret-key-here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

DB_ENGINE=django.db.backends.postgresql
DB_NAME=kitchenmate_db
DB_USER=postgres
DB_PASSWORD=your-password
DB_HOST=localhost
DB_PORT=5432

FRONTEND_URL=http://localhost:5174
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=gemma4:e2b
```

Tạo database PostgreSQL:

```sql
CREATE DATABASE kitchenmate_db;
```

Chạy migrations và tạo tài khoản admin:

```powershell
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

Backend chạy tại:

- API: `http://127.0.0.1:8000/api/`
- Django Admin: `http://127.0.0.1:8000/admin/`
- Swagger UI: `http://127.0.0.1:8000/api/docs/`
- ReDoc: `http://127.0.0.1:8000/api/redoc/`

### 2. Chạy Ollama cho AI moderation

Nếu cần tạo nguyên liệu hoặc publish công thức qua kiểm duyệt AI, chạy Ollama trước:

```powershell
ollama serve
ollama pull gemma4:e2b
```

Nếu Ollama không chạy, các endpoint dùng AI moderation có thể trả lỗi.

### 3. Chạy frontend

Mở terminal khác:

```powershell
cd KitchenMate_Frontend
npm install
npm run dev
```

Frontend chạy tại `http://localhost:5174/`.

Frontend mặc định gọi API tại `http://localhost:8000/api`. Nếu cần đổi URL backend, tạo `KitchenMate_Frontend/.env.local`:

```env
VITE_API_URL=http://localhost:8000/api
```

## Lệnh thường dùng

Backend:

```powershell
cd KitchenMate_Backend
python manage.py migrate
python manage.py runserver
pytest
pytest -m unit
pytest -m integration
pytest -m performance
```

Frontend:

```powershell
cd KitchenMate_Frontend
npm run dev
npm run build
npm run lint
npm run test
```

## Business Logic Quan Trọng

### AI content moderation

Khi người dùng đề xuất nguyên liệu hoặc gửi công thức public, backend gửi nội dung sang Ollama. Kết quả moderation quyết định nội dung được duyệt tự động, bị từ chối, hoặc chờ admin duyệt thủ công.

### Check-to-pantry transaction

Khi người dùng đánh dấu một món trong danh sách đi chợ là đã mua, backend dùng `transaction.atomic()` để cập nhật shopping item và thêm hoặc cập nhật pantry item cùng lúc. Nếu một bước lỗi, toàn bộ thay đổi rollback.

### Food suggestion algorithm

Thuật toán gợi ý món ăn bỏ qua gia vị staple, cộng điểm cho nguyên liệu khớp, trừ điểm theo mức rủi ro của nguyên liệu còn thiếu, và cộng affinity bonus cho công thức người dùng từng thích.

## Tài liệu

- [Backend README](./KitchenMate_Backend/README.md) - hướng dẫn backend và danh sách endpoint chính.
- [Backend technical docs](./KitchenMate_Backend/docs/README.md) - schema, API reference, business logic, testing, development guide.
- [Frontend design guide](./KitchenMate_Frontend/FRONTEND_DESIGN.md) - design tokens, typography, spacing, màu sắc, animation patterns.
- [Frontend source](./KitchenMate_Frontend/src/) - routes, pages, components, hooks, stores, API clients.

## Lưu ý phát triển

- Không commit file `.env`, media upload, database dump, hoặc secrets.
- Backend dùng custom user model `accounts.User`; không import trực tiếp `django.contrib.auth.models.User`.
- Khi làm frontend, kiểm tra backend endpoint trước để khớp request/response shape.
- UI text, label, message, và lỗi người dùng nhìn thấy phải viết bằng tiếng Việt.
- Backend response có thể là paginated hoặc non-paginated; frontend cần xử lý cả hai dạng.
- Vite dev server đang cấu hình port `5174`; nếu đổi port, cập nhật CORS backend cho đúng origin.

## Troubleshooting

### Backend không kết nối được database

Kiểm tra PostgreSQL đang chạy, database `kitchenmate_db` đã được tạo, và các biến `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT` trong `.env` đúng với máy local.

### Frontend bị lỗi CORS

Đảm bảo frontend chạy ở `http://localhost:5174`. Nếu dùng port khác, cập nhật `CORS_ALLOWED_ORIGINS` trong backend settings hoặc cấu hình lại Vite.

### API tạo nguyên liệu hoặc publish công thức trả lỗi AI

Kiểm tra Ollama đang chạy tại `http://localhost:11434` và model `gemma4:e2b` đã được pull.

### Token hết hạn hoặc bị 401

Frontend có interceptor refresh token. Nếu refresh token cũng hết hạn hoặc bị blacklist, ứng dụng sẽ xóa auth state và chuyển về trang đăng nhập.
