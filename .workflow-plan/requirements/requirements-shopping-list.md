# Requirements: Shopping List Page

## 1. Goals

- Xây dựng Shopping List page hoàn chỉnh cho phép user quản lý danh sách đi chợ
- Hỗ trợ thêm nguyên liệu từ nhiều nguồn: recipe detail, search bar trong page
- Cho phép mark purchased với atomic transaction đồng bộ vào Pantry + animation
- Hỗ trợ undo mark purchased (hoàn tác trạng thái đã mua)
- Hỗ trợ xóa tất cả item đã mua khỏi danh sách
- Giao diện responsive mobile-first, UI/UX theo frontend-design skill

## 2. Scope

### IN

- **Xem danh sách**: List toàn bộ ShoppingList items của user (chưa mua + đã mua)
- **Thêm item**: Từ search bar trong page (tự tạo ingredient nếu chưa tồn tại)
- **Thêm item từ recipe detail**: Nút "Thêm vào danh sách đi chợ" bên cạnh nguyên liệu trong RecipeDetailPage
- **Sửa item**: Cập nhật quantity và unit của item (không áp dụng cho item đã mua)
- **Xóa item**: Xóa một item khỏi danh sách
- **Mark purchased**: Đánh dấu đã mua → atomic transaction cộng dồn vào Pantry + animation
- **Undo purchased**: Bỏ đánh dấu đã mua → atomic transaction trừ khỏi Pantry
- **Xóa tất cả đã mua**: Xóa toàn bộ items có is_purchased=True
- **Loading state**: Skeleton loading khi fetch data
- **Error state**: Toast notification khi API fail
- **Empty state**: Hướng dẫn cách thêm item đầu tiên

### OUT

- Không có tab riêng cho "đã mua" — hiển thị chung danh sách với visual distinction
- Không tự động xóa item sau khi mark purchased
- Không export/share shopping list

## 3. Execution Order / Dependencies

1. Tạo ShoppingPage component + routing trong App.jsx
2. Xây dựng UI layout: header với "Xóa tất cả đã mua", danh sách items, empty state
3. Implement `getShoppingList` → fetch + display với skeleton loading
4. Implement `addToShoppingList` → search bar (tạo ingredient mới nếu chưa có)
5. Implement `updateShoppingItem` → sửa quantity/unit inline
6. Implement `removeFromShoppingList` → xóa item
7. Implement `markAsPurchased` → call API + animation đồng bộ
8. Implement `markAsUnpurchased` → undo mark purchased (nếu backend đã có `mark-unpurchased` endpoint)
9. Implement "Xóa tất cả đã mua" → confirm dialog + batch delete
10. Thêm nút "Thêm vào danh sách đi chợ" trong RecipeDetailPage

## 4. Happy Path

WHEN user mở `/shopping-list` AND đã đăng nhập THEN
  - Show skeleton loading
  - Fetch `GET /kitchen/shopping-list/`
  - On success: hiển thị danh sách items, phân tách chưa mua / đã mua
  - On error: hiển thị toast error "Không thể tải danh sách. Vui lòng thử lại."

WHEN user nhấn vào search bar (input nguyên liệu) THEN
  - Hiển thị dropdown gợi ý ingredient có sẵn trong hệ thống (search theo tên)
  - User chọn ingredient → điền form quantity + unit
  - User nhấn "Thêm" → `POST /kitchen/shopping-list/`
  - On success: toast "Đã thêm vào danh sách" + refresh list
  - On error: toast error

WHEN user thêm nguyên liệu NOT FOUND in system THEN
  - Backend tự động tạo ingredient mới với tên đó
  - Thêm vào shopping list như bình thường

WHEN user nhấn checkbox "Đã mua" trên item AND item.chuaMu THEN
  - Disable checkbox + show spinner nhỏ
  - Call `POST /kitchen/shopping-list/{id}/mark-purchased/`
  - On success:
    - Show toast "Đã thêm vào tủ lạnh" với animation icon tủ lạnh
    - Item chuyển sang visual style đã mua (opacity reduced, strikethrough text)
    - Item được di chuyển xuống cuối danh sách (hoặc section riêng)
  - On error: toast error + revert checkbox state

WHEN user nhấn lại checkbox (undo) trên item AND item.daMu THEN
  - Call `POST /kitchen/shopping-list/{id}/mark-unpurchased/`
  - On success:
    - Show toast "Đã bỏ khỏi tủ lạnh"
    - Item quay lại visual style chưa mua
    - Item được di chuyển về danh sách chưa mua
  - On error: toast error

WHEN user nhấn icon delete trên item THEN
  - Item được remove khỏi danh sách (optimistic UI)
  - Call `DELETE /kitchen/shopping-list/{id}/`
  - On error: revert item + toast error

WHEN user nhấn nút "Xóa tất cả đã mua" THEN
  - Show confirmation dialog: "Bạn có chắc muốn xóa tất cả nguyên liệu đã mua?"
  - User confirm → call `DELETE` cho từng item đã mua
  - On success: toast "Đã xóa {n} nguyên liệu đã mua"
  - On partial error: toast error + giữ lại items không xóa được

## 5. State Transitions

- **Item.chuaMu → Item.daMu**: User nhấn checkbox "Đã mua" → `mark_purchased` API → animate sang Pantry
- **Item.daMu → Item.chuaMu**: User nhấn lại checkbox (undo) → `mark_unpurchased` API → animate ra khỏi Pantry
- **Item.chuaMu → Deleted**: User nhấn delete → `removeFromShoppingList` API → remove khỏi list
- **Item.daMu → Deleted**: User nhấn delete → `removeFromShoppingList` API → remove khỏi list
- **Empty → HasItems**: User thêm item đầu tiên → toast "Đã thêm" → list hiển thị items
- **HasItems → Empty**: User xóa hết items → empty state hiển thị

## 6. Validation Rules

- **Quantity**: Phải là số dương (> 0). Nếu <= 0 → reject, show error "Số lượng phải lớn hơn 0"
- **Unit**: String 1-20 ký tự. Không empty.
- **Ingredient name** (khi thêm mới): 1-100 ký tự. Không empty.
- **Pre-purchased item**: Không cho sửa quantity/unit (disable input).
- **Quantity editing**: Chỉ áp dụng cho item chưa mua.

## 7. Edge Cases

IF user nhấn "Đã mua" AND network timeout THEN
  - Show error toast "Mất kết nối. Vui lòng thử lại."
  - Revert checkbox UI state

IF user nhấn "Xóa tất cả đã mua" AND có 0 item đã mua THEN
  - Disable button "Xóa tất cả đã mua" (không clickable)

IF user thêm ingredient đã tồn tại trong shopping list THEN
  - Backend sẽ tạo duplicate (vì không có unique constraint)
  - frontendKHÔNG validate trùng lặp (backend xử lý)

IF user refresh page khi đang có pending API THEN
  - Pending request có thể thành công hoặc thất bại không predictable
  - Khi reload page, fetch lại từ server để đảm bảo state đúng

IF user nhấn undo NHƯNG ingredient đã bị xóa khỏi Pantry (quantity = 0 hoặc không còn) THEN
  - Backend vẫn xử lý bình thường, set is_purchased=False
  - Pantry item có thể không tồn tại → undo vẫn OK

## 8. Rare Scenarios

IF user thêm item với tên ingredient dài (> 100 ký tự) THEN
  - Backend reject với 400 error
  - Frontend hiển thị error message từ API

IF xóa tất cả đã mua NHƯNG API fail giữa chừng THEN
  - Partial delete: items đã gọi DELETE sẽ bị xóa
  - Items chưa xóa vẫn còn trong list
  - Toast error: "Xóa thất bại một số nguyên liệu"

IF ingredient trong shopping list đã bị xóa khỏi hệ thống (cascade delete) THEN
  - Backend trả về 404 khi fetch
  - Frontend hiển thị "[Nguyên liệu đã bị xóa]" thay vì ingredient_name
  - Item vẫn có thể xóa được

## 9. Error States

WHEN API fetch shopping list fail THEN
  - Skeleton loading biến mất
  - Hiển thị empty state với icon và message: "Không thể tải danh sách"
  - Nút "Thử lại" để retry

WHEN API add item fail THEN
  - Toast error: "Không thể thêm nguyên liệu. Vui lòng thử lại."

WHEN API mark purchased fail THEN
  - Revert checkbox UI state
  - Toast error: "Không thể cập nhật. Vui lòng thử lại."

WHEN API delete item fail THEN
  - Revert item vào danh sách (optimistic UI rollback)
  - Toast error: "Không thể xóa nguyên liệu. Vui lòng thử lại."

## 10. Priority

- **P0**: Xem danh sách + thêm item + mark purchased + animation
- **P1**: Sửa quantity/unit + xóa item + undo + xóa tất cả đã mua
- **P2**: Thêm từ recipe detail button

## 11. Non-Functional Requirements

- **Performance**: Page load < 2s, optimistic UI cho delete
- **UX**: Loading skeleton cho list, toast cho success/error
- **Mobile-first**: Item card fit 1 hand interaction

## 12. Input/Output Schemas

**GET /kitchen/shopping-list/**
```json
Response: {
  "success": true,
  "data": [
    {
      "id": 1,
      "ingredient": 5,
      "ingredient_name": "Thịt bò",
      "quantity": 500,
      "unit": "gram",
      "is_purchased": false,
      "created_at": "2026-05-13T10:00:00Z"
    }
  ]
}
```

**POST /kitchen/shopping-list/**
```json
Request: { "ingredient": 5, "quantity": 500, "unit": "gram" }
Response: { "success": true, "data": {...}, "message": "Da them vao danh sach di cho." }
```

**POST /kitchen/shopping-list/{id}/mark-purchased/**
```json
Response: { "success": true, "message": "Da danh dau da mua va cap nhat tu lanh.", "data": {...} }
```

**POST /kitchen/shopping-list/{id}/mark-unpurchased/**
```json
Response: { "success": true, "message": "Da bo danh dau da mua.", "data": {...} }
```

## 13. Success Criteria

- User có thể xem toàn bộ shopping list (chưa mua + đã mua)
- User có thể thêm nguyên liệu vào shopping list từ search bar
- User có thể đánh dấu đã mua → nguyên liệu tự động cộng vào Pantry với animation
- User có thể undo đánh dấu đã mua → nguyên liệu được trừ khỏi Pantry
- User có thể xóa từng item hoặc xóa tất cả item đã mua
- User có thể sửa quantity/unit của item chưa mua
- User có thể thêm nguyên liệu từ recipe detail page
- Giao diện responsive mobile-first
- Loading skeleton + toast notifications hoạt động đúng