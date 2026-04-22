# Tasks — Phase 12: Documentation

## Tasks

- [x] 1. Thêm /api/redoc/ vào URL routing
  - [x] 1.1 Import SpectacularRedocView trong core/urls.py
  - [x] 1.2 Thêm path('api/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc') vào urlpatterns
  - [x] 1.3 Verify GET /api/redoc/ trả về HTTP 200

- [x] 2. Bổ sung docstring cho ViewSet
  - [x] 2.1 Cải thiện class docstring của RecipeViewSet (mô tả đầy đủ actions, visibility states)
  - [x] 2.2 Thêm method docstring chi tiết cho RecipeViewSet.publish (input, output, AI moderation flow)
  - [x] 2.3 Cải thiện class docstring của IngredientViewSet (mô tả AI moderation, search action)
  - [x] 2.4 Cải thiện class docstring của PantryViewSet (mô tả tủ lạnh số, ownership)
  - [x] 2.5 Cải thiện class docstring của ShoppingListViewSet (mô tả atomic transaction)
  - [x] 2.6 Cải thiện method docstring của ShoppingListViewSet.mark_purchased (mô tả 3 bước atomic)
  - [x] 2.7 Cải thiện class docstring của ReviewViewSet (mô tả rating constraint, unique constraint)
  - [x] 2.8 Cải thiện class docstring của CollectionViewSet (mô tả Affinity Bonus trong Tier-3 Scoring)
  - [x] 2.9 Cải thiện class docstring của RecommendationView (mô tả Tier-3 Scoring, COOK_NOW/ADD_MORE modes)
  - [x] 2.10 Thêm method docstring cho RecommendationView.post (mô tả request body, response format)

- [x] 3. Bổ sung docstring cho Serializer
  - [x] 3.1 Cải thiện class docstring của RecipeCreateSerializer (nested ingredients/steps, atomic create)
  - [x] 3.2 Cải thiện class docstring của RecipeDetailSerializer (computed avg_rating, nested serializers)
  - [x] 3.3 Cải thiện class docstring của PantrySerializer (nested ingredient_name, ingredient_category)
  - [x] 3.4 Cải thiện class docstring của ReviewSerializer (rating [1–5], unique(user, recipe) constraint)
  - [x] 3.5 Cải thiện class docstring của RegisterSerializer (required fields, password validation rules)

- [x] 4. Cập nhật README.md
  - [x] 4.1 Thêm section "Yêu cầu hệ thống" (Python 3.11+, PostgreSQL 14+, Git)
  - [x] 4.2 Viết lại section "Cài đặt" với đầy đủ các bước (clone, virtualenv, activate, pip install)
  - [x] 4.3 Thêm section "Cấu hình môi trường" (copy .env.example, điền SECRET_KEY, DB_*)
  - [x] 4.4 Thêm section "Database" (tạo DB PostgreSQL, migrate, createsuperuser)
  - [x] 4.5 Cập nhật section "Chạy development server" (lệnh runserver, URL mặc định)
  - [x] 4.6 Thêm section "Chạy tests" (pytest, pytest -m unit, pytest -m integration, pytest -m performance)
  - [x] 4.7 Cập nhật section "API Documentation" (thêm link /api/redoc/)
  - [x] 4.8 Thêm section "API Endpoints" với bảng đầy đủ cho Authentication group
  - [x] 4.9 Thêm bảng API Endpoints cho Accounts & Profile group
  - [x] 4.10 Thêm bảng API Endpoints cho Ingredients group
  - [x] 4.11 Thêm bảng API Endpoints cho Recipes group (bao gồm publish, stats)
  - [x] 4.12 Thêm bảng API Endpoints cho Kitchen group (bao gồm mark-purchased với ghi chú atomic)
  - [x] 4.13 Thêm bảng API Endpoints cho Recommendations group
  - [x] 4.14 Thêm bảng API Endpoints cho Social group (Reviews, Collections)
  - [x] 4.15 Thêm bảng API Endpoints cho Admin Panel group

- [x] 5. Kiểm tra tương thích ngược
  - [x] 5.1 Chạy pytest để xác nhận toàn bộ 192 tests vẫn pass
  - [x] 5.2 Chạy python manage.py check để xác nhận không có lỗi cấu hình
