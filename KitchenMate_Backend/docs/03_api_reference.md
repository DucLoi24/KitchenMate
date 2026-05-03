# KitchenMate Backend — API Reference

## Quy ước chung

### Base URL
```
http://localhost:8000
```

### Authentication
Tất cả endpoint yêu cầu xác thực đều dùng **JWT Bearer Token**:
```
Authorization: Bearer <access_token>
```

### Response Format
Tất cả response đều theo cấu trúc nhất quán:

**Thành công:**
```json
{
  "success": true,
  "message": "Mô tả kết quả (tùy endpoint)",
  "data": { ... }
}
```

**Lỗi:**
```json
{
  "success": false,
  "error": {
    "message": "Mô tả lỗi",
    "details": { ... }
  }
}
```

### Pagination
Các list endpoint đều hỗ trợ pagination với `page_size=20`:
```json
{
  "success": true,
  "data": {
    "count": 100,
    "next": "http://localhost:8000/api/recipes/?page=2",
    "previous": null,
    "results": [ ... ]
  }
}
```

---

## 1. Authentication (`/api/auth/`)

### POST `/api/auth/register/`
Đăng ký tài khoản mới. Trả về JWT tokens ngay sau khi đăng ký.

**Permission:** AllowAny

**Request Body:**
```json
{
  "email": "user@example.com",
  "full_name": "Nguyễn Văn A",
  "password": "matkhau123",
  "password_confirm": "matkhau123"
}
```

**Response 201:**
```json
{
  "success": true,
  "message": "Đăng ký thành công.",
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "full_name": "Nguyễn Văn A",
      "avatar_url": null,
      "bio": null,
      "created_at": "2024-01-01T00:00:00Z"
    },
    "tokens": {
      "access": "<access_token>",
      "refresh": "<refresh_token>"
    }
  }
}
```

**Lỗi:**
- `400` — Email đã tồn tại, mật khẩu không khớp, mật khẩu quá yếu.

---

### POST `/api/auth/login/`
Đăng nhập bằng email + password.

**Permission:** AllowAny

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "matkhau123"
}
```

**Response 200:**
```json
{
  "success": true,
  "message": "Đăng nhập thành công.",
  "data": {
    "user": { ... },
    "tokens": {
      "access": "<access_token>",
      "refresh": "<refresh_token>"
    }
  }
}
```

**Lỗi:**
- `400` — Thiếu email hoặc password.
- `401` — Email hoặc mật khẩu không đúng.
- `403` — Tài khoản đã bị khóa.

---

### POST `/api/auth/refresh/`
Lấy access token mới bằng refresh token.

**Permission:** AllowAny

**Request Body:**
```json
{ "refresh": "<refresh_token>" }
```

**Response 200:**
```json
{
  "access": "<new_access_token>",
  "refresh": "<new_refresh_token>"
}
```

**Ghi chú:** `ROTATE_REFRESH_TOKENS=True` → refresh token cũ bị blacklist sau khi dùng.

---

### POST `/api/auth/logout/`
Blacklist refresh token để vô hiệu hóa session.

**Permission:** IsAuthenticated

**Request Body:**
```json
{ "refresh": "<refresh_token>" }
```

**Response 200:**
```json
{ "success": true, "message": "Đăng xuất thành công." }
```

---

### POST `/api/auth/forgot-password/`
Gửi email chứa link đặt lại mật khẩu.

**Permission:** AllowAny

**Request Body:**
```json
{ "email": "user@example.com" }
```

**Response 200:** Luôn trả về 200 (tránh user enumeration attack):
```json
{
  "success": true,
  "message": "Nếu email tồn tại, bạn sẽ nhận được hướng dẫn đặt lại mật khẩu."
}
```

---

### POST `/api/auth/reset-password/`
Đặt lại mật khẩu bằng uid + token từ email.

**Permission:** AllowAny

**Request Body:**
```json
{
  "uid": "<uid_base64>",
  "token": "<reset_token>",
  "new_password": "matkhaumoi123",
  "new_password_confirm": "matkhaumoi123"
}
```

**Response 200:**
```json
{ "success": true, "message": "Đặt lại mật khẩu thành công. Vui lòng đăng nhập lại." }
```

---

## 2. Accounts (`/api/accounts/`)

### GET `/api/accounts/me/`
Lấy thông tin user đang đăng nhập.

**Permission:** IsAuthenticated

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "full_name": "Nguyễn Văn A",
    "avatar_url": "/media/avatars/xxx.jpg",
    "bio": "Tôi yêu nấu ăn",
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

---

### PUT/PATCH `/api/accounts/me/`
Cập nhật profile. `PUT` = toàn bộ, `PATCH` = một phần.

**Permission:** IsAuthenticated

**Request Body (các trường có thể cập nhật):**
```json
{
  "full_name": "Nguyễn Văn B",
  "avatar_url": "/media/avatars/xxx.jpg",
  "bio": "Mô tả mới"
}
```

---

### POST `/api/accounts/me/change-password/`
Đổi mật khẩu khi đã đăng nhập.

**Permission:** IsAuthenticated

**Request Body:**
```json
{
  "old_password": "matkhaucu",
  "new_password": "matkhaumoi123",
  "new_password_confirm": "matkhaumoi123"
}
```

---

### POST `/api/accounts/me/avatar/`
Upload ảnh đại diện. Chấp nhận `multipart/form-data`.

**Permission:** IsAuthenticated

**Request:** `multipart/form-data` với field `file` (jpg/png/webp, tối đa 5MB)

**Response 200:**
```json
{ "url": "/media/avatars/uuid.jpg", "message": "Cập nhật avatar thành công" }
```

---

### GET `/api/accounts/{id}/`
Xem profile công khai của người dùng khác.

**Permission:** AllowAny

---

### GET `/api/accounts/{id}/recipes/`
Danh sách công thức PUBLIC của user, có pagination.

**Permission:** AllowAny

---

### GET `/api/accounts/{id}/stats/`
Thống kê hoạt động của user.

**Permission:** AllowAny

**Response 200:**
```json
{
  "success": true,
  "data": {
    "recipe_count": 15,
    "total_likes": 42,
    "average_rating": 4.35
  }
}
```

| Trường | Mô tả |
|---|---|
| `recipe_count` | Số công thức PUBLIC đã đăng |
| `total_likes` | Tổng số lần công thức được lưu vào Collection |
| `average_rating` | Điểm rating trung bình trên tất cả PUBLIC recipes (null nếu chưa có review) |

---

## 3. Ingredients (`/api/ingredients/`)

### GET `/api/ingredients/`
Danh sách nguyên liệu đã được duyệt (status=APPROVED).

**Permission:** AllowAny

**Query Params:**
| Param | Mô tả |
|---|---|
| `category` | Lọc theo danh mục: PROTEIN, CARB, VEG, SPICE, STAPLE, OTHER |
| `page` | Số trang |

---

### POST `/api/ingredients/`
Đóng góp nguyên liệu mới. AI sẽ kiểm duyệt tên nguyên liệu.

**Permission:** IsAuthenticated

**Request Body:**
```json
{
  "name": "Thịt bò Wagyu",
  "category": "PROTEIN"
}
```

**Response 201:**
```json
{
  "success": true,
  "message": "Nguyên liệu đã được gửi và đang chờ Admin xem xét.",
  "data": { ... }
}
```

**AI Moderation Logic:**
- `YES` / `SUSPECT` → Lưu với `status=PENDING`, chờ Admin duyệt.
- `NO` → Trả về `400` "Tên nguyên liệu không phù hợp".
- AI lỗi → Graceful degradation: lưu `PENDING`, không block user.

---

### GET `/api/ingredients/search/?q={keyword}`
Tìm kiếm nguyên liệu APPROVED theo tên (autocomplete).

**Permission:** AllowAny

**Query Params:**
| Param | Mô tả |
|---|---|
| `q` | Từ khóa tìm kiếm (icontains) |

**Response 200:**
```json
{
  "success": true,
  "data": [
    { "id": 1, "name": "Thịt bò", "category": "PROTEIN", "status": "APPROVED" },
    ...
  ]
}
```

**Ghi chú:** Trả về tối đa 10 kết quả. Trả về `[]` nếu `q` rỗng.

---

## 4. Recipes (`/api/recipes/`)

### GET `/api/recipes/`
Danh sách công thức PUBLIC. Hỗ trợ filter và search.

**Permission:** AllowAny

**Query Params:**
| Param | Mô tả | Ví dụ |
|---|---|---|
| `title` | Tìm theo tên (icontains) | `?title=phở` |
| `difficulty` | Lọc theo độ khó | `?difficulty=EASY` |
| `prep_time_min` | Thời gian tối thiểu (phút) | `?prep_time_min=15` |
| `prep_time_max` | Thời gian tối đa (phút) | `?prep_time_max=60` |
| `ingredient` | Tìm theo tên nguyên liệu (icontains) | `?ingredient=thịt bò` |
| `page` | Số trang | `?page=2` |

---

### POST `/api/recipes/`
Tạo công thức mới. Mặc định `visibility=PRIVATE`.

**Permission:** IsAuthenticated

**Request Body:**
```json
{
  "title": "Phở bò truyền thống",
  "description": "Công thức phở bò chuẩn Hà Nội",
  "difficulty": "MEDIUM",
  "prep_time": 180,
  "thumbnail_url": "/media/recipes/thumbnails/xxx.jpg",
  "ingredients": [
    { "ingredient": 1, "quantity": 500, "unit": "gram" },
    { "ingredient": 2, "quantity": 200, "unit": "gram" }
  ],
  "steps": [
    { "step_number": 1, "instruction": "Ninh xương bò trong 4 tiếng", "media_url": null },
    { "step_number": 2, "instruction": "Thêm gia vị vào nồi nước dùng" }
  ]
}
```

**Ghi chú:** Toàn bộ quá trình tạo Recipe + RecipeIngredient + RecipeStep được thực hiện trong `transaction.atomic()`.

---

### GET `/api/recipes/{id}/`
Chi tiết công thức.

**Permission:**
- `PUBLIC`: AllowAny — tự động tăng `view_count` (atomic F() update).
- `PRIVATE`/`PENDING`: Chỉ owner — trả về `404` cho người khác (ẩn sự tồn tại).

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "Phở bò truyền thống",
    "description": "...",
    "difficulty": "MEDIUM",
    "prep_time": 180,
    "thumbnail_url": "/media/recipes/thumbnails/xxx.jpg",
    "visibility": "PUBLIC",
    "user": { "id": "uuid", "email": "...", "full_name": "...", ... },
    "recipe_ingredients": [
      { "id": 1, "ingredient": 1, "ingredient_name": "Xương bò", "ingredient_category": "PROTEIN", "quantity": 500, "unit": "gram" }
    ],
    "steps": [
      { "id": 1, "step_number": 1, "instruction": "Ninh xương bò...", "media_url": null }
    ],
    "avg_rating": 4.5,
    "created_at": "...",
    "updated_at": "..."
  }
}
```

---

### PUT/PATCH `/api/recipes/{id}/`
Cập nhật công thức. Chỉ cho phép khi `visibility=PRIVATE`.

**Permission:** IsOwner

---

### DELETE `/api/recipes/{id}/`
Xóa công thức.

**Permission:** IsOwner

**Response:** `204 No Content`

---

### GET `/api/recipes/my-recipes/`
Tất cả công thức của user hiện tại (bao gồm PRIVATE, PENDING, PUBLIC).

**Permission:** IsAuthenticated

---

### POST `/api/recipes/{id}/publish/`
Gửi công thức PRIVATE qua AI moderation để công khai.

**Permission:** IsOwner

**Điều kiện:** Công thức phải đang ở trạng thái `PRIVATE`.

**AI Moderation Flow:**
1. Ghép text: `title + description + các bước (theo step_number)`.
2. Gửi tới Ollama Local LLM.
3. Xử lý kết quả:

| Kết quả AI | Hành động | HTTP Status |
|---|---|---|
| `YES` | `visibility=PUBLIC` | 200 |
| `NO` | Không lưu, trả lỗi | 400 |
| `SUSPECT` | `visibility=PENDING` | 200 |
| AI lỗi | Không thay đổi trạng thái | 503 |

---

### POST `/api/recipes/{id}/thumbnail/`
Upload ảnh thumbnail cho công thức.

**Permission:** IsAuthenticated + IsOwner

**Request:** `multipart/form-data` với field `file`

---

### POST `/api/recipes/{id}/steps/{step_id}/media/`
Upload ảnh minh họa cho bước nấu ăn.

**Permission:** IsAuthenticated + IsOwner

---

### GET `/api/recipes/{id}/stats/`
Thống kê chi tiết của công thức.

**Permission:** AllowAny (PUBLIC) / IsOwner (PRIVATE/PENDING)

**Response 200:**
```json
{
  "success": true,
  "data": {
    "recipe_id": "uuid",
    "average_rating": 4.35,
    "review_count": 12,
    "view_count": 1500,
    "save_count": 45
  }
}
```

---

## 5. Kitchen (`/api/kitchen/`)

### GET `/api/kitchen/pantry/`
Xem toàn bộ nguyên liệu trong tủ lạnh số.

**Permission:** IsAuthenticated

**Response 200:**
```json
{
  "success": true,
  "data": {
    "count": 5,
    "results": [
      {
        "id": 1,
        "ingredient": 1,
        "ingredient_name": "Thịt bò",
        "ingredient_category": "PROTEIN",
        "quantity": 500.0,
        "unit": "gram",
        "updated_at": "2024-01-01T00:00:00Z"
      }
    ]
  }
}
```

---

### POST `/api/kitchen/pantry/`
Thêm nguyên liệu vào tủ lạnh.

**Permission:** IsAuthenticated

**Request Body:**
```json
{
  "ingredient": 1,
  "quantity": 500.0,
  "unit": "gram"
}
```

---

### PUT/PATCH `/api/kitchen/pantry/{id}/`
Cập nhật số lượng nguyên liệu trong tủ lạnh.

**Permission:** IsOwner

---

### DELETE `/api/kitchen/pantry/{id}/`
Xóa nguyên liệu khỏi tủ lạnh.

**Permission:** IsOwner

**Response:** `204 No Content`

---

### GET `/api/kitchen/shopping-list/`
Xem danh sách đi chợ.

**Permission:** IsAuthenticated

---

### POST `/api/kitchen/shopping-list/`
Thêm nguyên liệu vào danh sách đi chợ.

**Permission:** IsAuthenticated

**Request Body:**
```json
{
  "ingredient": 1,
  "quantity": 300.0,
  "unit": "gram"
}
```

---

### POST `/api/kitchen/shopping-list/{id}/mark-purchased/`
Đánh dấu đã mua và đồng bộ vào tủ lạnh (Pantry).

**Permission:** IsOwner

**Atomic Transaction (3 bước):**
1. Đặt `is_purchased=True` cho ShoppingList item.
2. `get_or_create` Pantry item tương ứng (cùng user + ingredient).
3. Cộng dồn `quantity` từ ShoppingList vào Pantry.

Nếu bất kỳ bước nào thất bại → **rollback toàn bộ**.

**Response 200:**
```json
{
  "success": true,
  "message": "Da danh dau da mua va cap nhat tu lanh.",
  "data": {
    "id": 1,
    "ingredient": 1,
    "ingredient_name": "Thịt bò",
    "ingredient_category": "PROTEIN",
    "quantity": 800.0,
    "unit": "gram",
    "updated_at": "..."
  }
}
```

---

### DELETE `/api/kitchen/shopping-list/{id}/`
Xóa item khỏi danh sách đi chợ.

**Permission:** IsOwner

---

## 6. Recommendations (`/api/recommendations/`)

### POST `/api/recommendations/suggest/`
Gợi ý công thức nấu ăn dựa trên tủ lạnh của user.

**Permission:** IsAuthenticated

**Request Body:**
```json
{
  "mode": "COOK_NOW",
  "exclude_ingredients": [5, 12]
}
```

| Trường | Bắt buộc | Mô tả |
|---|---|---|
| `mode` | Có | `COOK_NOW` hoặc `ADD_MORE` |
| `exclude_ingredients` | Không | Danh sách ingredient ID cần loại trừ |

**Mode:**
- `COOK_NOW` (Strict): Chỉ trả về công thức có đủ nguyên liệu (missing = 0).
- `ADD_MORE` (Flexible): Trả về công thức thiếu tối đa 2 nguyên liệu VÀ tổng điểm ≥ 0.

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "recipe": {
        "id": "uuid",
        "title": "Phở bò",
        ...
      },
      "score": 110,
      "missing_ingredients": []
    },
    {
      "recipe": { ... },
      "score": 45,
      "missing_ingredients": [
        { "id": 3, "name": "Hành tây", "category": "VEG" }
      ]
    }
  ]
}
```

**Lỗi:**
- `400` — `mode` không hợp lệ.

---

## 7. Social (`/api/social/`)

### GET `/api/social/recipes/{recipe_pk}/reviews/`
Danh sách đánh giá của một công thức.

**Permission:** AllowAny

---

### POST `/api/social/recipes/{recipe_pk}/reviews/`
Tạo đánh giá mới cho công thức.

**Permission:** IsAuthenticated

**Request Body:**
```json
{
  "rating": 5,
  "comment": "Ngon tuyệt vời!",
  "cooksnap_url": "/media/cooksnaps/xxx.jpg"
}
```

**Lỗi:**
- `400` — Đã đánh giá công thức này rồi (unique constraint).

---

### PUT/PATCH `/api/social/reviews/{id}/`
Cập nhật đánh giá.

**Permission:** IsOwner

---

### DELETE `/api/social/reviews/{id}/`
Xóa đánh giá.

**Permission:** IsOwner

---

### POST `/api/social/reviews/{review_id}/cooksnap/`
Upload ảnh cooksnap cho đánh giá.

**Permission:** IsAuthenticated + IsOwner

**Request:** `multipart/form-data` với field `file`

---

### GET `/api/social/collections/`
Danh sách bộ sưu tập của user hiện tại (bao gồm "Yêu thích" mặc định).

**Permission:** IsAuthenticated

**Response 200:**
```json
{
  "success": true,
  "data": {
    "results": [
      {
        "id": 1,
        "name": "Món ngon ngày Tết",
        "is_favorites": false,
        "recipe_count": 5,
        "collection_recipes": [
          { "id": 1, "recipe": "uuid", "added_at": "..." }
        ],
        "created_at": "..."
      },
      {
        "id": 2,
        "name": "Yêu thích",
        "is_favorites": true,
        "recipe_count": 3,
        "collection_recipes": [...],
        "created_at": "..."
      }
    ]
  }
}
```

- `is_favorites: true` cho collection "Yêu thích" mặc định (không thể xóa)
```

---

### POST `/api/social/collections/`
Tạo bộ sưu tập mới.

**Permission:** IsAuthenticated

**Request Body:**
```json
{ "name": "Thực đơn giảm cân" }
```

---

### POST `/api/social/collections/{id}/add-recipe/`
Thêm công thức vào bộ sưu tập.

**Permission:** IsOwner

**Request Body:**
```json
{ "recipe_id": "uuid" }
```

---

### DELETE `/api/social/collections/{id}/remove-recipe/`
Gỡ công thức khỏi bộ sưu tập.

**Permission:** IsOwner

**Request Body:**
```json
{ "recipe_id": "uuid" }
```

---

### DELETE `/api/social/collections/{id}/`
Xóa bộ sưu tập (kéo theo xóa tất cả CollectionRecipe liên quan).

**Permission:** IsOwner

**Response 204:** No content

**Response 403** (Favorites collection):
```json
{
  "success": false,
  "error": { "message": "Khong the xoa danh sach Yeu thich." }
}
```

---

### POST `/api/social/collections/toggle-favorite/`
Toggle công thức trong danh sách "Yêu thích" của user.

**Permission:** IsAuthenticated

**Request Body:**
```json
{ "recipe_id": "uuid" }
```

**Response 200 (added):**
```json
{
  "success": true,
  "message": "Da them vao Yeu thich.",
  "is_favorited": true
}
```

**Response 200 (removed):**
```json
{
  "success": true,
  "message": "Da xoa khoi Yeu thich.",
  "is_favorited": false
}
```

**Response 404:** `{ "success": false, "error": { "message": "Khong tim thay danh sach Yeu thich." } }`

**Response 400:** `{ "success": false, "error": { "message": "recipe_id la bat buoc." } }`

---

## 8. Admin Panel (`/api/admin/`)

> Tất cả endpoint Admin đều yêu cầu `is_staff=True`.

### GET `/api/admin/recipes/pending/`
Danh sách công thức đang chờ duyệt (visibility=PENDING).

**Permission:** IsAdminUser

---

### POST `/api/admin/recipes/{id}/approve/`
Duyệt công thức → `visibility=PUBLIC`.

**Permission:** IsAdminUser

---

### POST `/api/admin/recipes/{id}/reject/`
Từ chối công thức → `visibility=PRIVATE`.

**Permission:** IsAdminUser

---

### GET `/api/admin/ingredients/pending/`
Danh sách nguyên liệu đang chờ duyệt (status=PENDING).

**Permission:** IsAdminUser

---

### POST `/api/admin/ingredients/{id}/approve/`
Duyệt nguyên liệu → `status=APPROVED`.

**Permission:** IsAdminUser

---

### POST `/api/admin/ingredients/{id}/reject/`
Từ chối nguyên liệu → `status=REJECTED`.

**Permission:** IsAdminUser

---

### GET `/api/admin/users/list/`
Danh sách tất cả người dùng (kể cả tài khoản bị khóa).

**Permission:** IsAdminUser

---

### POST `/api/admin/users/{id}/block/`
Khóa tài khoản → `is_active=False`.

**Permission:** IsAdminUser

---

### POST `/api/admin/users/{id}/unblock/`
Mở khóa tài khoản → `is_active=True`.

**Permission:** IsAdminUser

---

## 9. API Documentation

| URL | Mô tả |
|---|---|
| `/api/schema/` | OpenAPI 3.0 schema (JSON/YAML) |
| `/api/docs/` | Swagger UI |
| `/api/redoc/` | ReDoc |
