# Requirements: Phase 8 — File Upload & Media Handling

## Giới thiệu

Phase 8 bổ sung khả năng upload và xử lý ảnh cho KitchenMate Backend. Người dùng có thể upload avatar cá nhân, thumbnail công thức, ảnh minh họa từng bước nấu ăn, và ảnh cooksnap trong review. Hệ thống xử lý ảnh (resize/compress) trước khi lưu, đảm bảo hiệu suất và dung lượng hợp lý.

---

## Requirements

### Requirement 1: Cấu hình Media Settings

**User Story:** Là một developer, tôi muốn hệ thống có cấu hình media rõ ràng để biết giới hạn upload và các loại file được phép.

**Acceptance Criteria:**

1. GIVEN settings.py được load, WHEN kiểm tra `IMAGE_UPLOAD_MAX_SIZE`, THEN giá trị phải là `5 * 1024 * 1024` (5MB).
2. GIVEN settings.py được load, WHEN kiểm tra `ALLOWED_IMAGE_EXTENSIONS`, THEN giá trị phải chứa đúng `{'jpg', 'jpeg', 'png', 'webp'}`.
3. GIVEN settings.py được load, WHEN kiểm tra `MEDIA_ROOT`, THEN đường dẫn phải trỏ đến thư mục `media/` trong `BASE_DIR`.
4. GIVEN settings.py được load, WHEN kiểm tra `MEDIA_URL`, THEN giá trị phải là `'/media/'`.
5. GIVEN `DEBUG=True`, WHEN server khởi động, THEN URL pattern `/media/` phải được serve bởi Django static file handler.

---

### Requirement 2: Tổ chức thư mục Media

**User Story:** Là một developer, tôi muốn các file media được tổ chức theo thư mục rõ ràng để dễ quản lý và backup.

**Acceptance Criteria:**

1. GIVEN server khởi động lần đầu, WHEN thư mục `media/avatars/` chưa tồn tại, THEN hệ thống phải tự tạo thư mục này khi có upload đầu tiên.
2. GIVEN server khởi động lần đầu, WHEN thư mục `media/recipes/thumbnails/` chưa tồn tại, THEN hệ thống phải tự tạo thư mục này khi có upload đầu tiên.
3. GIVEN server khởi động lần đầu, WHEN thư mục `media/recipes/steps/` chưa tồn tại, THEN hệ thống phải tự tạo thư mục này khi có upload đầu tiên.
4. GIVEN server khởi động lần đầu, WHEN thư mục `media/cooksnaps/` chưa tồn tại, THEN hệ thống phải tự tạo thư mục này khi có upload đầu tiên.
5. GIVEN một file được upload, WHEN file được lưu, THEN tên file phải là `{uuid4}.{ext}` (không dùng tên gốc từ client).

---

### Requirement 3: Validate File Type

**User Story:** Là một người dùng, tôi muốn hệ thống từ chối các file không phải ảnh để tránh upload nhầm file.

**Acceptance Criteria:**

1. GIVEN một file có extension `.gif`, WHEN upload lên bất kỳ endpoint nào, THEN hệ thống phải trả về `400 Bad Request` với message `"Định dạng file không được hỗ trợ. Chỉ chấp nhận: jpg, png, webp"`.
2. GIVEN một file có extension `.pdf`, WHEN upload lên bất kỳ endpoint nào, THEN hệ thống phải trả về `400 Bad Request`.
3. GIVEN một file `.txt` được đổi tên thành `.jpg`, WHEN upload lên bất kỳ endpoint nào, THEN hệ thống phải trả về `400 Bad Request` (kiểm tra magic bytes, không tin extension).
4. GIVEN một file `.jpg` hợp lệ, WHEN upload lên endpoint, THEN hệ thống phải chấp nhận và xử lý file.
5. GIVEN một file `.png` hợp lệ, WHEN upload lên endpoint, THEN hệ thống phải chấp nhận và xử lý file.
6. GIVEN một file `.webp` hợp lệ, WHEN upload lên endpoint, THEN hệ thống phải chấp nhận và xử lý file.

---

### Requirement 4: Validate File Size

**User Story:** Là một người dùng, tôi muốn hệ thống từ chối file quá lớn để tránh làm chậm server.

**Acceptance Criteria:**

1. GIVEN một file có kích thước `5MB + 1 byte`, WHEN upload lên bất kỳ endpoint nào, THEN hệ thống phải trả về `400 Bad Request` với message `"File quá lớn. Kích thước tối đa là 5MB"`.
2. GIVEN một file có kích thước đúng `5MB`, WHEN upload lên endpoint, THEN hệ thống phải chấp nhận file.
3. GIVEN một file có kích thước `1KB`, WHEN upload lên endpoint, THEN hệ thống phải chấp nhận file.
4. GIVEN request không có field `file`, WHEN gọi upload endpoint, THEN hệ thống phải trả về `400 Bad Request` với message `"Vui lòng chọn file để upload"`.

---

### Requirement 5: Image Processing (Resize & Compress)

**User Story:** Là một người dùng, tôi muốn ảnh được tự động resize và compress để tiết kiệm dung lượng server.

**Acceptance Criteria:**

1. GIVEN một ảnh avatar có kích thước `2000x2000px`, WHEN upload, THEN ảnh được lưu phải có kích thước `≤ 400x400px`.
2. GIVEN một ảnh recipe thumbnail có kích thước `3000x2000px`, WHEN upload, THEN ảnh được lưu phải có kích thước `≤ 800x600px`.
3. GIVEN một ảnh recipe step media có kích thước `4000x3000px`, WHEN upload, THEN ảnh được lưu phải có kích thước `≤ 1200x900px`.
4. GIVEN một ảnh cooksnap có kích thước `4000x3000px`, WHEN upload, THEN ảnh được lưu phải có kích thước `≤ 1200x900px`.
5. GIVEN một ảnh có kích thước `200x150px` (nhỏ hơn max), WHEN upload, THEN ảnh KHÔNG được phóng to (giữ nguyên kích thước gốc).
6. GIVEN một ảnh PNG có transparency (mode RGBA), WHEN upload, THEN ảnh phải được convert sang RGB trước khi lưu dạng JPEG.
7. GIVEN bất kỳ ảnh hợp lệ nào, WHEN được resize, THEN aspect ratio (tỷ lệ chiều rộng/chiều cao) phải được giữ nguyên (sai số ≤ 2%).

---

### Requirement 6: Upload Avatar

**User Story:** Là một người dùng đã đăng nhập, tôi muốn upload ảnh đại diện của mình.

**Acceptance Criteria:**

1. GIVEN user đã đăng nhập, WHEN gọi `POST /api/accounts/me/avatar/` với file ảnh hợp lệ, THEN hệ thống phải trả về `200 OK` với `{ "url": "/media/avatars/{uuid}.jpg", "message": "Cập nhật avatar thành công" }`.
2. GIVEN upload thành công, WHEN kiểm tra database, THEN `user.avatar_url` phải được cập nhật thành URL mới.
3. GIVEN user đã có avatar cũ, WHEN upload avatar mới thành công, THEN file avatar cũ phải bị xóa khỏi disk.
4. GIVEN user chưa đăng nhập, WHEN gọi `POST /api/accounts/me/avatar/`, THEN hệ thống phải trả về `401 Unauthorized`.
5. GIVEN upload thành công, WHEN gọi `GET` đến URL trả về (trong development), THEN phải nhận được file ảnh (HTTP 200).

---

### Requirement 7: Upload Recipe Thumbnail

**User Story:** Là một người dùng đã đăng nhập, tôi muốn upload ảnh thumbnail cho công thức của mình.

**Acceptance Criteria:**

1. GIVEN user là owner của recipe, WHEN gọi `POST /api/recipes/{recipe_id}/thumbnail/` với file hợp lệ, THEN hệ thống phải trả về `200 OK` với URL thumbnail mới.
2. GIVEN upload thành công, WHEN kiểm tra database, THEN `recipe.thumbnail_url` phải được cập nhật.
3. GIVEN user KHÔNG phải owner của recipe, WHEN gọi endpoint, THEN hệ thống phải trả về `403 Forbidden`.
4. GIVEN recipe_id không tồn tại, WHEN gọi endpoint, THEN hệ thống phải trả về `404 Not Found`.
5. GIVEN recipe đã có thumbnail cũ, WHEN upload thumbnail mới thành công, THEN file thumbnail cũ phải bị xóa khỏi disk.

---

### Requirement 8: Upload Recipe Step Media

**User Story:** Là một người dùng đã đăng nhập, tôi muốn upload ảnh minh họa cho từng bước nấu ăn.

**Acceptance Criteria:**

1. GIVEN user là owner của recipe chứa step, WHEN gọi `POST /api/recipes/{recipe_id}/steps/{step_id}/media/` với file hợp lệ, THEN hệ thống phải trả về `200 OK` với URL media mới.
2. GIVEN upload thành công, WHEN kiểm tra database, THEN `step.media_url` phải được cập nhật.
3. GIVEN user KHÔNG phải owner của recipe, WHEN gọi endpoint, THEN hệ thống phải trả về `403 Forbidden`.
4. GIVEN step_id không thuộc recipe_id, WHEN gọi endpoint, THEN hệ thống phải trả về `404 Not Found`.
5. GIVEN step đã có media cũ, WHEN upload media mới thành công, THEN file media cũ phải bị xóa khỏi disk.

---

### Requirement 9: Upload Cooksnap

**User Story:** Là một người dùng đã đăng nhập, tôi muốn upload ảnh món ăn tôi đã nấu vào review của mình.

**Acceptance Criteria:**

1. GIVEN user là owner của review, WHEN gọi `POST /api/social/reviews/{review_id}/cooksnap/` với file hợp lệ, THEN hệ thống phải trả về `200 OK` với URL cooksnap mới.
2. GIVEN upload thành công, WHEN kiểm tra database, THEN `review.cooksnap_url` phải được cập nhật.
3. GIVEN user KHÔNG phải owner của review, WHEN gọi endpoint, THEN hệ thống phải trả về `403 Forbidden`.
4. GIVEN review_id không tồn tại, WHEN gọi endpoint, THEN hệ thống phải trả về `404 Not Found`.
5. GIVEN review đã có cooksnap cũ, WHEN upload cooksnap mới thành công, THEN file cooksnap cũ phải bị xóa khỏi disk.

---

### Requirement 10: Unique Filename Generation

**User Story:** Là một developer, tôi muốn mỗi file được lưu với tên unique để tránh ghi đè file của người dùng khác.

**Acceptance Criteria:**

1. GIVEN bất kỳ số lần upload nào, WHEN hệ thống tạo tên file, THEN tên file phải có format `{uuid4}.{ext}`.
2. GIVEN 2 lần upload bất kỳ, WHEN so sánh tên file được tạo, THEN 2 tên file phải khác nhau.
3. GIVEN tên file gốc từ client là `../../etc/passwd.jpg`, WHEN hệ thống lưu file, THEN tên file được lưu phải là `{uuid4}.jpg` (không dùng tên gốc).

---

### Requirement 11: Cloud Storage (Optional — Production)

**User Story:** Là một developer, tôi muốn có thể chuyển sang AWS S3 hoặc Cloudinary cho production mà không cần thay đổi business logic.

**Acceptance Criteria:**

1. GIVEN biến môi trường `USE_S3=True` được set, WHEN upload file, THEN file phải được lưu lên AWS S3 thay vì local disk.
2. GIVEN `USE_S3=True`, WHEN upload thành công, THEN URL trả về phải là S3 URL (https://...).
3. GIVEN `USE_S3=False` hoặc không set, WHEN upload file, THEN file phải được lưu local như bình thường.
4. GIVEN cấu hình S3, WHEN thiếu `AWS_ACCESS_KEY_ID` hoặc `AWS_SECRET_ACCESS_KEY`, THEN server phải log warning và fallback về local storage.
