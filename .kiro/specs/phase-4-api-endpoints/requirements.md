# Tài liệu Yêu cầu

## Giới thiệu

Phase 4 xây dựng toàn bộ lớp API cho hệ thống KitchenMate Backend, bao gồm Serializers và ViewSets cho 7 nhóm chức năng: Accounts, Ingredients, Recipes, Kitchen (Pantry + ShoppingList), Recommendation, Social (Reviews + Collections) và Admin. Đây là lớp giao tiếp chính giữa Frontend và Backend, kế thừa trực tiếp từ các Models (Phase 2) và hệ thống xác thực (Phase 3) đã hoàn thành.

Tất cả API tuân theo định dạng response nhất quán `{ "success": true/false, "data": ..., "message": ... }`, sử dụng JWT Bearer Token để xác thực, và áp dụng PageNumberPagination (PAGE_SIZE=20) cho mọi list endpoint.

## Bảng chú giải

- **API_Server**: Hệ thống Django REST Framework xử lý toàn bộ HTTP request/response
- **Accounts_API**: Nhóm endpoint quản lý thông tin người dùng tại `/api/accounts/`
- **Ingredients_API**: Nhóm endpoint quản lý nguyên liệu tại `/api/ingredients/`
- **Recipes_API**: Nhóm endpoint quản lý công thức nấu ăn tại `/api/recipes/`
- **Kitchen_API**: Nhóm endpoint quản lý tủ lạnh và danh sách đi chợ tại `/api/kitchen/`
- **Recommendation_API**: Nhóm endpoint gợi ý món ăn tại `/api/recommendations/`
- **Social_API**: Nhóm endpoint đánh giá và bộ sưu tập tại `/api/social/`
- **Admin_API**: Nhóm endpoint quản trị hệ thống tại `/api/admin/`
- **Authenticated_User**: Người dùng đã đăng nhập với JWT token hợp lệ
- **Owner**: Người dùng là chủ sở hữu của resource (trường `user` trỏ đến request.user)
- **Staff_User**: Người dùng có `is_staff=True`
- **Pantry**: Tủ lạnh số lưu trữ nguyên liệu hiện có của người dùng
- **ShoppingList**: Danh sách đi chợ của người dùng
- **Collection**: Bộ sưu tập công thức cá nhân của người dùng
- **Tier3_Engine**: Thuật toán tính điểm gợi ý món ăn 3 tầng
- **COOK_NOW_Mode**: Chế độ gợi ý chỉ trả về công thức có đủ nguyên liệu (missing = 0)
- **ADD_MORE_Mode**: Chế độ gợi ý trả về công thức thiếu tối đa 2 nguyên liệu và score >= 0
- **Atomic_Transaction**: Giao dịch cơ sở dữ liệu dùng `django.db.transaction.atomic()` đảm bảo tính toàn vẹn

---

## Yêu cầu

### Yêu cầu 1: Accounts API — Thông tin người dùng

**User Story:** Là một người dùng, tôi muốn xem và cập nhật thông tin cá nhân của mình, đồng thời xem thống kê hoạt động của bất kỳ người dùng nào, để theo dõi hồ sơ và đóng góp của họ trên hệ thống.

#### Tiêu chí chấp nhận

1. WHEN một Authenticated_User gửi `GET /api/accounts/me/`, THE Accounts_API SHALL trả về thông tin đầy đủ của người dùng đó bao gồm id, email, full_name, avatar_url, bio, created_at với HTTP 200.
2. WHEN một Authenticated_User gửi `PUT /api/accounts/me/` hoặc `PATCH /api/accounts/me/` kèm dữ liệu hợp lệ, THE Accounts_API SHALL cập nhật các trường full_name, avatar_url, bio và trả về thông tin đã cập nhật với HTTP 200.
3. IF một Authenticated_User gửi `PUT /api/accounts/me/` với dữ liệu không hợp lệ, THEN THE Accounts_API SHALL trả về lỗi validation với HTTP 400 và trường `success: false`.
4. WHEN bất kỳ client nào gửi `GET /api/accounts/{id}/` với id hợp lệ của người dùng đang hoạt động, THE Accounts_API SHALL trả về thông tin profile công khai (id, full_name, avatar_url, bio, created_at) với HTTP 200.
5. IF client gửi `GET /api/accounts/{id}/` với id không tồn tại hoặc người dùng có `is_active=False`, THEN THE Accounts_API SHALL trả về lỗi với HTTP 404.
6. WHEN bất kỳ client nào gửi `GET /api/accounts/{id}/recipes/`, THE Accounts_API SHALL trả về danh sách công thức có `visibility=PUBLIC` của người dùng đó với pagination, sử dụng `select_related('user')` và `prefetch_related('recipe_ingredients__ingredient')`.
7. WHEN bất kỳ client nào gửi `GET /api/accounts/{id}/stats/`, THE Accounts_API SHALL trả về đối tượng thống kê gồm `recipe_count` (số công thức PUBLIC) và `total_saves` (tổng số lần công thức của người dùng đó được thêm vào Collection bởi bất kỳ ai) với HTTP 200.

---

### Yêu cầu 2: Ingredients API — Quản lý nguyên liệu

**User Story:** Là một người dùng, tôi muốn tìm kiếm nguyên liệu đã được duyệt và đóng góp nguyên liệu mới, để hệ thống ngày càng phong phú hơn. Là Admin, tôi muốn duyệt hoặc từ chối các nguyên liệu chờ duyệt.

#### Tiêu chí chấp nhận

1. WHEN bất kỳ client nào gửi `GET /api/ingredients/`, THE Ingredients_API SHALL trả về danh sách nguyên liệu có `status=APPROVED` với pagination, hỗ trợ filter theo `category` (PROTEIN/CARB/VEG/SPICE/STAPLE/OTHER).
2. WHEN bất kỳ client nào gửi `GET /api/ingredients/search/?q={keyword}`, THE Ingredients_API SHALL trả về tối đa 10 nguyên liệu có `status=APPROVED` mà tên chứa keyword (case-insensitive), không áp dụng pagination.
3. IF client gửi `GET /api/ingredients/search/` mà không có tham số `q` hoặc `q` rỗng, THEN THE Ingredients_API SHALL trả về danh sách rỗng với HTTP 200.
4. WHEN một Authenticated_User gửi `POST /api/ingredients/` với `name` và `category` hợp lệ, THE Ingredients_API SHALL tạo nguyên liệu mới với `status=PENDING`, gán `created_by=request.user` và trả về HTTP 201.
5. IF một Authenticated_User gửi `POST /api/ingredients/` với `name` đã tồn tại trong hệ thống, THEN THE Ingredients_API SHALL trả về lỗi với HTTP 400 và thông báo tên nguyên liệu đã tồn tại.
6. IF client chưa xác thực gửi `POST /api/ingredients/`, THEN THE Ingredients_API SHALL trả về lỗi với HTTP 401.
7. WHEN một Staff_User gửi `GET /api/admin/ingredients/pending/`, THE Admin_API SHALL trả về danh sách nguyên liệu có `status=PENDING` với pagination.
8. WHEN một Staff_User gửi `POST /api/admin/ingredients/{id}/approve/`, THE Admin_API SHALL cập nhật `status=APPROVED` cho nguyên liệu đó và trả về HTTP 200.
9. WHEN một Staff_User gửi `POST /api/admin/ingredients/{id}/reject/`, THE Admin_API SHALL cập nhật `status=REJECTED` cho nguyên liệu đó và trả về HTTP 200.
10. IF client không phải Staff_User gửi request đến `/api/admin/ingredients/`, THEN THE Admin_API SHALL trả về lỗi với HTTP 403.

---

### Yêu cầu 3: Recipes API — Quản lý công thức nấu ăn

**User Story:** Là một người dùng, tôi muốn tạo, chỉnh sửa, xóa và công khai công thức nấu ăn của mình, đồng thời xem công thức của người khác, để chia sẻ kiến thức nấu ăn với cộng đồng.

#### Tiêu chí chấp nhận

1. WHEN bất kỳ client nào gửi `GET /api/recipes/`, THE Recipes_API SHALL trả về danh sách công thức có `visibility=PUBLIC` với pagination, hỗ trợ filter theo `difficulty` (EASY/MEDIUM/HARD) và tìm kiếm theo `title` (case-insensitive), sử dụng `select_related('user')` và `prefetch_related('recipe_ingredients__ingredient', 'steps')`.
2. WHEN một Authenticated_User gửi `POST /api/recipes/` với title hợp lệ kèm danh sách `ingredients` và `steps`, THE Recipes_API SHALL tạo Recipe với `visibility=PRIVATE`, tạo các RecipeIngredient và RecipeStep liên quan trong cùng một transaction, và trả về HTTP 201.
3. IF một Authenticated_User gửi `POST /api/recipes/` thiếu trường `title`, THEN THE Recipes_API SHALL trả về lỗi validation với HTTP 400.
4. WHEN bất kỳ client nào gửi `GET /api/recipes/{id}/` với id công thức có `visibility=PUBLIC`, THE Recipes_API SHALL trả về chi tiết công thức bao gồm thông tin user, danh sách ingredients (kèm quantity, unit), danh sách steps (sắp xếp theo step_number), và `avg_rating` (điểm trung bình từ bảng Review) với HTTP 200.
5. WHEN Owner của công thức gửi `GET /api/recipes/{id}/` với công thức có `visibility=PRIVATE` hoặc `PENDING`, THE Recipes_API SHALL trả về chi tiết công thức đó với HTTP 200.
6. IF client không phải Owner gửi `GET /api/recipes/{id}/` với công thức có `visibility=PRIVATE` hoặc `PENDING`, THEN THE Recipes_API SHALL trả về lỗi với HTTP 404.
7. WHEN Owner gửi `PUT /api/recipes/{id}/` hoặc `PATCH /api/recipes/{id}/` với công thức có `visibility=PRIVATE`, THE Recipes_API SHALL cập nhật thông tin công thức và trả về HTTP 200.
8. IF Owner gửi `PUT /api/recipes/{id}/` hoặc `PATCH /api/recipes/{id}/` với công thức có `visibility=PENDING` hoặc `PUBLIC`, THEN THE Recipes_API SHALL trả về lỗi với HTTP 403 và thông báo chỉ được chỉnh sửa công thức ở trạng thái PRIVATE.
9. IF client không phải Owner gửi `PUT/PATCH /api/recipes/{id}/`, THEN THE Recipes_API SHALL trả về lỗi với HTTP 403.
10. WHEN Owner gửi `DELETE /api/recipes/{id}/`, THE Recipes_API SHALL xóa công thức và tất cả RecipeIngredient, RecipeStep liên quan (cascade), trả về HTTP 204.
11. IF client không phải Owner gửi `DELETE /api/recipes/{id}/`, THEN THE Recipes_API SHALL trả về lỗi với HTTP 403.
12. WHEN một Authenticated_User gửi `GET /api/recipes/my-recipes/`, THE Recipes_API SHALL trả về tất cả công thức của người dùng đó (mọi visibility: PRIVATE, PENDING, PUBLIC) với pagination.
13. WHEN Owner gửi `POST /api/recipes/{id}/publish/` với công thức có `visibility=PRIVATE`, THE Recipes_API SHALL chuyển `visibility=PENDING` và trả về HTTP 200 kèm thông báo công thức đang chờ duyệt (chuẩn bị cho AI moderation ở Phase 5).
14. IF Owner gửi `POST /api/recipes/{id}/publish/` với công thức không ở trạng thái `PRIVATE`, THEN THE Recipes_API SHALL trả về lỗi với HTTP 400 và thông báo trạng thái hiện tại không hợp lệ để gửi duyệt.

---

### Yêu cầu 4: Kitchen API — Tủ lạnh và Danh sách đi chợ

**User Story:** Là một người dùng, tôi muốn quản lý nguyên liệu trong tủ lạnh và danh sách đi chợ của mình, để theo dõi những gì tôi đang có và cần mua thêm.

#### Tiêu chí chấp nhận

1. WHEN một Authenticated_User gửi `GET /api/kitchen/pantry/`, THE Kitchen_API SHALL trả về danh sách Pantry items của người dùng đó (chỉ của họ, không lẫn với người khác) với pagination, sử dụng `select_related('ingredient')`.
2. WHEN một Authenticated_User gửi `POST /api/kitchen/pantry/` với `ingredient_id`, `quantity` và `unit` hợp lệ, THE Kitchen_API SHALL tạo Pantry item mới gán cho người dùng đó và trả về HTTP 201.
3. IF một Authenticated_User gửi `POST /api/kitchen/pantry/` với `ingredient_id` đã tồn tại trong Pantry của họ, THEN THE Kitchen_API SHALL trả về lỗi với HTTP 400 do vi phạm unique_together(user, ingredient).
4. WHEN Owner gửi `PUT /api/kitchen/pantry/{id}/` hoặc `PATCH /api/kitchen/pantry/{id}/` với dữ liệu hợp lệ, THE Kitchen_API SHALL cập nhật `quantity` và/hoặc `unit` của Pantry item đó và trả về HTTP 200.
5. WHEN Owner gửi `DELETE /api/kitchen/pantry/{id}/`, THE Kitchen_API SHALL xóa Pantry item đó và trả về HTTP 204.
6. IF client không phải Owner gửi `PUT/PATCH/DELETE /api/kitchen/pantry/{id}/`, THEN THE Kitchen_API SHALL trả về lỗi với HTTP 403.
7. WHEN một Authenticated_User gửi `GET /api/kitchen/shopping-list/`, THE Kitchen_API SHALL trả về danh sách ShoppingList items của người dùng đó với pagination, sử dụng `select_related('ingredient')`.
8. WHEN một Authenticated_User gửi `POST /api/kitchen/shopping-list/` với `ingredient_id`, `quantity` và `unit` hợp lệ, THE Kitchen_API SHALL tạo ShoppingList item mới với `is_purchased=False` và trả về HTTP 201.
9. WHEN Owner gửi `POST /api/kitchen/shopping-list/{id}/mark-purchased/`, THE Kitchen_API SHALL thực hiện Atomic_Transaction gồm: (1) đặt `is_purchased=True` cho ShoppingList item, (2) tìm hoặc tạo Pantry item tương ứng, (3) cộng dồn `quantity` vào Pantry item, và trả về HTTP 200 kèm thông tin Pantry item đã cập nhật.
10. IF Atomic_Transaction trong mark-purchased gặp lỗi bất kỳ, THEN THE Kitchen_API SHALL rollback toàn bộ thay đổi và trả về lỗi với HTTP 500.
11. WHEN Owner gửi `DELETE /api/kitchen/shopping-list/{id}/`, THE Kitchen_API SHALL xóa ShoppingList item đó và trả về HTTP 204.
12. IF client chưa xác thực gửi bất kỳ request nào đến `/api/kitchen/`, THEN THE Kitchen_API SHALL trả về lỗi với HTTP 401.

---

### Yêu cầu 5: Recommendation API — Gợi ý món ăn

**User Story:** Là một người dùng, tôi muốn nhận gợi ý món ăn dựa trên nguyên liệu hiện có trong tủ lạnh của mình, để quyết định nấu gì hôm nay hoặc biết cần mua thêm gì.

#### Tiêu chí chấp nhận

1. WHEN một Authenticated_User gửi `POST /api/recommendations/suggest/` với `mode=COOK_NOW`, THE Recommendation_API SHALL áp dụng Tier3_Engine và trả về danh sách công thức PUBLIC mà người dùng có đủ toàn bộ nguyên liệu không phải STAPLE (missing_count = 0), sắp xếp theo score giảm dần.
2. WHEN một Authenticated_User gửi `POST /api/recommendations/suggest/` với `mode=ADD_MORE`, THE Recommendation_API SHALL áp dụng Tier3_Engine và trả về danh sách công thức PUBLIC mà người dùng thiếu tối đa 2 nguyên liệu không phải STAPLE VÀ score >= 0, sắp xếp theo score giảm dần.
3. THE Tier3_Engine SHALL bỏ qua tất cả nguyên liệu có `category=STAPLE` khi tính toán missing_count và penalty score.
4. THE Tier3_Engine SHALL tính match score bằng cách cộng +20 điểm cho mỗi nguyên liệu không phải STAPLE mà người dùng có trong Pantry.
5. THE Tier3_Engine SHALL tính penalty score cho mỗi nguyên liệu không phải STAPLE còn thiếu theo bảng: PROTEIN=-100, CARB=-80, VEG=-50, OTHER=-25, SPICE=-10.
6. THE Tier3_Engine SHALL cộng thêm +50 điểm (Affinity Bonus) nếu công thức đó đã được lưu trong bất kỳ Collection nào của người dùng.
7. WHEN request `POST /api/recommendations/suggest/` có trường `exclude_ingredients` là danh sách id nguyên liệu, THE Recommendation_API SHALL loại trừ tất cả công thức có chứa bất kỳ nguyên liệu nào trong danh sách đó.
8. THE Recommendation_API SHALL trả về mỗi công thức kèm các trường: `score` (tổng điểm), `missing_ingredients` (danh sách nguyên liệu còn thiếu với tên và category).
9. THE Recommendation_API SHALL sử dụng `prefetch_related('recipe_ingredients__ingredient')` khi truy vấn công thức để tránh N+1 query.
10. IF một Authenticated_User gửi `POST /api/recommendations/suggest/` với `mode` không hợp lệ (không phải COOK_NOW hoặc ADD_MORE), THEN THE Recommendation_API SHALL trả về lỗi validation với HTTP 400.
11. IF client chưa xác thực gửi request đến `/api/recommendations/suggest/`, THEN THE Recommendation_API SHALL trả về lỗi với HTTP 401.

---

### Yêu cầu 6: Social API — Đánh giá và Bộ sưu tập

**User Story:** Là một người dùng, tôi muốn đánh giá công thức của người khác và lưu công thức yêu thích vào bộ sưu tập cá nhân, để chia sẻ trải nghiệm nấu ăn và tổ chức công thức theo sở thích.

#### Tiêu chí chấp nhận

1. WHEN bất kỳ client nào gửi `GET /api/social/recipes/{recipe_id}/reviews/`, THE Social_API SHALL trả về danh sách Review của công thức đó với pagination, sử dụng `select_related('user')`.
2. WHEN một Authenticated_User gửi `POST /api/social/recipes/{recipe_id}/reviews/` với `rating` (1-5) hợp lệ, THE Social_API SHALL tạo Review mới gán cho người dùng đó và trả về HTTP 201.
3. IF một Authenticated_User gửi `POST /api/social/recipes/{recipe_id}/reviews/` nhưng đã có Review cho công thức đó, THEN THE Social_API SHALL trả về lỗi với HTTP 400 do vi phạm unique_together(user, recipe).
4. IF một Authenticated_User gửi `POST /api/social/recipes/{recipe_id}/reviews/` với `rating` ngoài khoảng 1-5, THEN THE Social_API SHALL trả về lỗi validation với HTTP 400.
5. WHEN Owner gửi `PUT /api/social/reviews/{id}/` hoặc `PATCH /api/social/reviews/{id}/` với dữ liệu hợp lệ, THE Social_API SHALL cập nhật Review đó và trả về HTTP 200.
6. WHEN Owner gửi `DELETE /api/social/reviews/{id}/`, THE Social_API SHALL xóa Review đó và trả về HTTP 204.
7. IF client không phải Owner gửi `PUT/PATCH/DELETE /api/social/reviews/{id}/`, THEN THE Social_API SHALL trả về lỗi với HTTP 403.
8. WHEN một Authenticated_User gửi `GET /api/social/collections/`, THE Social_API SHALL trả về danh sách Collection của người dùng đó (chỉ của họ) với pagination.
9. WHEN một Authenticated_User gửi `POST /api/social/collections/` với `name` hợp lệ, THE Social_API SHALL tạo Collection mới gán cho người dùng đó và trả về HTTP 201.
10. WHEN Owner gửi `POST /api/social/collections/{id}/add-recipe/` với `recipe_id` hợp lệ của công thức PUBLIC, THE Social_API SHALL tạo CollectionRecipe liên kết và trả về HTTP 201.
11. IF Owner gửi `POST /api/social/collections/{id}/add-recipe/` với `recipe_id` đã có trong Collection đó, THEN THE Social_API SHALL trả về lỗi với HTTP 400 do vi phạm unique_together(collection, recipe).
12. WHEN Owner gửi `DELETE /api/social/collections/{id}/remove-recipe/` với `recipe_id` hợp lệ, THE Social_API SHALL xóa CollectionRecipe tương ứng và trả về HTTP 204.
13. WHEN Owner gửi `DELETE /api/social/collections/{id}/`, THE Social_API SHALL xóa Collection và tất cả CollectionRecipe liên quan (cascade) và trả về HTTP 204.
14. IF client không phải Owner gửi request ghi vào Collection của người khác, THEN THE Social_API SHALL trả về lỗi với HTTP 403.

---

### Yêu cầu 7: Admin API — Quản trị hệ thống

**User Story:** Là một Admin, tôi muốn duyệt hoặc từ chối công thức chờ duyệt và quản lý tài khoản người dùng, để đảm bảo chất lượng nội dung và an toàn cho cộng đồng.

#### Tiêu chí chấp nhận

1. WHEN một Staff_User gửi `GET /api/admin/recipes/pending/`, THE Admin_API SHALL trả về danh sách công thức có `visibility=PENDING` với pagination, sử dụng `select_related('user')`.
2. WHEN một Staff_User gửi `POST /api/admin/recipes/{id}/approve/`, THE Admin_API SHALL cập nhật `visibility=PUBLIC` cho công thức đó và trả về HTTP 200.
3. WHEN một Staff_User gửi `POST /api/admin/recipes/{id}/reject/`, THE Admin_API SHALL cập nhật `visibility=PRIVATE` cho công thức đó và trả về HTTP 200.
4. IF Staff_User gửi `POST /api/admin/recipes/{id}/approve/` hoặc `reject/` với id công thức không tồn tại, THEN THE Admin_API SHALL trả về lỗi với HTTP 404.
5. WHEN một Staff_User gửi `GET /api/admin/users/`, THE Admin_API SHALL trả về danh sách tất cả người dùng (kể cả is_active=False) với pagination.
6. WHEN một Staff_User gửi `POST /api/admin/users/{id}/block/`, THE Admin_API SHALL đặt `is_active=False` cho người dùng đó và trả về HTTP 200.
7. WHEN một Staff_User gửi `POST /api/admin/users/{id}/unblock/`, THE Admin_API SHALL đặt `is_active=True` cho người dùng đó và trả về HTTP 200.
8. IF Staff_User gửi `POST /api/admin/users/{id}/block/` hoặc `unblock/` với id người dùng không tồn tại, THEN THE Admin_API SHALL trả về lỗi với HTTP 404.
9. IF client không phải Staff_User gửi bất kỳ request nào đến `/api/admin/`, THEN THE Admin_API SHALL trả về lỗi với HTTP 403.

---

### Yêu cầu 8: Response Format và Query Optimization

**User Story:** Là một Frontend Developer, tôi muốn nhận response có định dạng nhất quán và API có hiệu năng tốt, để dễ dàng tích hợp và đảm bảo trải nghiệm người dùng mượt mà.

#### Tiêu chí chấp nhận

1. THE API_Server SHALL trả về tất cả response thành công theo định dạng `{ "success": true, "data": <payload>, "message": <string> }`.
2. THE API_Server SHALL trả về tất cả response lỗi theo định dạng `{ "success": false, "error": { "message": <string>, "details": <object|null> } }`.
3. THE API_Server SHALL áp dụng PageNumberPagination với PAGE_SIZE=20 cho tất cả list endpoint, trả về các trường `count`, `next`, `previous`, `results` trong `data`.
4. THE API_Server SHALL sử dụng `select_related()` cho tất cả ForeignKey relationship khi truy vấn list hoặc detail để tránh N+1 query.
5. THE API_Server SHALL sử dụng `prefetch_related()` cho tất cả ManyToMany và reverse ForeignKey relationship khi truy vấn list hoặc detail để tránh N+1 query.
6. WHEN API_Server nhận request với JWT token hết hạn, THE API_Server SHALL trả về lỗi với HTTP 401 và thông báo token đã hết hạn.
7. WHEN API_Server gặp lỗi server không mong muốn, THE API_Server SHALL trả về lỗi với HTTP 500 theo định dạng JSON chuẩn, không trả về raw Django error page.
