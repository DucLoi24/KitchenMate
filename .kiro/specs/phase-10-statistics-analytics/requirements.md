# Tài liệu Yêu cầu — Phase 10: Statistics & Analytics

## Giới thiệu

Phase 10 hoàn thiện tính năng thống kê và phân tích cho hệ thống KitchenMate Backend.
Hiện tại endpoint `GET /api/accounts/{id}/stats/` đã tồn tại nhưng chỉ trả về `recipe_count` và `total_saves` — chưa đầy đủ.
Phase này mở rộng User Stats với thêm `total_likes` (lượt thích), đồng thời bổ sung Recipe Stats endpoint mới với `average_rating`, `view_count` và `save_count`.

Để hỗ trợ `view_count`, cần thêm field `view_count` vào model `Recipe` và tạo migration tương ứng.
Tất cả thay đổi được thực hiện trên nền Django REST Framework + PostgreSQL, không phá vỡ các API endpoint đã có từ Phase 1–9.

## Bảng thuật ngữ

- **Stats_Service**: Module `apps/accounts/services.py` (hoặc `apps/recipes/services.py`) chứa logic tính toán thống kê, tách biệt khỏi views.
- **UserStatsView**: View hiện có tại `apps/accounts/views.py`, phục vụ `GET /api/accounts/{id}/stats/`.
- **RecipeStatsView**: View mới cần tạo, phục vụ `GET /api/recipes/{id}/stats/`.
- **recipe_count**: Tổng số công thức có `visibility=PUBLIC` mà user đã đăng.
- **total_likes**: Tổng số lần bất kỳ công thức nào của user được thêm vào `CollectionRecipe` (tức là được "lưu" bởi người dùng khác).
- **average_rating**: Điểm đánh giá trung bình của một công thức, tính từ tất cả `Review` liên kết, làm tròn 2 chữ số thập phân.
- **view_count**: Số lần công thức được xem qua endpoint `GET /api/recipes/{id}/`, lưu trực tiếp trên model `Recipe`.
- **save_count**: Số lần công thức được thêm vào bất kỳ `Collection` nào, đếm từ bảng `CollectionRecipe`.
- **review_count**: Tổng số lượt đánh giá (Review) của một công thức.
- **CollectionRecipe**: Bảng trung gian `(collection, recipe)` với unique constraint, mỗi bản ghi đại diện cho một lần lưu công thức vào collection.
- **N+1 Query**: Vấn đề hiệu năng khi ORM thực hiện 1 query lấy danh sách rồi N query con cho từng phần tử — phải tránh bằng `select_related`/`prefetch_related`/`annotate`.

---

## Yêu cầu

### Yêu cầu 1: Mở rộng User Stats — Thêm total_likes

**User Story:** Là người dùng, tôi muốn xem tổng số lượt thích (lượt lưu vào Collection) mà các công thức của mình nhận được, để biết mức độ được cộng đồng yêu thích.

#### Tiêu chí chấp nhận

1. WHEN người dùng gửi `GET /api/accounts/{id}/stats/`, THE UserStatsView SHALL trả về trường `total_likes` là tổng số bản ghi `CollectionRecipe` có `recipe__user = user` (tức là tổng số lần công thức của user được lưu vào bất kỳ Collection nào).
2. WHEN user chưa có công thức nào hoặc chưa có công thức nào được lưu, THE UserStatsView SHALL trả về `total_likes = 0`.
3. THE UserStatsView SHALL tính `total_likes` bằng một query duy nhất sử dụng `COUNT` aggregation, không dùng vòng lặp Python.
4. WHEN người dùng gửi `GET /api/accounts/{id}/stats/`, THE UserStatsView SHALL trả về response bao gồm đầy đủ các trường: `recipe_count`, `total_likes`, `average_rating`.
5. THE UserStatsView SHALL không yêu cầu xác thực (AllowAny), cho phép xem stats của bất kỳ user nào đang active.
6. IF user với `{id}` không tồn tại hoặc `is_active=False`, THEN THE UserStatsView SHALL trả về HTTP 404 kèm thông báo lỗi.

---

### Yêu cầu 2: Mở rộng User Stats — Thêm average_rating

**User Story:** Là người dùng, tôi muốn xem điểm đánh giá trung bình của tất cả công thức mình đã đăng, để có cái nhìn tổng quan về chất lượng nội dung của mình.

#### Tiêu chí chấp nhận

1. WHEN người dùng gửi `GET /api/accounts/{id}/stats/`, THE UserStatsView SHALL trả về trường `average_rating` là điểm trung bình của tất cả `Review.rating` trên tất cả công thức `visibility=PUBLIC` của user, làm tròn 2 chữ số thập phân.
2. WHEN user chưa có công thức nào được đánh giá, THE UserStatsView SHALL trả về `average_rating = null`.
3. THE UserStatsView SHALL tính `average_rating` bằng Django ORM `Avg` aggregation, không tính thủ công trong Python.
4. WHILE user có nhiều công thức với nhiều reviews, THE UserStatsView SHALL tính average_rating trên toàn bộ reviews của tất cả công thức (không phải trung bình của các trung bình).

---

### Yêu cầu 3: Thêm field view_count vào Recipe model

**User Story:** Là developer, tôi muốn theo dõi số lượt xem của từng công thức, để cung cấp dữ liệu analytics chính xác.

#### Tiêu chí chấp nhận

1. THE Recipe_Model SHALL có thêm field `view_count` kiểu `PositiveIntegerField` với `default=0`, không cho phép `null`.
2. THE Stats_Service SHALL tạo migration Django để thêm field `view_count` vào bảng `recipes` trong PostgreSQL.
3. WHEN field `view_count` được thêm vào, THE Recipe_Model SHALL đảm bảo tất cả bản ghi hiện có có `view_count = 0` (default migration).
4. THE Recipe_Model SHALL không thay đổi bất kỳ field nào khác đã có — chỉ thêm `view_count`.

---

### Yêu cầu 4: Tăng view_count khi xem chi tiết công thức

**User Story:** Là người dùng, tôi muốn mỗi lần xem chi tiết công thức được ghi nhận, để thống kê lượt xem phản ánh đúng thực tế.

#### Tiêu chí chấp nhận

1. WHEN người dùng gửi `GET /api/recipes/{id}/` và công thức có `visibility=PUBLIC`, THE RecipeViewSet SHALL tăng `view_count` của công thức đó lên 1 bằng `F()` expression (atomic increment, tránh race condition).
2. WHEN người dùng gửi `GET /api/recipes/{id}/` và công thức có `visibility=PRIVATE` hoặc `PENDING`, THE RecipeViewSet SHALL không tăng `view_count` (chỉ đếm lượt xem công khai).
3. THE RecipeViewSet SHALL sử dụng `Recipe.objects.filter(pk=pk).update(view_count=F('view_count') + 1)` hoặc tương đương để đảm bảo atomic update, không dùng `recipe.view_count += 1; recipe.save()`.
4. WHEN `view_count` được tăng, THE RecipeViewSet SHALL không trả về giá trị `view_count` đã tăng trong response của `retrieve` action (để tránh thêm query refresh) — giá trị `view_count` trong response có thể lệch 1 so với thực tế.

---

### Yêu cầu 5: Recipe Stats Endpoint

**User Story:** Là người dùng, tôi muốn xem thống kê chi tiết của một công thức cụ thể (rating, lượt xem, lượt lưu), để đánh giá mức độ phổ biến của công thức đó.

#### Tiêu chí chấp nhận

1. THE RecipeStatsView SHALL phục vụ endpoint `GET /api/recipes/{id}/stats/` với permission `AllowAny`.
2. WHEN người dùng gửi `GET /api/recipes/{id}/stats/` cho công thức `visibility=PUBLIC`, THE RecipeStatsView SHALL trả về HTTP 200 với response body:
   ```json
   {
     "success": true,
     "data": {
       "recipe_id": "<uuid>",
       "average_rating": 4.25,
       "review_count": 8,
       "view_count": 142,
       "save_count": 23
     }
   }
   ```
3. WHEN công thức có `visibility=PRIVATE` hoặc `PENDING` và người dùng không phải owner, THE RecipeStatsView SHALL trả về HTTP 404.
4. WHEN công thức có `visibility=PRIVATE` hoặc `PENDING` và người dùng là owner, THE RecipeStatsView SHALL trả về HTTP 200 với đầy đủ stats.
5. IF công thức với `{id}` không tồn tại, THEN THE RecipeStatsView SHALL trả về HTTP 404 kèm thông báo lỗi.
6. WHEN công thức chưa có review nào, THE RecipeStatsView SHALL trả về `average_rating = null` và `review_count = 0`.
7. THE RecipeStatsView SHALL tính tất cả các trường thống kê bằng một query duy nhất sử dụng `annotate` với `Avg`, `Count` aggregation — không thực hiện nhiều query riêng lẻ.

---

### Yêu cầu 6: Tối ưu hiệu năng Stats Queries

**User Story:** Là developer, tôi muốn các query thống kê được tối ưu, để API phản hồi trong vòng 2 giây ngay cả khi dữ liệu lớn.

#### Tiêu chí chấp nhận

1. THE UserStatsView SHALL tính toàn bộ `recipe_count`, `total_likes`, `average_rating` trong tối đa 3 database queries.
2. THE RecipeStatsView SHALL tính toàn bộ `average_rating`, `review_count`, `view_count`, `save_count` trong tối đa 2 database queries.
3. THE Stats_Service SHALL sử dụng Django ORM aggregation (`Count`, `Avg`, `Sum`) thay vì Python-level iteration để tính toán thống kê.
4. WHEN endpoint stats được gọi, THE Stats_Service SHALL hoàn thành và trả về response trong vòng 2 giây với dataset lên đến 10,000 công thức và 100,000 reviews.
5. THE Recipe_Model SHALL có `db_index=True` trên field `view_count` nếu cần thiết cho sorting/filtering trong tương lai — tuy nhiên Phase 10 chưa yêu cầu index này.

---

### Yêu cầu 7: Tính nhất quán dữ liệu thống kê

**User Story:** Là người dùng, tôi muốn số liệu thống kê luôn chính xác và nhất quán với dữ liệu thực tế trong hệ thống.

#### Tiêu chí chấp nhận

1. THE UserStatsView SHALL chỉ đếm công thức có `visibility=PUBLIC` trong `recipe_count` — không đếm PRIVATE hoặc PENDING.
2. THE UserStatsView SHALL đếm tất cả `CollectionRecipe` liên kết với công thức của user trong `total_likes`, bao gồm cả công thức PRIVATE/PENDING (vì chúng có thể đã được lưu trước khi chuyển trạng thái).
3. WHEN một `CollectionRecipe` bị xóa (user bỏ lưu công thức), THE total_likes SHALL giảm tương ứng trong lần query tiếp theo (real-time, không cache).
4. WHEN một `Review` bị xóa, THE average_rating SHALL được tính lại chính xác trong lần query tiếp theo.
5. THE view_count SHALL chỉ tăng khi request đến `GET /api/recipes/{id}/` thành công (HTTP 200) — không tăng khi trả về 404 hoặc 403.

---

### Yêu cầu 8: Property-Based Testing với Hypothesis

**User Story:** Là developer, tôi muốn các correctness properties của stats được kiểm tra tự động với nhiều bộ dữ liệu khác nhau, để đảm bảo tính đúng đắn của logic tính toán.

#### Tiêu chí chấp nhận

1. THE Test_Suite SHALL sử dụng Hypothesis để kiểm tra property: với bất kỳ tập hợp N công thức PUBLIC của user, `recipe_count` phải bằng đúng N.
2. THE Test_Suite SHALL sử dụng Hypothesis để kiểm tra property: với bất kỳ tập hợp M lượt lưu vào Collection, `total_likes` phải bằng đúng M.
3. THE Test_Suite SHALL sử dụng Hypothesis để kiểm tra property: với bất kỳ tập hợp ratings hợp lệ (1–5), `average_rating` phải nằm trong khoảng `[1.0, 5.0]` và bằng `sum(ratings) / len(ratings)` làm tròn 2 chữ số.
4. THE Test_Suite SHALL sử dụng Hypothesis để kiểm tra property: `view_count` sau K lần gọi `GET /api/recipes/{id}/` phải tăng đúng K đơn vị so với giá trị ban đầu.
5. THE Test_Suite SHALL sử dụng Hypothesis để kiểm tra property: `save_count` trong Recipe Stats phải bằng đúng số bản ghi `CollectionRecipe` liên kết với recipe đó.
6. THE Test_Suite SHALL chạy tối thiểu 50 examples cho mỗi property test (có thể giảm từ 100 do DB overhead).
