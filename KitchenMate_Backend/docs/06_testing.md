# KitchenMate Backend — Testing

## Tổng quan

Dự án sử dụng **pytest** kết hợp **Hypothesis** (Property-Based Testing) để đảm bảo tính đúng đắn của hệ thống.

Test suite có cả unit, integration, performance và property-based tests. Số lượng test thay đổi theo từng feature; dùng `pytest` để kiểm tra trạng thái hiện tại.

| Loại test | Số lượng | Mô tả |
|---|---|---|
| Unit tests | Nhiều file | Test models, serializers, permissions, services |
| Integration tests | Nhiều file | Test API endpoints, auth flow, workflows |
| Performance tests | Nhiều file | Test response time, N+1 query |
| Property-based tests | Nhiều file | Test invariants bằng Hypothesis |

---

## Cấu trúc thư mục tests

```
tests/
├── conftest.py                              # Fixtures dùng chung
│
├── # Phase 8 — File Upload
├── test_file_validator_properties.py        # PBT: FileValidator
├── test_image_processor_properties.py      # PBT: ImageProcessor
├── test_media_service_properties.py        # PBT: MediaUploadService
├── test_upload_integration.py              # Integration: upload endpoints
│
├── # Phase 9 — Search & Filter
├── test_ingredient_search.py               # Integration: ingredient search
├── test_ingredient_create.py               # Integration: ingredient create + AI
├── test_recipe_filter_properties.py        # PBT: RecipeFilter
├── test_recipe_filter_integration.py       # Integration: recipe filter
│
├── # Phase 10 — Statistics
├── test_phase10_stats_properties.py        # PBT: stats calculations
├── test_phase10_stats_integration.py       # Integration: stats endpoints
├── test_user_follow_api.py                 # Integration: follow/unfollow + followers/following
│
├── # Phase 11 — Full Test Suite
├── test_phase11_unit_models.py             # Unit: models validation
├── test_phase11_unit_serializers.py        # Unit: serializers
├── test_phase11_unit_permissions.py        # Unit: custom permissions
├── test_phase11_unit_ai_moderator.py       # Unit: AI moderator service
├── test_phase11_unit_recommendation_properties.py  # PBT: recommendation algorithm
├── test_phase11_unit_transaction.py        # Unit: atomic transaction
├── test_phase11_integration_api.py         # Integration: API endpoints
├── test_phase11_integration_auth.py        # Integration: auth flow
├── test_phase11_integration_workflows.py   # Integration: complex workflows
├── test_phase11_performance.py             # Performance: response time, N+1
│
├── # Các test khác
├── test_ai_moderator.py                    # Unit: AI moderator
├── test_recipe_publish.py                  # Integration: recipe publish
└── test_recipe_filter_integration.py       # Integration: recipe filter
```

---

## conftest.py — Fixtures dùng chung

```python
# Các fixtures chính
@pytest.fixture
def api_client():
    """DRF APIClient instance."""

@pytest.fixture
def user(db):
    """User thường đã đăng ký."""

@pytest.fixture
def admin_user(db):
    """User có is_staff=True."""

@pytest.fixture
def auth_client(api_client, user):
    """APIClient đã authenticate với JWT token."""

@pytest.fixture
def ingredient(db):
    """Ingredient APPROVED dùng chung."""

@pytest.fixture
def recipe(db, user, ingredient):
    """Recipe PRIVATE của user."""
```

---

## Unit Tests

### test_phase11_unit_models.py

Kiểm tra các ràng buộc và validation ở model level:

- **Review unique constraint:** Không thể tạo 2 review cho cùng (user, recipe).
- **Review rating validator:** Rating phải trong khoảng [1, 5].
- **Pantry unique constraint:** Không thể có 2 Pantry item cho cùng (user, ingredient).
- **CollectionRecipe unique constraint:** Không thể lưu trùng công thức trong cùng Collection.
- **RecipeStep ordering:** Steps luôn được sắp xếp theo `step_number`.
- **User email unique:** Không thể đăng ký 2 tài khoản cùng email.
- **Ingredient category choices:** Category phải là một trong các giá trị hợp lệ.
- **Recipe prep_time validator:** `prep_time` phải >= 1.

### test_phase11_unit_serializers.py

- **RegisterSerializer:** Validate password match, password strength, email unique.
- **RecipeCreateSerializer:** Tạo Recipe + RecipeIngredient + RecipeStep trong transaction.
- **RecipeListSerializer:** Output đúng các trường cần thiết.
- **PantrySerializer:** Output đúng `ingredient_name`, `ingredient_category`.
- **ReviewSerializer:** Validate rating [1-5].

### test_phase11_unit_permissions.py

- **IsOwnerOrReadOnly.has_permission:** GET → True (anonymous), POST → False (anonymous), POST → True (authenticated).
- **IsOwnerOrReadOnly.has_object_permission:** GET → True, PUT → True (owner), PUT → False (non-owner).
- **IsOwner:** Tất cả methods → False (anonymous), True (owner), False (non-owner).
- **IsAdminUser:** False (regular user), True (staff user).

### test_phase11_unit_ai_moderator.py

- **Empty input:** `moderate_text("")` → `"SUSPECT"` (không gọi Ollama).
- **Normalize response:** `"yes\n"` → `"YES"`, `"  NO  "` → `"NO"`, `"unknown"` → `"SUSPECT"`.
- **Timeout handling:** Ollama timeout → raise `ModerationTimeoutError`.
- **HTTP 500 handling:** Ollama HTTP 500 → raise `ModerationServiceError`.
- **Prompt content:** Prompt phải chứa text cần kiểm duyệt.
- **Settings usage:** Đọc đúng `OLLAMA_BASE_URL`, `OLLAMA_MODEL`, `OLLAMA_TIMEOUT` từ settings.

### test_phase11_unit_recommendation_properties.py (Property-Based Testing)

Sử dụng **Hypothesis** để kiểm tra các tính chất bất biến của thuật toán:

1. **STAPLE ignored:** Nguyên liệu STAPLE không bao giờ xuất hiện trong `missing_ingredients`.
2. **+20 match score:** Mỗi nguyên liệu non-STAPLE có trong pantry → score tăng đúng 20.
3. **Penalty by category:** Mỗi nguyên liệu thiếu → score giảm đúng theo PENALTY table.
4. **+50 affinity bonus:** Công thức trong Collection → score tăng đúng 50.
5. **Ordering invariant:** Kết quả luôn được sắp xếp theo score giảm dần.
6. **COOK_NOW filter:** Tất cả kết quả COOK_NOW đều có `missing_count == 0`.
7. **ADD_MORE filter:** Tất cả kết quả ADD_MORE đều có `missing_count <= 2` VÀ `score >= 0`.
8. **Exclusion invariant:** Công thức chứa excluded ingredient không bao giờ xuất hiện trong kết quả.

### test_phase11_unit_transaction.py

- **mark_purchased success:** ShoppingList `is_purchased=True`, Pantry được tạo/cập nhật.
- **mark_purchased create:** Pantry item mới được tạo nếu chưa tồn tại.
- **mark_purchased accumulate:** Quantity được cộng dồn đúng nếu Pantry item đã tồn tại.
- **Rollback on exception:** Nếu có lỗi trong transaction → cả ShoppingList và Pantry đều không thay đổi.
- **PBT accumulation invariant:** Sau N lần mark_purchased, tổng quantity trong Pantry = tổng quantity từ ShoppingList.

---

## Integration Tests

### test_phase11_integration_api.py

- **Success/error format:** Tất cả response đều theo cấu trúc `{success, data}` hoặc `{success, error}`.
- **Unauthenticated 401:** Các endpoint yêu cầu auth trả về 401 khi không có token.
- **Visibility filter:** List recipes chỉ trả về PUBLIC.
- **Ownership 403/404:** Non-owner không thể sửa/xóa recipe của người khác.
- **Pagination:** List endpoints trả về đúng cấu trúc pagination.
- **Admin endpoints:** Trả về 403 với regular user, 200 với staff user.

### test_phase11_integration_auth.py

- **Register:** Tạo user mới, trả về tokens.
- **Login:** Đăng nhập đúng credentials, trả về tokens.
- **Refresh:** Lấy access token mới bằng refresh token.
- **Logout:** Blacklist refresh token.
- **Blacklist:** Refresh token đã blacklist không dùng được nữa.
- **Forgot-password:** Luôn trả về 200 (không lộ email tồn tại hay không).

### test_user_follow_api.py

Kiểm tra luồng theo dõi người dùng:

- **Follow success:** User đăng nhập có thể theo dõi user khác, stats cập nhật `followers_count`, `following_count`, `is_following`.
- **Self-follow blocked:** Không thể theo dõi chính mình, trả `400`.
- **Duplicate follow:** Follow trùng không tạo quan hệ duplicate, trả trạng thái đang theo dõi.
- **Unfollow:** Hủy theo dõi trả `is_following=false` và cập nhật stats.
- **Public lists:** `/followers/` và `/following/` public, có pagination và trả user card.

### test_phase11_integration_workflows.py

Kiểm tra các workflow phức tạp end-to-end:

1. **Recipe lifecycle (AI=YES):** Tạo recipe → publish → lập tức PENDING → AI xử lý async → visibility=PUBLIC.
2. **Recipe lifecycle (AI=SUSPECT):** Tạo recipe → publish → lập tức PENDING → AI xử lý async → giữ PENDING.
3. **Recipe lifecycle (AI=NO):** Tạo recipe → publish → lập tức PENDING → AI xử lý async → visibility=PRIVATE + reason.
4. **Admin approve PENDING:** Admin approve recipe PENDING → visibility=PUBLIC.
5. **Check-to-Pantry workflow:** Thêm vào shopping list → mark_purchased → Pantry được cập nhật.
5. **Recommendation workflow:** Thêm nguyên liệu vào pantry → gọi suggest → nhận kết quả phù hợp.
6. **Social Review + Stats:** Tạo review → gọi stats → average_rating được tính đúng.
7. **AI unavailable graceful degradation:** Ollama down → ingredient create vẫn thành công (PENDING).

---

## Performance Tests

### test_phase11_performance.py

1. **Recommendation với 1000+ recipes:** Response time < 5 giây.
2. **Query count không tăng tuyến tính:** Thêm nhiều recipes không làm tăng số query đáng kể.
3. **Pantry queries ≤ 5:** Lấy pantry của user chỉ cần tối đa 5 queries.
4. **User stats queries ≤ 5:** Tính user stats chỉ cần tối đa 5 queries.
5. **N+1 detection:** Kiểm tra `select_related` và `prefetch_related` hoạt động đúng.

**Bug đã fix:** `recommendation_engine` thiếu `select_related('user')` gây N+1 query khi serialize recipe list.

---

## Property-Based Testing (Hypothesis)

### Tại sao dùng PBT?

PBT tự động sinh hàng trăm test case ngẫu nhiên để tìm edge case mà unit test thông thường bỏ sót. Đặc biệt hữu ích cho:
- Thuật toán tính điểm (recommendation engine)
- Xử lý ảnh (resize, compress)
- Validation logic (file validator)

### Ví dụ property

```python
from hypothesis import given, strategies as st

@given(
    pantry_ids=st.frozensets(st.integers(min_value=1, max_value=100)),
    saved_ids=st.frozensets(st.uuids()),
)
def test_staple_never_in_missing(pantry_ids, saved_ids):
    """STAPLE ingredients không bao giờ xuất hiện trong missing_ingredients."""
    recipe = create_recipe_with_staple_ingredient()
    score, missing = calculate_recipe_score(recipe, pantry_ids, saved_ids)
    assert all(ing['category'] != 'STAPLE' for ing in missing)
```

### Kết quả PBT

| Module | Số properties | Kết quả |
|---|---|---|
| FileValidator | 3 | ✅ Pass |
| ImageProcessor | 3 | ✅ Pass |
| MediaUploadService | 3 | ✅ Pass |
| RecipeFilter | 8 | ✅ Pass |
| Stats calculations | 5 | ✅ Pass |
| Recommendation algorithm | 8 | ✅ Pass |
| Transaction accumulation | 1 | ✅ Pass |

---

## Chạy Tests

```bash
# Activate virtualenv
source venv/bin/activate  # Linux/Mac
venv\Scripts\activate     # Windows

# Tất cả tests
pytest

# Với verbose output
pytest -v

# Chỉ một file
pytest tests/test_phase11_unit_models.py

# Chỉ một test function
pytest tests/test_phase11_unit_models.py::test_review_unique_constraint

# Theo marker
pytest -m unit
pytest -m integration
pytest -m performance

# Với coverage
pytest --cov=. --cov-report=html
# Xem report tại htmlcov/index.html

# Chạy nhanh (bỏ qua slow tests)
pytest -m "not performance"
```
