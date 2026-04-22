# Tài liệu Yêu cầu — Phase 11: Testing Suite Toàn Diện

## Giới thiệu

Phase 11 xây dựng bộ test suite toàn diện cho KitchenMate Backend, bao phủ toàn bộ logic nghiệp vụ đã triển khai từ Phase 1–10. Mục tiêu là đảm bảo tính đúng đắn, độ bền vững và khả năng phát hiện regression của hệ thống thông qua ba lớp kiểm thử: Unit Tests (kiểm tra từng thành phần độc lập), Integration Tests (kiểm tra luồng API end-to-end), và Performance Tests (kiểm tra hiệu năng dưới tải lớn).

Bộ test kế thừa và mở rộng các test đã có từ Phase 8–10 (Hypothesis PBT), đồng thời lấp đầy các khoảng trống chưa được kiểm thử: model validation, serializer, permissions, transaction rollback, và complex workflows.

Tất cả test được viết bằng `pytest` + `pytest-django`, sử dụng `Hypothesis` cho Property-Based Testing, và không phụ thuộc vào Ollama thật (mock AI service).

## Bảng thuật ngữ

- **Test_Suite**: Toàn bộ bộ kiểm thử của Phase 11, bao gồm unit, integration và performance tests.
- **Unit_Test**: Kiểm thử một thành phần đơn lẻ (model, serializer, permission, service) trong isolation, không gọi HTTP thật.
- **Integration_Test**: Kiểm thử luồng API end-to-end qua `APIClient` của DRF, tương tác với database thật.
- **Performance_Test**: Kiểm thử hành vi hệ thống dưới tải dữ liệu lớn (1000+ bản ghi), đo thời gian phản hồi và số lượng query.
- **PBT**: Property-Based Testing — dùng `Hypothesis` để sinh dữ liệu ngẫu nhiên và kiểm tra invariants.
- **Recommendation_Engine**: Module `kitchen/services/recommendation_engine.py` — thuật toán Tier-3 Scoring.
- **AI_Moderator**: Module `core/services/ai_moderator.py` — dịch vụ kiểm duyệt nội dung qua Ollama.
- **Transaction_Service**: Logic `@transaction.atomic` trong `ShoppingListViewSet.mark_purchased()`.
- **IsOwnerOrReadOnly**: Custom permission tại `core/permissions.py` — chỉ owner mới được write.
- **IsOwner**: Custom permission tại `core/permissions.py` — chỉ owner mới được truy cập.
- **RecipeFilter**: Class `django_filters.FilterSet` tại `apps/recipes/filters.py`.
- **Pantry**: Model `kitchen.Pantry` — tủ lạnh số của user.
- **ShoppingList**: Model `kitchen.ShoppingList` — danh sách đi chợ.
- **CollectionRecipe**: Model `social.CollectionRecipe` — bảng many-to-many giữa Collection và Recipe.
- **STAPLE**: Category nguyên liệu (muối, đường, dầu) bị bỏ qua trong thuật toán gợi ý.
- **Tier3_Score**: Điểm gợi ý = (+20 × match) + penalty(missing) + (+50 × affinity).
- **COOK_NOW**: Mode gợi ý — chỉ trả về recipe có `missing_count == 0`.
- **ADD_MORE**: Mode gợi ý — trả về recipe có `missing_count <= 2` VÀ `score >= 0`.
- **N+1_Query**: Vấn đề hiệu năng khi ORM thực hiện N query thêm cho N bản ghi liên quan.
- **django_assert_num_queries**: Context manager của pytest-django để đếm số SQL query.

---

## Yêu cầu

### Yêu cầu 1: Unit Tests — Model Validation và Constraints

**User Story:** Là developer, tôi muốn các model được kiểm thử kỹ về validation và constraints, để đảm bảo tính toàn vẹn dữ liệu ở tầng database.

#### Tiêu chí chấp nhận

1. WHEN tạo `Review` với `rating` ngoài khoảng [1, 5], THE Test_Suite SHALL xác nhận Django raise `ValidationError` hoặc database raise `IntegrityError`.
2. WHEN tạo hai `Review` từ cùng một user cho cùng một recipe, THE Test_Suite SHALL xác nhận database raise `IntegrityError` do unique constraint `(user, recipe)`.
3. WHEN tạo hai `Pantry` items với cùng `(user, ingredient)`, THE Test_Suite SHALL xác nhận database raise `IntegrityError` do unique constraint.
4. WHEN tạo hai `CollectionRecipe` với cùng `(collection, recipe)`, THE Test_Suite SHALL xác nhận database raise `IntegrityError` do unique constraint.
5. WHEN tạo `Recipe` với `prep_time` là số âm, THE Test_Suite SHALL xác nhận model hoặc serializer raise lỗi validation.
6. THE Test_Suite SHALL xác nhận `RecipeStep` được sắp xếp theo `step_number` tăng dần (Meta ordering).
7. WHEN tạo `User` với `email` đã tồn tại, THE Test_Suite SHALL xác nhận database raise `IntegrityError` do unique constraint trên `email`.
8. FOR ALL `Ingredient` categories trong `['PROTEIN', 'CARB', 'VEG', 'SPICE', 'STAPLE', 'OTHER']`, THE Test_Suite SHALL xác nhận model chấp nhận giá trị hợp lệ và từ chối giá trị ngoài danh sách.

---

### Yêu cầu 2: Unit Tests — Serializer

**User Story:** Là developer, tôi muốn các serializer được kiểm thử về input validation và output format, để đảm bảo API nhận và trả dữ liệu đúng cấu trúc.

#### Tiêu chí chấp nhận

1. WHEN `RegisterSerializer` nhận `password` và `password2` không khớp, THE Test_Suite SHALL xác nhận serializer trả về lỗi validation trên field `password`.
2. WHEN `RegisterSerializer` nhận `email` không đúng định dạng, THE Test_Suite SHALL xác nhận serializer trả về lỗi validation trên field `email`.
3. WHEN `RecipeCreateSerializer` nhận `prep_time` là số âm hoặc bằng 0, THE Test_Suite SHALL xác nhận serializer trả về lỗi validation.
4. WHEN `RecipeCreateSerializer` nhận `difficulty` không thuộc `['EASY', 'MEDIUM', 'HARD']`, THE Test_Suite SHALL xác nhận serializer trả về lỗi validation.
5. THE Test_Suite SHALL xác nhận `RecipeListSerializer` output chứa đúng các fields: `id`, `title`, `difficulty`, `prep_time`, `visibility`, `thumbnail_url`, `created_at`.
6. THE Test_Suite SHALL xác nhận `PantrySerializer` output chứa `ingredient` (nested), `quantity`, `unit`.
7. WHEN `ReviewSerializer` nhận `rating` ngoài khoảng [1, 5], THE Test_Suite SHALL xác nhận serializer trả về lỗi validation.

---

### Yêu cầu 3: Unit Tests — Permissions

**User Story:** Là developer, tôi muốn các custom permission được kiểm thử đầy đủ, để đảm bảo phân quyền hoạt động đúng trong mọi tình huống.

#### Tiêu chí chấp nhận

1. WHEN user chưa xác thực gửi request `GET` (safe method) tới endpoint dùng `IsOwnerOrReadOnly`, THE Test_Suite SHALL xác nhận permission trả về `True` (cho phép đọc).
2. WHEN user chưa xác thực gửi request `POST`/`PUT`/`DELETE` (unsafe method) tới endpoint dùng `IsOwnerOrReadOnly`, THE Test_Suite SHALL xác nhận permission trả về `False`.
3. WHEN user đã xác thực gửi request `PUT` tới object mà user là owner, THE Test_Suite SHALL xác nhận `IsOwnerOrReadOnly.has_object_permission()` trả về `True`.
4. WHEN user đã xác thực gửi request `PUT` tới object mà user không phải owner, THE Test_Suite SHALL xác nhận `IsOwnerOrReadOnly.has_object_permission()` trả về `False`.
5. WHEN user đã xác thực gửi request tới object mà user là owner, THE Test_Suite SHALL xác nhận `IsOwner.has_object_permission()` trả về `True`.
6. WHEN user đã xác thực gửi request tới object mà user không phải owner, THE Test_Suite SHALL xác nhận `IsOwner.has_object_permission()` trả về `False`.
7. FOR ALL safe HTTP methods `['GET', 'HEAD', 'OPTIONS']`, THE Test_Suite SHALL xác nhận `IsOwnerOrReadOnly` cho phép truy cập mà không kiểm tra ownership.

---

### Yêu cầu 4: Unit Tests — AI Moderation Service (Mở rộng)

**User Story:** Là developer, tôi muốn AI Moderation Service được kiểm thử toàn diện bao gồm các edge cases, để đảm bảo hệ thống kiểm duyệt hoạt động đúng và graceful khi AI lỗi.

#### Tiêu chí chấp nhận

1. WHEN `moderate_text` nhận input rỗng hoặc chỉ chứa whitespace, THE Test_Suite SHALL xác nhận hàm trả về `'SUSPECT'` mà không gọi Ollama API.
2. WHEN Ollama trả về response không thuộc `['YES', 'NO', 'SUSPECT']` (case-insensitive), THE Test_Suite SHALL xác nhận `moderate_text` trả về `'SUSPECT'` (fallback an toàn).
3. WHEN Ollama trả về response `'yes'`, `'Yes'`, `'YES '`, THE Test_Suite SHALL xác nhận `moderate_text` trả về `'YES'` (normalize case và whitespace).
4. WHEN Ollama timeout, THE Test_Suite SHALL xác nhận `moderate_text` raise `ModerationTimeoutError`.
5. WHEN Ollama trả về HTTP 500, THE Test_Suite SHALL xác nhận `moderate_text` raise `ModerationServiceError`.
6. FOR ALL valid input texts, THE Test_Suite SHALL xác nhận text xuất hiện nguyên vẹn trong prompt gửi tới Ollama (không bị truncate hay modify).
7. THE Test_Suite SHALL xác nhận `moderate_text` sử dụng đúng `OLLAMA_BASE_URL`, `OLLAMA_MODEL`, `OLLAMA_TIMEOUT` từ Django settings (không hardcode).

---

### Yêu cầu 5: Unit Tests — Recommendation Algorithm (PBT)

**User Story:** Là developer, tôi muốn thuật toán gợi ý món ăn được kiểm thử bằng Property-Based Testing, để đảm bảo logic Tier-3 Scoring đúng với mọi tổ hợp nguyên liệu.

#### Tiêu chí chấp nhận

1. FOR ALL tổ hợp nguyên liệu trong pantry và recipe, THE Test_Suite SHALL xác nhận `calculate_recipe_score` bỏ qua hoàn toàn nguyên liệu có `category='STAPLE'` (không cộng điểm, không phạt, không đưa vào `missing_ingredients`).
2. FOR ALL nguyên liệu non-STAPLE có trong pantry, THE Test_Suite SHALL xác nhận mỗi nguyên liệu khớp đóng góp đúng `+20` điểm vào score.
3. FOR ALL nguyên liệu non-STAPLE không có trong pantry, THE Test_Suite SHALL xác nhận penalty đúng theo category: `PROTEIN=-100`, `CARB=-80`, `VEG=-50`, `OTHER=-25`, `SPICE=-10`.
4. WHEN recipe đã được lưu trong Collection của user (`recipe.id in saved_recipe_ids`), THE Test_Suite SHALL xác nhận score tăng thêm đúng `+50` điểm (Affinity Bonus).
5. WHEN recipe không được lưu trong Collection, THE Test_Suite SHALL xác nhận score không thay đổi do Affinity Bonus.
6. FOR ALL kết quả từ `get_recommendations`, THE Test_Suite SHALL xác nhận danh sách được sắp xếp theo `score` giảm dần (invariant thứ tự).
7. WHEN mode là `COOK_NOW`, THE Test_Suite SHALL xác nhận tất cả recipe trong kết quả có `missing_count == 0`.
8. WHEN mode là `ADD_MORE`, THE Test_Suite SHALL xác nhận tất cả recipe trong kết quả có `missing_count <= 2` VÀ `score >= 0`.
9. FOR ALL recipe chứa `exclude_ingredient_ids`, THE Test_Suite SHALL xác nhận recipe đó không xuất hiện trong kết quả gợi ý.
10. THE Test_Suite SHALL xác nhận `missing_ingredients` trong kết quả chỉ chứa nguyên liệu non-STAPLE không có trong pantry.

---

### Yêu cầu 6: Unit Tests — Transaction Rollback

**User Story:** Là developer, tôi muốn logic transaction atomic được kiểm thử kỹ, để đảm bảo tính toàn vẹn dữ liệu khi có lỗi xảy ra trong quá trình mark-purchased.

#### Tiêu chí chấp nhận

1. WHEN `mark_purchased` thành công, THE Test_Suite SHALL xác nhận `ShoppingList.is_purchased` được set thành `True` VÀ `Pantry` được cập nhật trong cùng một transaction.
2. WHEN `mark_purchased` thành công và Pantry item chưa tồn tại, THE Test_Suite SHALL xác nhận Pantry item mới được tạo với đúng `quantity` và `unit`.
3. WHEN `mark_purchased` thành công và Pantry item đã tồn tại, THE Test_Suite SHALL xác nhận `quantity` trong Pantry được cộng dồn (không ghi đè).
4. WHEN có exception xảy ra sau khi set `is_purchased=True` nhưng trước khi cập nhật Pantry, THE Test_Suite SHALL xác nhận cả hai thay đổi đều bị rollback (atomicity).
5. THE Test_Suite SHALL xác nhận sau rollback, `ShoppingList.is_purchased` vẫn là `False` và Pantry không thay đổi.
6. FOR ALL số lượng `quantity` hợp lệ (số dương), THE Test_Suite SHALL xác nhận sau N lần mark-purchased, `Pantry.quantity` bằng tổng cộng dồn của N lần (PBT — invariant cộng dồn).

---

### Yêu cầu 7: Integration Tests — Authentication Flow

**User Story:** Là developer, tôi muốn toàn bộ luồng xác thực JWT được kiểm thử end-to-end, để đảm bảo register, login, refresh, logout hoạt động đúng.

#### Tiêu chí chấp nhận

1. WHEN user gửi `POST /api/auth/register/` với dữ liệu hợp lệ, THE Test_Suite SHALL xác nhận response trả về HTTP 201 và user được tạo trong database.
2. WHEN user gửi `POST /api/auth/register/` với email đã tồn tại, THE Test_Suite SHALL xác nhận response trả về HTTP 400.
3. WHEN user gửi `POST /api/auth/login/` với credentials đúng, THE Test_Suite SHALL xác nhận response trả về HTTP 200 kèm `access` token và `refresh` token.
4. WHEN user gửi `POST /api/auth/login/` với password sai, THE Test_Suite SHALL xác nhận response trả về HTTP 401.
5. WHEN user gửi `POST /api/auth/refresh/` với refresh token hợp lệ, THE Test_Suite SHALL xác nhận response trả về HTTP 200 kèm `access` token mới.
6. WHEN user gửi `POST /api/auth/logout/` với refresh token hợp lệ, THE Test_Suite SHALL xác nhận response trả về HTTP 200 và token bị blacklist.
7. WHEN user dùng access token đã logout để gọi API protected, THE Test_Suite SHALL xác nhận response trả về HTTP 401.
8. WHEN user gửi `POST /api/auth/forgot-password/` với email hợp lệ, THE Test_Suite SHALL xác nhận response trả về HTTP 200 (không lộ thông tin user tồn tại hay không).

---

### Yêu cầu 8: Integration Tests — API Endpoints (Status Code và Response Format)

**User Story:** Là developer, tôi muốn tất cả API endpoints được kiểm thử về status code và cấu trúc response, để đảm bảo API contract nhất quán.

#### Tiêu chí chấp nhận

1. THE Test_Suite SHALL xác nhận tất cả response thành công có cấu trúc `{"success": true, "data": {...}}` hoặc `{"success": true, "data": [...]}`.
2. THE Test_Suite SHALL xác nhận tất cả response lỗi có cấu trúc `{"success": false, "error": {"message": "..."}}`.
3. WHEN user chưa xác thực gọi endpoint yêu cầu auth (`/api/accounts/me/`, `/api/kitchen/pantry/`), THE Test_Suite SHALL xác nhận response trả về HTTP 401.
4. WHEN user gọi `GET /api/recipes/` (public endpoint), THE Test_Suite SHALL xác nhận response trả về HTTP 200 với danh sách chỉ chứa recipe `visibility=PUBLIC`.
5. WHEN user gọi `DELETE /api/recipes/{id}/` với recipe không phải của mình, THE Test_Suite SHALL xác nhận response trả về HTTP 403 hoặc 404.
6. THE Test_Suite SHALL xác nhận tất cả list endpoints có pagination với fields `count`, `next`, `previous`, `results`.
7. WHEN user gọi `GET /api/admin/recipes/pending/` mà không phải admin, THE Test_Suite SHALL xác nhận response trả về HTTP 403.
8. WHEN admin gọi `POST /api/admin/recipes/{id}/approve/`, THE Test_Suite SHALL xác nhận recipe `visibility` được đổi thành `PUBLIC` và response trả về HTTP 200.

---

### Yêu cầu 9: Integration Tests — File Upload

**User Story:** Là developer, tôi muốn các luồng upload file được kiểm thử end-to-end, để đảm bảo upload avatar, thumbnail, step media và cooksnap hoạt động đúng.

#### Tiêu chí chấp nhận

1. WHEN user upload avatar hợp lệ (JPEG/PNG, ≤ 5MB) tới `POST /api/accounts/me/avatar/`, THE Test_Suite SHALL xác nhận response trả về HTTP 200 và `avatar_url` được cập nhật.
2. WHEN user upload file không hợp lệ (PDF, file quá lớn), THE Test_Suite SHALL xác nhận response trả về HTTP 400 kèm thông báo lỗi mô tả.
3. WHEN user chưa xác thực upload file, THE Test_Suite SHALL xác nhận response trả về HTTP 401.
4. WHEN user upload thumbnail cho recipe không phải của mình, THE Test_Suite SHALL xác nhận response trả về HTTP 403.
5. THE Test_Suite SHALL xác nhận file được lưu vào đúng thư mục (`media/avatars/`, `media/recipes/`, `media/cooksnaps/`).

---

### Yêu cầu 10: Integration Tests — Complex Workflow (Recipe Lifecycle)

**User Story:** Là developer, tôi muốn luồng vòng đời đầy đủ của recipe được kiểm thử end-to-end, để đảm bảo các bước tạo → publish → AI check → admin review hoạt động liên tục đúng.

#### Tiêu chí chấp nhận

1. THE Test_Suite SHALL kiểm thử luồng đầy đủ: `POST /api/recipes/` (tạo PRIVATE) → `POST /api/recipes/{id}/publish/` (AI=YES) → xác nhận `visibility=PUBLIC`.
2. THE Test_Suite SHALL kiểm thử luồng: `POST /api/recipes/{id}/publish/` (AI=SUSPECT) → xác nhận `visibility=PENDING` → `POST /api/admin/recipes/{id}/approve/` → xác nhận `visibility=PUBLIC`.
3. THE Test_Suite SHALL kiểm thử luồng: `POST /api/recipes/{id}/publish/` (AI=NO) → xác nhận `visibility=PRIVATE` và response HTTP 400.
4. THE Test_Suite SHALL kiểm thử luồng Check-to-Pantry: `POST /api/kitchen/shopping-list/` (thêm item) → `POST /api/kitchen/shopping-list/{id}/mark-purchased/` → xác nhận `is_purchased=True` VÀ Pantry được cập nhật.
5. THE Test_Suite SHALL kiểm thử luồng Recommendation: thêm nguyên liệu vào Pantry → `POST /api/recommendations/suggest/` (mode=COOK_NOW) → xác nhận chỉ trả về recipe có đủ nguyên liệu.
6. THE Test_Suite SHALL kiểm thử luồng Social: tạo recipe PUBLIC → `POST /api/social/recipes/{id}/reviews/` (tạo review) → `GET /api/recipes/{id}/stats/` → xác nhận `review_count` và `average_rating` đúng.
7. WHEN AI service không khả dụng trong luồng publish, THE Test_Suite SHALL xác nhận recipe giữ nguyên `visibility=PRIVATE` và response HTTP 503 (graceful degradation).

---

### Yêu cầu 11: Performance Tests — Recommendation API

**User Story:** Là developer, tôi muốn Recommendation API được kiểm thử hiệu năng với dữ liệu lớn, để đảm bảo response time chấp nhận được trong production.

#### Tiêu chí chấp nhận

1. WHEN database có 1000 recipe PUBLIC, THE Test_Suite SHALL xác nhận `POST /api/recommendations/suggest/` hoàn thành trong vòng 5 giây.
2. WHEN database có 1000 recipe PUBLIC, THE Test_Suite SHALL xác nhận `POST /api/recommendations/suggest/` thực hiện không quá 10 SQL queries (kiểm tra N+1 problem).
3. THE Test_Suite SHALL xác nhận `get_recommendations()` sử dụng `prefetch_related('recipe_ingredients__ingredient')` để tránh N+1 query khi duyệt qua danh sách recipe.
4. WHEN database có 500 nguyên liệu APPROVED, THE Test_Suite SHALL xác nhận `GET /api/ingredients/search/?q=thit` hoàn thành trong vòng 1 giây.

---

### Yêu cầu 12: Performance Tests — Query Optimization

**User Story:** Là developer, tôi muốn các list endpoints được kiểm thử về số lượng SQL query, để đảm bảo không có N+1 problem trong production.

#### Tiêu chí chấp nhận

1. WHEN database có 50 recipe PUBLIC, THE Test_Suite SHALL xác nhận `GET /api/recipes/` thực hiện số lượng query không tăng tuyến tính theo số recipe (không có N+1).
2. THE Test_Suite SHALL xác nhận số lượng query khi lấy 10 recipe bằng số lượng query khi lấy 50 recipe (invariant query count — PBT).
3. WHEN database có 100 pantry items, THE Test_Suite SHALL xác nhận `GET /api/kitchen/pantry/` thực hiện không quá 5 SQL queries.
4. THE Test_Suite SHALL xác nhận `GET /api/accounts/{id}/stats/` thực hiện không quá 5 SQL queries bất kể số lượng recipe và review của user.

---

### Yêu cầu 13: Cấu trúc và Tổ chức Test Suite

**User Story:** Là developer, tôi muốn bộ test được tổ chức rõ ràng và có thể chạy độc lập từng nhóm, để dễ dàng maintain và debug.

#### Tiêu chí chấp nhận

1. THE Test_Suite SHALL tổ chức test files theo cấu trúc: `tests/test_phase11_unit_models.py`, `tests/test_phase11_unit_serializers.py`, `tests/test_phase11_unit_permissions.py`, `tests/test_phase11_unit_recommendation_properties.py`, `tests/test_phase11_unit_transaction.py`, `tests/test_phase11_integration_auth.py`, `tests/test_phase11_integration_api.py`, `tests/test_phase11_integration_workflows.py`, `tests/test_phase11_performance.py`.
2. THE Test_Suite SHALL sử dụng `pytest.mark` để tag các nhóm test: `@pytest.mark.unit`, `@pytest.mark.integration`, `@pytest.mark.performance`, `@pytest.mark.pbt`.
3. THE Test_Suite SHALL có `conftest.py` với fixtures dùng chung: `api_client`, `auth_user`, `admin_user`, `sample_recipe`, `sample_ingredient`, `sample_pantry`.
4. WHEN chạy `pytest -m unit`, THE Test_Suite SHALL chỉ chạy unit tests mà không cần kết nối Ollama thật.
5. WHEN chạy `pytest -m performance`, THE Test_Suite SHALL chạy riêng performance tests với setup dữ liệu lớn.
6. THE Test_Suite SHALL đạt tổng coverage ≥ 80% trên toàn bộ codebase (đo bằng `pytest-cov`).
7. THE Test_Suite SHALL không để lại dữ liệu test trong database sau khi chạy (cleanup sau mỗi test hoặc dùng `@pytest.mark.django_db` với transaction rollback).
