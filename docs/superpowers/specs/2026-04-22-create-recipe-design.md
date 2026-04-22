# Phase 6.1: Create Recipe Page — Design Spec

**Date:** 2026-04-22
**Status:** Approved → Implementation

## Overview

Tạo trang `/recipes/create` cho phép user tạo công thức nấu ăn mới. Recipe được tạo với `visibility=PRIVATE`, sau đó user có thể publish qua AI moderation.

---

## 1. Page Layout

- **Route:** `/recipes/create`
- **Layout:** `<MainLayout>` (Navbar + BottomNav)
- **Page title:** "Tạo công thức mới"
- **Back nav:** Arrow left → `/home`

---

## 2. Form Sections

### A. Basic Info

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| title | text | Yes | max 200 chars |
| description | textarea | No | - |
| difficulty | select | Yes | EASY / MEDIUM / HARD |
| prep_time | number | Yes | min 1 (minutes) |

### B. Ingredients

- Dynamic list, ít nhất 1 item khi submit
- Mỗi row chứa:
  - **Search dropdown** (debounced): tìm kiếm `GET /api/ingredients/search/?q={q}`
  - **Quantity** (number input)
  - **Unit** (select: gram, kg, ml, l, cái, quả, ...)
  - **Remove button** (🗑️)
- Button "+ Thêm nguyên liệu" để thêm row mới
- Nếu search không có kết quả → "Không tìm thấy nguyên liệu"

### C. Steps

- Dynamic list, ít nhất 1 step khi submit
- Mỗi row chứa:
  - **Step number** (auto: 1, 2, 3...)
  - **Instruction** (textarea)
  - **Remove button** (🗑️)
- Button "+ Thêm bước" để thêm row mới

### D. Thumbnail

- File input (accept: jpg/png/webp, max 5MB)
- Preview ảnh sau khi chọn
- Drag & drop support
- **Lưu ý:** Upload thumbnail là bước riêng sau khi tạo recipe thành công (hoặc bỏ qua)

---

## 3. Ingredient Search UX

```
[___Tìm nguyên liệu...___]
  ↓ gõ ≥ 2 ký tự → debounce 300ms → gọi API
  ↓
[Dropdown results]
  - Icon + Tên + Category badge
  - Click → thêm ingredient vào list → clear search
  ↓
[Row đã thêm: Tên | [_qty__] [unit ▼] | 🗑️]
```

- Debounce 300ms
- `q` rỗng → dropdown ẩn
- Chỉ hiện APPROVED ingredients (theo API)
- Nếu chưa login → redirect /login

---

## 4. Submission Flow

### Payload `POST /api/recipes/`

```json
{
  "title": "Phở bò truyền thống",
  "description": "Công thức phở bò chuẩn Hà Nội",
  "difficulty": "MEDIUM",
  "prep_time": 180,
  "ingredients": [
    { "ingredient": 1, "quantity": 500, "unit": "gram" },
    { "ingredient": 2, "quantity": 200, "unit": "gram" }
  ],
  "steps": [
    { "step_number": 1, "instruction": "Ninh xương bò trong 4 tiếng" },
    { "step_number": 2, "instruction": "Thêm gia vị vào nồi nước dùng" }
  ]
}
```

### Response Handling

| Status | Action |
|--------|--------|
| 201 | Toast "Tạo công thức thành công!" → redirect `/recipes/{id}` |
| 400 | Hiện validation errors inline |
| 401 | Redirect `/login` |
| Network Error | Toast error + retry |

---

## 5. File Structure

```
src/
├── api/
│   └── recipeApi.js           # createRecipe, searchIngredients
├── components/
│   └── recipe/
│       ├── CreateRecipeForm.jsx   # Main form container
│       ├── IngredientInput.jsx    # Single ingredient row
│       ├── IngredientSearch.jsx   # Search dropdown
│       ├── StepInput.jsx          # Single step row
│       └── ThumbnailUpload.jsx    # File input + preview
├── hooks/
│   └── useIngredientSearch.js    # Debounced search hook
└── pages/
    └── CreateRecipePage.jsx       # Route page
```

---

## 6. Component Inventory

### CreateRecipeForm
- State: fields + ingredients[] + steps[]
- Handles submit → calls recipeApi.createRecipe()
- Validation before submit

### IngredientSearch
- Props: `onSelect(ingredient)`
- State: query, results, isLoading, showDropdown
- Debounce 300ms on query change
- Dropdown positioned below input

### IngredientInput
- Props: `ingredient`, `onUpdate`, `onRemove`
- Renders: name (read-only) + quantity input + unit select + remove btn

### StepInput
- Props: `step`, `onUpdate`, `onRemove`
- Renders: step_number badge + textarea + remove btn

### ThumbnailUpload
- Props: `onFileSelect`
- Preview URL via FileReader
- Drag & drop handlers (onDragOver, onDrop)

### useIngredientSearch
- Input: query string
- Output: { results, isLoading, error }
- Debounce 300ms
- Calls `GET /api/ingredients/search/?q={q}`

---

## 7. Validation Rules

| Field | Rule |
|-------|------|
| title | Required, max 200 |
| difficulty | Required, one of EASY/MEDIUM/HARD |
| prep_time | Required, min 1 |
| ingredients | Array, min length 1 |
| steps | Array, min length 1 |

---

## 8. Error Handling

- **Form validation:** Inline error messages below each field
- **API 400:** Parse error details → show inline
- **Network error:** Toast notification with retry option
- **Unauthorized:** Redirect to `/login?from=/recipes/create`

---

## 9. Dependencies

- Existing: axiosInstance (JWT interceptor), authStore (Zustand persist)
- New: `react-hot-toast` (already in stack for notifications)
- No new UI library needed — use existing Tailwind components

---

## 10. Out of Scope (Phase 6.2)

- Recipe detail page
- Publish recipe flow (AI moderation)
- Step media upload (POST /recipes/{id}/steps/{step_id}/media/)
- Edit recipe
- Delete recipe
