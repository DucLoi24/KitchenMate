# Plan: Food Suggestion (SuggestionPage)

## Tasks

### Task 1: Setup SuggestionPage structure and routes - P0

**Files:** Create - `src/pages/suggestion/SuggestionPage.jsx`
          Modify - `src/App.jsx` (replace placeholder with real import)

**Acceptance Criteria:**
- `src/pages/suggestion/` folder exists
- `SuggestionPage.jsx` exports default component
- App.jsx imports SuggestionPage (not inline placeholder)
- Route `/suggest` correctly points to SuggestionPage wrapped in AuthGuard

**Verification:**
- Manual test: navigate to `/suggest` → page renders
- Verify page shows loading or content (not "Gợi ý món ăn - Cần đăng nhập")

**Context7 Lookup:**
- React Router v6 route definitions

---

### Task 2: Implement useSuggestion hook with all filter params - P0

**Files:** Modify - `src/hooks/useSuggestion.js`

**Acceptance Criteria:**
- Hook accepts `mode`, `excludeIngredients`, `cookTime`, `categories`, `page` params
- Query key includes all params for proper cache invalidation
- Debounce 300ms when filters change
- Uses React Query's `keepPreviousData` for smooth pagination

**Verification:**
- Console log queryKey when params change
- Verify old data stays visible while new data loads

**Context7 Lookup:**
- React Query v5 useQuery options (staleTime, gcTime, keepPreviousData)

---

### Task 3: Build SuggestionPage layout with skeleton loading - P0

**Files:** Modify - `src/pages/suggestion/SuggestionPage.jsx`

**Acceptance Criteria:**
- Page structure: header title, segmented control, filter section, recipe list, pagination
- Skeleton loading shown during initial fetch (3-4 skeleton cards)
- Sections use `animate-section` class for stagger reveal

**Verification:**
- Network tab: verify single API call on mount
- Visual: skeleton cards match recipe card dimensions

**Context7 Lookup:**
- Tailwind CSS v4 animation classes

---

### Task 4: Implement SegmentedControl for COOK_NOW / ADD_MORE - P0

**Files:** Create - `src/components/suggestion/SegmentedControl.jsx` (or inline)

**Acceptance Criteria:**
- Two segments: "Nấu ngay" (COOK_NOW) and "Thêm chút nữa" (ADD_MORE)
- Selected segment has filled background with primary color
- Unselected segment has transparent background
- Switching mode re-fetches suggestions, keeps other filters unchanged

**Verification:**
- Click each segment → verify API call with correct `mode` param
- Verify category/cookTime/exclude filters preserved after mode switch

---

### Task 5: Implement Cook Time filter (tab bar) - P1

**Files:** Create - `src/components/suggestion/CookTimeFilter.jsx` (or inline)

**Acceptance Criteria:**
- Tab bar with 5 options: "Tất cả", "< 15 phút", "15-30 phút", "30-60 phút", "> 60 phút"
- Active tab has underline or background indicator
- Selecting tab re-fetches with `cook_time` param

**Verification:**
- Select each tab → verify API call includes correct `cook_time` param
- "Tất cả" sends null/no cook_time param

---

### Task 6: Implement Category filter (multi-select chips) - P1

**Files:** Create - `src/components/suggestion/CategoryFilter.jsx` (or inline)

**Acceptance Criteria:**
- Horizontal scrollable chips list
- Each chip shows category name
- Selected chips have filled background (primary color)
- Multiple categories can be selected
- Empty selection = show all categories

**Verification:**
- Select multiple chips → verify API call includes array of category IDs
- Deselect all → verify API call with empty categories

---

### Task 7: Implement Exclude Ingredients filter (search + chips) - P1

**Files:** Create - `src/components/suggestion/ExcludeIngredientsFilter.jsx` (or inline)

**Acceptance Criteria:**
- Search input using IngredientSearchInput component
- Dropdown shows matching ingredients
- Selected ingredients appear as chips below input
- Each chip has × button to remove
- No limit on number of excluded ingredients
- Changing exclusion re-fetches suggestions

**Verification:**
- Type to search → dropdown appears → select → chip added
- Click × on chip → chip removed → re-fetch triggered

**Context7 Lookup:**
- IngredientSearchInput component behavior

---

### Task 8: Build RecipeCard component with score badge - P0

**Files:** Create - `src/components/suggestion/RecipeCard.jsx`

**Acceptance Criteria:**
- Card shows: thumbnail, title, cook time, score badge, missing ingredient count
- Score badge displays as "+XX" with accent color background
- Missing count shows "Thiếu X nguyên liệu"
- Card click opens bottom sheet preview

**Verification:**
- Verify score is number from API
- Verify missing count matches `missing_ingredients.length`

---

### Task 9: Implement Recipe list with pagination - P0

**Files:** Modify - `src/pages/suggestion/SuggestionPage.jsx`

**Acceptance Criteria:**
- List displays recipes sorted by score (high → low)
- Pagination controls at bottom: page numbers with prev/next arrows
- Clicking page number re-fetches that page
- "Trang X / Y" indicator shown
- Empty state when no results

**Verification:**
- Click page 2 → scroll to top, show page 2 data
- Page 1 of 3 when total is 45 items with 20 per page

---

### Task 10: Implement BottomSheet preview with full recipe info - P0

**Files:** Create - `src/components/suggestion/RecipeBottomSheet.jsx`

**Acceptance Criteria:**
- Bottom sheet shows: image, title, description, cook time, servings, ingredients, missing ingredients, score
- "Xem chi tiết" button navigates to `/recipe/{id}` and closes sheet
- "Thêm vào shopping list" button shown only when missing_ingredients.length > 0
- Sheet animates up from bottom (Framer Motion)
- Click outside or × button closes sheet

**Verification:**
- Tap recipe card → sheet opens with correct recipe data
- Tap "Xem chi tiết" → navigate to detail page
- Tap outside sheet → sheet closes

**Context7 Lookup:**
- Framer Motion AnimatePresence for bottom sheet

---

### Task 11: Implement Add to Shopping List modal with ingredient selection - P0

**Files:** Create - `src/components/suggestion/AddToShoppingModal.jsx`

**Acceptance Criteria:**
- Modal dialog (center screen) with ingredient list
- Each row: ingredient name + quantity input + unit dropdown
- Only shows ingredients NOT already in user's pantry
- Quantity input validates > 0 on submit
- "Hủy" closes modal, "Thêm vào danh sách" submits
- On success: close modal, show success toast "Đã thêm vào danh sách mua sắm"
- On error: show error message in modal

**Verification:**
- Open modal → verify ingredients list matches missing_ingredients
- Fill quantity = 0 → click submit → validation error shown
- Fill valid quantity → submit → verify items added to shopping list

**Context7 Lookup:**
- Modal animation (Framer Motion)

---

### Task 12: Implement empty/error/no-results states - P2

**Files:** Modify - `src/pages/suggestion/SuggestionPage.jsx`

**Acceptance Criteria:**
- **Empty state (no pantry)**: Icon + "Tủ lạnh trống" title + "Thêm nguyên liệu..." description + "Đến tủ lạnh" button → navigate to `/pantry`
- **Error state**: Icon + "Không thể tải gợi ý" + retry button → triggers re-fetch
- **No results state**: "Không tìm thấy công thức..." + suggest "Thử chế độ 'Thêm chút nữa'?" button → switches mode

**Verification:**
- Mock empty pantry → verify empty state renders
- Mock API error → verify error state with retry
- Mock no results → verify no-results state with suggest switch

---

### Task 13: Implement auto-refresh on pantry changes - P2

**Files:** Modify - `src/hooks/useSuggestion.js` or `src/pages/suggestion/SuggestionPage.jsx`

**Acceptance Criteria:**
- When pantry is modified (add/remove ingredient), suggestions query is invalidated
- Use React Query's `queryClient.invalidateQueries` on pantry mutation success

**Verification:**
- Add item to pantry → suggestions refetch automatically
- Implementation approach: call `queryClient.invalidateQueries({ queryKey: ['suggestions'] })` in pantry page after mutation success

---

## Execution Order

1. **Task 1** - Setup structure (foundation, must do first)
2. **Task 2** - Hook with all params (API layer)
3. **Task 3** - Page layout + skeleton (UI shell)
4. **Task 4** - SegmentedControl (first filter)
5. **Task 5** - Cook time filter
6. **Task 6** - Category filter
7. **Task 7** - Exclude ingredients filter
8. **Task 8** - RecipeCard component
9. **Task 9** - Recipe list + pagination
10. **Task 10** - BottomSheet preview
11. **Task 11** - Add to Shopping modal
12. **Task 12** - Empty/error/no-results states
13. **Task 13** - Auto-refresh on pantry changes

---

## File Changes Summary

**Create:**
- `src/pages/suggestion/SuggestionPage.jsx`
- `src/components/suggestion/SegmentedControl.jsx` (or inline)
- `src/components/suggestion/CookTimeFilter.jsx` (or inline)
- `src/components/suggestion/CategoryFilter.jsx` (or inline)
- `src/components/suggestion/ExcludeIngredientsFilter.jsx` (or inline)
- `src/components/suggestion/RecipeCard.jsx`
- `src/components/suggestion/RecipeBottomSheet.jsx`
- `src/components/suggestion/AddToShoppingModal.jsx`

**Modify:**
- `src/App.jsx` (import SuggestionPage)
- `src/hooks/useSuggestion.js` (add filter params, debounce)

---

## Success Metrics

- User vào `/suggest` → suggestions load in < 2s (no manual trigger needed)
- All 4 filters (mode, cook time, category, exclude) work correctly
- Recipe list sorted by score, pagination works
- Bottom sheet opens/closes correctly with all recipe info
- Add to shopping list modal works with validation
- Empty/error/no-results states all handled
- Auto-refresh works when pantry changes

---

## Debug Strategy

1. Main Agent spawns **Explore agent** → trace API response shape
2. Main Agent spawns **Test agent** → verify filter interactions
3. Main Agent nghiệm thu → proceed to next task