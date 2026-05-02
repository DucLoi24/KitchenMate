# Requirements: Food Suggestion (SuggestionPage)

## 1. Goals

- Cung cấp trang gợi ý món ăn đầy đủ dựa trên nguyên liệu trong pantry của user
- Cho phép filter theo mode (COOK_NOW / ADD_MORE), thời gian nấu, category, và loại trừ nguyên liệu
- Hiển thị danh sách recipe sorted by score với badge điểm
- Cho phép preview recipe trong bottom sheet với khả năng thêm missing ingredients vào shopping list

---

## 2. Scope

### IN

- SuggestionPage component tại `src/pages/suggestion/SuggestionPage.jsx`
- Route `/suggest` protected bởi AuthGuard (update App.jsx)
- Segmented control (COOK_NOW | ADD_MORE mode)
- Cook time filter (tab bar: "< 15 phút", "15-30 phút", "30-60 phút", "> 60 phút")
- Category filter (multi-select chips)
- Exclude ingredients filter (search input + chips bên dưới, không giới hạn số lượng)
- Recipe list với pagination, sorted by score (high → low)
- Score badge hiển thị điểm cho mỗi recipe
- Bottom sheet preview khi tap recipe (full recipe info + "Xem chi tiết" button)
- "Thêm vào shopping list" → modal popup chọn nguyên liệu (tên + số lượng input + đơn vị dropdown)
- Modal chỉ hiện nguyên liệu user CHƯA có trong pantry
- Skeleton loading state
- Empty state (no pantry → prompt thêm pantry)
- Error state (API fail → retry button)
- No results state (suggest switch mode COOK_NOW ↔ ADD_MORE)
- Auto-refresh khi pantry thay đổi (React Query cache invalidation on pantry mutations)

### OUT

- Không implement real-time WebSocket
- Không có sort options khác ngoài score (high → low)
- Không giới hạn số lượng exclude ingredients
- Không implement polling mechanism

---

## 3. Execution Order / Dependencies

1. **Setup**: Tạo folder `src/pages/suggestion/` và import SuggestionPage vào App.jsx
2. **API Integration**: Sử dụng `useSuggestion` hook với params (mode, excludeIngredients, cookTime, categories, page)
3. **UI Components**: Xây dựng SuggestionPage với các sub-components (SegmentedControl, FilterSection, RecipeList, BottomSheet, AddToShoppingModal)
4. **Interaction**: Implement bottom sheet preview, add to shopping list flow
5. **Edge Cases**: Empty/error/no-results states
6. **Testing**: Manual test các flows + verify React Query invalidation

---

## 4. Happy Path

WHEN user navigates to `/suggest` AND user is authenticated AND pantry has ingredients THEN
  - Load suggestions immediately with COOK_NOW mode
  - Show loading skeleton for first 200ms
  - Display recipe list sorted by score (high → low)
  - Each recipe card shows: image, name, cook time, score badge, missing ingredient count
  - Show pagination controls at bottom

WHEN user switches mode from COOK_NOW to ADD_MORE THEN
  - Keep all other filters (category, cook time, exclude ingredients) unchanged
  - Re-fetch suggestions with new mode
  - Show loading skeleton during fetch
  - Update recipe list with new results

WHEN user taps on a recipe card THEN
  - Open bottom sheet with full recipe preview
  - Bottom sheet shows: image, name, description, cook time, servings, ingredients list, missing ingredients, score
  - Display "Xem chi tiết" button at bottom
  - Display "Thêm vào shopping list" button (if missing ingredients exist)

WHEN user clicks "Xem chi tiết" on bottom sheet THEN
  - Navigate to `/recipe/{id}`
  - Close bottom sheet

WHEN user clicks "Thêm vào shopping list" on bottom sheet THEN
  - Open modal dialog (center screen)
  - List all missing ingredients (name + quantity input + unit dropdown)
  - Hide ingredients that user already has in pantry
  - Show "Hủy" and "Thêm vào danh sách" buttons

WHEN user fills quantity/unit and clicks "Thêm vào danh sách" THEN
  - Validate: quantity > 0, unit is selected
  - Call shopping list API to add items
  - On success: close modal, show success toast "Đã thêm vào danh sách mua sắm"
  - On error: show error message in modal

WHEN user changes cook time filter (tab bar) THEN
  - Re-fetch suggestions with selected cook time range
  - Keep mode and other filters unchanged

WHEN user toggles category chips THEN
  - Re-fetch suggestions with selected categories
  - Support multi-select (user can select multiple categories)
  - Keep mode and other filters unchanged

WHEN user types in exclude ingredients search THEN
  - Show dropdown with matching ingredients from database
  - User selects ingredient → add as chip below input
  - Chip has × button to remove
  - Re-fetch suggestions with updated exclude list

WHEN user clicks pagination page number THEN
  - Re-fetch suggestions for that page
  - Scroll to top of recipe list
  - Update URL query param if needed

---

## 5. State Transitions

- **Loading** → **Content**: Initial page load with skeleton
- **Loading** → **Error**: API call failed
- **Content** → **Loading**: User changes filter (new API call)
- **Content** → **Empty**: No pantry ingredients
- **Content** → **NoResults**: Filters return empty
- **BottomSheet** → **Closed**: User taps outside or close button
- **Modal** → **Closed**: User cancels or successfully adds items

---

## 6. Validation Rules

- Mode must be "COOK_NOW" or "ADD_MORE" (enum)
- Cook time filter must be one of: "lt15", "15-30", "30-60", "gt60", or null (no filter)
- Exclude ingredients must be array of ingredient IDs (integers)
- Page must be positive integer ≥ 1
- Quantity input must be > 0 when submitting
- Unit must be selected from predefined list

---

## 7. Edge Cases

IF user navigates to `/suggest` AND pantry is empty THEN
  - Show empty state with icon, title "Tủ lạnh trống", description "Thêm nguyên liệu vào tủ lạnh để nhận gợi ý món ăn phù hợp"
  - Display "Đến tủ lạnh" button → navigate to `/pantry`

IF user navigates to `/suggest` AND user is not authenticated THEN
  - Redirect to login page (handled by AuthGuard)

IF API returns 401 unauthorized THEN
  - Redirect to login page
  - Clear auth state

IF API returns 500 server error THEN
  - Show error state with icon, message "Không thể tải gợi ý", retry button
  - Retry button triggers re-fetch

IF network timeout occurs THEN
  - Show error toast "Kết nối bị gián đoạn. Vui lòng thử lại."
  - Show retry button

IF exclude ingredient search returns no results THEN
  - Show "Không tìm thấy nguyên liệu" in dropdown

IF user removes last exclude ingredient chip THEN
  - Re-fetch suggestions without that exclusion

IF pagination returns page > total pages THEN
  - Clamp to last available page

IF user clicks "Thêm vào danh sách" with quantity = 0 THEN
  - Show validation error "Số lượng phải lớn hơn 0"
  - Prevent submission

---

## 8. Rare Scenarios

IF recipe has > 10 missing ingredients THEN
  - Show first 10 with " và X nguyên liệu khác" text
  - Full list visible in bottom sheet

IF user rapidly switches filters (debounce needed) THEN
  - Debounce API calls by 300ms
  - Cancel in-flight requests when new filter applied

IF suggestionApi.getSuggestions returns very slow response (> 10s) THEN
  - Show timeout error after 10s
  - Allow manual retry

---

## 9. Error States

WHEN error occurs THEN
  - IF 401 unauthorized THEN redirect to /login
  - IF 500 server error THEN show error state with retry button
  - IF network timeout THEN show "Connection timed out. Please retry" toast
  - IF 400 bad request THEN show validation error message from API

---

## 10. Priority

- **P0 (Critical)**:
  - SuggestionPage route và authentication
  - Mode switching (COOK_NOW / ADD_MORE)
  - Recipe list display với score badge
  - Bottom sheet preview
  - Pagination

- **P1 (Important)**:
  - Cook time filter (tab bar)
  - Category filter (multi-select chips)
  - Exclude ingredients filter (search + chips)
  - Add to shopping list modal

- **P2 (Nice to have)**:
  - Auto-refresh on pantry changes
  - Skeleton loading
  - Empty/error/no-results states

---

## 11. Non-Functional Requirements

- **Performance**: API response should render within 2s; pagination should not cause full page reload
- **UX**: Filter changes should debounce 300ms; bottom sheet should animate smoothly (Framer Motion)
- **Accessibility**: All interactive elements keyboard accessible; focus management in modals

---

## 12. Input/Output Schemas

### useSuggestion Hook Params

```javascript
{
  mode: "COOK_NOW" | "ADD_MORE",      // required
  excludeIngredients: number[],       // optional, default []
  cookTime: "lt15" | "15-30" | "30-60" | "gt60" | null,  // optional
  categories: number[],               // optional, default []
  page: number                        // optional, default 1
}
```

### API Response

```javascript
// GET /api/recommendations/suggest/
// Request body: { mode, exclude_ingredients, cook_time, categories, page }
// Response:
{
  success: true,
  data: [
    {
      recipe: {
        id: number,
        title: string,
        thumbnail: string,
        cook_time: number,           // minutes
        servings: number,
        description: string,
        categories: [{ id, name }],
        ingredients: [{ id, name, quantity, unit }]
      },
      score: number,                 // calculated score
      missing_ingredients: [
        { id, name, category }
      ]
    }
  ],
  pagination: {
    current_page: number,
    total_pages: number,
    total_count: number
  }
}
```

### Add to Shopping List Request

```javascript
// POST /api/kitchen/shopping-list/add-multiple/
{
  items: [
    { ingredient_id: number, quantity: number, unit: string }
  ]
}
```

---

## 13. Success Criteria

- [ ] User vào `/suggest` → load ngay suggestions với COOK_NOW mode (không cần bấm nút)
- [ ] Segmented control switch COOK_NOW ↔ ADD_MORE hoạt động đúng, giữ nguyên filter khác
- [ ] Cook time filter (tab bar) hoạt động đúng
- [ ] Category filter (multi-select chips) hoạt động đúng
- [ ] Exclude ingredients filter (search + chips) hoạt động đúng, không limit số lượng
- [ ] Recipe list sorted by score (high → low), có badge hiển thị điểm
- [ ] Tap recipe → bottom sheet preview với full recipe info
- [ ] "Xem chi tiết" navigate đến RecipeDetailPage
- [ ] "Thêm vào shopping list" → modal popup hiện ingredients chưa có trong pantry
- [ ] Modal có quantity input + unit dropdown, validate quantity > 0
- [ ] Empty state khi pantry trống với prompt đến /pantry
- [ ] Error state khi API fail với retry button
- [ ] No results state với suggest switch mode
- [ ] Pagination traditional hoạt động đúng
- [ ] Skeleton loading hiển thị trong lúc fetch
- [ ] Auto-refresh khi pantry thay đổi (React Query invalidation)