# Analysis: "Công thức của tôi" Page Implementation

## 1. File Inventory

### Backend (No changes required)
- `KitchenMate_Backend/apps/recipes/models.py` - Recipe model with visibility states (PRIVATE/PENDING/PUBLIC) already supports owner-only access
- `KitchenMate_Backend/apps/recipes/views.py` - `my_recipes` action already exists at `/api/recipes/my-recipes/`
- `KitchenMate_Backend/apps/recipes/serializers.py` - RecipeListSerializer/RecipeDetailSerializer already available
- `KitchenMate_Backend/apps/recipes/urls.py` - Router already registered

### Frontend - New Files Required
| File | Purpose |
|------|---------|
| `src/pages/recipe/MyRecipesPage.jsx` | Main page component listing user's recipes |
| `src/hooks/useMyRecipes.js` | Hook for fetching/managing my recipes state (extends existing `useMyRecipes`) |

### Frontend - Existing Files to Modify
| File | Change | Risk |
|------|--------|------|
| `src/App.jsx` | Add route `/my-recipes` | LOW - Route addition |
| `src/api/recipeApi.js` | Already has `getMyRecipes()` | N/A |
| `src/hooks/useRecipes.js` | Already exports `useMyRecipes` | N/A |
| `src/components/recipe/RecipeCard.jsx` | Reuse existing component | N/A |
| `src/components/layout/Header.jsx` | Add navigation link to "Công thức của tôi" | LOW - UI link addition |
| `src/components/layout/Sidebar.jsx` | Add navigation link | LOW - UI link addition |
| `src/components/layout/BottomNav.jsx` | Add navigation link for mobile | LOW - UI link addition |

---

## 2. Backend API Endpoints

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/recipes/my-recipes/` | GET | IsAuthenticated | Returns all user recipes (PRIVATE/PENDING/PUBLIC) |
| `/api/recipes/{id}/` | GET | Owner for PRIVATE/PENDING | Get recipe detail |
| `/api/recipes/{id}/` | PATCH | IsOwner, only PRIVATE | Update recipe |
| `/api/recipes/{id}/` | DELETE | IsOwner | Delete recipe |
| `/api/recipes/{id}/publish/` | POST | IsOwner, only PRIVATE | Submit to AI moderation |

**Backend is FULLY READY** - no backend changes needed.

---

## 3. Frontend Components Involv

### Pages
- `RecipeDetailPage.jsx` - Already shows owner actions (edit/delete) based on ownership
- `RecipeEditorPage.jsx` - Reused for create/edit via `/recipe/new` and `/recipe/:id/edit`
- **NEW: `MyRecipesPage.jsx`** - List view of user's recipes with status badges

### Components
- `RecipeCard.jsx` - Already supports `variant`, `showFavoriteButton`, `showAuthor` props
- `RecipeCardSkeleton.jsx` - Reuse for loading states
- Existing recipe components in `src/components/recipe/`

### Hooks
- `useMyRecipes()` - Already exists in `useRecipes.js`
- `useRecipe(id)` - Already exists
- `useCreateRecipe()`, `useUpdateRecipe()`, `useDeleteRecipe()` - Already exist

### Stores
- `authStore` - Already has `user` object with id

---

## 4. Integration Points

### Recipe Visibility States
- `PRIVATE` - Only owner sees; can edit/delete
- `PENDING` - Only owner sees; AI moderation SUSPECT; cannot edit
- `PUBLIC` - Everyone sees; cannot edit (must unpublish first)

### Existing Recipe Workflow
1. Create at `/recipe/new` → visibility=PRIVATE
2. Edit at `/recipe/:id/edit` → only if PRIVATE
3. Publish via `/recipe/:id/edit` step 4 → AI moderation → PUBLIC or PENDING
4. View at `/recipe/:id` → owner sees all, others see only PUBLIC

### My Recipes Page Should Show
- All user's recipes (PRIVATE/PENDING/PUBLIC)
- Visibility badges per recipe
- Edit button (only for PRIVATE)
- Publish button (only for PRIVATE, not yet published)
- Delete button (all statuses)
- Stats (view_count, avg_rating, save_count)

---

## 5. Risk Assessment

| Area | Risk | Mitigation |
|------|------|------------|
| Route conflicts | LOW | `/my-recipes` is new, distinct from `/recipe/:id` |
| Auth access | LOW | Backend enforces ownership; `AuthGuard` on frontend |
| Edit flow conflicts | LOW | Backend already blocks edit for non-PRIVATE recipes |
| Hook conflicts | NONE | `useMyRecipes` already exported from `useRecipes.js` |
| Component reuse | LOW | RecipeCard already flexible via props |

---

## 6. Estimated Scope

- **New files**: 1-2 (page + optional hook enhancement)
- **Modified files**: 4-6 (App.jsx, Header, Sidebar, BottomNav, index.js exports)
- **Backend changes**: NONE required
- **Testing**: Add unit tests for `useMyRecipes` hook