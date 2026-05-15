# KitchenMate Backend — Database Schema

## Tổng quan

Database sử dụng **PostgreSQL**. Tài liệu này mô tả các bảng nghiệp vụ cốt lõi; các bảng phụ trợ như view tracking, report, notification, category/unit được quản lý trong module tương ứng.

---

## Sơ đồ quan hệ (ERD)

```
users (accounts.User)
  │
  ├──< user_follows (accounts.UserFollow) >── users
  ├──< recipes (recipes.Recipe)
  │       │
  │       ├──< recipe_ingredients (recipes.RecipeIngredient) >── ingredients
  │       ├──< recipe_steps (recipes.RecipeStep)
  │       └──< reviews (social.Review)
  │
  ├──< pantries (kitchen.Pantry) >── ingredients
  ├──< shopping_lists (kitchen.ShoppingList) >── ingredients
  ├──< reviews (social.Review) >── recipes
  └──< collections (social.Collection)
          └──< collection_recipes (social.CollectionRecipe) >── recipes

ingredients (ingredients.Ingredient)
```

---

## Chi tiết từng bảng

### 1. `users` — Người dùng

**App:** `apps.accounts` | **Model:** `User`

| Cột | Kiểu | Ràng buộc | Mô tả |
|---|---|---|---|
| `id` | UUID | PK, auto-generated | Primary key dạng UUID (tránh lộ số lượng user) |
| `email` | VARCHAR | UNIQUE, NOT NULL | Trường đăng nhập (USERNAME_FIELD) |
| `username` | VARCHAR | UNIQUE | Tự động set = email khi đăng ký |
| `full_name` | VARCHAR(100) | NOT NULL | Họ và tên đầy đủ |
| `avatar_url` | TEXT | NULL | URL ảnh đại diện (lưu relative path `/media/avatars/...`) |
| `bio` | TEXT | NULL | Giới thiệu bản thân |
| `is_active` | BOOLEAN | DEFAULT TRUE | FALSE = tài khoản bị khóa |
| `is_staff` | BOOLEAN | DEFAULT FALSE | TRUE = có quyền Admin |
| `is_superuser` | BOOLEAN | DEFAULT FALSE | TRUE = superuser Django |
| `created_at` | TIMESTAMP | auto_now_add | Thời điểm tạo tài khoản |
| `date_joined` | TIMESTAMP | auto | Kế thừa từ AbstractUser |

**Ghi chú:**
- Kế thừa `AbstractUser` của Django — có sẵn password hashing, session management.
- `USERNAME_FIELD = 'email'` → đăng nhập bằng email thay vì username.
- `REQUIRED_FIELDS = ['username', 'full_name']` → bắt buộc khi tạo superuser qua CLI.

---

### 2. `user_follows` — Quan hệ theo dõi người dùng

**App:** `apps.accounts` | **Model:** `UserFollow`

| Cột | Kiểu | Ràng buộc | Mô tả |
|---|---|---|---|
| `id` | BIGINT | PK, auto-increment | Primary key (`BigAutoField`) |
| `follower_id` | UUID | FK → users, CASCADE | Người thực hiện theo dõi |
| `following_id` | UUID | FK → users, CASCADE | Người được theo dõi |
| `created_at` | TIMESTAMP | auto_now_add | Thời điểm bắt đầu theo dõi |

**Unique constraint:** `(follower_id, following_id)` — mỗi cặp user chỉ có một quan hệ theo dõi.

**Check constraint:** `follower_id != following_id` — không cho phép user theo dõi chính mình.

**Indexes:**
- `(follower_id, created_at)` — tối ưu danh sách user đang theo dõi.
- `(following_id, created_at)` — tối ưu danh sách người theo dõi.

---

### 3. `ingredients` — Nguyên liệu

**App:** `apps.ingredients` | **Model:** `Ingredient`

| Cột | Kiểu | Ràng buộc | Mô tả |
|---|---|---|---|
| `id` | INTEGER | PK, auto-increment | Primary key |
| `name` | VARCHAR(100) | UNIQUE, NOT NULL | Tên nguyên liệu |
| `category` | VARCHAR(20) | NOT NULL | Danh mục (xem bên dưới) |
| `status` | VARCHAR(20) | DEFAULT 'APPROVED' | Trạng thái kiểm duyệt |
| `created_by_id` | UUID | FK → users, NULL | Người đóng góp nguyên liệu |
| `created_at` | TIMESTAMP | auto_now_add | Thời điểm tạo |

**Choices — `category`:**
| Giá trị | Nhãn | Mô tả |
|---|---|---|
| `PROTEIN` | Đạm | Thịt, cá, trứng, đậu phụ... |
| `CARB` | Tinh bột | Gạo, mì, bún, bánh mì... |
| `VEG` | Rau củ | Rau xanh, củ quả... |
| `SPICE` | Gia vị đặc trưng | Sả, ớt, hồi, quế... |
| `STAPLE` | Gia vị cơ bản | Muối, đường, dầu ăn, nước mắm... |
| `OTHER` | Khác | Không thuộc các nhóm trên |

**Choices — `status`:**
| Giá trị | Mô tả |
|---|---|
| `PENDING` | Chờ Admin duyệt (sau khi user đóng góp) |
| `APPROVED` | Đã duyệt, hiển thị trong hệ thống |
| `REJECTED` | Đã từ chối |

**Ghi chú:**
- Nguyên liệu `STAPLE` bị bỏ qua trong thuật toán gợi ý (giả định user luôn có sẵn).
- Khi user đóng góp nguyên liệu mới → AI kiểm duyệt → lưu với `status=PENDING`.

---

### 4. `recipes` — Công thức nấu ăn

**App:** `apps.recipes` | **Model:** `Recipe`

| Cột | Kiểu | Ràng buộc | Mô tả |
|---|---|---|---|
| `id` | UUID | PK, auto-generated | Primary key dạng UUID |
| `user_id` | UUID | FK → users, CASCADE | Tác giả công thức |
| `title` | VARCHAR(200) | NOT NULL | Tên công thức |
| `description` | TEXT | BLANK | Mô tả tổng quan |
| `prep_time` | INTEGER | MIN=1, NULL | Thời gian thực hiện (phút) |
| `difficulty` | VARCHAR(10) | DEFAULT 'EASY' | Độ khó |
| `visibility` | VARCHAR(10) | DEFAULT 'PRIVATE' | Trạng thái hiển thị |
| `thumbnail_url` | TEXT | NULL | URL ảnh đại diện |
| `view_count` | INTEGER | DEFAULT 0 | Số lượt xem (atomic F() increment) |
| `created_at` | TIMESTAMP | auto_now_add | Thời điểm tạo |
| `updated_at` | TIMESTAMP | auto_now | Thời điểm cập nhật gần nhất |

**Choices — `difficulty`:**
| Giá trị | Nhãn |
|---|---|
| `EASY` | Dễ |
| `MEDIUM` | Trung bình |
| `HARD` | Khó |

**Choices — `visibility`:**
| Giá trị | Mô tả |
|---|---|
| `PRIVATE` | Riêng tư — chỉ owner thấy, có thể chỉnh sửa |
| `PENDING` | Chờ Admin duyệt — chỉ owner thấy, không chỉnh sửa |
| `PUBLIC` | Công khai — ai cũng thấy, view_count tăng mỗi lần xem |

**Ordering:** `-created_at` (mới nhất trước)

---

### 5. `recipe_ingredients` — Nguyên liệu trong công thức

**App:** `apps.recipes` | **Model:** `RecipeIngredient`

| Cột | Kiểu | Ràng buộc | Mô tả |
|---|---|---|---|
| `id` | INTEGER | PK, auto-increment | Primary key |
| `recipe_id` | UUID | FK → recipes, CASCADE | Công thức |
| `ingredient_id` | INTEGER | FK → ingredients, PROTECT | Nguyên liệu (PROTECT tránh xóa nguyên liệu đang dùng) |
| `quantity` | FLOAT | MIN=0 | Số lượng |
| `unit` | VARCHAR(20) | NOT NULL | Đơn vị (gram, ml, cái, muỗng...) |

**Ghi chú:**
- `on_delete=PROTECT` trên `ingredient` → không thể xóa nguyên liệu đang được dùng trong công thức.

---

### 6. `recipe_steps` — Các bước thực hiện

**App:** `apps.recipes` | **Model:** `RecipeStep`

| Cột | Kiểu | Ràng buộc | Mô tả |
|---|---|---|---|
| `id` | INTEGER | PK, auto-increment | Primary key |
| `recipe_id` | UUID | FK → recipes, CASCADE | Công thức |
| `step_number` | INTEGER | MIN=1 | Số thứ tự bước |
| `instruction` | TEXT | NOT NULL | Hướng dẫn thực hiện |
| `media_url` | TEXT | NULL | URL ảnh/video minh họa |

**Ordering:** `step_number` (tăng dần — đảm bảo thứ tự bước luôn đúng)

---

### 7. `pantries` — Tủ lạnh số

**App:** `apps.kitchen` | **Model:** `Pantry`

| Cột | Kiểu | Ràng buộc | Mô tả |
|---|---|---|---|
| `id` | INTEGER | PK, auto-increment | Primary key |
| `user_id` | UUID | FK → users, CASCADE | Chủ sở hữu |
| `ingredient_id` | INTEGER | FK → ingredients, CASCADE | Nguyên liệu |
| `quantity` | FLOAT | MIN=0 | Số lượng hiện có |
| `unit` | VARCHAR(20) | NOT NULL | Đơn vị đo lường |
| `updated_at` | TIMESTAMP | auto_now | Thời điểm cập nhật gần nhất |

**Unique constraint:** `(user_id, ingredient_id)` — mỗi nguyên liệu chỉ xuất hiện 1 lần trong tủ lạnh của mỗi user.

**Ordering:** `ingredient__name` (theo tên nguyên liệu)

---

### 8. `shopping_lists` — Danh sách đi chợ

**App:** `apps.kitchen` | **Model:** `ShoppingList`

| Cột | Kiểu | Ràng buộc | Mô tả |
|---|---|---|---|
| `id` | INTEGER | PK, auto-increment | Primary key |
| `user_id` | UUID | FK → users, CASCADE | Chủ sở hữu |
| `ingredient_id` | INTEGER | FK → ingredients, CASCADE | Nguyên liệu cần mua |
| `quantity` | FLOAT | MIN=0 | Số lượng cần mua |
| `unit` | VARCHAR(20) | NOT NULL | Đơn vị đo lường |
| `is_purchased` | BOOLEAN | DEFAULT FALSE | Đã mua chưa |
| `created_at` | TIMESTAMP | auto_now_add | Thời điểm thêm vào danh sách |

**Ordering:** `-created_at` (mới nhất trước)

**Ghi chú:**
- Khi `is_purchased` chuyển thành `True` → kích hoạt **atomic transaction** cộng dồn vào `Pantry`.

---

### 9. `reviews` — Đánh giá công thức

**App:** `apps.social` | **Model:** `Review`

| Cột | Kiểu | Ràng buộc | Mô tả |
|---|---|---|---|
| `id` | INTEGER | PK, auto-increment | Primary key |
| `user_id` | UUID | FK → users, CASCADE | Người đánh giá |
| `recipe_id` | UUID | FK → recipes, CASCADE | Công thức được đánh giá |
| `rating` | INTEGER | MIN=1, MAX=5 | Điểm đánh giá (1–5 sao) |
| `comment` | TEXT | NULL | Bình luận (tùy chọn) |
| `cooksnap_url` | TEXT | NULL | URL ảnh món ăn đã nấu (tùy chọn) |
| `created_at` | TIMESTAMP | auto_now_add | Thời điểm đánh giá |

**Unique constraint:** `(user_id, recipe_id)` — mỗi user chỉ đánh giá một công thức đúng 1 lần.

**Ordering:** `-created_at` (mới nhất trước)

---

### 10. `collections` — Bộ sưu tập

**App:** `apps.social` | **Model:** `Collection`

| Cột | Kiểu | Ràng buộc | Mô tả |
|---|---|---|---|
| `id` | INTEGER | PK, auto-increment | Primary key |
| `user_id` | UUID | FK → users, CASCADE | Chủ sở hữu |
| `name` | VARCHAR(100) | NOT NULL | Tên bộ sưu tập |
| `created_at` | TIMESTAMP | auto_now_add | Thời điểm tạo |

**Ordering:** `-created_at` (mới nhất trước)

---

### 11. `collection_recipes` — Công thức trong bộ sưu tập

**App:** `apps.social` | **Model:** `CollectionRecipe`

| Cột | Kiểu | Ràng buộc | Mô tả |
|---|---|---|---|
| `id` | INTEGER | PK, auto-increment | Primary key |
| `collection_id` | INTEGER | FK → collections, CASCADE | Bộ sưu tập |
| `recipe_id` | UUID | FK → recipes, CASCADE | Công thức |
| `added_at` | TIMESTAMP | auto_now_add | Thời điểm thêm vào |

**Unique constraint:** `(collection_id, recipe_id)` — tránh lưu trùng công thức trong cùng bộ sưu tập.

**Ghi chú:**
- Bảng này là nguồn dữ liệu cho **Affinity Bonus (+50 điểm)** trong thuật toán gợi ý.

---

## Query Optimization

Tất cả các ViewSet đều sử dụng `select_related()` và `prefetch_related()` để tránh N+1 query:

```python
# Ví dụ trong RecipeViewSet
Recipe.objects.select_related('user').prefetch_related(
    'recipe_ingredients__ingredient',
    'steps'
)

# Ví dụ trong PantryViewSet
Pantry.objects.filter(user=request.user).select_related('ingredient')

# Ví dụ trong recommendation_engine
Recipe.objects.filter(visibility='PUBLIC').select_related('user').prefetch_related(
    'recipe_ingredients__ingredient'
)
```
