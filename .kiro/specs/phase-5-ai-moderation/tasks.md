# Implementation Plan: Phase 5 — AI Moderation

## Overview

Tích hợp lớp kiểm duyệt nội dung tự động bằng AI (Local LLM qua Ollama) vào KitchenMate Backend. Bao gồm: tạo module `AI_Moderator`, cập nhật `RecipeViewSet.publish()`, cập nhật `IngredientViewSet.create()`, và viết test suite đầy đủ.

## Tasks

- [x] 1. Cập nhật Django Settings cho Ollama
  - Thêm ba setting mới vào `KitchenMate_Backend/core/settings.py`: `OLLAMA_BASE_URL`, `OLLAMA_MODEL`, `OLLAMA_TIMEOUT`
  - Xóa (hoặc comment-out) hai setting cũ `AI_MODEL_NAME` và `AI_API_URL` đã lỗi thời
  - Cập nhật `.env.example` với ba biến môi trường tương ứng
  - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [x] 2. Tạo module `core/services/ai_moderator.py`
  - [x] 2.1 Tạo file `KitchenMate_Backend/core/services/__init__.py` (nếu chưa có) và `ai_moderator.py`
    - Định nghĩa hai exception class: `ModerationTimeoutError(Exception)` và `ModerationServiceError(Exception)`
    - Implement helper `_build_prompt(text: str) -> str` nhúng text vào Prompt_Template tiếng Việt
    - Implement helper `_call_ollama(prompt: str) -> str` gọi HTTP POST tới Ollama với timeout từ settings
    - Implement helper `_normalize_result(raw: str) -> str` strip + upper + validate, fallback về `"SUSPECT"`
    - Implement hàm public `moderate_text(text: str) -> str` kết hợp tất cả helpers
    - Thêm logging ở mức `ERROR` cho tất cả exception trước khi raise
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.3, 3.4, 3.5, 6.1, 6.2, 6.3, 6.4, 6.5, 7.1, 7.2, 7.3_

  - [x] 2.2 Viết property test — Property 1: Text nhúng vào prompt
    - File: `KitchenMate_Backend/tests/test_ai_moderator.py`
    - Dùng `@given(text=st.text(min_size=1).filter(lambda t: t.strip()))`, patch `requests.post`
    - Kiểm tra text xuất hiện nguyên vẹn trong `call_args[1]['json']['prompt']`
    - **Property 1: Text nhúng vào prompt**
    - **Validates: Requirements 2.4**

  - [x] 2.3 Viết property test — Property 2: Output luôn là giá trị hợp lệ
    - Dùng `@given(text=..., raw_result=st.sampled_from(['YES', 'NO', 'SUSPECT', 'yes', 'no', 'suspect', ' YES ', '\nNO\n']))`
    - Kiểm tra `result in ('YES', 'NO', 'SUSPECT')`
    - **Property 2: Output luôn là giá trị hợp lệ**
    - **Validates: Requirements 3.2, 3.3**

  - [x] 2.4 Viết property test — Property 3: Fallback SUSPECT cho response không hợp lệ
    - Dùng `@given(text=..., invalid_response=st.text().filter(lambda r: r.strip().upper() not in ('YES', 'NO', 'SUSPECT')))`
    - Kiểm tra `result == 'SUSPECT'`
    - **Property 3: Fallback về SUSPECT cho response không hợp lệ**
    - **Validates: Requirements 3.4**

  - [x] 2.5 Viết property test — Property 4: Whitespace input không gọi Ollama
    - Dùng `@given(text=st.one_of(st.just(''), st.text(alphabet=' \t\n\r', min_size=1)))`
    - Kiểm tra `result == 'SUSPECT'` và `mock_post.assert_not_called()`
    - **Property 4: Whitespace input không gọi Ollama**
    - **Validates: Requirements 3.5**

  - [x] 2.6 Viết property test — Property 10: Settings override
    - Dùng `@given(base_url=..., model=..., timeout=st.integers(min_value=1, max_value=120))`
    - Dùng `override_settings` để inject giá trị, kiểm tra URL, model, timeout trong `call_args`
    - **Property 10: Settings override — AI_Moderator sử dụng giá trị từ Django settings**
    - **Validates: Requirements 7.1, 7.2, 7.3, 7.4**

  - [x] 2.7 Viết unit tests cho `ai_moderator.py`
    - Smoke: `ModerationTimeoutError` và `ModerationServiceError` kế thừa từ `Exception`
    - Smoke: Hàm `moderate_text` tồn tại và có thể gọi được
    - Example: Timeout → raise `ModerationTimeoutError`
    - Example: HTTP 500 → raise `ModerationServiceError`
    - Example: Connection refused → raise `ModerationServiceError`
    - Example: Response `"yes\n"` → trả về `"YES"` (normalize)
    - Example: Response `"  No  "` → trả về `"NO"` (normalize)
    - Example: `logger.error` được gọi khi có exception
    - _Requirements: 1.3, 1.4, 3.3, 6.1, 6.2, 6.3_

- [x] 3. Checkpoint — Kiểm tra module AI_Moderator
  - Đảm bảo tất cả tests trong `test_ai_moderator.py` pass, hỏi user nếu có vấn đề.

- [x] 4. Cập nhật `RecipeViewSet.publish()`
  - [x] 4.1 Sửa `KitchenMate_Backend/apps/recipes/views.py` — action `publish()`
    - Import `moderate_text`, `ModerationTimeoutError`, `ModerationServiceError` từ `core.services.ai_moderator`
    - Ghép text kiểm duyệt theo format: `"{title}\n{description}\n{step1_instruction}\n..."` (sắp xếp theo `step_number`)
    - Thay thế logic cũ (chuyển thẳng sang PENDING) bằng luồng AI moderation theo bảng trong design
    - Xử lý exception: trả về HTTP 503 khi AI service lỗi, không thay đổi `recipe.visibility`
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_

  - [x] 4.2 Viết property test — Property 5: Recipe publish visibility đúng theo result
    - File: `KitchenMate_Backend/tests/test_recipe_publish.py`
    - Dùng `@given(moderation_result=st.sampled_from(['YES', 'NO', 'SUSPECT']))`, patch `moderate_text`
    - Kiểm tra `recipe.visibility` và `response.status_code` theo bảng mapping trong design
    - **Property 5: Recipe publish — visibility được cập nhật đúng theo moderation result**
    - **Validates: Requirements 4.2, 4.3, 4.4**

  - [x] 4.3 Viết property test — Property 6: Recipe text ghép đúng format
    - Dùng `@given(steps=st.lists(st.text(min_size=1), min_size=0, max_size=10))`
    - Kiểm tra `title`, `description`, và tất cả `instruction` của steps xuất hiện trong text truyền vào `moderate_text`
    - **Property 6: Recipe publish — text ghép đúng format và đầy đủ**
    - **Validates: Requirements 4.1, 4.6**

  - [x] 4.4 Viết property test — Property 7: Recipe publish AI lỗi không thay đổi trạng thái
    - Dùng `@given(exc_class=st.sampled_from([ModerationTimeoutError, ModerationServiceError]))`
    - Kiểm tra `recipe.visibility == 'PRIVATE'` và `response.status_code == 503`
    - **Property 7: Recipe publish — AI service lỗi không thay đổi trạng thái**
    - **Validates: Requirements 4.5**

  - [x] 4.5 Viết unit tests cho `RecipeViewSet.publish()`
    - Example: Recipe không phải PRIVATE → 400 (không gọi AI)
    - Example: Recipe không tồn tại → 404
    - Example: User không phải owner → 403
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 5. Cập nhật `IngredientViewSet.create()`
  - [x] 5.1 Sửa `KitchenMate_Backend/apps/ingredients/views.py` — method `create()` và `perform_create()`
    - Import `moderate_text`, `ModerationTimeoutError`, `ModerationServiceError` từ `core.services.ai_moderator`
    - Gọi `moderate_text(name)` trước khi lưu ingredient
    - Thay thế `perform_create()` hiện tại bằng luồng AI moderation theo bảng trong design
    - Xử lý exception: lưu với `status = "PENDING"` (graceful degradation), trả về HTTP 201
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

  - [x] 5.2 Viết property test — Property 8: Ingredient create status đúng theo result
    - File: `KitchenMate_Backend/tests/test_ingredient_create.py`
    - Dùng `@given(moderation_result=st.sampled_from(['YES', 'NO', 'SUSPECT']))`, patch `moderate_text`
    - Kiểm tra `response.status_code` và `ingredient.status` theo bảng mapping trong design
    - **Property 8: Ingredient create — status được gán đúng theo moderation result**
    - **Validates: Requirements 5.2, 5.3, 5.4**

  - [x] 5.3 Viết property test — Property 9: Ingredient create AI lỗi vẫn lưu PENDING
    - Dùng `@given(exc_class=st.sampled_from([ModerationTimeoutError, ModerationServiceError]))`
    - Kiểm tra `response.status_code == 201` và `ingredient.status == 'PENDING'`
    - **Property 9: Ingredient create — AI service lỗi vẫn lưu với PENDING**
    - **Validates: Requirements 5.5**

  - [x] 5.4 Viết unit tests cho `IngredientViewSet.create()`
    - Example: Dữ liệu không hợp lệ → 400 (không gọi AI)
    - Example: User chưa đăng nhập → 401
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 6. Final Checkpoint — Đảm bảo toàn bộ test suite pass
  - Chạy toàn bộ tests: `pytest KitchenMate_Backend/tests/ -v`
  - Đảm bảo tất cả tests pass, hỏi user nếu có vấn đề phát sinh.

## Notes

- Tasks đánh dấu `*` là optional, có thể bỏ qua để MVP nhanh hơn
- Mỗi task tham chiếu requirements cụ thể để đảm bảo traceability
- Property tests dùng `hypothesis` (đã có sẵn trong project)
- Không thay đổi schema database — chỉ thay đổi giá trị gán cho các trường đã tồn tại
- `IngredientViewSet` dùng graceful degradation khi AI lỗi (lưu PENDING), `RecipeViewSet` trả 503 vì publish là hành động chủ động
