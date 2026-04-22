# Tài liệu Yêu cầu — Phase 9: Search & Filter

## Giới thiệu

Phase 9 bổ sung khả năng tìm kiếm và lọc nâng cao cho hệ thống KitchenMate Backend.
Hiện tại `RecipeFilter` chỉ hỗ trợ lọc theo `title` (icontains) và `difficulty`.
Phase này mở rộng bộ lọc công thức với `prep_time` range và tìm kiếm theo tên nguyên liệu,
đồng thời nâng cấp endpoint autocomplete nguyên liệu để đáp ứng tốt hơn nhu cầu người dùng.

Tất cả thay đổi được thực hiện trên nền Django REST Framework + `django-filter` + PostgreSQL,
không phá vỡ các API endpoint đã có từ Phase 1–8.

## Bảng thuật ngữ

- **RecipeFilter**: Class `django_filters.FilterSet` áp dụng cho `RecipeViewSet`, kiểm soát các tham số lọc/tìm kiếm trên danh sách công thức.
- **RecipeViewSet**: ViewSet DRF xử lý CRUD cho model `Recipe`, đặt tại `apps/recipes/views.py`.
- **IngredientViewSet**: ViewSet DRF xử lý danh sách và tìm kiếm nguyên liệu, đặt tại `apps/ingredients/views.py`.
- **Ingredient_Search_Endpoint**: Action `search` của `IngredientViewSet`, phục vụ tại `/api/ingredients/search/`.
- **prep_time**: Trường `IntegerField` trên model `Recipe`, đơn vị phút, giá trị tối thiểu là 1.
- **difficulty**: Trường `CharField` trên model `Recipe`, nhận một trong ba giá trị: `EASY`, `MEDIUM`, `HARD`.
- **icontains**: Toán tử tìm kiếm không phân biệt hoa/thường của Django ORM (`ILIKE` trong PostgreSQL).
- **Autocomplete**: Tính năng gợi ý tên nguyên liệu theo từ khóa nhập dở, trả về tối đa 10 kết quả.
- **Query_Param**: Tham số truyền qua URL dạng `?key=value`.

---

## Yêu cầu

### Yêu cầu 1: Lọc công thức theo độ khó

**User Story:** Là người dùng, tôi muốn lọc danh sách công thức theo độ khó, để tìm được món phù hợp với kỹ năng nấu ăn của mình.

#### Tiêu chí chấp nhận

1. WHEN người dùng gửi `GET /api/recipes/?difficulty=EASY`, THE RecipeViewSet SHALL chỉ trả về các công thức có `difficulty=EASY` và `visibility=PUBLIC`.
2. WHEN người dùng gửi `GET /api/recipes/?difficulty=MEDIUM`, THE RecipeViewSet SHALL chỉ trả về các công thức có `difficulty=MEDIUM` và `visibility=PUBLIC`.
3. WHEN người dùng gửi `GET /api/recipes/?difficulty=HARD`, THE RecipeViewSet SHALL chỉ trả về các công thức có `difficulty=HARD` và `visibility=PUBLIC`.
4. WHEN người dùng gửi `GET /api/recipes/` không kèm tham số `difficulty`, THE RecipeViewSet SHALL trả về tất cả công thức `visibility=PUBLIC` không phân biệt độ khó.
5. IF người dùng truyền giá trị `difficulty` không hợp lệ (không thuộc `EASY`, `MEDIUM`, `HARD`), THEN THE RecipeFilter SHALL trả về HTTP 400 kèm thông báo lỗi mô tả giá trị không hợp lệ.

---

### Yêu cầu 2: Lọc công thức theo khoảng thời gian chuẩn bị

**User Story:** Là người dùng, tôi muốn lọc công thức theo khoảng thời gian chuẩn bị, để tìm món ăn phù hợp với thời gian tôi có.

#### Tiêu chí chấp nhận

1. WHEN người dùng gửi `GET /api/recipes/?prep_time_min=15`, THE RecipeViewSet SHALL chỉ trả về các công thức có `prep_time >= 15` và `visibility=PUBLIC`.
2. WHEN người dùng gửi `GET /api/recipes/?prep_time_max=30`, THE RecipeViewSet SHALL chỉ trả về các công thức có `prep_time <= 30` và `visibility=PUBLIC`.
3. WHEN người dùng gửi `GET /api/recipes/?prep_time_min=10&prep_time_max=30`, THE RecipeViewSet SHALL chỉ trả về các công thức có `10 <= prep_time <= 30` và `visibility=PUBLIC`.
4. WHEN người dùng gửi `GET /api/recipes/` không kèm tham số `prep_time_min` hoặc `prep_time_max`, THE RecipeViewSet SHALL trả về tất cả công thức `visibility=PUBLIC` không lọc theo thời gian.
5. IF người dùng truyền `prep_time_min` hoặc `prep_time_max` là giá trị không phải số nguyên dương, THEN THE RecipeFilter SHALL trả về HTTP 400 kèm thông báo lỗi mô tả trường không hợp lệ.
6. WHILE `prep_time_min` và `prep_time_max` đều được cung cấp, THE RecipeFilter SHALL áp dụng cả hai điều kiện đồng thời (AND logic), không phải OR.

---

### Yêu cầu 3: Tìm kiếm công thức theo tiêu đề

**User Story:** Là người dùng, tôi muốn tìm kiếm công thức theo từ khóa trong tiêu đề, để nhanh chóng tìm được món ăn tôi đang nghĩ đến.

#### Tiêu chí chấp nhận

1. WHEN người dùng gửi `GET /api/recipes/?title=bún`, THE RecipeViewSet SHALL trả về tất cả công thức `visibility=PUBLIC` có `title` chứa chuỗi `bún` (không phân biệt hoa/thường).
2. WHEN người dùng gửi `GET /api/recipes/?title=BÚN`, THE RecipeViewSet SHALL trả về cùng kết quả như khi tìm `bún` (tìm kiếm không phân biệt hoa/thường).
3. WHEN người dùng gửi `GET /api/recipes/?title=` (chuỗi rỗng), THE RecipeViewSet SHALL trả về tất cả công thức `visibility=PUBLIC` không áp dụng lọc tiêu đề.
4. WHEN người dùng gửi `GET /api/recipes/?title=xyz_khong_ton_tai`, THE RecipeViewSet SHALL trả về danh sách rỗng với HTTP 200.

---

### Yêu cầu 4: Tìm kiếm công thức theo tên nguyên liệu

**User Story:** Là người dùng, tôi muốn tìm công thức theo tên nguyên liệu, để biết có thể nấu món gì với nguyên liệu tôi đang có.

#### Tiêu chí chấp nhận

1. WHEN người dùng gửi `GET /api/recipes/?ingredient=thịt bò`, THE RecipeViewSet SHALL trả về tất cả công thức `visibility=PUBLIC` có ít nhất một `RecipeIngredient` liên kết với `Ingredient` có `name` chứa chuỗi `thịt bò` (không phân biệt hoa/thường).
2. WHEN người dùng gửi `GET /api/recipes/?ingredient=` (chuỗi rỗng), THE RecipeViewSet SHALL trả về tất cả công thức `visibility=PUBLIC` không áp dụng lọc nguyên liệu.
3. WHEN người dùng gửi `GET /api/recipes/?ingredient=xyz_khong_ton_tai`, THE RecipeViewSet SHALL trả về danh sách rỗng với HTTP 200.
4. THE RecipeFilter SHALL tìm kiếm nguyên liệu qua quan hệ `recipe_ingredients__ingredient__name` với lookup `icontains`.
5. WHEN một công thức có nhiều nguyên liệu khớp với từ khóa, THE RecipeViewSet SHALL chỉ trả về công thức đó một lần (không trùng lặp).

---

### Yêu cầu 5: Kết hợp nhiều bộ lọc đồng thời

**User Story:** Là người dùng, tôi muốn kết hợp nhiều tiêu chí lọc cùng lúc, để thu hẹp kết quả tìm kiếm chính xác hơn.

#### Tiêu chí chấp nhận

1. WHEN người dùng gửi `GET /api/recipes/?difficulty=EASY&prep_time_max=30&title=gà`, THE RecipeViewSet SHALL trả về các công thức `visibility=PUBLIC` thỏa mãn đồng thời: `difficulty=EASY` VÀ `prep_time <= 30` VÀ `title` chứa `gà`.
2. WHEN người dùng gửi `GET /api/recipes/?ingredient=cà chua&prep_time_min=10&prep_time_max=60`, THE RecipeViewSet SHALL trả về các công thức `visibility=PUBLIC` thỏa mãn đồng thời: có nguyên liệu chứa `cà chua` VÀ `10 <= prep_time <= 60`.
3. THE RecipeFilter SHALL áp dụng tất cả các tham số lọc được cung cấp theo logic AND.
4. THE RecipeViewSet SHALL vẫn áp dụng phân trang (pagination) cho kết quả sau khi lọc.

---

### Yêu cầu 6: Autocomplete tìm kiếm nguyên liệu

**User Story:** Là người dùng, tôi muốn nhận gợi ý tên nguyên liệu khi gõ từ khóa, để nhanh chóng chọn đúng nguyên liệu mà không cần nhớ chính xác tên.

#### Tiêu chí chấp nhận

1. WHEN người dùng gửi `GET /api/ingredients/search/?q=thit`, THE Ingredient_Search_Endpoint SHALL trả về tối đa 10 nguyên liệu có `status=APPROVED` và `name` chứa chuỗi `thit` (không phân biệt hoa/thường), với HTTP 200.
2. WHEN người dùng gửi `GET /api/ingredients/search/?q=` (chuỗi rỗng hoặc chỉ khoảng trắng), THE Ingredient_Search_Endpoint SHALL trả về danh sách rỗng `[]` với HTTP 200.
3. WHEN người dùng gửi `GET /api/ingredients/search/?q=xyz_khong_ton_tai`, THE Ingredient_Search_Endpoint SHALL trả về danh sách rỗng `[]` với HTTP 200.
4. WHEN kết quả tìm kiếm có nhiều hơn 10 nguyên liệu khớp, THE Ingredient_Search_Endpoint SHALL chỉ trả về đúng 10 kết quả đầu tiên (sắp xếp theo `name` tăng dần).
5. THE Ingredient_Search_Endpoint SHALL chỉ trả về nguyên liệu có `status=APPROVED`, không trả về nguyên liệu `PENDING` hoặc `REJECTED`.
6. IF người dùng gửi request không kèm tham số `q`, THEN THE Ingredient_Search_Endpoint SHALL trả về danh sách rỗng `[]` với HTTP 200.
7. THE Ingredient_Search_Endpoint SHALL không yêu cầu xác thực (AllowAny), cho phép cả người dùng chưa đăng nhập sử dụng.

---

### Yêu cầu 7: Hiệu năng và tối ưu truy vấn

**User Story:** Là developer, tôi muốn các truy vấn search/filter được tối ưu, để API phản hồi nhanh ngay cả khi dữ liệu lớn.

#### Tiêu chí chấp nhận

1. THE RecipeViewSet SHALL sử dụng `select_related('user')` và `prefetch_related('recipe_ingredients__ingredient', 'steps')` trong `get_queryset()` để tránh N+1 query khi trả về danh sách công thức.
2. WHEN tìm kiếm theo `ingredient`, THE RecipeFilter SHALL sử dụng `distinct()` để loại bỏ công thức trùng lặp trong kết quả.
3. THE Ingredient_Search_Endpoint SHALL giới hạn kết quả ở mức tối đa 10 bản ghi bằng cách dùng slicing trên queryset (`[:10]`) trước khi serialize.
4. WHERE trường `name` của model `Ingredient` được tìm kiếm thường xuyên, THE Ingredient model SHALL có `db_index=True` hoặc index mặc định từ `unique=True` trên trường `name`.
