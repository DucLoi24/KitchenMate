# Thiết kế — Phase 12: Documentation

## Tổng quan

Phase 12 hoàn thiện tài liệu hóa cho KitchenMate Backend. Mục tiêu là đảm bảo bất kỳ developer mới nào cũng có thể clone repo, cài đặt, chạy server và khám phá toàn bộ API chỉ bằng cách đọc tài liệu — không cần hỏi thêm.

Phase này gồm 4 nhóm công việc chính:
1. **Hoàn thiện URL routing** — thêm `/api/redoc/` còn thiếu
2. **Docstring cho ViewSet** — bổ sung mô tả cho các class và custom action
3. **Docstring cho Serializer** — bổ sung mô tả cho các Serializer quan trọng
4. **Cập nhật README.md** — hướng dẫn cài đặt đầy đủ + bảng API endpoints

Không có thay đổi logic nghiệp vụ, không có migration mới. Tất cả 192 tests hiện có phải tiếp tục pass.

---

## Kiến trúc

### Trạng thái hiện tại

```
settings.py
  ├── INSTALLED_APPS: 'drf_spectacular' ✅
  ├── REST_FRAMEWORK.DEFAULT_SCHEMA_CLASS: AutoSchema ✅
  └── SPECTACULAR_SETTINGS: TITLE, DESCRIPTION, VERSION, SERVE_INCLUDE_SCHEMA ✅

urls.py
  ├── /api/schema/  → SpectacularAPIView ✅
  ├── /api/docs/    → SpectacularSwaggerView ✅
  └── /api/redoc/   → CHƯA CÓ ❌
```

### Sau Phase 12

```
urls.py
  ├── /api/schema/  → SpectacularAPIView ✅
  ├── /api/docs/    → SpectacularSwaggerView ✅
  └── /api/redoc/   → SpectacularRedocView ✅ (thêm mới)

ViewSets (docstring bổ sung)
  ├── RecipeViewSet          — class + publish action
  ├── IngredientViewSet      — class + search action
  ├── PantryViewSet          — class
  ├── ShoppingListViewSet    — class + mark_purchased action
  ├── ReviewViewSet          — class
  ├── CollectionViewSet      — class
  └── RecommendationView     — class + post method

Serializers (docstring bổ sung)
  ├── RecipeCreateSerializer
  ├── RecipeDetailSerializer
  ├── PantrySerializer
  ├── ReviewSerializer
  └── RegisterSerializer

README.md (cập nhật toàn diện)
  ├── Yêu cầu hệ thống
  ├── Cài đặt từng bước
  ├── Cấu hình môi trường
  ├── Database setup
  ├── Chạy server
  ├── Chạy tests
  ├── API Documentation links
  └── Bảng API Endpoints đầy đủ
```

### Luồng generate OpenAPI Schema

```
drf-spectacular AutoSchema
        │
        ├── Đọc ViewSet class docstring → tag description
        ├── Đọc action method docstring → operation description
        ├── Đọc Serializer class docstring → schema description
        ├── Đọc Serializer fields → request/response schema
        └── Đọc @extend_schema decorator (nếu có) → override metadata
                │
                ▼
        OpenAPI 3.0 Schema (YAML/JSON)
                │
        ┌───────┴───────┐
        ▼               ▼
  Swagger UI        ReDoc
  /api/docs/        /api/redoc/
```

---

## Components và Interfaces

### 1. URL Routing — `core/urls.py`

**Thay đổi**: Thêm import `SpectacularRedocView` và URL pattern `/api/redoc/`.

```python
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView, SpectacularRedocView

urlpatterns = [
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),  # THÊM MỚI
    # ... các URL khác giữ nguyên
]
```

**Lý do thiết kế**: `SpectacularRedocView` nhận `url_name='schema'` để tự động lấy schema từ endpoint `/api/schema/`. Không cần cấu hình thêm.

### 2. ViewSet Docstrings

Docstring được viết theo chuẩn Google Style để `drf-spectacular` có thể parse và hiển thị trong Swagger UI / ReDoc.

**Cấu trúc docstring cho ViewSet class**:
```python
class XxxViewSet(...):
    """
    Mô tả ngắn về mục đích của ViewSet.

    Actions:
        list: Mô tả
        create: Mô tả
        retrieve: Mô tả
        ...
    """
```

**Cấu trúc docstring cho custom action**:
```python
@action(...)
def my_action(self, request, pk=None):
    """
    Mô tả ngắn (1 dòng).

    Mô tả chi tiết business logic.

    Args:
        request: HTTP request với body {...}
        pk: ID của object

    Returns:
        200: Mô tả response thành công
        400: Mô tả lỗi validation
        404: Mô tả lỗi not found
    """
```

**Danh sách ViewSet cần bổ sung docstring**:

| ViewSet | File | Loại thay đổi |
|---------|------|---------------|
| `RecipeViewSet` | `apps/recipes/views.py` | Cải thiện class docstring + thêm docstring cho `publish` action |
| `IngredientViewSet` | `apps/ingredients/views.py` | Cải thiện class docstring (đã có cơ bản) |
| `PantryViewSet` | `apps/kitchen/views.py` | Cải thiện class docstring |
| `ShoppingListViewSet` | `apps/kitchen/views.py` | Cải thiện class docstring + cải thiện docstring `mark_purchased` |
| `ReviewViewSet` | `apps/social/views.py` | Cải thiện class docstring |
| `CollectionViewSet` | `apps/social/views.py` | Cải thiện class docstring |
| `RecommendationView` | `apps/kitchen/views.py` | Cải thiện class docstring + thêm docstring cho `post` method |

> **Lưu ý**: Một số ViewSet đã có docstring cơ bản (tiếng Việt không dấu). Phase này sẽ cải thiện chất lượng và thêm thông tin chi tiết hơn, không xóa code cũ.

### 3. Serializer Docstrings

**Danh sách Serializer cần bổ sung docstring**:

| Serializer | File | Nội dung docstring |
|------------|------|-------------------|
| `RecipeCreateSerializer` | `apps/recipes/serializers.py` | Mô tả nested input (ingredients, steps), atomic create |
| `RecipeDetailSerializer` | `apps/recipes/serializers.py` | Mô tả computed field avg_rating, nested serializers |
| `PantrySerializer` | `apps/kitchen/serializers.py` | Mô tả output với nested ingredient info |
| `ReviewSerializer` | `apps/social/serializers.py` | Mô tả ràng buộc rating [1–5], unique constraint |
| `RegisterSerializer` | `apps/accounts/serializers.py` | Mô tả các trường bắt buộc, password validation |

> **Lưu ý**: Các Serializer đã có docstring ngắn. Phase này sẽ mở rộng thêm thông tin chi tiết.

### 4. README.md

README sẽ được viết lại hoàn toàn với cấu trúc rõ ràng hơn. Nội dung hiện tại sẽ được giữ lại và mở rộng.

**Cấu trúc README mới**:
```
# KitchenMate Backend
## Giới thiệu
## Yêu cầu hệ thống
## Cài đặt
## Cấu hình môi trường
## Database
## Chạy development server
## Chạy tests
## API Documentation
## API Endpoints
  ### Authentication
  ### Accounts & Profile
  ### Ingredients
  ### Recipes
  ### Kitchen (Pantry & Shopping List)
  ### Recommendations
  ### Social (Reviews & Collections)
  ### Admin Panel
## Cấu trúc Project
## Lưu ý quan trọng
```

---

## Data Models

Phase này không thay đổi bất kỳ model nào. Không có migration mới.

Các model liên quan (chỉ để tham chiếu):
- `Recipe` — `visibility`: PRIVATE / PENDING / PUBLIC
- `Ingredient` — `status`: PENDING / APPROVED / REJECTED
- `Pantry` — tủ lạnh số của user
- `ShoppingList` — danh sách đi chợ, `is_purchased` flag
- `Review` — đánh giá công thức, `rating` [1–5], unique(user, recipe)
- `Collection` — bộ sưu tập công thức của user

---

## Correctness Properties

Phase này liên quan đến documentation (docstring, README, URL config) — không có logic thuần túy nào phù hợp với property-based testing.

Tất cả acceptance criteria đều thuộc loại SMOKE (kiểm tra cấu hình một lần) hoặc INTEGRATION (kiểm tra endpoint HTTP). PBT không phù hợp vì:
- Không có hàm thuần túy với input space lớn cần kiểm tra
- Behavior không thay đổi có nghĩa theo input (cấu hình hoặc đúng hoặc sai)
- Chạy 100 lần không tìm thêm bug so với 1–2 lần

**Chiến lược kiểm thử thay thế**: Xem phần Testing Strategy bên dưới.

---

## Error Handling

### URL `/api/redoc/` không tồn tại (trước khi thêm)
- **Hiện tại**: Django trả về 404
- **Sau Phase 12**: Trả về trang ReDoc với HTTP 200

### Docstring không ảnh hưởng đến runtime
- Docstring là metadata thuần túy, không thể gây lỗi runtime
- Không cần error handling đặc biệt

### README không ảnh hưởng đến server
- README là file tĩnh, không được load bởi Django
- Không cần error handling

### Tương thích ngược
- Tất cả URL hiện có (`/api/schema/`, `/api/docs/`) giữ nguyên
- Không thay đổi serializer fields → không break existing tests
- Không thay đổi view logic → không break existing tests

---

## Testing Strategy

Phase này không phù hợp với property-based testing. Chiến lược kiểm thử gồm:

### 1. Smoke Tests (kiểm tra cấu hình)

Kiểm tra các điều kiện một lần, không có input variation:

```python
# test_documentation_config.py
def test_drf_spectacular_in_installed_apps():
    assert 'drf_spectacular' in settings.INSTALLED_APPS

def test_spectacular_settings_keys():
    required_keys = ['TITLE', 'DESCRIPTION', 'VERSION', 'SERVE_INCLUDE_SCHEMA']
    for key in required_keys:
        assert key in settings.SPECTACULAR_SETTINGS

def test_spectacular_settings_values():
    assert settings.SPECTACULAR_SETTINGS['TITLE'] == 'KitchenMate API'
    assert settings.SPECTACULAR_SETTINGS['VERSION'] == '1.0.0'
    assert settings.SPECTACULAR_SETTINGS['SERVE_INCLUDE_SCHEMA'] is False

def test_default_schema_class():
    assert settings.REST_FRAMEWORK['DEFAULT_SCHEMA_CLASS'] == 'drf_spectacular.openapi.AutoSchema'
```

### 2. Integration Tests (kiểm tra endpoint HTTP)

Kiểm tra các endpoint documentation trả về đúng HTTP status:

```python
# test_documentation_endpoints.py
def test_schema_endpoint_returns_200(client):
    response = client.get('/api/schema/')
    assert response.status_code == 200

def test_schema_json_format(client):
    response = client.get('/api/schema/?format=json')
    assert response.status_code == 200

def test_swagger_ui_returns_200(client):
    response = client.get('/api/docs/')
    assert response.status_code == 200

def test_redoc_returns_200(client):
    response = client.get('/api/redoc/')
    assert response.status_code == 200

def test_schema_accessible_without_auth(client):
    # Schema endpoint phải public
    response = client.get('/api/schema/')
    assert response.status_code == 200

def test_redoc_accessible_without_auth(client):
    response = client.get('/api/redoc/')
    assert response.status_code == 200
```

### 3. Docstring Presence Tests

Kiểm tra docstring tồn tại (không rỗng):

```python
# test_documentation_docstrings.py
from apps.recipes.views import RecipeViewSet
from apps.ingredients.views import IngredientViewSet
from apps.kitchen.views import PantryViewSet, ShoppingListViewSet, RecommendationView
from apps.social.views import ReviewViewSet, CollectionViewSet
from apps.recipes.serializers import RecipeCreateSerializer, RecipeDetailSerializer
from apps.kitchen.serializers import PantrySerializer
from apps.social.serializers import ReviewSerializer
from apps.accounts.serializers import RegisterSerializer

def test_viewset_class_docstrings():
    viewsets = [RecipeViewSet, IngredientViewSet, PantryViewSet,
                ShoppingListViewSet, ReviewViewSet, CollectionViewSet, RecommendationView]
    for vs in viewsets:
        assert vs.__doc__ is not None and vs.__doc__.strip() != ''

def test_serializer_class_docstrings():
    serializers = [RecipeCreateSerializer, RecipeDetailSerializer,
                   PantrySerializer, ReviewSerializer, RegisterSerializer]
    for s in serializers:
        assert s.__doc__ is not None and s.__doc__.strip() != ''

def test_custom_action_docstrings():
    assert RecipeViewSet.publish.__doc__ is not None
    assert ShoppingListViewSet.mark_purchased.__doc__ is not None
```

### 4. Backward Compatibility

Đảm bảo 192 tests hiện có không bị ảnh hưởng:

```bash
# Chạy toàn bộ test suite sau mỗi thay đổi
pytest --tb=short -q

# Kết quả mong đợi: 192 passed, 0 failed
```

### Phân bổ tests

| Loại | Số lượng | Mục đích |
|------|----------|----------|
| Smoke tests | ~8 | Kiểm tra cấu hình settings |
| Integration tests | ~6 | Kiểm tra HTTP endpoints |
| Docstring tests | ~3 | Kiểm tra sự tồn tại của docstring |
| Regression (existing) | 192 | Đảm bảo không break |
