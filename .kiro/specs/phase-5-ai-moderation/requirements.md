# Requirements Document

## Introduction

Phase 5 bổ sung tính năng kiểm duyệt nội dung tự động bằng AI cho hệ thống KitchenMate Backend. Thay vì để Admin duyệt thủ công toàn bộ nội dung, hệ thống sẽ gọi một Local LLM (model `gemma4:e2b` chạy qua Ollama tại `http://localhost:11434`) để phân tích văn bản và phân loại mức độ phù hợp. Kết quả phân loại sẽ quyết định trạng thái cuối cùng của công thức hoặc nguyên liệu được gửi lên.

Phạm vi tích hợp:
- `RecipeViewSet.publish()` — kiểm duyệt `title`, `description`, và nội dung các `steps` trước khi công khai công thức.
- `IngredientViewSet.create()` — kiểm duyệt tên nguyên liệu trước khi lưu vào hệ thống.

---

## Glossary

- **AI_Moderator**: Module Python tại `core/services/ai_moderator.py`, chịu trách nhiệm giao tiếp với Ollama API và trả về kết quả kiểm duyệt.
- **Ollama_API**: HTTP API cục bộ tại `http://localhost:11434`, cung cấp khả năng inference cho model `gemma4:e2b`.
- **Moderation_Result**: Chuỗi kết quả kiểm duyệt, nhận một trong ba giá trị: `"YES"`, `"NO"`, hoặc `"SUSPECT"`.
- **Recipe**: Đối tượng công thức nấu ăn trong hệ thống, có trường `visibility` với các giá trị `PRIVATE`, `PENDING`, `PUBLIC`.
- **Ingredient**: Đối tượng nguyên liệu trong hệ thống, có trường `status` với các giá trị `PENDING`, `APPROVED`, `REJECTED`.
- **Prompt_Template**: Chuỗi văn bản định dạng sẵn bằng tiếng Việt, được gửi kèm nội dung cần kiểm duyệt tới Ollama_API.
- **RecipeViewSet**: Django REST Framework ViewSet xử lý các thao tác CRUD và action `publish()` cho Recipe.
- **IngredientViewSet**: Django REST Framework ViewSet xử lý tạo và liệt kê Ingredient.
- **Admin**: Người dùng có quyền `is_staff=True`, có thể duyệt hoặc từ chối nội dung ở trạng thái `PENDING`.

---

## Requirements

### Requirement 1: Kết nối và giao tiếp với Ollama API

**User Story:** Là một developer, tôi muốn hệ thống có thể gọi Ollama API cục bộ một cách đáng tin cậy, để AI_Moderator có thể hoạt động mà không phụ thuộc vào dịch vụ bên ngoài.

#### Acceptance Criteria

1. THE AI_Moderator SHALL gửi HTTP POST request tới `http://localhost:11434/api/generate` với payload chứa `model` là `"gemma4:e2b"` và `prompt` được xây dựng từ Prompt_Template.
2. THE AI_Moderator SHALL đặt timeout cho mỗi request tới Ollama_API là 30 giây.
3. IF Ollama_API không phản hồi trong vòng 30 giây, THEN THE AI_Moderator SHALL raise exception `ModerationTimeoutError` với thông báo mô tả lỗi timeout.
4. IF Ollama_API trả về HTTP status code khác 200, THEN THE AI_Moderator SHALL raise exception `ModerationServiceError` với thông báo mô tả lỗi từ service.
5. THE AI_Moderator SHALL parse response JSON từ Ollama_API và trích xuất nội dung text từ trường `response`.

---

### Requirement 2: Prompt Template tiếng Việt cho nội dung ẩm thực

**User Story:** Là một developer, tôi muốn AI nhận được prompt rõ ràng bằng tiếng Việt phù hợp với ngữ cảnh ẩm thực, để kết quả kiểm duyệt chính xác và nhất quán.

#### Acceptance Criteria

1. THE AI_Moderator SHALL xây dựng Prompt_Template bằng tiếng Việt, yêu cầu model đánh giá xem văn bản có phù hợp để đăng trên nền tảng chia sẻ công thức nấu ăn hay không.
2. THE Prompt_Template SHALL hướng dẫn model chỉ trả về đúng một trong ba từ: `YES`, `NO`, hoặc `SUSPECT` — không kèm giải thích hay ký tự thừa.
3. THE Prompt_Template SHALL định nghĩa rõ tiêu chí: `YES` khi nội dung phù hợp với chủ đề ẩm thực và không vi phạm; `NO` khi nội dung rõ ràng không phù hợp (ngôn từ thô tục, nội dung độc hại, không liên quan đến ẩm thực); `SUSPECT` khi nội dung mơ hồ hoặc cần xem xét thêm.
4. THE AI_Moderator SHALL nhúng văn bản cần kiểm duyệt vào Prompt_Template trước khi gửi tới Ollama_API.

---

### Requirement 3: Hàm `moderate_text` — phân loại nội dung

**User Story:** Là một developer, tôi muốn có một hàm đơn giản nhận văn bản và trả về kết quả phân loại, để các ViewSet có thể gọi mà không cần biết chi tiết giao tiếp với Ollama.

#### Acceptance Criteria

1. THE AI_Moderator SHALL cung cấp hàm `moderate_text(text: str) -> str` nhận một chuỗi văn bản và trả về Moderation_Result.
2. WHEN `moderate_text` được gọi với văn bản hợp lệ, THE AI_Moderator SHALL trả về một trong ba giá trị: `"YES"`, `"NO"`, hoặc `"SUSPECT"`.
3. THE AI_Moderator SHALL chuẩn hóa response từ Ollama_API bằng cách strip whitespace và chuyển về chữ hoa trước khi so sánh.
4. IF response từ Ollama_API sau khi chuẩn hóa không khớp với `"YES"`, `"NO"`, hoặc `"SUSPECT"`, THEN THE AI_Moderator SHALL trả về `"SUSPECT"` làm giá trị mặc định an toàn.
5. IF `moderate_text` được gọi với chuỗi rỗng hoặc chỉ chứa khoảng trắng, THEN THE AI_Moderator SHALL trả về `"SUSPECT"` mà không gọi Ollama_API.

---

### Requirement 4: Tích hợp kiểm duyệt vào `RecipeViewSet.publish()`

**User Story:** Là một người dùng, tôi muốn công thức của mình được kiểm duyệt tự động khi tôi nhấn publish, để nội dung không phù hợp bị chặn ngay lập tức và nội dung cần xem xét được chuyển cho Admin.

#### Acceptance Criteria

1. WHEN `RecipeViewSet.publish()` được gọi và recipe có `visibility == "PRIVATE"`, THE RecipeViewSet SHALL gọi `moderate_text` với văn bản được ghép từ `title`, `description`, và `instruction` của tất cả các `RecipeStep` liên quan.
2. WHEN Moderation_Result là `"YES"`, THE RecipeViewSet SHALL cập nhật `recipe.visibility` thành `"PUBLIC"` và trả về HTTP 200 với thông báo thành công.
3. WHEN Moderation_Result là `"NO"`, THE RecipeViewSet SHALL trả về HTTP 400 với thông báo lỗi `"Nội dung không phù hợp với tiêu chuẩn cộng đồng."` và KHÔNG lưu thay đổi vào database.
4. WHEN Moderation_Result là `"SUSPECT"`, THE RecipeViewSet SHALL cập nhật `recipe.visibility` thành `"PENDING"` và trả về HTTP 200 với thông báo `"Công thức đang chờ Admin xem xét."`.
5. IF `moderate_text` raise `ModerationTimeoutError` hoặc `ModerationServiceError`, THEN THE RecipeViewSet SHALL trả về HTTP 503 với thông báo `"Dịch vụ kiểm duyệt tạm thời không khả dụng. Vui lòng thử lại sau."` và KHÔNG thay đổi trạng thái recipe.
6. THE RecipeViewSet SHALL ghép văn bản kiểm duyệt theo định dạng: `"{title}\n{description}\n{step1_instruction}\n{step2_instruction}\n..."` trước khi truyền vào `moderate_text`.

---

### Requirement 5: Tích hợp kiểm duyệt vào `IngredientViewSet.create()`

**User Story:** Là một người dùng, tôi muốn tên nguyên liệu tôi đóng góp được kiểm duyệt tự động, để nguyên liệu phù hợp được duyệt nhanh hơn và nguyên liệu không phù hợp bị chặn ngay.

#### Acceptance Criteria

1. WHEN `IngredientViewSet.create()` được gọi với dữ liệu hợp lệ, THE IngredientViewSet SHALL gọi `moderate_text` với giá trị của trường `name` trước khi lưu vào database.
2. WHEN Moderation_Result là `"YES"`, THE IngredientViewSet SHALL lưu Ingredient với `status = "APPROVED"` và trả về HTTP 201 với thông báo `"Nguyên liệu đã được thêm thành công."`.
3. WHEN Moderation_Result là `"NO"`, THE IngredientViewSet SHALL trả về HTTP 400 với thông báo lỗi `"Tên nguyên liệu không phù hợp."` và KHÔNG lưu Ingredient vào database.
4. WHEN Moderation_Result là `"SUSPECT"`, THE IngredientViewSet SHALL lưu Ingredient với `status = "PENDING"` và trả về HTTP 201 với thông báo `"Nguyên liệu đã được gửi và đang chờ Admin xem xét."`.
5. IF `moderate_text` raise `ModerationTimeoutError` hoặc `ModerationServiceError`, THEN THE IngredientViewSet SHALL lưu Ingredient với `status = "PENDING"` và trả về HTTP 201 với thông báo `"Nguyên liệu đã được gửi và đang chờ duyệt."` — đảm bảo trải nghiệm người dùng không bị gián đoạn khi AI service gặp sự cố.

---

### Requirement 6: Xử lý lỗi và độ bền của AI Service

**User Story:** Là một developer, tôi muốn hệ thống xử lý gracefully khi Ollama không khả dụng, để API không bị crash và người dùng nhận được phản hồi có ý nghĩa.

#### Acceptance Criteria

1. THE AI_Moderator SHALL định nghĩa hai exception class tùy chỉnh: `ModerationTimeoutError` và `ModerationServiceError`, kế thừa từ `Exception`.
2. IF kết nối tới Ollama_API bị từ chối (connection refused), THEN THE AI_Moderator SHALL raise `ModerationServiceError` với thông báo mô tả lỗi kết nối.
3. THE AI_Moderator SHALL log tất cả các lỗi kết nối và lỗi parse response bằng Python `logging` module ở mức `ERROR` trước khi raise exception.
4. WHILE Ollama_API đang xử lý request, THE AI_Moderator SHALL không block các request khác của hệ thống (sử dụng timeout thay vì chờ vô hạn).
5. THE AI_Moderator SHALL sử dụng `requests` library với `stream=False` để nhận toàn bộ response trước khi parse, tránh lỗi partial response.

---

### Requirement 7: Cấu hình Ollama qua Django Settings

**User Story:** Là một developer, tôi muốn URL và tên model của Ollama được cấu hình qua Django settings, để dễ dàng thay đổi môi trường mà không cần sửa code.

#### Acceptance Criteria

1. THE AI_Moderator SHALL đọc Ollama base URL từ Django setting `OLLAMA_BASE_URL`, với giá trị mặc định là `"http://localhost:11434"` nếu setting không tồn tại.
2. THE AI_Moderator SHALL đọc tên model từ Django setting `OLLAMA_MODEL`, với giá trị mặc định là `"gemma4:e2b"` nếu setting không tồn tại.
3. THE AI_Moderator SHALL đọc giá trị timeout từ Django setting `OLLAMA_TIMEOUT`, với giá trị mặc định là `30` (giây) nếu setting không tồn tại.
4. WHERE `OLLAMA_BASE_URL` được cấu hình trong `settings.py`, THE AI_Moderator SHALL sử dụng giá trị đó thay vì giá trị mặc định.
