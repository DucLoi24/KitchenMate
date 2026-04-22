# Kế hoạch Triển khai: Phase 11 — Testing Suite Toàn Diện

## Tổng quan

Xây dựng bộ test suite đầy đủ cho KitchenMate Backend, bao gồm Unit Tests (model, serializer, permission, service, PBT), Integration Tests (auth flow, API endpoints, complex workflows), và Performance Tests (N+1 query, response time). Tất cả test viết bằng `pytest` + `pytest-django` + `Hypothesis`, không phụ thuộc Ollama thật.

## Tasks

- [x] 1. Nâng cấp cấu hình test infrastructure
  - [x] 1.1 Cập nhật `conftest.py` với shared fixtures
    - Thêm fixture `api_client` → trả về `APIClient()` của DRF
    - Thêm fixture `auth_user` → tạo User thường, gắn credentials vào `api_client`
    - Thêm fixture `admin_user` → tạo User với `is_staff=True`
    - Thêm fixture `sample_ingredient` → dict gồm 4 ingredient: PROTEIN, CARB, VEG, STAPLE
    - Thêm fixture `sample_recipe` → Recipe PRIVATE thuộc `auth_user`, có RecipeIngredient
    - Thêm fixture `sample_pantry` → Pantry item cho `auth_user` với ingredient PROTEIN
    - _Requirements: 13.3_

  - [x] 1.2 Cập nhật `pytest.ini` với custom marks
    - Thêm `markers` section với: `unit`, `integration`, `performance`, `pbt`
    - Đảm bảo `pytest -m unit` chạy đúng nhóm, không warning unknown marks
    - _Requirements: 13.2, 13.4, 13.5_

- [x] 2. Unit Tests — Model Validation & Constraints
  - [x] 2.1 Tạo file `tests/test_phase11_unit_models.py`
    - Test `Review` unique constraint `(user, recipe)` → `IntegrityError`
    - Test `Review.rating` validator: rating=0 và rating=6 → `ValidationError`
    - Test `Pantry` unique constraint `(user, ingredient)` → `IntegrityError`
    - Test `CollectionRecipe` unique constraint `(collection, recipe)` → `IntegrityError`
    - Test `RecipeStep` Meta ordering: tạo steps thứ tự ngẫu nhiên, query lại → đúng thứ tự `step_number`
    - Test `User` email unique constraint → `IntegrityError`
    - Test `Ingredient` category choices: tất cả 6 giá trị hợp lệ được chấp nhận, giá trị ngoài danh sách bị từ chối
    - Test `Recipe.prep_time` MinValueValidator: `prep_time=0` → lỗi validation
    - Đánh dấu toàn bộ class với `@pytest.mark.unit` và `@pytest.mark.django_db`
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8_

- [x] 3. Unit Tests — Serializers
  - [x] 3.1 Tạo file `tests/test_phase11_unit_serializers.py`
    - Test `RegisterSerializer`: `password != password2` → lỗi trên field `password`
    - Test `RegisterSerializer`: email không hợp lệ (thiếu @) → lỗi trên field `email`
    - Test `RecipeCreateSerializer`: `prep_time=-1` → `is_valid()` trả về `False`
    - Test `RecipeCreateSerializer`: `difficulty='INVALID'` → `is_valid()` trả về `False`
    - Test `RecipeListSerializer` output: xác nhận đủ 7 fields `id, title, difficulty, prep_time, visibility, thumbnail_url, created_at`
    - Test `PantrySerializer` output: xác nhận có `ingredient` (nested object), `quantity`, `unit`
    - Test `ReviewSerializer`: `rating=0` và `rating=6` → `is_valid()` trả về `False`
    - Đánh dấu toàn bộ class với `@pytest.mark.unit`
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7_

- [x] 4. Unit Tests — Permissions
  - [x] 4.1 Tạo file `tests/test_phase11_unit_permissions.py`
    - Test `IsOwnerOrReadOnly.has_permission`: unauthenticated + GET → `True`
    - Test `IsOwnerOrReadOnly.has_permission`: unauthenticated + POST → `False`
    - Test `IsOwnerOrReadOnly.has_permission`: unauthenticated + PUT → `False`
    - Test `IsOwnerOrReadOnly.has_permission`: unauthenticated + DELETE → `False`
    - Test `IsOwnerOrReadOnly.has_object_permission`: owner + PUT → `True`
    - Test `IsOwnerOrReadOnly.has_object_permission`: non-owner + PUT → `False`
    - Test `IsOwner.has_object_permission`: owner → `True`
    - Test `IsOwner.has_object_permission`: non-owner → `False`
    - Test `IsAdminUser.has_permission`: `is_staff=True` → `True`; `is_staff=False` → `False`
    - Dùng `MockRequest` và mock object có thuộc tính `user`, không cần HTTP thật
    - Đánh dấu toàn bộ class với `@pytest.mark.unit`
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7_

- [x] 5. Unit Tests — AI Moderation Service
  - [x] 5.1 Tạo file `tests/test_phase11_unit_ai_moderator.py`
    - Mock `requests.post` (hoặc `httpx`) để không gọi Ollama thật
    - Test input rỗng `""` → trả về `'SUSPECT'`, mock không được gọi
    - Test input chỉ whitespace `"   "` → trả về `'SUSPECT'`, mock không được gọi
    - Test Ollama trả về `'GARBAGE'` → fallback `'SUSPECT'`
    - Test Ollama trả về `'yes'` → normalize thành `'YES'`
    - Test Ollama trả về `'Yes'` → normalize thành `'YES'`
    - Test Ollama trả về `'YES '` (có trailing space) → normalize thành `'YES'`
    - Test Ollama timeout (`requests.exceptions.Timeout`) → raise `ModerationTimeoutError`
    - Test Ollama HTTP 500 → raise `ModerationServiceError`
    - Test prompt chứa nguyên văn input text (không bị truncate)
    - Test sử dụng `settings.OLLAMA_BASE_URL`, `settings.OLLAMA_MODEL`, `settings.OLLAMA_TIMEOUT`
    - Đánh dấu toàn bộ class với `@pytest.mark.unit`
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7_

- [x] 6. Unit Tests — Recommendation Algorithm (PBT)
  - [x] 6.1 Tạo file `tests/test_phase11_unit_recommendation_properties.py`
    - Import `calculate_recipe_score` và `get_recommendations` từ `apps.kitchen.services.recommendation_engine`
    - Dùng `@given` của Hypothesis để sinh dữ liệu ngẫu nhiên cho tất cả PBT

  - [x] 6.2 PBT: STAPLE bị bỏ qua hoàn toàn
    - **Property 1: STAPLE ingredients không ảnh hưởng score**
    - Sinh recipe chỉ có STAPLE ingredients, pantry rỗng
    - Xác nhận `score == 0` và `missing_ingredients == []`
    - **Validates: Requirements 5.1**

  - [x] 6.3 PBT: +20 điểm mỗi ingredient match
    - **Property 2: Match score tuyến tính**
    - Sinh N ingredient non-STAPLE, tất cả có trong pantry
    - Xác nhận `score == N * 20` (không có penalty, không có affinity)
    - **Validates: Requirements 5.2**

  - [x] 6.4 PBT: Penalty đúng theo category
    - **Property 3: Penalty invariant theo category**
    - Sinh recipe với 1 ingredient missing, kiểm tra penalty đúng với PENALTY dict
    - Xác nhận `score == PENALTY[category]` cho từng category
    - **Validates: Requirements 5.3**

  - [x] 6.5 PBT: +50 Affinity Bonus khi recipe trong Collection
    - **Property 4: Affinity Bonus cộng đúng +50**
    - Tính score với `saved_recipe_ids` rỗng, sau đó với recipe.id trong set
    - Xác nhận `score_with_affinity == score_without_affinity + 50`
    - **Validates: Requirements 5.4, 5.5**

  - [x] 6.6 PBT: Kết quả sắp xếp score giảm dần
    - **Property 5: Ordering invariant**
    - Sinh danh sách kết quả từ `get_recommendations`, kiểm tra `scores[i] >= scores[i+1]`
    - **Validates: Requirements 5.6**

  - [x] 6.7 PBT: COOK_NOW chỉ trả về missing_count == 0
    - **Property 6: COOK_NOW filter invariant**
    - Với mode=COOK_NOW, xác nhận tất cả kết quả có `len(missing_ingredients) == 0`
    - **Validates: Requirements 5.7**

  - [x] 6.8 PBT: ADD_MORE chỉ trả về missing_count <= 2 AND score >= 0
    - **Property 7: ADD_MORE filter invariant**
    - Với mode=ADD_MORE, xác nhận tất cả kết quả có `missing_count <= 2` và `score >= 0`
    - **Validates: Requirements 5.8**

  - [x] 6.9 PBT: exclude_ingredient_ids loại trừ đúng recipe
    - **Property 8: Exclusion invariant**
    - Sinh danh sách `exclude_ids`, xác nhận không có recipe nào trong kết quả chứa ingredient đó
    - **Validates: Requirements 5.9**

  - Đánh dấu toàn bộ class với `@pytest.mark.unit` và `@pytest.mark.pbt`
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8, 5.9, 5.10_

- [x] 7. Unit Tests — Transaction Rollback
  - [x] 7.1 Tạo file `tests/test_phase11_unit_transaction.py`
    - Test `mark_purchased` thành công: `is_purchased=True` VÀ Pantry được cập nhật trong cùng transaction
    - Test `mark_purchased` tạo Pantry mới khi chưa tồn tại: `Pantry.quantity == shopping_item.quantity`
    - Test `mark_purchased` cộng dồn khi Pantry đã tồn tại: `Pantry.quantity == old_qty + shopping_item.quantity`
    - Test rollback khi exception: mock raise exception sau khi set `is_purchased=True`, xác nhận cả hai thay đổi bị rollback
    - Test sau rollback: `ShoppingList.is_purchased` vẫn `False`, Pantry không thay đổi
    - Đánh dấu toàn bộ class với `@pytest.mark.unit` và `@pytest.mark.django_db`

  - [x] 7.2 PBT: N lần mark-purchased → Pantry.quantity = tổng cộng dồn
    - **Property 9: Pantry accumulation invariant**
    - Sinh danh sách N quantity dương, thực hiện N lần mark-purchased
    - Xác nhận `Pantry.quantity == sum(quantities)`
    - **Validates: Requirements 6.6**

  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_

- [x] 8. Checkpoint — Unit Tests
  - Đảm bảo tất cả unit tests pass với `pytest -m unit --no-header -q`
  - Xác nhận không có test nào gọi Ollama thật (kiểm tra mock được gọi đúng)
  - Hỏi user nếu có vấn đề cần làm rõ trước khi tiếp tục.

- [x] 9. Integration Tests — Authentication Flow
  - [x] 9.1 Tạo file `tests/test_phase11_integration_auth.py`
    - Test `POST /api/auth/register/` dữ liệu hợp lệ → HTTP 201, user tồn tại trong DB
    - Test `POST /api/auth/register/` email trùng → HTTP 400
    - Test `POST /api/auth/login/` credentials đúng → HTTP 200, có `access` và `refresh` trong response
    - Test `POST /api/auth/login/` password sai → HTTP 401
    - Test `POST /api/auth/refresh/` refresh token hợp lệ → HTTP 200, có `access` token mới
    - Test `POST /api/auth/logout/` refresh token hợp lệ → HTTP 200, token bị blacklist
    - Test dùng access token sau logout → HTTP 401
    - Test `POST /api/auth/forgot-password/` email hợp lệ → HTTP 200
    - Đánh dấu toàn bộ class với `@pytest.mark.integration` và `@pytest.mark.django_db`
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8_

- [x] 10. Integration Tests — API Endpoints
  - [x] 10.1 Tạo file `tests/test_phase11_integration_api.py`
    - Test response format success: xác nhận `{"success": true, "data": ...}` trên ít nhất 3 endpoints
    - Test response format error: xác nhận `{"success": false, "error": {"message": "..."}}` trên ít nhất 2 endpoints
    - Test unauthenticated → HTTP 401 cho `GET /api/accounts/me/` và `GET /api/kitchen/pantry/`
    - Test `GET /api/recipes/` chỉ trả về recipe `visibility=PUBLIC` (tạo cả PRIVATE và PUBLIC, xác nhận chỉ thấy PUBLIC)
    - Test `DELETE /api/recipes/{id}/` recipe không phải của mình → HTTP 403 hoặc 404
    - Test pagination: `GET /api/recipes/` có đủ fields `count`, `next`, `previous`, `results`
    - Test `GET /api/admin/recipes/pending/` không phải admin → HTTP 403
    - Test admin `POST /api/admin/recipes/{id}/approve/` → recipe `visibility=PUBLIC`, HTTP 200
    - Đánh dấu toàn bộ class với `@pytest.mark.integration` và `@pytest.mark.django_db`
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 8.8_

- [x] 11. Integration Tests — Complex Workflows
  - [x] 11.1 Tạo file `tests/test_phase11_integration_workflows.py`
    - Mock `moderate_text` để kiểm soát kết quả AI trong tất cả workflow tests

  - [x] 11.2 Workflow Recipe Lifecycle — AI=YES
    - `POST /api/recipes/` → tạo recipe PRIVATE
    - Mock AI trả về `'YES'`
    - `POST /api/recipes/{id}/publish/` → xác nhận `visibility=PUBLIC`
    - _Requirements: 10.1_

  - [x] 11.3 Workflow Recipe Lifecycle — AI=SUSPECT → Admin approve
    - Mock AI trả về `'SUSPECT'`
    - `POST /api/recipes/{id}/publish/` → xác nhận `visibility=PENDING`
    - Admin `POST /api/admin/recipes/{id}/approve/` → xác nhận `visibility=PUBLIC`
    - _Requirements: 10.2_

  - [x] 11.4 Workflow Recipe Lifecycle — AI=NO
    - Mock AI trả về `'NO'`
    - `POST /api/recipes/{id}/publish/` → xác nhận `visibility=PRIVATE` và HTTP 400
    - _Requirements: 10.3_

  - [x] 11.5 Workflow Check-to-Pantry
    - `POST /api/kitchen/shopping-list/` → thêm item
    - `POST /api/kitchen/shopping-list/{id}/mark-purchased/` → HTTP 200
    - Xác nhận `is_purchased=True` VÀ Pantry được cập nhật với đúng quantity
    - _Requirements: 10.4_

  - [x] 11.6 Workflow Recommendation
    - Thêm ingredient vào Pantry của user
    - Tạo recipe PUBLIC có đúng ingredient đó
    - `POST /api/recommendations/suggest/` với `mode=COOK_NOW`
    - Xác nhận recipe xuất hiện trong kết quả với `missing_count == 0`
    - _Requirements: 10.5_

  - [x] 11.7 Workflow Social — Review & Stats
    - Tạo recipe PUBLIC
    - `POST /api/social/recipes/{id}/reviews/` → tạo review với rating=4
    - `GET /api/recipes/{id}/stats/` → xác nhận `review_count=1` và `average_rating=4.0`
    - _Requirements: 10.6_

  - [x] 11.8 Workflow AI unavailable — Graceful degradation
    - Mock `moderate_text` raise `ModerationServiceError`
    - `POST /api/recipes/{id}/publish/` → HTTP 503, recipe giữ nguyên `visibility=PRIVATE`
    - _Requirements: 10.7_

  - Đánh dấu toàn bộ class với `@pytest.mark.integration` và `@pytest.mark.django_db`

- [x] 12. Checkpoint — Integration Tests
  - Đảm bảo tất cả integration tests pass với `pytest -m integration --no-header -q`
  - Xác nhận tất cả workflow tests dùng mock AI (không gọi Ollama thật)
  - Hỏi user nếu có vấn đề cần làm rõ trước khi tiếp tục.

- [x] 13. Performance Tests
  - [x] 13.1 Tạo file `tests/test_phase11_performance.py`
    - Dùng `django_assert_num_queries` context manager để đếm SQL queries
    - Dùng `time.time()` hoặc `pytest-benchmark` để đo thời gian

  - [x] 13.2 Test Recommendation API — Response time
    - Tạo bulk 1000 Recipe PUBLIC với `Recipe.objects.bulk_create()`
    - Gọi `POST /api/recommendations/suggest/` (mode=COOK_NOW)
    - Xác nhận hoàn thành trong vòng 5 giây
    - _Requirements: 11.1_

  - [x] 13.3 Test Recommendation API — N+1 query check
    - Với 1000 Recipe PUBLIC, gọi `POST /api/recommendations/suggest/`
    - Dùng `django_assert_num_queries(10)` → xác nhận ≤ 10 SQL queries
    - Xác nhận `prefetch_related('recipe_ingredients__ingredient')` được sử dụng
    - _Requirements: 11.2, 11.3_

  - [x] 13.4 Test Recipe list — Query count không tăng tuyến tính
    - Tạo 10 recipe, đếm query count khi `GET /api/recipes/`
    - Tạo thêm 40 recipe (tổng 50), đếm query count lại
    - Xác nhận query count bằng nhau (không có N+1)
    - _Requirements: 12.1, 12.2_

  - [x] 13.5 Test Pantry list — Query optimization
    - Tạo 100 Pantry items cho user
    - Dùng `django_assert_num_queries(5)` cho `GET /api/kitchen/pantry/`
    - _Requirements: 12.3_

  - [x] 13.6 Test User stats — Query optimization
    - Tạo user với nhiều recipe và review
    - Dùng `django_assert_num_queries(5)` cho `GET /api/accounts/{id}/stats/`
    - _Requirements: 12.4_

  - Đánh dấu toàn bộ class với `@pytest.mark.performance` và `@pytest.mark.django_db`

- [x] 14. Checkpoint cuối — Đảm bảo toàn bộ test suite pass
  - Chạy `pytest --no-header -q` để xác nhận tất cả tests pass
  - Chạy `pytest --cov=. --cov-report=term-missing` để kiểm tra coverage ≥ 80%
  - Đảm bảo không có dữ liệu test còn lại trong database sau khi chạy
  - Hỏi user nếu có vấn đề cần làm rõ.

## Ghi chú

- Tasks đánh dấu `*` là optional (PBT), có thể bỏ qua để chạy nhanh MVP
- Mỗi task tham chiếu đến requirements cụ thể để đảm bảo traceability
- Tất cả AI calls phải được mock — không phụ thuộc Ollama thật khi chạy test
- Dùng `@pytest.mark.django_db(transaction=True)` cho các test liên quan đến transaction rollback
- Performance tests nên chạy riêng biệt: `pytest -m performance` để tránh làm chậm CI pipeline
