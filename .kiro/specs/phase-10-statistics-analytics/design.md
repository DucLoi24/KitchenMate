# Tài liệu Thiết kế — Phase 10: Statistics & Analytics

## Tổng quan

Phase 10 mở rộng hệ thống thống kê của KitchenMate Backend theo hai hướng:

1. **Mở rộng User Stats** (`GET /api/accounts/{id}/stats/`): Bổ sung `total_likes` và `average_rating` vào response hiện có (đang có `recipe_count` và `total_saves`).
2. **Recipe Stats mới** (`GET /api/recipes/{id}/stats/`): Endpoint mới trả về `average_rating`, `review_count`, `view_count`, `save_count` cho một công thức cụ thể.

Để hỗ trợ `view_count`, cần thêm field vào model `Recipe` và tạo migration. Tất cả thay đổi không phá vỡ API đã có từ Phase 1–9.

---

## Kiến trúc

```
Client
  │
  ▼
DRF Router
  ├── GET /api/accounts/{id}/stats/
  │       └── UserStatsView (mở rộng)
  │               ├── Query 1: Recipe.objects.filter(user, visibility=PUBLIC).count()
  │               ├── Query 2: CollectionRecipe.objects.filter(recipe__user=user).count()
  │               └── Query 3: Review.objects.filter(recipe__user=user, recipe__visibility=PUBLIC)
  │                               .aggregate(Avg('rating'))
  │
  └── GET /api/recipes/{id}/stats/
          └── RecipeStatsView (MỚI)
                  ├── Query 1: Recipe.objects.get(pk=id)  [visibility check]
                  └── Query 2: Recipe.objects.filter(pk=id).annotate(
                                  avg_rating=Avg('reviews__rating'),
                                  review_count=Count('reviews'),
                                  save_count=Count('saved_in_collections')
                               )

  ┌── GET /api/recipes/{id}/  (retrieve — đã có)
  │       └── RecipeViewSet.retrieve()
  │               └── [sau khi trả response] Recipe.objects.filter(pk=pk)
  │                       .update(view_count=F('view_count') + 1)  ← MỚI (chỉ khi PUBLIC)
```

---

## Components và Interfaces

### 1. Recipe Model — Thêm view_count

**File:** `apps/recipes/models.py`

Thêm một field duy nhất:

```python
view_count = models.PositiveIntegerField(default=0)
```

Không thay đổi bất kỳ field nào khác.

---

### 2. Migration

**File:** `apps/recipes/migrations/000X_add_view_count_to_recipe.py`

Tạo bằng lệnh:
```bash
python manage.py makemigrations recipes --name add_view_count_to_recipe
```

Migration sẽ:
- Thêm column `view_count INTEGER NOT NULL DEFAULT 0` vào bảng `recipes`
- Tất cả bản ghi hiện có tự động nhận `view_count = 0`

---

### 3. RecipeViewSet.retrieve() — Tăng view_count

**File:** `apps/recipes/views.py`

Sau khi xác định công thức là `PUBLIC` và trả về response, thực hiện atomic increment:

```python
def retrieve(self, request, pk=None):
    try:
        recipe = self.get_queryset().get(pk=pk)
    except Recipe.DoesNotExist:
        return Response(...)  # 404, không tăng view_count

    if recipe.visibility in ('PRIVATE', 'PENDING'):
        if not request.user.is_authenticated or recipe.user != request.user:
            return Response(...)  # 404, không tăng view_count
        # Owner xem PRIVATE/PENDING → không tăng view_count
        serializer = RecipeDetailSerializer(recipe)
        return Response({'success': True, 'data': serializer.data})

    # Chỉ tăng khi PUBLIC
    Recipe.objects.filter(pk=pk).update(view_count=F('view_count') + 1)
    serializer = RecipeDetailSerializer(recipe)
    return Response({'success': True, 'data': serializer.data})
```

**Lý do dùng `F()` expression:** Tránh race condition khi nhiều request đồng thời — `UPDATE recipes SET view_count = view_count + 1 WHERE id = ?` là atomic ở database level.

**Lý do không refresh object:** Tránh thêm query. Response trả về `view_count` cũ (trước khi tăng) — chấp nhận được theo Requirement 4.4.

---

### 4. UserStatsView — Mở rộng

**File:** `apps/accounts/views.py`

```python
class UserStatsView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, pk):
        from apps.recipes.models import Recipe
        from apps.social.models import CollectionRecipe, Review
        from django.db.models import Avg

        user = get_object_or_404(User, pk=pk, is_active=True)

        # Query 1: đếm PUBLIC recipes
        recipe_count = Recipe.objects.filter(user=user, visibility='PUBLIC').count()

        # Query 2: đếm tổng saves (tất cả visibility)
        total_likes = CollectionRecipe.objects.filter(recipe__user=user).count()

        # Query 3: average rating trên tất cả PUBLIC recipes
        avg_result = Review.objects.filter(
            recipe__user=user,
            recipe__visibility='PUBLIC'
        ).aggregate(average_rating=Avg('rating'))
        average_rating = avg_result['average_rating']
        if average_rating is not None:
            average_rating = round(average_rating, 2)

        return Response({
            'success': True,
            'data': {
                'recipe_count': recipe_count,
                'total_likes': total_likes,
                'average_rating': average_rating,
            }
        })
```

**Lưu ý:** Field `total_saves` cũ được đổi tên thành `total_likes` theo Requirement 1.1. Cần kiểm tra xem frontend (nếu có) có dùng `total_saves` không.

---

### 5. RecipeStatsView — Mới

**File:** `apps/recipes/views.py` (thêm class mới) hoặc tách ra `apps/recipes/stats_views.py`

Quyết định: Thêm vào `apps/recipes/views.py` để nhất quán với pattern hiện tại.

```python
class RecipeStatsView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, pk):
        from django.db.models import Avg, Count

        # Query 1: lấy recipe + visibility check
        try:
            recipe = Recipe.objects.get(pk=pk)
        except Recipe.DoesNotExist:
            return Response(
                {'success': False, 'error': {'message': 'Công thức không tồn tại.'}},
                status=status.HTTP_404_NOT_FOUND
            )

        if recipe.visibility in ('PRIVATE', 'PENDING'):
            if not request.user.is_authenticated or recipe.user != request.user:
                return Response(
                    {'success': False, 'error': {'message': 'Công thức không tồn tại.'}},
                    status=status.HTTP_404_NOT_FOUND
                )

        # Query 2: tính tất cả stats bằng annotate
        stats = Recipe.objects.filter(pk=pk).aggregate(
            average_rating=Avg('reviews__rating'),
            review_count=Count('reviews', distinct=True),
            save_count=Count('saved_in_collections', distinct=True),
        )

        average_rating = stats['average_rating']
        if average_rating is not None:
            average_rating = round(average_rating, 2)

        return Response({
            'success': True,
            'data': {
                'recipe_id': str(recipe.pk),
                'average_rating': average_rating,
                'review_count': stats['review_count'],
                'view_count': recipe.view_count,
                'save_count': stats['save_count'],
            }
        })
```

---

### 6. URL Configuration

**File:** `apps/recipes/urls.py` — thêm route mới:

```python
path('<uuid:pk>/stats/', RecipeStatsView.as_view(), name='recipe-stats'),
```

`UserStatsView` đã có route tại `apps/accounts/urls.py` — không cần thay đổi URL, chỉ thay đổi logic.

---

## Data Models

### Recipe (thay đổi)

| Field | Type | Thay đổi |
|---|---|---|
| `id` | UUIDField | Không đổi |
| `user` | FK → User | Không đổi |
| `title` | CharField(200) | Không đổi |
| `description` | TextField | Không đổi |
| `prep_time` | IntegerField | Không đổi |
| `difficulty` | CharField | Không đổi |
| `visibility` | CharField | Không đổi |
| `thumbnail_url` | TextField | Không đổi |
| `created_at` | DateTimeField | Không đổi |
| `updated_at` | DateTimeField | Không đổi |
| **`view_count`** | **PositiveIntegerField(default=0)** | **MỚI** |

### Review (không đổi)

| Field | Type |
|---|---|
| `user` | FK → User |
| `recipe` | FK → Recipe |
| `rating` | IntegerField(1–5) |
| `comment` | TextField |
| `cooksnap_url` | TextField |
| `created_at` | DateTimeField |

### CollectionRecipe (không đổi)

| Field | Type |
|---|---|
| `collection` | FK → Collection |
| `recipe` | FK → Recipe |
| `added_at` | DateTimeField |

---

### Migration Plan

```
Bước 1: Thêm field vào model
  apps/recipes/models.py
  → view_count = models.PositiveIntegerField(default=0)

Bước 2: Tạo migration
  python manage.py makemigrations recipes --name add_view_count_to_recipe
  → Tạo file: apps/recipes/migrations/000X_add_view_count_to_recipe.py

Bước 3: Apply migration (development)
  python manage.py migrate

Bước 4: Verify
  python manage.py shell
  >>> from apps.recipes.models import Recipe
  >>> Recipe._meta.get_field('view_count')
  <django.db.models.fields.PositiveIntegerField: view_count>

Bước 5: Apply migration (production)
  → Migration là non-destructive (chỉ ADD column với DEFAULT)
  → PostgreSQL thực hiện ADD COLUMN với DEFAULT không lock table (PostgreSQL 11+)
  → An toàn để chạy trên production không cần downtime
```

---

## Correctness Properties

*A property là một đặc tính hoặc hành vi phải đúng trong mọi lần thực thi hợp lệ của hệ thống — về cơ bản là một phát biểu hình thức về những gì hệ thống phải làm. Properties là cầu nối giữa đặc tả dạng ngôn ngữ tự nhiên và đảm bảo tính đúng đắn có thể kiểm chứng tự động.*

### Property 1: recipe_count chỉ đếm PUBLIC recipes

*For any* user với N công thức có `visibility=PUBLIC` và M công thức có `visibility=PRIVATE` hoặc `PENDING`, `GET /api/accounts/{id}/stats/` phải trả về `recipe_count == N`, không phụ thuộc vào M.

**Validates: Requirements 7.1, 8.1**

---

### Property 2: total_likes bằng đúng số CollectionRecipe

*For any* user với M bản ghi `CollectionRecipe` liên kết với công thức của user (bất kể visibility của công thức), `GET /api/accounts/{id}/stats/` phải trả về `total_likes == M`.

**Validates: Requirements 1.1, 1.2, 7.2, 8.2**

---

### Property 3: average_rating tính đúng trên toàn bộ reviews

*For any* tập hợp ratings hợp lệ (mỗi rating trong khoảng [1, 5]) trên các công thức PUBLIC của user, `GET /api/accounts/{id}/stats/` phải trả về `average_rating == round(sum(ratings) / len(ratings), 2)`. Khi không có rating nào, phải trả về `average_rating == null`.

**Validates: Requirements 2.1, 2.2, 2.4, 8.3**

---

### Property 4: view_count tăng đúng K lần sau K lượt xem PUBLIC

*For any* công thức có `visibility=PUBLIC` và giá trị `view_count` ban đầu là V, sau K lần gọi `GET /api/recipes/{id}/`, `view_count` trong database phải bằng `V + K`. Với công thức `PRIVATE` hoặc `PENDING`, `view_count` không được thay đổi.

**Validates: Requirements 4.1, 4.2, 7.5, 8.4**

---

### Property 5: save_count trong Recipe Stats bằng đúng số CollectionRecipe của recipe

*For any* công thức với S bản ghi `CollectionRecipe` liên kết, `GET /api/recipes/{id}/stats/` phải trả về `save_count == S`.

**Validates: Requirements 5.2, 7.3, 8.5**

---

## Error Handling

| Tình huống | HTTP Status | Response |
|---|---|---|
| `GET /api/accounts/{id}/stats/` — user không tồn tại hoặc `is_active=False` | 404 | `{"success": false, "error": {"message": "..."}}` |
| `GET /api/recipes/{id}/stats/` — recipe không tồn tại | 404 | `{"success": false, "error": {"message": "Công thức không tồn tại."}}` |
| `GET /api/recipes/{id}/stats/` — recipe PRIVATE/PENDING, không phải owner | 404 | `{"success": false, "error": {"message": "Công thức không tồn tại."}}` (ẩn sự tồn tại) |
| `GET /api/recipes/{id}/stats/` — recipe PRIVATE/PENDING, là owner | 200 | Full stats response |
| `GET /api/recipes/{id}/` — recipe không tồn tại | 404 | Không tăng `view_count` |
| `GET /api/recipes/{id}/` — recipe PRIVATE/PENDING, không phải owner | 404 | Không tăng `view_count` |
| User chưa có review nào | 200 | `average_rating: null` |
| Recipe chưa có review nào | 200 | `average_rating: null, review_count: 0` |

**Nguyên tắc bảo mật:** Trả về 404 thay vì 403 cho PRIVATE/PENDING recipes để không lộ sự tồn tại của công thức — nhất quán với behavior hiện tại của `RecipeViewSet.retrieve()`.

---

## Testing Strategy

### Công cụ

- **pytest** + **pytest-django**: Test runner
- **Hypothesis**: Property-based testing — minimum 50 examples mỗi property (giảm từ 100 do DB overhead)
- **APIClient** (DRF): Gọi API trong tests
- **`@pytest.mark.django_db(transaction=True)`**: Bắt buộc cho Hypothesis tests cần DB

### Dual Testing Approach

**Property tests (Hypothesis)** — kiểm tra invariants trên nhiều inputs:

| Property | Test function | Tag |
|---|---|---|
| P1: recipe_count chỉ đếm PUBLIC | `test_recipe_count_only_public` | `# Feature: phase-10-statistics-analytics, Property 1` |
| P2: total_likes bằng CollectionRecipe count | `test_total_likes_equals_collection_recipe_count` | `# Feature: phase-10-statistics-analytics, Property 2` |
| P3: average_rating tính đúng | `test_average_rating_correctness` | `# Feature: phase-10-statistics-analytics, Property 3` |
| P4: view_count tăng đúng K lần | `test_view_count_increments_correctly` | `# Feature: phase-10-statistics-analytics, Property 4` |
| P5: save_count bằng CollectionRecipe của recipe | `test_save_count_equals_collection_recipe` | `# Feature: phase-10-statistics-analytics, Property 5` |

**Integration tests (example-based)** — kiểm tra các trường hợp cụ thể:

- User không tồn tại → 404
- User không có data → tất cả về 0/null
- Recipe PRIVATE + không auth → 404
- Recipe PRIVATE + owner → 200 với stats
- Response structure đầy đủ các fields
- view_count không tăng khi recipe PRIVATE/PENDING
- average_rating = null khi không có reviews

### Cấu trúc file test

```
KitchenMate_Backend/tests/
├── test_phase10_stats_properties.py    ← Properties 1-5 (Hypothesis)
└── test_phase10_stats_integration.py   ← Integration + example-based tests
```

### Cấu hình Hypothesis

```python
from hypothesis import given, settings, strategies as st

@settings(max_examples=50)
@given(st.integers(min_value=0, max_value=20))
@pytest.mark.django_db(transaction=True)
def test_recipe_count_only_public(n_public):
    # Feature: phase-10-statistics-analytics, Property 1
    ...
```
