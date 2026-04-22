# Phase 6.1: Create Recipe Page — Design Spec (Updated)

**Date:** 2026-04-22
**Status:** In Progress — Adding missing features
**Updated:** 2026-04-23

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
| visibility | select | Yes | PRIVATE (default) / PUBLIC |

**Visibility options:**
- `PRIVATE` — "Riêng tư (chỉ tôi)"
- `PUBLIC` — "Công khai (mọi người)" — requires all ingredients APPROVED

### B. Ingredients

- Dynamic list, ít nhất 1 item khi submit
- Mỗi row chứa:
  - **Search dropdown** (debounced): tìm kiếm `GET /api/ingredients/search/?q={q}`
  - **Quantity** (number input)
  - **Unit** (select: gram, kg, ml, l, cái, quả, ...)
  - **Remove button** (🗑️)
- Button "+ Thêm nguyên liệu" để thêm row mới

**Ingredient search empty state (khi không có kết quả):**
- Text: "Không tìm thấy nguyên liệu nào"
- Button: "Đóng góp nguyên liệu mới"

**Contribute ingredient inline form:**
- Fields: name (text), category (select: PROTEIN/CARB/VEG/SPICE/STAPLE/OTHER)
- Submit: `POST /api/ingredients/`
- Success: toast "Đã gửi nguyên liệu để duyệt. Cảm ơn bạn!" + form đóng
- Cancel button để đóng form

**Ingredient status badges:**
- APPROVED: không badge đặc biệt
- PENDING: `bg-yellow-100 text-yellow-700` + "⏳ Chờ duyệt"
- REJECTED: ẩn luôn không cho chọn

**PENDING ingredient validation:**
- Nếu có PENDING ingredient VÀ visibility = PUBLIC → error: "Công thức có nguyên liệu chờ duyệt, không thể gửi công khai"
- PRIVATE recipe vẫn cho phép PENDING ingredients

### C. Steps

- Dynamic list, ít nhất 1 step khi submit
- Mỗi row chứa:
  - **Step number** (auto: 1, 2, 3...)
  - **Instruction** (textarea)
  - **Media toggle** (checkbox): "Thêm ảnh/video minh họa"
  - **Media input** (conditional): ThumbnailUpload nhỏ
  - **Remove button** (🗑️)
- Button "+ Thêm bước" để thêm row mới

**Step media handling:**
- Media file lưu vào temporary state (chưa upload)
- Khi submit: Tạo recipe → Lấy recipeId + stepIds → Upload media cho từng step
- Upload: `POST /api/recipes/{recipeId}/steps/{stepId}/media/`
- Nếu upload fail → toast warning + tiếp tục, user edit sau

### D. Thumbnail

- File input (accept: jpg/png/webp, max 5MB)
- Preview ảnh sau khi chọn
- Drag & drop support
- Upload sau khi recipe tạo thành công: `POST /api/recipes/{id}/thumbnail/`

---

## 3. Submission Flow

### Payload `POST /api/recipes/`

```json
{
  "title": "Phở bò truyền thống",
  "description": "Công thức phở bò chuẩn Hà Nội",
  "difficulty": "MEDIUM",
  "prep_time": 180,
  "visibility": "PRIVATE",
  "ingredients": [
    { "ingredient": 1, "quantity": 500, "unit": "gram" }
  ],
  "steps": [
    { "step_number": 1, "instruction": "Ninh xương bò trong 4 tiếng" }
  ]
}
```

**Lưu ý:** steps trong payload KHÔNG có media_url — media upload sau khi có recipeId.

### Response Handling

| Status | Action |
|--------|--------|
| 201 | Tạo recipe → Upload step media → Toast "Tạo công thức thành công!" → redirect `/recipes/{id}` |
| 400 | Hiện validation errors inline |
| 401 | Redirect `/login` |
| Network Error | Toast error + form giữ nguyên |

### Step Media Upload Flow

```
1. recipeApi.createRecipe(payload) → success → { id: recipeId }
2. Với mỗi step có mediaFile:
   - recipeApi.uploadStepMedia(recipeId, stepId, mediaFile)
   - Nếu fail → warning, continue next step
3. Redirect /recipes/{recipeId}
```

**Error handling:**
- Recipe creation FAIL → KHÔNG upload media gì cả, form giữ nguyên
- Step media FAIL → warning toast, tiếp tục steps khác, recipe vẫn tạo OK

---

## 4. File Structure

```
src/
├── api/
│   └── recipeApi.js           # createRecipe, searchIngredients, uploadThumbnail, uploadStepMedia, contributeIngredient
├── components/
│   └── recipe/
│       ├── CreateRecipeForm.jsx   # Main form container
│       ├── IngredientInput.jsx    # Single ingredient row
│       ├── IngredientSearch.jsx   # Search dropdown + contribute inline form
│       ├── StepInput.jsx          # Single step row + optional media
│       └── ThumbnailUpload.jsx    # File input + preview
├── hooks/
│   └── useIngredientSearch.js    # Debounced search hook
└── pages/
    └── CreateRecipePage.jsx       # Route page
```

---

## 5. Component Changes

### IngredientSearch (updated)
- Props: `onSelect(ingredient)`
- Thêm: contribute inline form khi empty results
- Thêm: status badge cho PENDING ingredients

### StepInput (updated)
- Props: `step`, `onUpdate`, `onRemove`, `stepNumber`
- Thêm: media toggle checkbox + conditional ThumbnailUpload nhỏ
- Media file stored in step state → parent passes to handleSubmit

### CreateRecipeForm (updated)
- Thêm: visibility select field
- Thêm: step media upload sau khi recipe creation success
- Thêm: validation check PENDING ingredients khi visibility=PUBLIC

---

## 6. recipeApi Changes

```javascript
// Thêm methods:
uploadStepMedia: async (recipeId, stepId, file) => { ... }
contributeIngredient: async (name, category) => { ... }
```

---

## 7. Validation Rules

| Field | Rule |
|-------|------|
| title | Required, max 200 |
| difficulty | Required, one of EASY/MEDIUM/HARD |
| prep_time | Required, min 1 |
| visibility | Required, PRIVATE or PUBLIC |
| visibility + PENDING | PUBLIC và có PENDING ingredient → error |
| ingredients | Array, min length 1 |
| steps | Array, min length 1 |

---

## 8. Error Handling

- **Form validation:** Inline error messages below each field
- **API 400:** Parse error details → show inline
- **Network error:** Toast notification
- **Step media upload fail:** Toast warning (non-blocking)
- **Unauthorized:** Redirect to `/login?from=/recipes/create`

---

## 9. Out of Scope (Phase 6.2)

- Recipe detail page
- Publish recipe flow (AI moderation)
- Edit recipe
- Delete recipe
