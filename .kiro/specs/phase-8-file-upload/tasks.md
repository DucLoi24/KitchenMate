# Tasks: Phase 8 — File Upload & Media Handling

## Tổng quan

Triển khai hệ thống upload và xử lý ảnh cho KitchenMate Backend. Bao gồm: cấu hình media settings, image processing utilities, 4 upload endpoints, và property-based tests.

---

## Task List

- [x] 1. Cấu hình Media Settings
  - [x] 1.1 Thêm `IMAGE_UPLOAD_MAX_SIZE` và `ALLOWED_IMAGE_EXTENSIONS` vào `core/settings.py`
  - [x] 1.2 Thêm `IMAGE_SIZES` dict chứa max dimensions cho từng loại upload (avatar, thumbnail, step, cooksnap)
  - [x] 1.3 Thêm cấu hình optional cloud storage (`USE_S3`, `AWS_*`) với giá trị mặc định `False`

- [x] 2. Tạo Core Utilities
  - [x] 2.1 Tạo file `core/utils/__init__.py`
  - [x] 2.2 Tạo `core/utils/file_validator.py` — class `FileValidator` với 3 methods: `_check_extension`, `_check_mime_type` (dùng Pillow), `_check_file_size`, và public method `validate`
  - [x] 2.3 Tạo `core/utils/image_processor.py` — class `ImageProcessor` với method `process` (resize + compress) và `_get_resize_dimensions` (giữ aspect ratio, không upscale)
  - [x] 2.4 Tạo `core/utils/media_upload_service.py` — class `MediaUploadService` với 4 upload methods, `_delete_old_file`, và `_generate_unique_filename`

- [x] 3. Upload Endpoints — Accounts (Avatar)
  - [x] 3.1 Tạo `apps/accounts/upload_views.py` — `AvatarUploadView(APIView)` với `permission_classes = [IsAuthenticated]` và `parser_classes = [MultiPartParser, FormParser]`
  - [x] 3.2 Tạo `apps/accounts/upload_urls.py` — URL pattern `me/avatar/`
  - [x] 3.3 Đăng ký `upload_urls.py` vào `core/urls.py` dưới prefix `api/accounts/`

- [x] 4. Upload Endpoints — Recipes (Thumbnail + Step Media)
  - [x] 4.1 Tạo `apps/recipes/upload_views.py` — `RecipeThumbnailUploadView` và `RecipeStepMediaUploadView`, cả hai đều kiểm tra ownership (recipe.user == request.user)
  - [x] 4.2 Tạo `apps/recipes/upload_urls.py` — URL patterns: `{recipe_id}/thumbnail/` và `{recipe_id}/steps/{step_id}/media/`
  - [x] 4.3 Đăng ký `upload_urls.py` vào `core/urls.py` dưới prefix `api/recipes/`

- [x] 5. Upload Endpoints — Social (Cooksnap)
  - [x] 5.1 Tạo `apps/social/upload_views.py` — `CooksnapUploadView`, kiểm tra ownership (review.user == request.user)
  - [x] 5.2 Tạo `apps/social/upload_urls.py` — URL pattern `reviews/{review_id}/cooksnap/`
  - [x] 5.3 Đăng ký `upload_urls.py` vào `core/urls.py` dưới prefix `api/social/`

- [x] 6. Property-Based Tests (Hypothesis)
  - [x] 6.1 Tạo `apps/tests/test_file_validator_properties.py` — 3 properties: invalid extension luôn bị reject, file > 5MB luôn bị reject, file ≤ 5MB luôn được chấp nhận
  - [x] 6.2 Tạo `apps/tests/test_image_processor_properties.py` — 3 properties: output không vượt max dimensions, aspect ratio được giữ, ảnh nhỏ không bị upscale
  - [x] 6.3 Tạo `apps/tests/test_media_service_properties.py` — 1 property: unique filename không bao giờ trùng

- [x] 7. Integration Tests
  - [x] 7.1 Tạo `apps/tests/test_upload_integration.py` — test toàn bộ luồng upload qua HTTP: avatar, thumbnail, step media, cooksnap
  - [x] 7.2 Test permission: user A không upload được cho resource của user B (403)
  - [x] 7.3 Test cleanup: file cũ bị xóa sau khi upload file mới
  - [x] 7.4 Test error cases: no file, wrong type, oversized

- [x] 8. Cập nhật API Documentation
  - [x] 8.1 Thêm `@extend_schema` decorators vào tất cả upload views để Swagger hiển thị đúng `multipart/form-data`
  - [x] 8.2 Cập nhật `TODO.md` — đánh dấu Phase 8 hoàn thành
