# KitchenMate Backend — Module Reference

## core/

### `core/settings.py`

File cấu hình Django trung tâm. Đọc tất cả giá trị nhạy cảm từ `.env` qua `python-dotenv`.

**Các section chính:**
- `CORE SETTINGS` — SECRET_KEY, DEBUG, ALLOWED_HOSTS
- `APPLICATIONS` — INSTALLED_APPS (Django + Third-party + Local)
- `MIDDLEWARE` — Stack middleware theo thứ tự
- `DATABASE` — PostgreSQL connection
- `JWT SETTINGS` — SimpleJWT configuration
- `CORS SETTINGS` — Allowed origins cho frontend
- `DRF SPECTACULAR` — API documentation metadata
- `EMAIL SETTINGS` — SMTP configuration
- `AI MODERATION SETTINGS` — Ollama configuration
- `FILE UPLOAD SETTINGS` — Image size limits và quality

---

### `core/urls.py`

URL routing gốc của toàn bộ ứng dụng. Include URL patterns từ tất cả apps.

**Đặc điểm:**
- Media files chỉ được serve trong `DEBUG=True` (development).
- Mỗi app có thể có nhiều URL file (ví dụ: `accounts` có `urls.py`, `profile_urls.py`, `upload_urls.py`).

---

### `core/permissions.py`

Custom DRF Permission classes.

#### `IsOwnerOrReadOnly`

```python
class IsOwnerOrReadOnly(BasePermission):
    def has_permission(self, request, view) -> bool
    def has_object_permission(self, request, view, obj) -> bool
```

- `has_permission`: SAFE_METHODS → True; write methods → yêu cầu authenticated.
- `has_object_permission`: SAFE_METHODS → True; write methods → kiểm tra `obj.user == request.user`.
- Object phải có thuộc tính `user` hoặc `owner`.

#### `IsOwner`

```python
class IsOwner(BasePermission):
    def has_permission(self, request, view) -> bool
    def has_object_permission(self, request, view, obj) -> bool
```

- Tất cả methods đều yêu cầu authenticated VÀ là owner.
- Dùng cho Pantry, ShoppingList (resource hoàn toàn private).

#### `IsAdminUser`

```python
class IsAdminUser(BasePermission):
    def has_permission(self, request, view) -> bool
```

- Yêu cầu `request.user.is_staff == True`.
- Dùng cho tất cả Admin Panel endpoints.

---

### `core/exceptions.py`

Custom exception handler để format lỗi nhất quán.

```python
def custom_exception_handler(exc, context) -> Response | None
```

Wrap tất cả DRF exceptions thành format:
```json
{
  "success": false,
  "error": {
    "message": "...",
    "details": { ... }
  }
}
```

---

### `core/services/ai_moderator.py`

Service giao tiếp với Ollama Local LLM để kiểm duyệt nội dung.

#### Exception Classes

```python
class ModerationTimeoutError(Exception)
    """Ollama không phản hồi trong thời gian timeout."""

class ModerationServiceError(Exception)
    """Lỗi kết nối hoặc HTTP error từ Ollama service."""
```

#### Public Interface

```python
def moderate_text(text: str) -> str
    """
    Nhận văn bản, trả về "YES", "NO", hoặc "SUSPECT".
    
    - text rỗng/whitespace → "SUSPECT" (không gọi Ollama)
    - Ollama timeout → raise ModerationTimeoutError
    - Ollama lỗi → raise ModerationServiceError
    """
```

#### Internal Functions

```python
def _build_prompt(text: str) -> str
    """Nhúng text vào PROMPT_TEMPLATE."""

def _call_ollama(prompt: str) -> str
    """Gọi HTTP POST tới Ollama API /api/generate."""

def _normalize_result(raw: str) -> str
    """Strip, uppercase, validate. Fallback về 'SUSPECT'."""
```

### `core/services/recipe_moderation_task.py` — Background AI Moderation

Background task chạy trong thread riêng để không blocking request.

```python
def run_ai_moderation(recipe_id: int)
    """
    1. Skip if ai_moderation_attempted == True
    2. Set ai_moderation_attempted = True
    3. Build text: title + description + steps
    4. Call moderate_text()
    5. Update visibility:
       - YES  → PUBLIC
       - NO   → PRIVATE + moderation_reason
       - SUSPECT → keep PENDING
    """

def trigger_async_moderation(recipe_id: int)
    """Spawn daemon thread chạy run_ai_moderation()."""
```

**Moderation flow mới:**
- `publish()` → set PENDING → `trigger_async_moderation()` → return 200 ngay
- AI chạy nền → cập nhật visibility theo kết quả
- Admin và AI cùng share một "rổ PENDING"

---

### `core/utils/file_validator.py`

Validate file upload theo 3 tiêu chí.

#### `FileValidator`

```python
class FileValidator:
    ALLOWED_TYPES: set = {'image/jpeg', 'image/png', 'image/webp'}
    ALLOWED_EXTENSIONS: set = {'jpg', 'jpeg', 'png', 'webp'}
    MAX_FILE_SIZE: int = 5 * 1024 * 1024  # 5MB

    def validate(self, file) -> None
        """Validate toàn bộ: extension → file size → MIME type."""

    def _check_extension(self, filename: str) -> None
        """Kiểm tra extension có trong whitelist."""

    def _check_mime_type(self, file) -> None
        """Kiểm tra MIME type thực sự bằng Pillow magic bytes."""

    def _check_file_size(self, file) -> None
        """Kiểm tra file size ≤ MAX_FILE_SIZE."""
```

**Lưu ý bảo mật:** Không tin vào `Content-Type` header hay extension. Dùng Pillow để đọc magic bytes thực sự của file.

---

### `core/utils/image_processor.py`

Resize và compress ảnh trước khi lưu.

#### `ImageProcessor`

```python
class ImageProcessor:
    def process(
        self,
        file,
        max_width: int,
        max_height: int,
        quality: int = 85,
        output_format: str = 'JPEG'
    ) -> io.BytesIO
        """
        Resize và compress ảnh.
        - Convert RGBA/P → RGB (background trắng cho ảnh có transparency)
        - Giữ nguyên aspect ratio
        - Không upscale ảnh nhỏ hơn max dimensions
        - Compress với quality cho trước
        """

    def _get_resize_dimensions(
        self,
        original_width: int,
        original_height: int,
        max_width: int,
        max_height: int
    ) -> tuple[int, int]
        """
        Tính kích thước mới giữ aspect ratio.
        Dùng round() thay vì int() để giảm sai số.
        """
```

---

### `core/utils/media_upload_service.py`

Orchestrate toàn bộ luồng upload: validate → process → save → update DB → delete old file.

#### `MediaUploadService`

```python
class MediaUploadService:
    def upload_avatar(self, user, file) -> str
        """Upload avatar. Returns: '/media/avatars/{uuid}.jpg'"""

    def upload_recipe_thumbnail(self, recipe, file) -> str
        """Upload thumbnail. Returns: '/media/recipes/thumbnails/{uuid}.jpg'"""

    def upload_step_media(self, step, file) -> str
        """Upload step media. Returns: '/media/recipes/steps/{uuid}.jpg'"""

    def upload_cooksnap(self, review, file) -> str
        """Upload cooksnap. Returns: '/media/cooksnaps/{uuid}.jpg'"""

    def _save_file(self, relative_path: str, content) -> None
        """Lưu file vào MEDIA_ROOT, tự tạo thư mục."""

    def _delete_old_file(self, url: str | None) -> None
        """Xóa file cũ trên disk."""

    def _generate_unique_filename(self, ext: str) -> str
        """Tạo tên file: {uuid4}.{ext}"""
```

---

## apps/accounts/

### `models.py` — `User`

Custom User model kế thừa `AbstractUser`. UUID primary key, đăng nhập bằng email.

### `serializers.py`

| Serializer | Mô tả |
|---|---|
| `RegisterSerializer` | Đăng ký: email, full_name, password, password_confirm |
| `UserSerializer` | Trả về thông tin user (public-safe) |
| `UserProfileUpdateSerializer` | Cập nhật: full_name, avatar_url, bio |
| `ChangePasswordSerializer` | Đổi mật khẩu: old_password, new_password |
| `ForgotPasswordSerializer` | Yêu cầu reset: email |
| `ResetPasswordSerializer` | Đặt lại: token, new_password |

### `views.py`

| View | Endpoint | Mô tả |
|---|---|---|
| `RegisterView` | POST `/api/auth/register/` | Đăng ký |
| `LoginView` | POST `/api/auth/login/` | Đăng nhập |
| `LogoutView` | POST `/api/auth/logout/` | Đăng xuất (blacklist token) |
| `MeView` | GET/PUT/PATCH `/api/accounts/me/` | Profile của tôi |
| `ChangePasswordView` | POST `/api/accounts/me/change-password/` | Đổi mật khẩu |
| `UserPublicProfileView` | GET `/api/accounts/{id}/` | Profile công khai |
| `ForgotPasswordView` | POST `/api/auth/forgot-password/` | Quên mật khẩu |
| `ResetPasswordView` | POST `/api/auth/reset-password/` | Đặt lại mật khẩu |
| `UserRecipesView` | GET `/api/accounts/{id}/recipes/` | Công thức của user |
| `UserStatsView` | GET `/api/accounts/{id}/stats/` | Thống kê user |

### `upload_views.py`

| View | Endpoint | Mô tả |
|---|---|---|
| `AvatarUploadView` | POST `/api/accounts/me/avatar/` | Upload avatar |

---

## apps/ingredients/

### `models.py` — `Ingredient`

Danh mục nguyên liệu dùng chung. Category choices: PROTEIN, CARB, VEG, SPICE, STAPLE, OTHER. Status choices: PENDING, APPROVED, REJECTED.

### `serializers.py` — `IngredientSerializer`

Fields: `id`, `name`, `category`, `status`, `created_by`, `created_at`.

### `views.py` — `IngredientViewSet`

| Action | Method | URL | Permission |
|---|---|---|---|
| `list` | GET | `/api/ingredients/` | AllowAny |
| `create` | POST | `/api/ingredients/` | IsAuthenticated |
| `search` | GET | `/api/ingredients/search/` | AllowAny |

### `filters.py`

Filter theo `category` qua `DjangoFilterBackend`.

---

## apps/recipes/

### `models.py`

| Model | Mô tả |
|---|---|
| `Recipe` | Công thức nấu ăn. UUID PK. Visibility: PRIVATE/PENDING/PUBLIC |
| `RecipeIngredient` | M2M through table: recipe ↔ ingredient với quantity + unit |
| `RecipeStep` | Các bước thực hiện. Ordering: step_number |

### `serializers.py`

| Serializer | Dùng cho | Mô tả |
|---|---|---|
| `RecipeIngredientSerializer` | Nested trong Recipe | ingredient_name, ingredient_category, quantity, unit |
| `RecipeStepSerializer` | Nested trong Recipe | step_number, instruction, media_url |
| `RecipeListSerializer` | List endpoint | Ít trường, tối ưu performance |
| `RecipeDetailSerializer` | Detail endpoint | Đầy đủ: user, ingredients, steps, avg_rating |
| `RecipeCreateSerializer` | Create/Update | Nested write: ingredients + steps trong transaction.atomic() |

### `views.py`

| Action | Method | URL | Permission |
|---|---|---|---|
| `list` | GET | `/api/recipes/` | AllowAny |
| `create` | POST | `/api/recipes/` | IsAuthenticated |
| `retrieve` | GET | `/api/recipes/{id}/` | Custom (PUBLIC=All, PRIVATE=Owner) |
| `update` | PUT | `/api/recipes/{id}/` | IsOwner |
| `partial_update` | PATCH | `/api/recipes/{id}/` | IsOwner |
| `destroy` | DELETE | `/api/recipes/{id}/` | IsOwner |
| `my_recipes` | GET | `/api/recipes/my-recipes/` | IsAuthenticated |
| `publish` | POST | `/api/recipes/{id}/publish/` | IsOwner |

### `filters.py` — `RecipeFilter`

| Filter | Lookup | Mô tả |
|---|---|---|
| `title` | icontains | Tìm theo tên |
| `difficulty` | exact | Lọc theo độ khó |
| `prep_time_min` | gte | Thời gian tối thiểu |
| `prep_time_max` | lte | Thời gian tối đa |
| `ingredient` | custom method | Tìm theo tên nguyên liệu (distinct) |

### `upload_views.py`

| View | Endpoint | Mô tả |
|---|---|---|
| `RecipeThumbnailUploadView` | POST `/api/recipes/{recipe_id}/thumbnail/` | Upload thumbnail |
| `RecipeStepMediaUploadView` | POST `/api/recipes/{recipe_id}/steps/{step_id}/media/` | Upload step media |

---

## apps/kitchen/

### `models.py`

| Model | Mô tả |
|---|---|
| `Pantry` | Tủ lạnh số. Unique: (user, ingredient) |
| `ShoppingList` | Danh sách đi chợ. is_purchased trigger transaction |

### `serializers.py`

| Serializer | Mô tả |
|---|---|
| `PantrySerializer` | ingredient_name, ingredient_category, quantity, unit |
| `ShoppingListSerializer` | ingredient_name, quantity, unit, is_purchased |

### `views.py`

| ViewSet/View | Mô tả |
|---|---|
| `PantryViewSet` | CRUD tủ lạnh số. Ownership isolation |
| `ShoppingListViewSet` | CRUD danh sách đi chợ + mark_purchased (atomic transaction) |
| `RecommendationView` | POST suggest — Tier-3 Scoring Algorithm |

### `services/recommendation_engine.py`

```python
def calculate_recipe_score(
    recipe,
    pantry_ingredient_ids: set,
    saved_recipe_ids: set
) -> tuple[int, list]
    """Tính điểm cho một công thức. Returns: (score, missing_ingredients)"""

def get_recommendations(
    user,
    mode: str,  # 'COOK_NOW' | 'ADD_MORE'
    exclude_ingredient_ids: list | None = None
) -> list[dict]
    """Lấy danh sách công thức gợi ý. Returns: [{'recipe', 'score', 'missing_ingredients'}]"""
```

---

## apps/social/

### `models.py`

| Model | Mô tả |
|---|---|
| `Review` | Đánh giá. Unique: (user, recipe). Rating: 1-5 |
| `Collection` | Bộ sưu tập công thức |
| `CollectionRecipe` | M2M through: collection ↔ recipe. Unique: (collection, recipe) |

### `serializers.py`

| Serializer | Mô tả |
|---|---|
| `ReviewSerializer` | user_name, rating, comment, cooksnap_url |
| `CollectionSerializer` | name, recipe_count, collection_recipes (nested) |
| `CollectionRecipeSerializer` | recipe, added_at |

### `views.py`

| ViewSet | Actions |
|---|---|
| `ReviewViewSet` | list, create, update, partial_update, destroy |
| `CollectionViewSet` | list, create, destroy, add_recipe, remove_recipe |

### `upload_views.py`

| View | Endpoint | Mô tả |
|---|---|---|
| `CooksnapUploadView` | POST `/api/social/reviews/{review_id}/cooksnap/` | Upload cooksnap |

---

## apps/admin_panel/

### `views.py`

Tất cả ViewSet đều yêu cầu `IsAdminUser` (is_staff=True).

| ViewSet | Actions |
|---|---|
| `AdminRecipeViewSet` | pending, approve, reject |
| `AdminIngredientViewSet` | pending, approve, reject |
| `AdminUserViewSet` | list_users, block, unblock |
