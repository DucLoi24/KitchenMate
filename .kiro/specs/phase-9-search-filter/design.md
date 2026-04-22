# Tài liệu Thiết kế — Phase 9: Search & Filter

## Tổng quan

Phase 9 mở rộng khả năng tìm kiếm và lọc của KitchenMate Backend theo hai hướng:

1. **RecipeFilter nâng cao**: Bổ sung `prep_time_min`, `prep_time_max` (lọc theo khoảng thời gian chuẩn bị) và `ingredient` (tìm công thức theo tên nguyên liệu) vào `RecipeFilter` hiện có.
2. **Ingredient Search tests**: Endpoint `/api/ingredients/search/?q=` đã có code hoạt động đúng nhưng chưa có test coverage — Phase này bổ sung property-based tests và integration tests.

Không có migration nào cần thiết vì không thay đổi schema database.

---

## Kiến trúc

```
Client
  │
  ▼
DRF Router
  ├── GET /api/recipes/?[difficulty][title][prep_time_min][prep_time_max][ingredient]
  │       └── RecipeViewSet.list()
  │               └── filter_queryset() → RecipeFilter (django-filter)
  │                       ├── CharFilter(title, icontains)
  │                       ├── ChoiceFilter(difficulty)
  │                       ├── NumberFilter(prep_time, gte)   ← MỚI
  │                       ├── NumberFilter(prep_time, lte)   ← MỚI
  │                       └── CharFilter(ingredient, icontains + distinct) ← MỚI
  │
  └── GET /api/ingredients/search/?q=
          └── IngredientViewSet.search()
                  └── Ingredient.objects.filter(name__icontains=q, status='APPROVED')[:10]
```

Toàn bộ logic filter nằm trong `apps/recipes/filters.py`. `RecipeViewSet` không cần thay đổi — nó đã dùng `filterset_class = RecipeFilter` và `filter_backends = [DjangoFilterBackend]`.

---

## Components và Interfaces

### RecipeFilter (mở rộng)

**File:** `apps/recipes/filters.py`

| Tham số | Loại Filter | Lookup | Ghi chú |
|---|---|---|---|
| `title` | `CharFilter` | `icontains` | Đã có |
| `difficulty` | `ChoiceFilter` | `exact` | Đã có |
| `prep_time_min` | `NumberFilter` | `gte` | **Mới** |
| `prep_time_max` | `NumberFilter` | `lte` | **Mới** |
| `ingredient` | `CharFilter` | custom `method=` | **Mới** — dùng `filter_by_ingredient()` |

`ingredient` filter cần custom method vì phải traverse qua relation `recipe_ingredients__ingredient__name` và gọi `.distinct()` để tránh duplicate khi một công thức có nhiều nguyên liệu khớp.

```python
class RecipeFilter(django_filters.FilterSet):
    title = django_filters.CharFilter(field_name='title', lookup_expr='icontains')
    difficulty = django_filters.ChoiceFilter(choices=Recipe.Difficulty.choices)
    prep_time_min = django_filters.NumberFilter(field_name='prep_time', lookup_expr='gte')
    prep_time_max = django_filters.NumberFilter(field_name='prep_time', lookup_expr='lte')
    ingredient = django_filters.CharFilter(method='filter_by_ingredient')

    def filter_by_ingredient(self, queryset, name, value):
        if not value:
            return queryset
        return queryset.filter(
            recipe_ingredients__ingredient__name__icontains=value
        ).distinct()

    class Meta:
        model = Recipe
        fields = ['difficulty', 'title', 'prep_time_min', 'prep_time_max', 'ingredient']
```

### IngredientViewSet.search() (không thay đổi code)

**File:** `apps/ingredients/views.py`

Endpoint đã hoạt động đúng:
- `GET /api/ingredients/search/?q={keyword}` — AllowAny
- Trả về tối đa 10 `Ingredient` có `status=APPROVED` và `name__icontains=q`
- Trả về `[]` nếu `q` rỗng hoặc chỉ có khoảng trắng

---

## Data Models

Không có thay đổi schema. Các model liên quan:

**Recipe** (`apps/recipes/models.py`)
- `prep_time`: `IntegerField(null=True, blank=True, validators=[MinValueValidator(1)])` — đơn vị phút
- `difficulty`: `CharField(choices=Difficulty.choices)` — `EASY | MEDIUM | HARD`
- `title`: `CharField(max_length=200)`
- `visibility`: `CharField(choices=Visibility.choices)` — filter list chỉ trả về `PUBLIC`

**RecipeIngredient** (`apps/recipes/models.py`)
- `recipe`: FK → Recipe
- `ingredient`: FK → Ingredient

**Ingredient** (`apps/ingredients/models.py`)
- `name`: `CharField(unique=True)` — unique=True tạo index tự động trên PostgreSQL
- `status`: `CharField(choices=Status.choices)` — `PENDING | APPROVED | REJECTED`

---

## Correctness Properties

*A property là một đặc tính hoặc hành vi phải đúng trong mọi lần thực thi hợp lệ của hệ thống — về cơ bản là một phát biểu hình thức về những gì hệ thống phải làm. Properties là cầu nối giữa đặc tả dạng ngôn ngữ tự nhiên và đảm bảo tính đúng đắn có thể kiểm chứng tự động.*

### Property 1: Difficulty filter chỉ trả về recipes đúng difficulty

*For any* giá trị difficulty hợp lệ (`EASY`, `MEDIUM`, `HARD`) và bất kỳ tập recipes nào trong database, khi filter theo difficulty đó, tất cả recipes trong kết quả phải có đúng difficulty được yêu cầu.

**Validates: Requirements 1.1, 1.2, 1.3**

### Property 2: prep_time range filter đúng bounds

*For any* cặp giá trị `(prep_time_min, prep_time_max)` với `prep_time_min <= prep_time_max`, khi filter theo range đó, tất cả recipes trong kết quả phải có `prep_time` nằm trong khoảng `[prep_time_min, prep_time_max]`.

**Validates: Requirements 2.1, 2.2, 2.3, 2.6**

### Property 3: Title search case-insensitive

*For any* keyword tìm kiếm, kết quả filter theo `title=keyword.upper()` phải giống hệt kết quả filter theo `title=keyword.lower()` — tìm kiếm không phân biệt hoa/thường.

**Validates: Requirements 3.1, 3.2**

### Property 4: Ingredient filter correctness và no duplicate

*For any* ingredient keyword, tất cả recipes trong kết quả phải có ít nhất một `RecipeIngredient` liên kết với `Ingredient` có `name` chứa keyword đó (case-insensitive), và mỗi recipe chỉ xuất hiện đúng một lần trong kết quả dù có nhiều ingredients khớp.

**Validates: Requirements 4.1, 4.5, 7.2**

### Property 5: Combined filters áp dụng AND logic

*For any* tập hợp filter params được cung cấp đồng thời, tất cả recipes trong kết quả phải thỏa mãn TẤT CẢ các điều kiện filter — không phải OR mà là AND.

**Validates: Requirements 5.1, 5.2, 5.3**

### Property 6: Ingredient search chỉ trả về APPROVED có keyword

*For any* keyword tìm kiếm không rỗng, tất cả ingredients trong kết quả phải có `status=APPROVED` và `name` chứa keyword đó (case-insensitive). Ingredients có `status=PENDING` hoặc `REJECTED` không được xuất hiện.

**Validates: Requirements 6.1, 6.5**

### Property 7: Empty/whitespace query trả về danh sách rỗng

*For any* chuỗi chỉ gồm khoảng trắng (bao gồm chuỗi rỗng), endpoint `/api/ingredients/search/` phải trả về `data=[]` với HTTP 200.

**Validates: Requirements 6.2, 6.6**

### Property 8: Search result limit không vượt quá 10

*For any* keyword tìm kiếm, dù có bao nhiêu ingredients khớp trong database, endpoint `/api/ingredients/search/` phải trả về tối đa 10 kết quả.

**Validates: Requirements 6.4, 7.3**

---

## Error Handling

| Tình huống | HTTP Status | Response |
|---|---|---|
| `difficulty` không hợp lệ (không thuộc EASY/MEDIUM/HARD) | 400 | `{"difficulty": ["Select a valid choice..."]}` |
| `prep_time_min` hoặc `prep_time_max` không phải số | 400 | `{"prep_time_min": ["Enter a number."]}` |
| Không tìm thấy kết quả (filter hợp lệ) | 200 | `{"success": true, "data": {"results": [], ...}}` |
| `q` rỗng hoặc whitespace trong ingredient search | 200 | `{"success": true, "data": []}` |
| Không có param `q` trong ingredient search | 200 | `{"success": true, "data": []}` |

`django-filter` tự động xử lý validation cho `ChoiceFilter` và `NumberFilter` — trả về HTTP 400 với message mô tả lỗi khi giá trị không hợp lệ.

---

## Testing Strategy

### Công cụ

- **pytest** + **pytest-django**: Test runner
- **Hypothesis**: Property-based testing (PBT) — minimum 100 iterations mỗi property
- **APIClient** (DRF): Gọi API trong tests
- **`@pytest.mark.django_db(transaction=True)`**: Cho Hypothesis tests cần DB

### Dual Testing Approach

**Unit tests (example-based)** — kiểm tra các trường hợp cụ thể:
- Filter không có params → trả về tất cả PUBLIC recipes
- Empty string params → không áp dụng filter
- Keyword không tồn tại → trả về `[]` với 200
- Unauthenticated request đến ingredient search → 200 (AllowAny)
- Missing `q` param → trả về `[]`

**Property tests (Hypothesis)** — kiểm tra invariants trên nhiều inputs:
- Mỗi property test chạy tối đa 100 examples
- Tag format: `# Feature: phase-9-search-filter, Property {N}: {property_text}`

### Cấu trúc file test

```
KitchenMate_Backend/tests/
├── test_recipe_filter_properties.py   ← Properties 1-5 (RecipeFilter)
└── test_ingredient_search.py          ← Properties 6-8 + integration tests
```

### Mapping Property → Test

| Property | Test file | Test function |
|---|---|---|
| P1: Difficulty filter | `test_recipe_filter_properties.py` | `test_difficulty_filter_correctness` |
| P2: prep_time range | `test_recipe_filter_properties.py` | `test_prep_time_range_filter` |
| P3: Title case-insensitive | `test_recipe_filter_properties.py` | `test_title_search_case_insensitive` |
| P4: Ingredient filter + no dup | `test_recipe_filter_properties.py` | `test_ingredient_filter_no_duplicate` |
| P5: Combined AND logic | `test_recipe_filter_properties.py` | `test_combined_filters_and_logic` |
| P6: Search APPROVED only | `test_ingredient_search.py` | `test_search_returns_approved_with_keyword` |
| P7: Empty query → empty | `test_ingredient_search.py` | `test_empty_query_returns_empty` |
| P8: Result limit ≤ 10 | `test_ingredient_search.py` | `test_search_result_limit` |
