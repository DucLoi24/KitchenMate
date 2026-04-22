# KitchenMate Backend - TODO List

## 📋 Tổng quan dự án
Xây dựng Backend API cho hệ thống KitchenMate sử dụng Django REST Framework + PostgreSQL

---

## 🎯 Phase 1: Setup & Configuration

### 1.1 Cấu hình Database
- [x] Cài đặt PostgreSQL
- [x] Tạo database `kitchenmate_db`
- [x] Cấu hình kết nối PostgreSQL trong `settings.py`
- [x] Cập nhật file `.env` với thông tin database

### 1.2 Cài đặt Dependencies
- [x] Cài thêm các package cần thiết:
  - `psycopg2-binary` (PostgreSQL adapter)
  - `djangorestframework-simplejwt` (JWT authentication)
  - `Pillow` (xử lý ảnh)
  - `django-cors-headers` (CORS cho frontend)
  - `django-filter` (filter API)
  - `drf-spectacular` (API documentation)
- [x] Cập nhật `requirements.txt`

### 1.3 Cấu hình Django Settings
- [x] Thêm CORS settings
- [x] Cấu hình JWT authentication
- [x] Cấu hình media files (upload ảnh/video)
- [x] Cấu hình REST Framework settings (pagination, permissions)
- [x] Cấu hình múi giờ (TIME_ZONE = 'Asia/Ho_Chi_Minh')

---

## 🗄️ Phase 2: Database Models (10 bảng)

### 2.1 App: accounts
- [x] Tạo Django app `accounts`
- [x] Custom User Model kế thừa AbstractUser:
  - `id` (UUID, primary key)
  - `email` (unique, login field)
  - `full_name`
  - `avatar_url` (TextField, null=True)
  - `bio` (TextField, null=True)
  - `is_staff` (Boolean, default=False) - dùng Django built-in auth
  - `is_superuser` (Boolean, default=False) - dùng Django built-in auth
  - `is_active` (Boolean, default=True)
  - `created_at` (auto_now_add)
  - `USERNAME_FIELD = 'email'`
- [x] Tạo migrations và migrate

### 2.2 App: ingredients
- [x] Tạo Django app `ingredients`
- [x] Model `Ingredient`:
  - `id` (AutoField)
  - `name` (unique)
  - `category` (choices: PROTEIN, CARB, VEG, SPICE, STAPLE, OTHER)
  - `status` (choices: PENDING, APPROVED, REJECTED)
  - `created_by` (FK -> User)
  - `created_at`
- [x] Tạo migrations và migrate

### 2.3 App: recipes
- [x] Tạo Django app `recipes`
- [x] Model `Recipe`:
  - `id` (UUID)
  - `user` (FK -> User)
  - `title`
  - `description`
  - `prep_time` (Integer, phút)
  - `difficulty` (choices: EASY, MEDIUM, HARD)
  - `visibility` (choices: PRIVATE, PUBLIC, PENDING)
  - `thumbnail_url` (TextField, null=True)
  - `created_at`, `updated_at`
- [x] Model `RecipeIngredient` (Many-to-Many through table):
  - `recipe` (FK -> Recipe)
  - `ingredient` (FK -> Ingredient)
  - `quantity` (Float)
  - `unit` (CharField)
- [x] Model `RecipeStep`:
  - `recipe` (FK -> Recipe)
  - `step_number` (Integer)
  - `instruction` (Text)
  - `media_url` (TextField, null=True)
  - `class Meta: ordering = ['step_number']` (đảm bảo thứ tự bước)
- [x] Tạo migrations và migrate

### 2.4 App: kitchen
- [x] Tạo Django app `kitchen`
- [x] Model `Pantry` (Tủ lạnh số):
  - `user` (FK -> User)
  - `ingredient` (FK -> Ingredient)
  - `quantity` (Float)
  - `unit`
  - `updated_at`
  - Unique constraint: (user, ingredient)
- [x] Model `ShoppingList` (Danh sách đi chợ):
  - `user` (FK -> User)
  - `ingredient` (FK -> Ingredient)
  - `quantity` (Float)
  - `unit`
  - `is_purchased` (Boolean, default=False)
  - `created_at`
- [x] Tạo migrations và migrate

### 2.5 App: social
- [x] Tạo Django app `social`
- [x] Model `Review`:
  - `user` (FK -> User)
  - `recipe` (FK -> Recipe)
  - `rating` (Integer 1-5)
  - `comment` (Text, optional)
  - `cooksnap_url` (TextField, optional - ảnh trả bài)
  - `created_at`
  - Unique constraint: (user, recipe) - 1 user chỉ review 1 lần
- [x] Model `Collection` (Bộ sưu tập):
  - `user` (FK -> User)
  - `name`
  - `created_at`
- [x] Model `CollectionRecipe` (Many-to-Many through):
  - `collection` (FK -> Collection)
  - `recipe` (FK -> Recipe)
  - `added_at`
  - Unique constraint: `(collection, recipe)` - tránh lưu trùng công thức
- [x] Tạo migrations và migrate

---

## 🔐 Phase 3: Authentication & Authorization

### 3.1 JWT Authentication
- [x] Cấu hình SimpleJWT trong settings
- [x] Tạo endpoint `/api/auth/register/` (đăng ký)
- [x] Tạo endpoint `/api/auth/login/` (đăng nhập, trả về access + refresh token)
- [x] Tạo endpoint `/api/auth/refresh/` (refresh token)
- [x] Tạo endpoint `/api/auth/logout/` (blacklist token nếu cần)

### 3.2 OAuth2 (Google Login)
- [ ] Cài `django-allauth` hoặc `dj-rest-auth`
- [ ] Cấu hình Google OAuth2
- [ ] Tạo endpoint `/api/auth/google/`

### 3.3 Password Reset
- [x] Endpoint `/api/auth/forgot-password/` (gửi email)
- [x] Endpoint `/api/auth/reset-password/` (đặt lại mật khẩu)

### 3.4 Permissions
- [x] Tạo custom permission `IsOwnerOrReadOnly`
- [x] Tạo custom permission `IsAdminUser`
- [ ] Áp dụng permissions cho các ViewSet (sẽ áp dụng khi làm Phase 4)

---

## 🛠️ Phase 4: API Endpoints (Serializers + ViewSets)

### 4.1 Accounts API (`/api/accounts/`)
- [x] Serializer: `UserSerializer`, `UserProfileSerializer`
- [x] ViewSet: `UserViewSet`
  - `GET /api/accounts/me/` - Lấy thông tin user hiện tại
  - `PUT/PATCH /api/accounts/me/` - Cập nhật profile
  - `GET /api/accounts/{id}/` - Xem profile người khác
  - `GET /api/accounts/{id}/recipes/` - Xem công thức của user
  - `GET /api/accounts/{id}/stats/` - Thống kê (số công thức, lượt thích...)

### 4.2 Ingredients API (`/api/ingredients/`)
- [x] Serializer: `IngredientSerializer`
- [x] ViewSet: `IngredientViewSet`
  - `GET /api/ingredients/` - Danh sách nguyên liệu (filter theo category, status)
  - `POST /api/ingredients/` - Đóng góp nguyên liệu mới (status=PENDING)
  - `GET /api/ingredients/search/?q=` - Tìm kiếm autocomplete
- [x] Admin ViewSet: `IngredientAdminViewSet`
  - `GET /api/admin/ingredients/pending/` - Danh sách chờ duyệt
  - `POST /api/admin/ingredients/{id}/approve/` - Duyệt
  - `POST /api/admin/ingredients/{id}/reject/` - Từ chối

### 4.3 Recipes API (`/api/recipes/`)
- [x] Serializer: `RecipeSerializer`, `RecipeDetailSerializer`, `RecipeCreateSerializer`
- [x] ViewSet: `RecipeViewSet`
  - `GET /api/recipes/` - Danh sách công thức (filter, search, pagination)
  - `POST /api/recipes/` - Tạo công thức mới
  - `GET /api/recipes/{id}/` - Chi tiết công thức
  - `PUT/PATCH /api/recipes/{id}/` - Cập nhật công thức (chỉ owner)
  - `DELETE /api/recipes/{id}/` - Xóa công thức (chỉ owner)
  - `GET /api/recipes/my-recipes/` - Công thức của tôi
  - `POST /api/recipes/{id}/publish/` - Công khai công thức (trigger AI moderation)

### 4.4 Kitchen API (`/api/kitchen/`)
- [x] Serializer: `PantrySerializer`, `ShoppingListSerializer`
- [x] ViewSet: `PantryViewSet`
  - `GET /api/kitchen/pantry/` - Xem tủ lạnh
  - `POST /api/kitchen/pantry/` - Thêm nguyên liệu
  - `PUT/PATCH /api/kitchen/pantry/{id}/` - Cập nhật số lượng
  - `DELETE /api/kitchen/pantry/{id}/` - Xóa nguyên liệu
- [x] ViewSet: `ShoppingListViewSet`
  - `GET /api/kitchen/shopping-list/` - Xem danh sách đi chợ
  - `POST /api/kitchen/shopping-list/` - Thêm nguyên liệu
  - `POST /api/kitchen/shopping-list/{id}/mark-purchased/` - Đánh dấu đã mua (TRANSACTION!)
  - `DELETE /api/kitchen/shopping-list/{id}/` - Xóa khỏi danh sách

### 4.5 Recommendation API (`/api/recommendations/`)
- [x] Serializer: `RecommendationSerializer`
- [x] ViewSet: `RecommendationViewSet`
  - `POST /api/recommendations/suggest/` - Gợi ý món ăn
    - Body: `{ "mode": "COOK_NOW" | "ADD_MORE", "exclude_ingredients": [ids] }`
    - Response: Danh sách recipes được xếp hạng + điểm số + nguyên liệu thiếu

### 4.6 Social API (`/api/social/`)
- [x] Serializer: `ReviewSerializer`, `CollectionSerializer`
- [x] ViewSet: `ReviewViewSet`
  - `GET /api/social/recipes/{recipe_id}/reviews/` - Xem reviews
  - `POST /api/social/recipes/{recipe_id}/reviews/` - Tạo review
  - `PUT/PATCH /api/social/reviews/{id}/` - Sửa review (chỉ owner)
  - `DELETE /api/social/reviews/{id}/` - Xóa review
- [x] ViewSet: `CollectionViewSet`
  - `GET /api/social/collections/` - Danh sách bộ sưu tập của tôi
  - `POST /api/social/collections/` - Tạo bộ sưu tập mới
  - `POST /api/social/collections/{id}/add-recipe/` - Thêm công thức
  - `DELETE /api/social/collections/{id}/remove-recipe/` - Gỡ công thức
  - `DELETE /api/social/collections/{id}/` - Xóa bộ sưu tập

### 4.7 Admin API (`/api/admin/`)
- [x] ViewSet: `AdminRecipeViewSet`
  - `GET /api/admin/recipes/pending/` - Công thức chờ duyệt
  - `POST /api/admin/recipes/{id}/approve/` - Duyệt
  - `POST /api/admin/recipes/{id}/reject/` - Từ chối
- [x] ViewSet: `AdminUserViewSet`
  - `GET /api/admin/users/` - Danh sách user
  - `POST /api/admin/users/{id}/block/` - Khóa tài khoản
  - `POST /api/admin/users/{id}/unblock/` - Mở khóa

---

## 🤖 Phase 5: AI Moderation (Local LLM)

### 5.1 Setup Local AI
- [x] Cài đặt Ollama (đã có sẵn trên máy)
- [x] Tải model `gemma4:e2b` qua Ollama
- [ ] Test kết nối với model qua Ollama API (`http://localhost:11434`)

### 5.2 AI Service Module
- [x] Tạo file `core/services/ai_moderator.py`
- [x] Function `moderate_text(text: str) -> str`:
  - Input: Văn bản cần kiểm duyệt
  - Output: "YES" | "NO" | "SUSPECT"
- [x] Tạo prompt template cho AI
- [x] Xử lý timeout và error handling

### 5.3 Tích hợp AI vào API
- [x] Hook vào `RecipeViewSet.publish()` - kiểm duyệt title, description, steps
- [x] Hook vào `IngredientViewSet.create()` - kiểm duyệt tên nguyên liệu
- [x] Logic Recipe publish:
  - YES → `visibility=PUBLIC` (200)
  - NO → Trả lỗi 400 "Nội dung không phù hợp"
  - SUSPECT → `visibility=PENDING`, chờ Admin (200)
  - Error → 503, không thay đổi trạng thái
- [x] Logic Ingredient create:
  - YES/SUSPECT → `status=PENDING`, chờ Admin duyệt (201)
  - NO → Trả lỗi 400 "Tên nguyên liệu không phù hợp"
  - Error → `status=PENDING`, graceful degradation (201)

---

## 🧮 Phase 6: Thuật toán Gợi ý món ăn

### 6.1 Core Algorithm
- [x] Tạo file `kitchen/services/recommendation_engine.py`
- [x] Function `calculate_recipe_score(recipe, pantry_ingredient_ids, saved_recipe_ids)`:
  - Lấy danh sách nguyên liệu từ Pantry của user
  - Lấy danh sách nguyên liệu của recipe
  - Bỏ qua STAPLE ingredients
  - Tính điểm khớp (+20 điểm/nguyên liệu)
  - Tính điểm phạt theo category:
    - PROTEIN thiếu: -100
    - CARB thiếu: -80
    - VEG thiếu: -50
    - OTHER thiếu: -25
    - SPICE thiếu: -10
  - Kiểm tra recipe có trong Collection của user → +50 điểm
  - Return: `{ "recipe": recipe, "score": int, "missing_ingredients": [] }`

### 6.2 Filtering Logic
- [x] Mode "COOK_NOW": Chỉ lấy recipes có missing_count = 0
- [x] Mode "ADD_MORE": Lấy recipes có missing_count <= 2 VÀ score >= 0
- [x] Sắp xếp theo score giảm dần
- [x] Loại trừ recipes chứa exclude_ingredients

### 6.3 Optimization
- [x] Sử dụng `select_related()` và `prefetch_related()` để giảm query
- [ ] Cache kết quả nếu cần (Redis)
- [x] Đảm bảo response time < 2s

---

## 🔄 Phase 7: Database Transaction (Check-to-Pantry)

### 7.1 Atomic Transaction
- [x] Trong `ShoppingListViewSet.mark_purchased()`:
  ```python
  from django.db import transaction
  
  @transaction.atomic
  def mark_purchased(self, request, pk=None):
      # 1. Lấy shopping_list_item
      # 2. Set is_purchased = True
      # 3. Tìm hoặc tạo Pantry item
      # 4. Cộng dồn quantity vào Pantry
      # 5. Nếu có lỗi → rollback tự động
  ```
- [x] Test rollback khi có lỗi
- [x] Viết unit test cho transaction

---

## 📤 Phase 8: File Upload & Media Handling ✅

### 8.1 Cấu hình Media
- [x] Cấu hình `MEDIA_URL` và `MEDIA_ROOT` trong settings
- [x] Thêm URL pattern cho media files (chỉ dùng trong development)
- [x] Tạo thư mục `media/avatars/`, `media/recipes/`, `media/cooksnaps/` (tự tạo khi upload)

### 8.2 Image Processing
- [x] Cài `Pillow`
- [x] Tạo `core/utils/image_processor.py` — resize/compress giữ aspect ratio, không upscale
- [x] Tạo `core/utils/file_validator.py` — validate extension + MIME type (magic bytes) + file size
- [x] Tạo `core/utils/media_upload_service.py` — orchestrate toàn bộ luồng upload
- [x] 4 Upload Endpoints: avatar, recipe thumbnail, recipe step media, cooksnap
- [x] Property-Based Tests (Hypothesis): 9 properties pass
- [x] Integration Tests: 14 tests pass (upload, permission, cleanup, error cases)

### 8.3 Cloud Storage (Optional - Production)
- [x] Cấu hình `USE_S3`, `AWS_*` trong settings (đọc từ .env, mặc định False)

---

## 🔍 Phase 9: Search & Filter ✅

### 9.1 Recipe Search
- [x] Cài `django-filter`
- [x] Tạo `RecipeFilter`:
  - Filter theo `difficulty`
  - Filter theo `prep_time` (range: `prep_time_min`, `prep_time_max`)
  - Search theo `title` (icontains)
  - Search theo `ingredients__name` (icontains + distinct)
- [x] Áp dụng vào `RecipeViewSet`

### 9.2 Ingredient Autocomplete
- [x] Endpoint `/api/ingredients/search/?q=thit`
- [x] Trả về top 10 kết quả khớp (status=APPROVED, sắp xếp theo name)
- [x] Sử dụng `__icontains`, trả về `[]` nếu q rỗng/whitespace
- [x] Property-Based Tests (Hypothesis): 8 properties pass
- [x] Integration Tests: 18 tests pass (filter, search, pagination, edge cases)

---

## 📊 Phase 10: Statistics & Analytics ✅

### 10.1 User Stats
- [x] Tính tổng số công thức đã đăng (`recipe_count` — chỉ PUBLIC)
- [x] Tính tổng lượt thích (`total_likes` — số lần recipe của user được thêm vào Collection)
- [x] Tính điểm rating trung bình (`average_rating` — Avg trên tất cả PUBLIC recipes, null nếu chưa có review)

### 10.2 Recipe Stats
- [x] Tính điểm rating trung bình (`average_rating`, làm tròn 2 chữ số)
- [x] Đếm số lượt xem (`view_count` — thêm field vào Recipe model + migration, atomic F() increment)
- [x] Đếm số lượt lưu vào Collection (`save_count`)
- [x] Tạo endpoint mới `GET /api/recipes/{id}/stats/` (RecipeStatsView, AllowAny, visibility check)
- [x] Property-Based Tests (Hypothesis): 5 properties pass
- [x] Integration Tests: 12 tests pass

---

## ✅ Phase 11: Testing ✅

### 11.1 Unit Tests
- [x] Test models (validation, constraints) — Review unique, rating validator, Pantry/CollectionRecipe unique, RecipeStep ordering, User email unique, Ingredient category choices, Recipe prep_time validator
- [x] Test serializers — RegisterSerializer, RecipeCreateSerializer, RecipeListSerializer output, PantrySerializer output, ReviewSerializer rating validation
- [x] Test permissions — IsOwnerOrReadOnly (has_permission + has_object_permission), IsOwner, IsAdminUser
- [x] Test AI moderation service — empty input, normalize response, timeout/HTTP500 error handling, prompt content, settings usage
- [x] Test recommendation algorithm (PBT) — STAPLE ignored, +20 match score, penalty by category, +50 affinity bonus, ordering invariant, COOK_NOW/ADD_MORE filter, exclusion invariant
- [x] Test transaction rollback — mark_purchased success/create/accumulate, rollback on exception, PBT accumulation invariant

### 11.2 Integration Tests
- [x] Test API endpoints (status code, response format) — success/error format, unauthenticated 401, visibility filter, ownership 403/404, pagination, admin endpoints
- [x] Test authentication flow — register, login, refresh, logout, blacklist, forgot-password
- [ ] Test file upload (nằm trong Phase 8 — đã có 14 integration tests)
- [x] Test complex workflows — Recipe lifecycle (AI=YES/SUSPECT/NO), Check-to-Pantry, Recommendation, Social Review+Stats, AI unavailable graceful degradation

### 11.3 Performance Tests
- [x] Test recommendation API với 1000+ recipes — response time < 5s
- [x] Test query optimization (N+1 problem) — query count không tăng tuyến tính, pantry ≤5 queries, user stats ≤5 queries
- [x] Bug fix: recommendation_engine thiếu select_related('user') gây N+1 — đã fix

**Kết quả: 192 tests pass (70 unit + 29 integration + 5 performance + 88 tests từ Phase 8-10)**

---

## 📝 Phase 12: Documentation ✅

### 12.1 API Documentation
- [x] Cài `drf-spectacular`
- [x] Generate OpenAPI schema tại `/api/schema/`
- [x] Setup Swagger UI tại `/api/docs/`
- [x] Setup ReDoc tại `/api/redoc/`
- [x] Viết docstring cho các ViewSet (RecipeViewSet, IngredientViewSet, PantryViewSet, ShoppingListViewSet, ReviewViewSet, CollectionViewSet, RecommendationView)
- [x] Viết docstring cho các Serializer (RecipeCreateSerializer, RecipeDetailSerializer, PantrySerializer, ReviewSerializer, RegisterSerializer)

### 12.2 README
- [x] Hướng dẫn cài đặt (clone, virtualenv, pip install)
- [x] Hướng dẫn cấu hình môi trường (.env, biến bắt buộc)
- [x] Hướng dẫn chạy development server
- [x] Hướng dẫn chạy migrations + tạo superuser
- [x] Hướng dẫn chạy tests (pytest, -m unit, -m integration, -m performance)
- [x] API endpoints overview (8 nhóm endpoint đầy đủ)
- [x] Yêu cầu hệ thống (Python 3.11+, PostgreSQL 14+, Git)

---

## 🚀 Phase 13: Deployment Preparation

### 13.1 Production Settings
- [ ] Tách `settings.py` thành `settings/base.py`, `settings/dev.py`, `settings/prod.py`
- [ ] Cấu hình `DEBUG=False` cho production
- [ ] Cấu hình `ALLOWED_HOSTS`
- [ ] Cấu hình HTTPS/SSL

### 13.2 Security
- [ ] Cấu hình CORS đúng origin
- [ ] Thêm rate limiting (django-ratelimit)
- [ ] Cấu hình CSP headers
- [ ] Review security checklist: `python manage.py check --deploy`

### 13.3 Database
- [ ] Backup strategy
- [ ] Migration rollback plan
- [ ] Indexing cho các trường thường query

---

## 📌 Notes & Best Practices

### Coding Standards
- Sử dụng `black` để format code
- Sử dụng `flake8` để lint
- Viết docstring cho functions/classes phức tạp
- Commit message rõ ràng

### Git Workflow
- Branch `main` cho production
- Branch `develop` cho development
- Feature branches: `feature/ten-tinh-nang`
- Commit thường xuyên, mỗi commit 1 chức năng nhỏ

### Performance Tips
- Luôn dùng `select_related()` cho ForeignKey
- Luôn dùng `prefetch_related()` cho ManyToMany
- Thêm `db_index=True` cho các field thường filter/search
- Pagination cho tất cả list endpoints

---

## 🎯 Priority Order (Khuyến nghị)

1. **Phase 1-2**: Setup + Models (Nền tảng)
2. **Phase 3**: Authentication (Bắt buộc cho mọi tính năng)
3. **Phase 4.1-4.3**: Core APIs (Accounts, Ingredients, Recipes)
4. **Phase 4.4**: Kitchen APIs (Pantry, Shopping List)
5. **Phase 7**: Transaction (Quan trọng cho tính toàn vẹn dữ liệu)
6. **Phase 6**: Recommendation Algorithm (Tính năng đặc trưng)
7. **Phase 4.6**: Social APIs (Reviews, Collections)
8. **Phase 5**: AI Moderation (Có thể làm sau, tạm thời dùng manual moderation)
9. **Phase 8-13**: Các tính năng bổ sung

---

## 📅 Estimated Timeline

- Phase 1-2: 2-3 ngày
- Phase 3: 1-2 ngày
- Phase 4 (Core APIs): 5-7 ngày
- Phase 5 (AI): 2-3 ngày
- Phase 6 (Algorithm): 2-3 ngày
- Phase 7 (Transaction): 1 ngày
- Phase 8-10: 3-4 ngày
- Phase 11-13: 3-5 ngày

**Tổng ước tính: 20-30 ngày làm việc**

---

## ✨ Bonus Features (Nếu có thời gian)

- [ ] WebSocket cho real-time notifications
- [ ] Email notifications (công thức được duyệt, có người comment)
- [ ] Export recipe to PDF
- [ ] Recipe import từ URL (web scraping)
- [ ] Nutrition calculator API integration
- [ ] Multi-language support (i18n)
- [ ] Dark mode support (frontend)

---

**Last Updated**: Session 12 - Phase 12 Completed ✅ (Documentation — drf-spectacular, Swagger UI + ReDoc, docstring ViewSet/Serializer, README đầy đủ. 192 tests vẫn pass)
**Next Session**: Phase 13 (Deployment Preparation)
