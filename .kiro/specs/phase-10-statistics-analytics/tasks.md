# Tasks — Phase 10: Statistics & Analytics

## Task List

- [x] 1. Thêm field view_count vào Recipe model và tạo migration
  - [x] 1.1 Thêm `view_count = models.PositiveIntegerField(default=0)` vào class `Recipe` trong `apps/recipes/models.py` (Validates: Req 3.1, 3.4)
  - [x] 1.2 Chạy `python manage.py makemigrations recipes --name add_view_count_to_recipe` để tạo migration file (Validates: Req 3.2)
  - [x] 1.3 Chạy `python manage.py migrate` để apply migration — verify tất cả bản ghi hiện có có `view_count = 0` (Validates: Req 3.3)

- [x] 2. Cập nhật RecipeViewSet.retrieve() để tăng view_count
  - [x] 2.1 Import `F` từ `django.db.models` vào `apps/recipes/views.py`
  - [x] 2.2 Trong `retrieve()`, sau khi xác định recipe là `PUBLIC`, thêm `Recipe.objects.filter(pk=pk).update(view_count=F('view_count') + 1)` trước khi trả response (Validates: Req 4.1, 4.3)
  - [x] 2.3 Đảm bảo logic PRIVATE/PENDING không tăng view_count — chỉ tăng khi visibility == 'PUBLIC' (Validates: Req 4.2)
  - [x] 2.4 Verify response của retrieve() không thêm field view_count mới vào serializer (Validates: Req 4.4)

- [x] 3. Mở rộng UserStatsView — thêm total_likes và average_rating
  - [x] 3.1 Import `Avg` từ `django.db.models` vào `apps/accounts/views.py`
  - [x] 3.2 Trong `UserStatsView.get()`, thêm query đếm `total_likes` bằng `CollectionRecipe.objects.filter(recipe__user=user).count()` — đổi tên từ `total_saves` thành `total_likes` trong response (Validates: Req 1.1, 1.2, 1.3)
  - [x] 3.3 Thêm query tính `average_rating` bằng `Review.objects.filter(recipe__user=user, recipe__visibility='PUBLIC').aggregate(Avg('rating'))`, làm tròn 2 chữ số thập phân, trả về `null` nếu không có review (Validates: Req 2.1, 2.2, 2.3, 2.4)
  - [x] 3.4 Cập nhật response trả về đầy đủ 3 trường: `recipe_count`, `total_likes`, `average_rating` (Validates: Req 1.4)
  - [x] 3.5 Verify `permission_classes = [AllowAny]` vẫn giữ nguyên (Validates: Req 1.5)
  - [x] 3.6 Verify `get_object_or_404(User, pk=pk, is_active=True)` vẫn trả về 404 khi user không tồn tại (Validates: Req 1.6)

- [x] 4. Tạo RecipeStatsView mới
  - [x] 4.1 Tạo class `RecipeStatsView(APIView)` trong `apps/recipes/views.py` với `permission_classes = [AllowAny]` (Validates: Req 5.1)
  - [x] 4.2 Implement `get()`: lấy recipe bằng `Recipe.objects.get(pk=pk)`, trả về 404 nếu không tồn tại (Validates: Req 5.5)
  - [x] 4.3 Implement visibility check: PRIVATE/PENDING + không phải owner → 404; PRIVATE/PENDING + owner → 200 (Validates: Req 5.3, 5.4)
  - [x] 4.4 Tính stats bằng `Recipe.objects.filter(pk=pk).aggregate(Avg('reviews__rating'), Count('reviews', distinct=True), Count('saved_in_collections', distinct=True))` — một query duy nhất (Validates: Req 5.7, 6.2)
  - [x] 4.5 Làm tròn `average_rating` 2 chữ số thập phân, trả về `null` nếu không có review (Validates: Req 5.6)
  - [x] 4.6 Trả về response đúng format: `recipe_id`, `average_rating`, `review_count`, `view_count`, `save_count` (Validates: Req 5.2)

- [x] 5. Đăng ký URL cho RecipeStatsView
  - [x] 5.1 Thêm `path('<uuid:pk>/stats/', RecipeStatsView.as_view(), name='recipe-stats')` vào `apps/recipes/urls.py`
  - [x] 5.2 Import `RecipeStatsView` vào `apps/recipes/urls.py`
  - [x] 5.3 Verify URL pattern không conflict với các routes hiện có

- [x] 6. Viết property-based tests (Hypothesis)
  - [x] 6.1 Tạo file `KitchenMate_Backend/tests/test_phase10_stats_properties.py` với fixtures cần thiết (user, api_client, helper tạo recipe/review/collection)
  - [x] 6.2 Viết property test `test_recipe_count_only_public` — `# Feature: phase-10-statistics-analytics, Property 1` — generate random N PUBLIC + M PRIVATE recipes, verify `recipe_count == N` (Validates: Req 7.1, 8.1)
  - [x] 6.3 Viết property test `test_total_likes_equals_collection_recipe_count` — `# Feature: phase-10-statistics-analytics, Property 2` — generate random M CollectionRecipe records, verify `total_likes == M` (Validates: Req 1.1, 7.2, 8.2)
  - [x] 6.4 Viết property test `test_average_rating_correctness` — `# Feature: phase-10-statistics-analytics, Property 3` — generate random list ratings [1-5], tạo Reviews, verify `average_rating == round(sum/len, 2)` và null khi rỗng (Validates: Req 2.1, 2.2, 2.4, 8.3)
  - [x] 6.5 Viết property test `test_view_count_increments_correctly` — `# Feature: phase-10-statistics-analytics, Property 4` — generate random K (1-10), gọi API K lần trên PUBLIC recipe, verify `view_count` tăng đúng K; verify PRIVATE recipe không tăng (Validates: Req 4.1, 4.2, 7.5, 8.4)
  - [x] 6.6 Viết property test `test_save_count_equals_collection_recipe` — `# Feature: phase-10-statistics-analytics, Property 5` — generate random S CollectionRecipe cho một recipe, verify `save_count == S` trong Recipe Stats (Validates: Req 5.2, 7.3, 8.5)
  - [x] 6.7 Đảm bảo tất cả property tests dùng `@settings(max_examples=50)` và `@pytest.mark.django_db(transaction=True)` (Validates: Req 8.6)

- [x] 7. Viết integration tests (example-based)
  - [x] 7.1 Tạo file `KitchenMate_Backend/tests/test_phase10_stats_integration.py`
  - [x] 7.2 Test `GET /api/accounts/{id}/stats/` với user không tồn tại → HTTP 404 (Validates: Req 1.6)
  - [x] 7.3 Test `GET /api/accounts/{id}/stats/` với user không có data → `recipe_count=0, total_likes=0, average_rating=null` (Validates: Req 1.2, 2.2)
  - [x] 7.4 Test `GET /api/accounts/{id}/stats/` response có đầy đủ 3 fields: `recipe_count`, `total_likes`, `average_rating` (Validates: Req 1.4)
  - [x] 7.5 Test `GET /api/accounts/{id}/stats/` không cần auth → HTTP 200 (Validates: Req 1.5)
  - [x] 7.6 Test `GET /api/recipes/{id}/stats/` với recipe PUBLIC, không auth → HTTP 200 với đầy đủ fields (Validates: Req 5.1, 5.2)
  - [x] 7.7 Test `GET /api/recipes/{id}/stats/` với recipe PRIVATE, không auth → HTTP 404 (Validates: Req 5.3)
  - [x] 7.8 Test `GET /api/recipes/{id}/stats/` với recipe PRIVATE, là owner → HTTP 200 (Validates: Req 5.4)
  - [x] 7.9 Test `GET /api/recipes/{id}/stats/` với UUID không tồn tại → HTTP 404 (Validates: Req 5.5)
  - [x] 7.10 Test `GET /api/recipes/{id}/stats/` với recipe chưa có review → `average_rating=null, review_count=0` (Validates: Req 5.6)
  - [x] 7.11 Test `GET /api/recipes/{id}/` với recipe PRIVATE → view_count không tăng (Validates: Req 4.2, 7.5)
  - [x] 7.12 Test `GET /api/recipes/{id}/` với recipe PUBLIC → view_count tăng 1 trong database (Validates: Req 4.1)

- [x] 8. Chạy toàn bộ test suite và xác nhận pass
  - [x] 8.1 Chạy `pytest KitchenMate_Backend/tests/test_phase10_stats_properties.py -v` — tất cả 5 property tests pass
  - [x] 8.2 Chạy `pytest KitchenMate_Backend/tests/test_phase10_stats_integration.py -v` — tất cả integration tests pass
  - [x] 8.3 Chạy full test suite `pytest KitchenMate_Backend/tests/ -v` — không có regression từ Phase 1–9
