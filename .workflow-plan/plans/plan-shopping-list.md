# Plan: Shopping List Page

## Tasks

### Task 1: ShoppingPage component + routing - P0
**Files:** Create - `KitchenMate_Frontend/src/pages/shopping/ShoppingPage.jsx`
          Modify - `KitchenMate_Frontend/src/App.jsx`

**Acceptance Criteria:**
- `ShoppingPage` renders at `/shopping-list` route (wrapped with AuthGuard)
- Page has: header with title "Danh sách đi chợ", add form area, list container
- Skeleton loading shown while fetching data
- Empty state with illustration and guidance text when list is empty
- Responsive mobile-first layout

**Verification:**
- Manual test: navigate to `/shopping-list` → see page renders correctly
- Check loading state appears on mount
- Check empty state when no items

**Context7 Lookup:**
- Tailwind CSS v4 responsive design patterns
- Skeleton loading component patterns

**Notes:**
- Use existing UI components from `KitchenMate_Frontend/src/components/ui/`
- Import FRONTEND_DESIGN.md tokens for colors/spacing

---

### Task 2: ShoppingListItem component - P0
**Files:** Create - `KitchenMate_Frontend/src/pages/shopping/ShoppingListItem.jsx`

**Acceptance Criteria:**
- Item card displays: ingredient_name, quantity, unit, checkbox
- Unpurchased item: full opacity, checkbox unchecked
- Purchased item: reduced opacity (50%), strikethrough text, checkbox checked
- Quantity/unit editable inline only when unpurchased
- Delete icon button on each item (right side)
- Smooth animation when item transitions purchased ↔ unpurchased

**Verification:**
- Manual test: add item → see unpurchased style
- Mark as purchased → see purchased style + animation
- Undo → see back to unpurchased style

**Context7 Lookup:**
- Framer Motion animation patterns
- Tailwind CSS v4 state-based styling

---

### Task 3: Add item via search bar - P0
**Files:** Modify - `KitchenMate_Frontend/src/pages/shopping/ShoppingPage.jsx`

**Acceptance Criteria:**
- Search input with dropdown showing ingredient suggestions
- On select ingredient → show quantity + unit input fields
- "Thêm" button submits to API
- On success: toast "Đã thêm vào danh sách" + item appears in list
- On error: toast error
- If ingredient not found → user can create new ingredient by typing name

**Verification:**
- Manual test: type in search bar → see dropdown of ingredients
- Select ingredient → form appears
- Submit → see item in list

**Context7 Lookup:**
- Search/dropdown input UX patterns

---

### Task 4: Mark purchased + animation - P0
**Files:** Modify - `KitchenMate_Frontend/src/pages/shopping/ShoppingListItem.jsx`,
          Modify - `KitchenMate_Frontend/src/pages/shopping/ShoppingPage.jsx`

**Acceptance Criteria:**
- Checkbox click → call `markAsPurchased` API
- While pending: checkbox disabled + spinner
- On success:
  - Toast "Đã thêm vào tủ lạnh"
  - Item style changes to purchased
  - Item moves to end of list (or purchased section)
- On error: toast error + revert checkbox state

**Verification:**
- Manual test: click checkbox → see animation + toast
- Check pantry data updates (go to /pantry to verify)

**Context7 Lookup:**
- Axios error handling patterns
- Toast notification patterns

---

### Task 5: Undo purchased (mark unpurchased) - P1
**Files:** Modify - `KitchenMate_Frontend/src/api/kitchenApi.js` (add `markAsUnpurchased` API)
          Modify - `KitchenMate_Frontend/src/pages/shopping/ShoppingListItem.jsx`

**Acceptance Criteria:**
- `markAsUnpurchased(id)` function added to `shoppingListApi`
- Clicking checkbox on purchased item → call `markAsUnpurchased` API
- On success: toast "Đã bỏ khỏi tủ lạnh" + item moves back to unpurchased section
- On error: toast error + revert checkbox state

**Verification:**
- Manual test: click checkbox on purchased item → see undo + toast

**Context7 Lookup:**
- Backend `mark-unpurchased` endpoint already exists in views.py

---

### Task 6: Delete item (optimistic UI) - P1
**Files:** Modify - `KitchenMate_Frontend/src/pages/shopping/ShoppingListItem.jsx`

**Acceptance Criteria:**
- Click delete icon → item immediately removed from UI (optimistic)
- API call in background
- On error: item re-appears in list + toast error

**Verification:**
- Manual test: click delete → item disappears immediately
- Refresh → verify item really deleted

**Context7 Lookup:**
- Optimistic UI patterns in React

---

### Task 7: Delete all purchased - P1
**Files:** Modify - `KitchenMate_Frontend/src/pages/shopping/ShoppingPage.jsx`

**Acceptance Criteria:**
- "Xóa tất cả đã mua" button in header (only visible when >= 1 purchased item)
- Click → confirmation dialog
- User confirm → batch delete all purchased items
- On success: toast "Đã xóa {n} nguyên liệu đã mua"
- On partial error: toast error + remaining items stay

**Verification:**
- Manual test: add items → mark some purchased → click delete all purchased → confirm → items removed

**Context7 Lookup:**
- Confirmation dialog patterns

---

### Task 8: "Thêm vào danh sách đi chợ" button in RecipeDetailPage - P2
**Files:** Modify - `KitchenMate_Frontend/src/pages/recipe/RecipeDetailPage.jsx`

**Acceptance Criteria:**
- In ingredient list section, each ingredient has "Thêm vào danh sách đi chợ" button
- Click → `addToShoppingList` API called with that ingredient
- On success: toast "Đã thêm vào danh sách đi chợ"
- On error: toast error

**Verification:**
- Manual test: go to recipe detail → click "Thêm vào danh sách đi chợ" on an ingredient
- Go to shopping list → verify ingredient appears

**Context7 Lookup:**
- Recipe detail ingredient list structure (already built, inspect to find right place)

---

## Execution Order

1. **Task 1** - ShoppingPage component + routing (foundation)
2. **Task 2** - ShoppingListItem component (depends on Task 1)
3. **Task 3** - Add item via search bar (depends on Task 1)
4. **Task 4** - Mark purchased + animation (depends on Task 2)
5. **Task 5** - Undo purchased (depends on Task 4 + API available)
6. **Task 6** - Delete item (depends on Task 2)
7. **Task 7** - Delete all purchased (depends on Task 6)
8. **Task 8** - Recipe detail button (independent, can do last)

## File Changes Summary

**Create:**
- `KitchenMate_Frontend/src/pages/shopping/ShoppingPage.jsx`
- `KitchenMate_Frontend/src/pages/shopping/ShoppingListItem.jsx`
- `KitchenMate_Frontend/src/pages/shopping/index.js` (export file)

**Modify:**
- `KitchenMate_Frontend/src/App.jsx` (update ShoppingPage import/route)
- `KitchenMate_Frontend/src/api/kitchenApi.js` (add `markAsUnpurchased`)
- `KitchenMate_Frontend/src/pages/recipe/RecipeDetailPage.jsx` (add button)

## Success Metrics

- User can view shopping list at `/shopping-list`
- User can add items via search bar
- User can mark items as purchased with animation
- User can undo mark purchased
- User can delete items
- User can delete all purchased items
- "Thêm vào danh sách đi chợ" button works in recipe detail
- All API calls handle errors with toast
- Mobile-first responsive layout works on all screen sizes

## Debug Strategy

1. If Task X fails → identify which API or UI component is causing issue
2. Check browser console for errors
3. Verify API endpoint works via Swagger docs at `http://127.0.0.1:8000/api/docs/`
4. Check network tab for failed requests
5. If API issue → check backend logs
6. If UI issue → check React component logic and state management