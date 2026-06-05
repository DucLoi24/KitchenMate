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

**Response 200:**
```json
{
  "success": true,
  "message": "Đổi mật khẩu thành công."
}
```

**Error Response 400:**
```json
{
  "success": false,
  "error": {
    "message": "Dữ liệu không hợp lệ.",
    "details": {
      "old_password": ["Mật khẩu hiện tại không đúng."]
    }
  }
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
    "average_rating": 4.35,
    "followers_count": 12,
    "following_count": 5,
    "is_following": true
  }
}
```

| Trường | Mô tả |
|---|---|
| `recipe_count` | Số công thức PUBLIC đã đăng |
| `total_likes` | Tổng số lần công thức được lưu vào Collection |
| `average_rating` | Điểm rating trung bình trên tất cả PUBLIC recipes (null nếu chưa có review) |
| `followers_count` | Số người đang theo dõi user này |
| `following_count` | Số user mà user này đang theo dõi |
| `is_following` | `true` nếu requester đã đăng nhập và đang theo dõi user này; anonymous hoặc chính profile của mình trả `false` |

---

### POST `/api/accounts/{id}/follow/`
Theo dõi user khác.

**Permission:** IsAuthenticated

**Path Params:**
| Param | Mô tả |
|---|---|
| `id` | UUID của user cần theo dõi |

**Request Body:** Không có.

**Response 201** (tạo quan hệ mới):
```json
{
  "success": true,
  "message": "Đã theo dõi người dùng.",
  "data": {
    "is_following": true
  }
}
```

**Response 200** (đã theo dõi từ trước):
```json
{
  "success": true,
  "message": "Bạn đã theo dõi người dùng này.",
  "data": {
    "is_following": true
  }
}
```

**Lỗi:**
- `400` — Không thể theo dõi chính mình: `"Bạn không thể theo dõi chính mình."`
- `401` — Chưa đăng nhập.
- `404` — User không tồn tại hoặc đã bị khóa.

---

### DELETE `/api/accounts/{id}/follow/`
Hủy theo dõi user khác. Endpoint idempotent: nếu chưa theo dõi, vẫn trả về trạng thái không theo dõi.

**Permission:** IsAuthenticated

**Response 200:**
```json
{
  "success": true,
  "message": "Đã hủy theo dõi người dùng.",
  "data": {
    "is_following": false
  }
}
```

**Lỗi:**
- `401` — Chưa đăng nhập.
- `404` — User không tồn tại hoặc đã bị khóa.

---

### GET `/api/accounts/{id}/followers/`
Danh sách người đang theo dõi user. Endpoint public và có pagination.

**Permission:** AllowAny

**Query Params:**
| Param | Mô tả |
|---|---|
| `page` | Số trang |

**Response 200:**
```json
{
  "success": true,
  "data": {
    "count": 1,
    "next": null,
    "previous": null,
    "results": [
      {
        "id": "uuid",
        "full_name": "Nguyễn Văn A",
        "avatar_url": null,
        "bio": "Tôi yêu nấu ăn",
        "followers_count": 3,
        "is_following": false
      }
    ]
  }
}
```

`is_following` trong từng item phụ thuộc requester hiện tại. Anonymous luôn nhận `false`.

**Lỗi:**
- `404` — User không tồn tại hoặc đã bị khóa.

---

### GET `/api/accounts/{id}/following/`
Danh sách user mà user này đang theo dõi. Endpoint public và có pagination.

**Permission:** AllowAny

Response giống `/api/accounts/{id}/followers/`.

**Lỗi:**
- `404` — User không tồn tại hoặc đã bị khóa.

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
      {
        "id": 1,
        "step_number": 1,
        "instruction": "Ninh xương bò...",
        "media_url": "/media/recipes/steps/first-file.jpg",
        "media_items": [
          {
            "id": 1,
            "media_url": "/media/recipes/steps/uuid.jpg",
            "media_type": "IMAGE",
            "order": 1,
            "original_name": "step-1.png",
            "created_at": "2026-05-22T09:00:00Z"
          }
        ]
      }
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
Xóa công thức (soft delete — đưa vào thùng rác).

**Permission:** IsOwner

**Điều kiện:** Công thức không ở trạng thái `PENDING` (đang chờ duyệt).

**Flow:**
1. Set `is_deleted=True` và `deleted_at=now`
2. Recipe được đưa vào trash
3. Auto-hard-delete sau 14 ngày (qua `cleanup_trash` command)

**Success Response (200):**
```json
{
  "success": true,
  "message": "Công thức đã được đưa vào thùng rác.",
  "data": { ... }
}
```

**Error Response (400):** Khi công thức đang ở trạng thái PENDING.
```json
{
  "success": false,
  "error": { "message": "Không thể xóa công thức đang chờ duyệt." }
}
```

---

### GET `/api/recipes/trash/`
Lấy danh sách công thức trong thùng rác của user hiện tại.

**Permission:** IsAuthenticated

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "count": 2,
    "next": null,
    "previous": null,
    "results": [
      {
        "id": "...",
        "title": "...",
        "is_deleted": true,
        "deleted_at": "2026-05-05T10:00:00Z",
        ...
      }
    ]
  }
}
```

---

### POST `/api/recipes/{id}/restore/`
Khôi phục công thức từ thùng rác.

**Permission:** IsOwner

**Success Response (200):**
```json
{
  "success": true,
  "message": "Công thức đã được khôi phục.",
  "data": { ... }
}
```

---

### GET `/api/recipes/my-recipes/`
Tất cả công thức của user hiện tại (bao gồm PRIVATE, PENDING, PUBLIC).

**Permission:** IsAuthenticated

---

### POST `/api/recipes/{id}/publish/`
Gửi công thức PRIVATE sang PENDING và trigger AI moderation async.

**Permission:** IsOwner

**Điều kiện:** Công thức phải đang ở trạng thái `PRIVATE`.

**Flow:**
1. Recipe lập tức chuyển `visibility=PENDING`
2. Background thread gọi AI moderation
3. Trả về 200 ngay lập tức (không chờ AI)

**Response:**

| Kết quả AI | HTTP | Recipe visibility |
|---|---|---|
| `YES` | 200 | `PUBLIC` (sau khi AI xử lý) |
| `NO` | 200 | `PRIVATE` + `rejection_reason` |
| `SUSPECT` | 200 | `PENDING` (Admin duyệt) |
| AI đang xử lý | 200 | `PENDING` (chờ kết quả) |

**Success Response (200):**
```json
{
  "success": true,
  "message": "Đã gửi công thức đi duyệt. Vui lòng chờ kết quả.",
  "data": { ... }
}
```

---

### POST `/api/recipes/{id}/thumbnail/`
Upload ảnh thumbnail cho công thức.

**Permission:** IsAuthenticated + IsOwner

**Request:** `multipart/form-data` với field `file`

---

### POST `/api/recipes/{id}/steps/{step_id}/media/`
Upload một hoặc nhiều ảnh/video minh họa cho bước nấu ăn.

**Permission:** IsAuthenticated + IsOwner

**Request:** `multipart/form-data`

| Field | Mô tả |
|---|---|
| `files` | Một hoặc nhiều file. Frontend có thể append nhiều field cùng tên `files`. |
| `file` | File đơn, giữ tương thích với client cũ. |

**Định dạng hỗ trợ:**

- Ảnh: `jpg`, `jpeg`, `png`, `webp`, tối đa 5MB, được resize/compress về JPEG.
- Video: `mp4`, `webm`, `mov`, tối đa 50MB, kiểm tra header file.

**Response 200:**
```json
{
  "url": "/media/recipes/steps/first-file.jpg",
  "media": [
    {
      "id": 1,
      "media_url": "/media/recipes/steps/uuid.jpg",
      "media_type": "IMAGE",
      "order": 1,
      "original_name": "step-1.png"
    }
  ],
  "message": "Cập nhật media bước thực hiện thành công"
}
```

`url` là media đầu tiên và được lưu vào `recipe_steps.media_url` để tương thích với client cũ. Danh sách đầy đủ nằm trong `steps[].media_items` khi lấy chi tiết công thức.

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

## 4.1 Recipe Categories (`/api/recipes/categories/`)

Danh mục công thức dùng để phân loại recipe và làm bộ lọc ở frontend. Danh sách public mặc định chỉ trả về danh mục `is_active=true`, sắp xếp theo `order,name` để số thứ tự thấp hơn hiển thị trước.

### GET `/api/recipes/categories/`
Danh sách danh mục công thức active.

**Permission:** AllowAny

**Query Params:**
| Param | Mô tả |
|---|---|
| `page` | Số trang |
| `page_size` | Số item mỗi trang |
| `ordering` | Trường sắp xếp, ví dụ `order,name`, `-order,name`, `name` |
| `is_active` | Lọc theo trạng thái active/inactive |
| `include_inactive` | Admin truyền `true` để xem cả danh mục inactive |

**Response 200:**
```json
{
  "count": 3,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": "uuid",
      "name": "Món Việt",
      "slug": "mon-viet",
      "description": "Các món ăn truyền thống Việt Nam",
      "order": 1,
      "is_active": true
    }
  ]
}
```

---

### POST `/api/recipes/categories/`
Tạo danh mục công thức mới.

**Permission:** Admin

**Request Body:**
```json
{
  "name": "Món khai vị",
  "description": "Các món ăn nhẹ trước bữa chính",
  "order": 7
}
```

**Ghi chú:** Nếu không gửi `slug`, backend tự tạo slug từ `name`.

---

### PATCH `/api/recipes/categories/{slug}/`
Cập nhật tên, mô tả hoặc `order` của danh mục.

**Permission:** Admin

**Request Body:**
```json
{
  "name": "Món khai vị",
  "description": "Món ăn nhẹ",
  "order": 4
}
```

---

### DELETE `/api/recipes/categories/{slug}/`
Vô hiệu hóa danh mục bằng soft delete (`is_active=false`).

**Permission:** Admin

**Response 204:** Không có body.

---

### POST `/api/recipes/categories/{slug}/restore/`
Khôi phục danh mục đã bị vô hiệu hóa.

**Permission:** Admin

**Response 200:** Category sau khi khôi phục.

---

### POST `/api/recipes/categories/{slug}/move/`
Đổi thứ tự ưu tiên bằng cách swap danh mục hiện tại với danh mục active liền kề.

**Permission:** Admin

**Request Body:**
```json
{ "direction": "up" }
```

`direction` nhận một trong hai giá trị:

| Giá trị | Hành vi |
|---|---|
| `up` | Đưa danh mục lên một vị trí |
| `down` | Đưa danh mục xuống một vị trí |

**Hành vi thứ tự:**
- Backend chạy trong `transaction.atomic()`.
- Chỉ reorder danh mục `is_active=true`.
- Sau khi swap, backend normalize `order` của danh mục active thành `1..n`.
- Nếu danh mục đã ở đầu mà move `up`, hoặc ở cuối mà move `down`, trả `400`.

**Response 200:**
```json
{
  "message": "Đã cập nhật thứ tự danh mục.",
  "results": [
    { "id": "uuid-a", "name": "A", "slug": "a", "description": "", "order": 1, "is_active": true },
    { "id": "uuid-c", "name": "C", "slug": "c", "description": "", "order": 2, "is_active": true },
    { "id": "uuid-b", "name": "B", "slug": "b", "description": "", "order": 3, "is_active": true }
  ]
}
```

**Lỗi:**
- `400` — `direction` không hợp lệ hoặc không thể di chuyển xa hơn.
- `403` — User không có quyền admin.
- `404` — Danh mục không tồn tại hoặc không active.

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

**Response item fields:**
```json
{
  "id": 1,
  "ingredient": 1,
  "ingredient_name": "Thịt bò",
  "quantity": 300.0,
  "unit": "gram",
  "unit_display": "Gram",
  "is_purchased": false,
  "created_at": "2026-05-22T09:00:00Z"
}
```

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

### PUT/PATCH `/api/kitchen/shopping-list/{id}/`
Cập nhật số lượng hoặc đơn vị của một mục trong danh sách đi chợ.

**Permission:** IsOwner

**Điều kiện:**
- Chỉ cập nhật item chưa mua (`is_purchased=false`).
- Không cho đổi `ingredient` của item đã tạo.
- Nếu nguyên liệu có `allowed_units`, `unit` phải là slug của một đơn vị active trong danh sách đó.

**Request Body (PATCH):**
```json
{
  "quantity": 500.0,
  "unit": "kilogram"
}
```

**Response 200:**
```json
{
  "success": true,
  "message": "Cap nhat thanh cong.",
  "data": {
    "id": 1,
    "ingredient": 1,
    "ingredient_name": "Thịt bò",
    "quantity": 500.0,
    "unit": "kilogram",
    "unit_display": "Kilogram",
    "is_purchased": false,
    "created_at": "2026-05-22T09:00:00Z"
  }
}
```

**Lỗi:**
- `400` — Item đã mua, quantity không hợp lệ, unit không thuộc allowed units, hoặc cố đổi ingredient.
- `403` — Không phải owner.
- `404` — Item không tồn tại trong danh sách của user.

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

### POST `/api/kitchen/shopping-list/{id}/mark-unpurchased/`
Bỏ đánh dấu đã mua và trừ số lượng đã cộng khỏi tủ lạnh.

**Permission:** IsOwner

**Atomic Transaction (3 bước):**
1. Đặt `is_purchased=false` cho ShoppingList item.
2. Tìm Pantry item tương ứng (cùng user + ingredient).
3. Trừ `quantity` của ShoppingList khỏi Pantry. Nếu số lượng còn lại `<= 0`, xóa Pantry item.

Nếu bất kỳ bước nào thất bại → **rollback toàn bộ**.

**Response 200:**
```json
{
  "success": true,
  "message": "Da bo danh dau da mua.",
  "data": null
}
```

`data` là pantry item còn lại nếu vẫn còn số lượng, hoặc `null` nếu pantry item đã bị xóa.

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

### GET `/api/admin/recipes/`
Danh sách tất cả công thức cho quản trị viên.

**Permission:** IsAdminUser

**Query Params:**
| Param | Mô tả |
|---|---|
| `visibility` | Lọc theo `PUBLIC`, `PRIVATE`, hoặc `PENDING` |
| `search` | Tìm theo `title` hoặc `description` |
| `ordering` | Trường sắp xếp, mặc định `-created_at` |
| `page_size` | Số item mỗi trang, tối đa 500 |

---

### GET `/api/admin/recipes/pending/`
Danh sách công thức đang chờ duyệt (visibility=PENDING).

**Permission:** IsAdminUser

---

### POST `/api/admin/recipes/{id}/approve/`
Duyệt công thức → `visibility=PUBLIC`.

**Permission:** IsAdminUser

---

### POST `/api/admin/recipes/{id}/reject/`
Từ chối công thức đang chờ duyệt → `visibility=PRIVATE`, `ai_moderation_status=REJECTED`.

**Permission:** IsAdminUser

**Request Body:**
```json
{
  "reason": "Cần bổ sung định lượng nguyên liệu chính."
}
```

`reason` là tùy chọn. Nếu có, backend trim whitespace, lưu vào `Recipe.rejection_reason`, trả kèm trong message, và đưa lý do vào thông báo gửi cho chủ công thức.

**Side effects:**
- Tạo `Notification` cho chủ công thức với `type=WARNING`.
- `Notification.data.action = "recipe_reject"`.
- `Notification.data.reason` là lý do đã trim hoặc `null`.

---

### POST `/api/admin/recipes/{id}/unpublish/`
Chuyển công thức đang công khai về riêng tư → `visibility=PRIVATE`, `ai_moderation_status=REJECTED`.

**Permission:** IsAdminUser + superuser check trong action

**Request Body:**
```json
{
  "reason": "Thiếu nguồn ảnh và mô tả có nội dung cần chỉnh sửa."
}
```

`reason` là tùy chọn. Nếu có, backend trim whitespace, lưu vào `Recipe.rejection_reason`, trả kèm trong message, và đưa lý do vào thông báo gửi cho chủ công thức.

**Side effects:**
- Tạo `Notification` cho chủ công thức với `type=WARNING`.
- `Notification.data.action = "recipe_unpublish"`.
- `Notification.data.reason` là lý do đã trim hoặc `null`.

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
