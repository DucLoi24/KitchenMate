# KitchenMate Backend — Tổng quan dự án

## Giới thiệu

KitchenMate là ứng dụng web chia sẻ công thức nấu ăn và quản lý nguyên liệu thông minh dành cho người dùng Việt Nam. Backend được xây dựng theo kiến trúc **Client-Server** thuần túy — chỉ phục vụ RESTful API (JSON), không sử dụng Django Templates.

---

## Tech Stack

| Thành phần | Công nghệ |
|---|---|
| Ngôn ngữ | Python 3.11+ |
| Web Framework | Django 5.2 |
| API Framework | Django REST Framework 3.16 |
| Database | PostgreSQL 14+ |
| Authentication | JWT (djangorestframework-simplejwt) |
| AI Moderation | Ollama Local LLM (model: gemma4:e2b) |
| Image Processing | Pillow 10 |
| API Documentation | drf-spectacular (OpenAPI 3.0) |
| Testing | pytest + Hypothesis (Property-Based Testing) |

---

## Cấu trúc thư mục

```
KitchenMate_Backend/
├── core/                          # Cấu hình trung tâm
│   ├── settings.py                # Django settings (đọc từ .env)
│   ├── urls.py                    # URL routing gốc
│   ├── permissions.py             # Custom DRF permissions
│   ├── exceptions.py              # Custom exception handler
│   ├── services/
│   │   └── ai_moderator.py        # AI moderation service (Ollama)
│   └── utils/
│       ├── file_validator.py      # Validate file upload
│       ├── image_processor.py     # Resize/compress ảnh
│       └── media_upload_service.py # Orchestrate luồng upload
│
├── apps/                          # Django applications
│   ├── accounts/                  # Quản lý người dùng & xác thực
│   ├── ingredients/               # Danh mục nguyên liệu
│   ├── recipes/                   # Công thức nấu ăn
│   ├── kitchen/                   # Tủ lạnh số & danh sách đi chợ
│   ├── social/                    # Đánh giá & bộ sưu tập
│   └── admin_panel/               # Quản trị hệ thống
│
├── tests/                         # Test suite tập trung
│   ├── conftest.py                # Fixtures dùng chung
│   └── test_*.py                  # 24 file test (192 tests)
│
├── manage.py
├── requirements.txt
├── pytest.ini
├── .env.example
└── README.md
```

---

## Kiến trúc tổng quan

```
Frontend (React)
      │
      │  HTTP/HTTPS (JSON)
      ▼
┌─────────────────────────────────────────┐
│           Django REST Framework          │
│                                         │
│  ┌──────────┐  ┌──────────┐  ┌───────┐ │
│  │ accounts │  │ recipes  │  │kitchen│ │
│  └──────────┘  └──────────┘  └───────┘ │
│  ┌──────────┐  ┌──────────┐  ┌───────┐ │
│  │ingredients│ │  social  │  │ admin │ │
│  └──────────┘  └──────────┘  └───────┘ │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │         core/ (shared)          │   │
│  │  permissions | exceptions       │   │
│  │  ai_moderator | media_upload    │   │
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
      │
      ▼
PostgreSQL Database
      │
      ▼
Ollama Local LLM (AI Moderation)
```

---

## Các tính năng chính

1. **Xác thực JWT** — Đăng ký, đăng nhập, refresh token, logout (blacklist), đặt lại mật khẩu qua email.
2. **Quản lý công thức** — CRUD đầy đủ, hệ thống visibility (PRIVATE → PENDING → PUBLIC), AI moderation tự động.
3. **Tủ lạnh số (Pantry)** — Quản lý nguyên liệu hiện có, đồng bộ từ danh sách đi chợ qua atomic transaction.
4. **Gợi ý món ăn** — Thuật toán Tier-3 Scoring với 2 chế độ: COOK_NOW và ADD_MORE.
5. **AI Moderation** — Kiểm duyệt nội dung tự động qua Ollama Local LLM, graceful degradation khi AI lỗi.
6. **File Upload** — Validate magic bytes, resize/compress ảnh cho avatar/thumbnail/cooksnap/step image; step media hỗ trợ thêm video `mp4`, `webm`, `mov` với giới hạn 50MB.
7. **Tìm kiếm & Lọc** — Filter công thức theo nhiều tiêu chí, autocomplete nguyên liệu.
8. **Thống kê** — User stats (recipe_count, total_likes, average_rating) và Recipe stats (view_count, save_count).
9. **Admin Panel** — Duyệt/từ chối công thức và nguyên liệu, quản lý tài khoản người dùng.

---

## Trạng thái phát triển

| Phase | Mô tả | Trạng thái |
|---|---|---|
| 1 | Setup & Configuration | ✅ Hoàn thành |
| 2 | Database Models | ✅ Hoàn thành |
| 3 | Authentication & Authorization | ✅ Hoàn thành |
| 4 | API Endpoints | ✅ Hoàn thành |
| 5 | AI Moderation | ✅ Hoàn thành |
| 6 | Recommendation Algorithm | ✅ Hoàn thành |
| 7 | Database Transaction | ✅ Hoàn thành |
| 8 | File Upload & Media | ✅ Hoàn thành |
| 9 | Search & Filter | ✅ Hoàn thành |
| 10 | Statistics & Analytics | ✅ Hoàn thành |
| 11 | Testing (192 tests) | ✅ Hoàn thành |
| 12 | API Documentation | ✅ Hoàn thành |
| 13 | Deployment Preparation | 🔲 Chưa bắt đầu |
