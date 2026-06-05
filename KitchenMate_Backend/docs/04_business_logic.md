# KitchenMate Backend — Business Logic

## 1. Hệ thống Visibility của Công thức

### Vòng đời trạng thái

```
Tạo mới
   │
   ▼
PRIVATE ──── publish() ──── LẬP TỨC PENDING
   │                    │
   │                    ▼
   │            AI Moderation (async)
   │                    │
   │         ┌──────────┼──────────┐
   │         ▼          ▼          ▼
   │       YES       SUSPECT      NO
   │         │          │          │
   │         ▼          │          ▼
   │      PUBLIC     PENDING   PRIVATE
   │      (auto)     (keep)    +reason
   │                    │
   │         Admin approve ──► PUBLIC
   │         Admin reject ──► PRIVATE +reason +notification
   │
PUBLIC ── Admin unpublish ──► PRIVATE +reason +notification
```

### Quy tắc truy cập theo trạng thái

| Trạng thái | Ai xem được | Ai sửa được | view_count tăng? |
|---|---|---|---|
| `PRIVATE` | Chỉ owner | Owner | Không |
| `PENDING` | Chỉ owner | Không ai | Không |
| `PUBLIC` | Tất cả | Không ai (phải về PRIVATE trước) | Có (atomic) |

**Lưu ý bảo mật:** Khi người dùng không có quyền xem công thức PRIVATE/PENDING, hệ thống trả về `404` thay vì `403` để không lộ sự tồn tại của công thức.

### Chi tiết AI Moderation

**Nguyên tắc:** AI và Admin cùng share một "rổ PENDING". AI xử lý trước, Admin là backup.

**Sequential Queue:** Chỉ 1 công thức được AI xử lý tại một thời điểm. Các công thức khác đang chờ trong hàng đợi sẽ hiển thị trạng thái `PENDING` (không phải `PROCESSING`).

| Kết quả AI | Hành vi |
|---|---|
| `YES` | Recipe tự động `PUBLIC` (AI duyệt trước) |
| `NO` | Recipe về `PRIVATE` + lưu `rejection_reason` |
| `SUSPECT` | Giữ `PENDING` để Admin duyệt thủ công |

**Admin moderation side effects:**
- `reject` công thức PENDING lưu `rejection_reason` nếu admin nhập lý do, chuyển `ai_moderation_status=REJECTED`, và tạo `Notification` `WARNING` cho chủ công thức với `data.action="recipe_reject"`.
- `unpublish` công thức PUBLIC chỉ dành cho superuser, lưu `rejection_reason` nếu có, chuyển `ai_moderation_status=REJECTED`, và tạo `Notification` `WARNING` cho chủ công thức với `data.action="recipe_unpublish"`.

**Trạng thái AI Moderation:**

| Trạng thái | Ý nghĩa |
|---|---|
| `PENDING` | Đang chờ trong hàng đợi |
| `PROCESSING` | AI đang đọc và phân tích nội dung |
| `APPROVED` | Đã duyệt (do AI hoặc Admin) |
| `REJECTED` | Đã từ chối (do AI hoặc Admin) |

**Cơ chế async:**
1. User gọi `publish()` → Recipe **lập tức** chuyển `PENDING`
2. Background thread gọi Ollama AI (sequential - có lock đảm bảo 1 công thức tại một thời điểm)
3. Khi AI bắt đầu đọc → `ai_moderation_status = 'PROCESSING'`, `ai_moderation_attempted=True`
4. AI xử lý xong → cập nhật `visibility` và `ai_moderation_status` theo kết quả
5. Sau khi xong → tự động lấy công thức PENDING tiếp theo có `ai_moderation_attempted=False`
6. User không blocked trong lúc chờ AI

Nếu Ollama timeout hoặc lỗi kết nối, recipe giữ `visibility=PENDING`, `ai_moderation_status=PENDING`, lưu lý do vào `rejection_reason`, và không tự retry cho đến khi user gửi duyệt lại. Điều này tránh vòng lặp background task khi Ollama đang tắt.

---

## 2. AI Moderation Workflow

### Kiến trúc

```
API Request
    │
    ▼
moderate_text(text)
    │
    ├── text rỗng → trả về "SUSPECT" ngay (không gọi Ollama)
    │
    ▼
_build_prompt(text)  ← PROMPT_TEMPLATE tiếng Việt
    │
    ▼
_call_ollama(prompt)
    │
    ├── Timeout → raise ModerationTimeoutError
    ├── Connection Error → raise ModerationServiceError
    ├── HTTP != 200 → raise ModerationServiceError
    │
    ▼
_normalize_result(raw)
    │
    ├── "YES" / "NO" / "SUSPECT" → trả về nguyên
    └── Khác → fallback về "SUSPECT"
```

### Cấu hình Ollama (settings.py)

```python
OLLAMA_BASE_URL = 'http://localhost:11434'  # URL Ollama server
OLLAMA_MODEL    = 'gemma4:e2b'              # Model đang dùng
OLLAMA_TIMEOUT  = 30                        # Timeout (giây)
```

### Prompt Template

```
Bạn là hệ thống kiểm duyệt nội dung cho nền tảng chia sẻ công thức nấu ăn.
Hãy đánh giá văn bản sau và trả lời bằng ĐÚNG MỘT trong ba từ: YES, NO, hoặc SUSPECT.

Tiêu chí:
- YES: Nội dung phù hợp với chủ đề ẩm thực, không vi phạm cộng đồng.
- NO: Nội dung rõ ràng không phù hợp (ngôn từ thô tục, nội dung độc hại, hoàn toàn không liên quan đến ẩm thực).
- SUSPECT: Nội dung mơ hồ, cần Admin xem xét thêm.

Chỉ trả về đúng một từ, không giải thích, không thêm ký tự nào khác.

Văn bản cần kiểm duyệt:
{text}
```

### Xử lý lỗi AI (Graceful Degradation)

| Tình huống | Hành vi Recipe publish | Hành vi Ingredient create |
|---|---|---|
| AI trả `YES` | `visibility=PUBLIC` | `status=PENDING` (chờ Admin) |
| AI trả `NO` | `visibility=PRIVATE`, `ai_moderation_status=REJECTED`, lưu `rejection_reason` | Trả lỗi 400 |
| AI trả `SUSPECT` | `visibility=PENDING` | `status=PENDING` |
| AI timeout | Giữ `PENDING`, lưu `rejection_reason`, không block user | Lưu `PENDING`, không block user |
| AI lỗi kết nối | Giữ `PENDING`, lưu `rejection_reason`, không block user | Lưu `PENDING`, không block user |

**Lý do khác biệt:** Recipe publish chạy moderation bất đồng bộ để không block người dùng. Ingredient create vẫn ưu tiên graceful degradation để Admin xử lý sau khi AI không sẵn sàng.

---

## 3. Tier-3 Scoring Algorithm (Gợi ý món ăn)

### Tổng quan

Thuật toán tính điểm cho từng công thức PUBLIC dựa trên nguyên liệu trong tủ lạnh của user, sau đó lọc và sắp xếp theo chế độ.

### Phase 1 — Filter (Bỏ qua STAPLE)

Nguyên liệu có `category=STAPLE` (muối, đường, dầu ăn, nước mắm...) bị bỏ qua hoàn toàn trong tính toán. Hệ thống giả định user luôn có sẵn các nguyên liệu cơ bản này.

### Phase 2 — Scoring

```python
PENALTY = {
    'PROTEIN': -100,  # Thiếu đạm → nghiêm trọng nhất
    'CARB':     -80,  # Thiếu tinh bột
    'VEG':      -50,  # Thiếu rau củ
    'OTHER':    -25,  # Thiếu nguyên liệu khác
    'SPICE':    -10,  # Thiếu gia vị đặc trưng → ít nghiêm trọng nhất
}
```

**Công thức tính điểm:**
```
score = 0
for mỗi nguyên liệu non-STAPLE trong công thức:
    if nguyên liệu có trong pantry:
        score += 20  (Match Score)
    else:
        score += PENALTY[category]  (Penalty Score)
        thêm vào missing_ingredients

if công thức nằm trong Collection của user:
    score += 50  (Affinity Bonus)
```

**Ví dụ:**
```
Công thức "Phở bò" cần: Xương bò (PROTEIN), Bánh phở (CARB), Hành (VEG), Sả (SPICE), Muối (STAPLE)
Pantry user có: Xương bò, Bánh phở, Muối

Tính điểm:
- Muối (STAPLE) → bỏ qua
- Xương bò (PROTEIN) → có trong pantry → +20
- Bánh phở (CARB) → có trong pantry → +20
- Hành (VEG) → thiếu → -50
- Sả (SPICE) → thiếu → -10

score = 20 + 20 - 50 - 10 = -20
missing = [Hành, Sả]
```

### Phase 3 — Modes

| Mode | Điều kiện lọc | Mô tả |
|---|---|---|
| `COOK_NOW` | `missing_count == 0` | Chỉ công thức có đủ nguyên liệu |
| `ADD_MORE` | `missing_count <= 2` VÀ `score >= 0` | Công thức thiếu tối đa 2 nguyên liệu và điểm không âm |

**Kết quả:** Sắp xếp theo `score` giảm dần.

### Tối ưu hóa

```python
# Lấy pantry IDs một lần (set lookup O(1))
pantry_ingredient_ids = set(
    user.pantry_items.values_list('ingredient_id', flat=True)
)

# Lấy saved recipe IDs một lần
saved_recipe_ids = set(
    CollectionRecipe.objects.filter(collection__user=user)
    .values_list('recipe_id', flat=True)
)

# Prefetch tất cả ingredients của tất cả recipes trong một query
recipes = Recipe.objects.filter(visibility='PUBLIC').select_related('user').prefetch_related(
    'recipe_ingredients__ingredient'
)
```

---

## 4. Check-to-Pantry Atomic Transaction

### Quy tắc chỉnh sửa ShoppingList

Người dùng có thể chỉnh sửa `quantity` và `unit` của item trong danh sách đi chợ khi item chưa mua (`is_purchased=false`). Sau khi item đã được đánh dấu mua, backend chặn update trực tiếp để tránh lệch dữ liệu đã đồng bộ sang Pantry; người dùng phải bỏ đánh dấu đã mua trước rồi mới chỉnh sửa.

Khi cập nhật `unit`, backend kiểm tra theo đơn vị hợp lệ của nguyên liệu. Nếu nguyên liệu có `allowed_units`, giá trị gửi lên phải là `slug` của một đơn vị active trong danh sách đó. Không cho đổi `ingredient` của một shopping item đã tạo.

### Mục đích

Đảm bảo tính toàn vẹn dữ liệu khi user đánh dấu đã mua một item trong danh sách đi chợ. Cả hai thao tác (cập nhật ShoppingList + cập nhật Pantry) phải thành công hoặc thất bại cùng nhau.

### Luồng xử lý

```python
with transaction.atomic():
    # Bước 1: Đánh dấu đã mua
    item.is_purchased = True
    item.save(update_fields=['is_purchased'])

    # Bước 2: Tìm hoặc tạo Pantry item
    pantry_item, created = Pantry.objects.get_or_create(
        user=request.user,
        ingredient=item.ingredient,
        defaults={'quantity': 0, 'unit': item.unit}
    )

    # Bước 3: Cộng dồn số lượng
    pantry_item.quantity += item.quantity
    pantry_item.save(update_fields=['quantity', 'updated_at'])
```

**Nếu bất kỳ bước nào raise exception → toàn bộ transaction bị rollback.**

### Tại sao dùng `get_or_create` thay vì `get` + `create`?

`get_or_create` là atomic ở database level (dùng `SELECT ... FOR UPDATE` hoặc `INSERT ... ON CONFLICT`), tránh race condition khi nhiều request đồng thời cùng tạo Pantry item cho cùng một user + ingredient.

---

## 5. File Upload System

### Luồng xử lý

```
Client gửi multipart/form-data
    │
    ▼
FileValidator.validate(file)
    ├── _check_extension(filename)  → whitelist: jpg, jpeg, png, webp
    ├── _check_file_size(file)      → tối đa 5MB
    └── _check_mime_type(file)      → Pillow magic bytes (không tin Content-Type header)
    │
    ▼
ImageProcessor.process(file, max_width, max_height, quality)
    ├── Convert RGBA/P → RGB (tạo background trắng cho ảnh có transparency)
    ├── Tính kích thước mới (giữ aspect ratio, không upscale)
    └── Resize + compress → BytesIO
    │
    ▼
MediaUploadService._save_file(relative_path, content)
    ├── Tạo thư mục nếu chưa có (os.makedirs)
    └── Ghi file vào MEDIA_ROOT
    │
    ▼
MediaUploadService._delete_old_file(old_url)
    └── Xóa file cũ trên disk (nếu tồn tại)
    │
    ▼
Cập nhật DB (user.avatar_url / recipe.thumbnail_url / recipe_steps.media_url / recipe_step_media / ...)
```

Step media hỗ trợ upload nhiều file cho cùng một bước:

- Ảnh dùng luồng validate/resize/compress chung với `FileValidator` và `ImageProcessor`.
- Video chấp nhận `mp4`, `webm`, `mov`, tối đa `VIDEO_UPLOAD_MAX_SIZE` (50MB), kiểm tra header file trước khi lưu.
- Mỗi file tạo một bản ghi `RecipeStepMedia` với `order` tăng dần theo số media hiện có.
- `recipe_steps.media_url` được set bằng media đầu tiên trong lần upload để giữ tương thích với client cũ; client mới đọc danh sách đầy đủ ở `steps[].media_items`.

### Cấu hình kích thước ảnh

| Loại | Max Width | Max Height | Quality |
|---|---|---|---|
| `avatar` | 400px | 400px | 85% |
| `thumbnail` | 800px | 600px | 85% |
| `step` | 1200px | 900px | 80% |
| `cooksnap` | 1200px | 900px | 80% |

### Cấu trúc thư mục media

```
media/
├── avatars/           → Ảnh đại diện user
├── recipes/
│   ├── thumbnails/    → Ảnh đại diện công thức
│   └── steps/         → Ảnh/video minh họa bước nấu ăn
└── cooksnaps/         → Ảnh món ăn đã nấu (từ Review)
```

### Tên file

Mỗi file được đặt tên theo UUID4 để tránh trùng lặp và không lộ thông tin. Ảnh sau xử lý lưu dạng `.jpg`; video giữ extension hợp lệ ban đầu:
```
{uuid4}.jpg
{uuid4}.mp4
```

---

## 6. Password Reset Flow

```
User gửi POST /api/auth/forgot-password/ với email
    │
    ▼
Tìm user theo email (is_active=True)
    │
    ├── Không tìm thấy → Vẫn trả về 200 (tránh user enumeration attack)
    │
    └── Tìm thấy:
        ├── Tạo uid = base64(user.pk)
        ├── Tạo token = default_token_generator.make_token(user)
        ├── Tạo reset_url = FRONTEND_URL/reset-password?uid=...&token=...
        └── Gửi email (fail_silently=True)
    │
    ▼
User nhấn link → Frontend gửi POST /api/auth/reset-password/
    │
    ▼
Decode uid → lấy user
Verify token (có hiệu lực 24 giờ)
    │
    ├── Token không hợp lệ → 400
    └── Token hợp lệ → set_password(new_password) → 200
```

---

## 7. Custom Permissions

### `IsOwnerOrReadOnly`

```
GET/HEAD/OPTIONS → Cho phép tất cả (kể cả anonymous)
POST/PUT/PATCH/DELETE → Yêu cầu đăng nhập VÀ là owner của object
```

Object phải có thuộc tính `user` hoặc `owner` trỏ đến User.

### `IsOwner`

```
Tất cả methods → Yêu cầu đăng nhập VÀ là owner của object
```

Dùng cho resource hoàn toàn private (Pantry, ShoppingList).

### `IsAdminUser`

```
Tất cả methods → Yêu cầu đăng nhập VÀ is_staff=True
```

---

## 8. Custom Exception Handler

Tất cả lỗi DRF đều được format lại theo cấu trúc nhất quán:

```python
# Trước khi có custom handler:
{ "detail": "Authentication credentials were not provided." }

# Sau khi có custom handler:
{
  "success": false,
  "error": {
    "message": "Authentication credentials were not provided.",
    "details": { "detail": "Authentication credentials were not provided." }
  }
}
```

Cấu hình trong `settings.py`:
```python
REST_FRAMEWORK = {
    'EXCEPTION_HANDLER': 'core.exceptions.custom_exception_handler',
}
```
