# Tasks — Phase 9: Search & Filter

## Task List

- [x] 1. Mở rộng RecipeFilter
  - [x] 1.1 Thêm `prep_time_min = NumberFilter(field_name='prep_time', lookup_expr='gte')` vào `RecipeFilter`
  - [x] 1.2 Thêm `prep_time_max = NumberFilter(field_name='prep_time', lookup_expr='lte')` vào `RecipeFilter`
  - [x] 1.3 Thêm `ingredient = CharFilter(method='filter_by_ingredient')` và implement method `filter_by_ingredient()` dùng `recipe_ingredients__ingredient__name__icontains` + `.distinct()`
  - [x] 1.4 Cập nhật `Meta.fields` của `RecipeFilter` để bao gồm các filter mới

- [x] 2. Viết property-based tests cho RecipeFilter (Hypothesis)
  - [x] 2.1 Tạo file `KitchenMate_Backend/tests/test_recipe_filter_properties.py` với fixtures cần thiết (user, api_client, helper tạo recipe/ingredient)
  - [x] 2.2 Viết property test `test_difficulty_filter_correctness` — `# Feature: phase-9-search-filter, Property 1` — generate random difficulty, verify tất cả kết quả có đúng difficulty đó (Validates: Req 1.1, 1.2, 1.3)
  - [x] 2.3 Viết property test `test_prep_time_range_filter` — `# Feature: phase-9-search-filter, Property 2` — generate random (min, max) pairs, verify tất cả kết quả có prep_time trong [min, max] (Validates: Req 2.1, 2.2, 2.3, 2.6)
  - [x] 2.4 Viết property test `test_title_search_case_insensitive` — `# Feature: phase-9-search-filter, Property 3` — generate random keyword, verify upper/lower case cho cùng kết quả (Validates: Req 3.1, 3.2)
  - [x] 2.5 Viết property test `test_ingredient_filter_no_duplicate` — `# Feature: phase-9-search-filter, Property 4` — tạo recipe với nhiều ingredients khớp keyword, verify recipe chỉ xuất hiện một lần (Validates: Req 4.1, 4.5, 7.2)
  - [x] 2.6 Viết property test `test_combined_filters_and_logic` — `# Feature: phase-9-search-filter, Property 5` — generate random filter combinations, verify tất cả kết quả thỏa mãn AND của tất cả điều kiện (Validates: Req 5.1, 5.2, 5.3)

- [x] 3. Viết integration tests cho RecipeFilter (example-based)
  - [x] 3.1 Test filter không có params → trả về tất cả PUBLIC recipes (Validates: Req 1.4, 2.4, 3.3)
  - [x] 3.2 Test `difficulty` không hợp lệ → HTTP 400 (Validates: Req 1.5)
  - [x] 3.3 Test `prep_time_min` hoặc `prep_time_max` không phải số → HTTP 400 (Validates: Req 2.5)
  - [x] 3.4 Test `title=` rỗng → trả về tất cả PUBLIC recipes (Validates: Req 3.3)
  - [x] 3.5 Test `title=xyz_khong_ton_tai` → HTTP 200 với data rỗng (Validates: Req 3.4)
  - [x] 3.6 Test `ingredient=` rỗng → trả về tất cả PUBLIC recipes (Validates: Req 4.2)
  - [x] 3.7 Test `ingredient=xyz_khong_ton_tai` → HTTP 200 với data rỗng (Validates: Req 4.3)
  - [x] 3.8 Test pagination vẫn hoạt động sau khi filter (Validates: Req 5.4)

- [x] 4. Viết property-based tests cho Ingredient Search (Hypothesis)
  - [x] 4.1 Tạo file `KitchenMate_Backend/tests/test_ingredient_search.py` với fixtures cần thiết
  - [x] 4.2 Viết property test `test_search_returns_approved_with_keyword` — `# Feature: phase-9-search-filter, Property 6` — generate random keyword, tạo ingredients với các status khác nhau, verify chỉ APPROVED có keyword xuất hiện (Validates: Req 6.1, 6.5)
  - [x] 4.3 Viết property test `test_empty_query_returns_empty` — `# Feature: phase-9-search-filter, Property 7` — generate whitespace-only strings, verify response là 200 với data=[] (Validates: Req 6.2, 6.6)
  - [x] 4.4 Viết property test `test_search_result_limit` — `# Feature: phase-9-search-filter, Property 8` — tạo >10 ingredients đều khớp keyword, verify len(results) <= 10 (Validates: Req 6.4, 7.3)

- [x] 5. Viết integration tests cho Ingredient Search (example-based)
  - [x] 5.1 Test `GET /api/ingredients/search/?q=thit` → HTTP 200, kết quả chứa ingredients có "thit" trong name (Validates: Req 6.1)
  - [x] 5.2 Test `GET /api/ingredients/search/?q=xyz_khong_ton_tai` → HTTP 200 với data=[] (Validates: Req 6.3)
  - [x] 5.3 Test không có param `q` → HTTP 200 với data=[] (Validates: Req 6.6)
  - [x] 5.4 Test unauthenticated request → HTTP 200 (AllowAny) (Validates: Req 6.7)
  - [x] 5.5 Test kết quả được sắp xếp theo `name` tăng dần (Validates: Req 6.4)

- [x] 6. Chạy toàn bộ test suite và xác nhận pass
  - [x] 6.1 Chạy `pytest KitchenMate_Backend/tests/test_recipe_filter_properties.py -v` — tất cả pass
  - [x] 6.2 Chạy `pytest KitchenMate_Backend/tests/test_ingredient_search.py -v` — tất cả pass
  - [x] 6.3 Chạy full test suite `pytest KitchenMate_Backend/tests/ -v` — không có regression
