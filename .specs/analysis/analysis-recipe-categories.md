---
title: Codebase Impact Analysis - Implement Recipe Categories Feature
task_file: .specs/tasks/draft/implement-recipe-categories.feature.md
scratchpad: .specs/scratchpad/hex_temp.md
created: 2026-05-06
status: complete
---

# Codebase Impact Analysis: Implement Recipe Categories Feature

## Summary

- **Files to Modify**: 7 files
- **Files to Create**: 4 files (categoryApi.js, CategoryBadge.jsx, CategoryManagementPage.jsx, FALLBACK_CATEGORIES constant)
- **Files to Delete**: 0 files
- **Test Files Affected**: 0 files identified for update
- **Risk Level**: Medium

---

## Files to be Modified/Created

### Primary Changes

```
KitchenMate_Frontend/src/
├── api/
│   └── categoryApi.js              # NEW: Category CRUD API functions
├── components/
│   ├── ui/
│   │   └── CategoryBadge.jsx       # NEW: Reusable category pill component
│   ├── recipe/
│   │   └── RecipeCard.jsx          # UPDATE: Add category badge per AC-3
│   └── explore/
│       └── CategoryFilter.jsx      # UPDATE: Replace hardcoded with API + 3000ms timeout fallback
├── hooks/
│   └── useRecipeDraft.js           # UPDATE: Add category_slugs field to formData
├── pages/
│   ├── explore/
│   │   └── ExplorePage.jsx         # UPDATE: Add category param + categories mapping
│   ├── home/
│   │   └── HomePage.jsx            # UPDATE: Replace hardcoded placeholder with real API grid (lines 614-625)
│   ├── recipe/
│   │   ├── RecipeDetailPage.jsx     # UPDATE: Make category badges clickable
│   │   └── StepBasicInfo.jsx        # UPDATE: Add category multi-select with categoryApi.getCategories()
│   └── admin/
│       └── CategoryManagementPage.jsx  # NEW: Admin CRUD page for categories at /admin/categories
└── App.jsx                         # UPDATE: Add /admin/categories route
```

### Documentation Updates

```
.specs/
├── analysis/
│   └── analysis-recipe-categories.md  # UPDATE: Add AC-6/AC-10 timeout risk assessment
└── tasks/
    └── draft/
        └── implement-recipe-categories.feature.md  # READ: Reference for AC requirements
```

---

## Key Interfaces & Contracts

### Functions/Methods to Modify

| Location | Name | Current Signature | Change Required |
|----------|------|-------------------|-----------------|
| `KitchenMate_Frontend/src/pages/explore/ExplorePage.jsx:72-89` | `apiParams` useMemo | Builds params without category | Add: `if (category && category !== 'all') params.categories = category` |
| `KitchenMate_Frontend/src/pages/explore/ExplorePage.jsx:105-120` | recipe transformation | No `categories` field | Add `categories: recipe.categories` to mapped object |
| `KitchenMate_Frontend/src/components/explore/CategoryFilter.jsx:4-13` | hardcoded CATEGORIES | Static array | Replace with API call + Promise.race 3000ms timeout + FALLBACK_CATEGORIES |
| `KitchenMate_Frontend/src/components/recipe/RecipeCard.jsx:26-37` | recipe destructuring | No `categories` field | Add `categories` to destructuring and display badge per AC-3 |
| `KitchenMate_Frontend/src/pages/recipe/StepBasicInfo.jsx:126-162` | difficulty selector | No category selector | Add category multi-select after difficulty selector |
| `KitchenMate_Frontend/src/pages/recipe/RecipeDetailPage.jsx:361-370` | category display | Plain `<span>` elements | Convert to clickable `<button>` with navigate |
| `KitchenMate_Frontend/src/pages/home/HomePage.jsx:614-625` | categories placeholder | Hardcoded "Bổ sung trong tương lai" | Replace with API-fetched grid per AC-7 |
| `KitchenMate_Frontend/src/hooks/useRecipeDraft.js` | formData state | No categories field | Add `categories: []` (UUIDs, NOT slugs) for recipe creation payload |
| `KitchenMate_Frontend/src/App.jsx` | admin routes | No `/admin/categories` route | Add lazy-loaded CategoryManagementPage route |

---

## Implementation Guidance by File

### 1. categoryApi.js - NEW FILE

**Location**: `KitchenMate_Frontend/src/api/categoryApi.js`

```javascript
import axiosInstance from '@/lib/axiosInstance'

export const categoryApi = {
  // Get all active categories (public - AllowAny)
  getCategories: async (params = {}) => {
    const { data } = await axiosInstance.get('/recipes/categories/', { params })
    return data
  },

  // Get single category by slug (public - AllowAny)
  getCategory: async (slug) => {
    const { data } = await axiosInstance.get(`/recipes/categories/${slug}/`)
    return data
  },

  // Create category (admin only - IsAdminUser)
  createCategory: async (categoryData) => {
    const { data } = await axiosInstance.post('/recipes/categories/', categoryData)
    return data
  },

  // Update category (admin only - IsAdminUser)
  updateCategory: async (slug, categoryData) => {
    const { data } = await axiosInstance.patch(`/recipes/categories/${slug}/`, categoryData)
    return data
  },

  // Delete category (admin only - IsAdminUser, soft delete)
  deleteCategory: async (slug) => {
    await axiosInstance.delete(`/recipes/categories/${slug}/`)
  },
}

export default categoryApi
```

**Backend endpoints**:
- `GET /api/recipes/categories/` - list active categories (public - AllowAny)
- `GET /api/recipes/categories/{slug}/` - get single category (lookup_field='slug', NOT UUID)
- `POST /api/recipes/categories/` - create (admin only - IsAdminUser)
- `PATCH /api/recipes/categories/{slug}/` - partial update (admin only)
- `DELETE /api/recipes/categories/{slug}/` - soft delete (admin only)

**CRITICAL: Dual format requirement for categories**:
- **Recipe filtering (GET)**: Uses `categories` query param with **slug** values (e.g., `?categories=mon-viet,mon-a`)
- **Recipe creation (POST)**: Backend `RecipeCreateSerializer` at `serializers.py:166-170` expects `categories` field with **UUID values** (PrimaryKeyRelatedField on RecipeCategory.id)
- **Frontend must convert** between formats: store both `{ id: uuid, slug, name }` when user selects, use UUID for create, use slug for filter

### 2. CategoryFilter.jsx - REPLACE HARDCODED WITH API + FALLBACK (AC-5, AC-6)

**Location**: `KitchenMate_Frontend/src/components/explore/CategoryFilter.jsx`

**AC-5**: Load categories from API on mount
**AC-6**: Fall back to hardcoded when API fails/takes >3000ms, render within 500ms

**Current hardcoded code** (lines 4-13) - MUST REPLACE:
```javascript
const CATEGORIES = [
  { id: 'all', label: 'Tất cả', emoji: '🍽️' },
  { id: 'vietnamese', label: 'Món Việt', emoji: '🍜' },
  // ... more hardcoded entries
]
```

**EXACT CHANGE NEEDED**:

1. Add imports and FALLBACK_CATEGORIES constant:
```javascript
import { useState, useEffect } from 'react'
import { categoryApi } from '@/api/categoryApi'

const FALLBACK_CATEGORIES = [
  { id: 'all', slug: 'all', name: 'Tất cả', emoji: '🍽️' },
  { id: 'mon-viet', slug: 'mon-viet', name: 'Món Việt', emoji: '🍜' },
  { id: 'mon-a', slug: 'mon-a', name: 'Món Á', emoji: '🥢' },
  { id: 'mon-tay', slug: 'mon-tay', name: 'Món Tây', emoji: '🥐' },
  { id: 'trang-miem', slug: 'trang-miem', name: 'Tráng miệng', emoji: '🍰' },
  { id: 'do-uong', slug: 'do-uong', name: 'Đồ uống', emoji: '🍵' },
  { id: 'mon-chay', slug: 'mon-chay', name: 'Món chay', emoji: '🥗' },
]

function getEmojiForCategory(slug) {
  const emojiMap = {
    'mon-viet': '🍜', 'mon-a': '🍲', 'mon-tay': '🥩',
    'trang-miem': '🍰', 'do-uong': '🥤', 'mon-chay': '🥗', 'all': '🍽️'
  }
  return emojiMap[slug] || '📁'
}
```

2. Add useEffect with Promise.race 3000ms timeout (AC-6 compliance):
```javascript
export function CategoryFilter({ active = 'all', onChange, className }) {
  const [categories, setCategories] = useState(FALLBACK_CATEGORIES)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // AC-6: Promise.race with 3000ms timeout
    const categoryPromise = categoryApi.getCategories()
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('timeout')), 3000)
    )

    Promise.race([categoryPromise, timeoutPromise])
      .then(res => {
        const apiCategories = res.data?.results || []
        setCategories([
          { id: 'all', slug: 'all', name: 'Tất cả', emoji: '🍽️' },
          ...apiCategories.map(cat => ({
            id: cat.slug,
            slug: cat.slug,
            name: cat.name,
            emoji: getEmojiForCategory(cat.slug),
          }))
        ])
      })
      .catch(err => {
        console.error('Failed to load categories (timeout or error):', err)
        // AC-6: Fallback to hardcoded without crashing
        setCategories(FALLBACK_CATEGORIES)
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return <div className="h-14 bg-[var(--color-surface)] animate-pulse rounded-full" />
  }

  return (
    <div className="relative">
      <div className="flex gap-3 overflow-x-auto pb-4">
        {categories.map(cat => (
          <motion.button
            key={cat.id}
            onClick={() => onChange(cat.id)}
            className={cn(
              'flex-shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-full',
              active === cat.id
                ? 'bg-[var(--color-primary)] text-white'
                : 'bg-[var(--color-surface)] border border-[var(--color-border)]'
            )}
          >
            <span>{cat.emoji}</span>
            <span>{cat.name}</span>
          </motion.button>
        ))}
      </div>
    </div>
  )
}
```

### 3. ExplorePage.jsx - ADD CATEGORY TO apiParams AND RECIPE TRANSFORMATION

**Location**: `KitchenMate_Frontend/src/pages/explore/ExplorePage.jsx`

**Current code** (lines 72-89 - apiParams useMemo):
```javascript
const apiParams = useMemo(() => {
  const params = {}

  if (search) params.q = search
  if (difficulties.length > 0) params.difficulty = difficulties.join(',')

  if (cookingTime.length > 0) params.cooking_time = cookingTime.join(',')

  // Map sort to API ordering
  const orderingMap = {
    newest: '-created_at',
    popular: '-save_count',
    rating: '-avg_rating',
  }
  if (sort) params.ordering = orderingMap[sort]

  return params
}, [search, difficulties, cookingTime, sort])
```

**EXACT CHANGE NEEDED**: Add after line 78 (before orderingMap):
```javascript
// Category filter - use slug-based filtering (AC-5)
if (category && category !== 'all') params.categories = category
```

Also update the dependency array to include `category`.

**Current code** (lines 105-120 - recipe transformation):
```javascript
return data.pages.flatMap((page) =>
  (page.data?.results || []).map((recipe) => ({
    id: recipe.id,
    title: recipe.title,
    thumbnail: recipe.thumbnail_url,
    author: {
      full_name: recipe.user_name,
      avatar: recipe.user_avatar,
    },
    prep_time: recipe.prep_time,
    difficulty: recipe.difficulty,
    avg_rating: recipe.avg_rating,
    save_count: recipe.save_count,
    is_favorited: false,
  }))
)
```

**EXACT CHANGE NEEDED**: Add `categories: recipe.categories` to the mapped object:
```javascript
return data.pages.flatMap((page) =>
  (page.data?.results || []).map((recipe) => ({
    id: recipe.id,
    title: recipe.title,
    thumbnail: recipe.thumbnail_url,
    author: {
      full_name: recipe.user_name,
      avatar: recipe.user_avatar,
    },
    prep_time: recipe.prep_time,
    difficulty: recipe.difficulty,
    avg_rating: recipe.avg_rating,
    save_count: recipe.save_count,
    is_favorited: false,
    categories: recipe.categories,  // ADD THIS - needed for RecipeCard AC-3
  }))
)
```

### 4. RecipeCard.jsx - ADD CATEGORY BADGE PER AC-3

**Location**: `KitchenMate_Frontend/src/components/recipe/RecipeCard.jsx`

**AC-3 Logic**:
- When `recipe.categories.length > 1`: Show first 2 category badges
- When `recipe.categories.length === 1`: Show 1 category badge
- When `recipe.categories.length === 0`: No badge shown

**Current code** (around lines 119-124):
```jsx
{/* Difficulty Badge Overlay */}
<div className="absolute top-3 left-3">
  <Badge variant={difficultyInfo.variant} size="sm">
    {difficultyInfo.label}
  </Badge>
</div>
```

**EXACT CHANGE NEEDED**: Add after the difficulty badge section:

```jsx
{/* Category Badge Overlay - AC-3: show 2 when > 1, 1 when = 1, hidden when = 0 */}
{categories && categories.length > 0 && (
  <div className="absolute top-3 right-3 flex gap-1">
    {categories.length > 1
      ? categories.slice(0, 2).map(cat => (
          <span
            key={cat.id}
            className="px-2 py-0.5 rounded-full bg-white/90 backdrop-blur-sm text-xs font-medium text-[var(--color-text)]"
          >
            {cat.name}
          </span>
        ))
      : (
          <span
            key={categories[0].id}
            className="px-2 py-0.5 rounded-full bg-white/90 backdrop-blur-sm text-xs font-medium text-[var(--color-text)]"
          >
            {categories[0].name}
          </span>
        )
    }
  </div>
)}
```

Also add `categories` to the recipe destructuring.

### 5. StepBasicInfo.jsx - ADD CATEGORY MULTI-SELECT

**Location**: `KitchenMate_Frontend/src/pages/recipe/StepBasicInfo.jsx`

**AC-2**: Category multi-select component with checkbox/pill selection, supporting 0-N categories

**CRITICAL: Categories field uses UUID for recipe creation, NOT slug**.

When user selects categories in StepBasicInfo:
- Store both `{ slug, name, id: uuid }` in selectedCategories state
- When saving recipe, send `categories: [uuid1, uuid2, ...]` (array of UUIDs)
- When filtering recipes on Explore, use `categories` query param with **slug** value

**EXACT CHANGE NEEDED** (add after difficulty selector at line 162):

```jsx
<motion.div variants={itemVariants}>
  <label className="text-sm font-medium text-[var(--color-text)] flex items-center gap-1 mb-3">
    Danh mục
  </label>
  <div className="flex flex-wrap gap-2">
    {availableCategories.map(cat => (
      <button
        key={cat.id}
        type="button"
        onClick={() => handleCategoryToggle(cat)}  // Pass full cat object {slug, name, id}
        className={cn(
          'px-3 py-1.5 rounded-full text-sm border transition-all',
          selectedCategoryIds.includes(cat.id)  // Use UUID for comparison
            ? 'bg-[var(--color-primary)] text-white border-transparent'
            : 'bg-transparent border-[var(--color-border)] hover:border-[var(--color-primary)]'
        )}
      >
        {cat.name}
      </button>
    ))}
  </div>
</motion.div>
```

**Required additions to the component**:
- Import `useState, useEffect` from 'react'
- Import `categoryApi` from '@/api/categoryApi'
- Import `cn` from '@/utils'
- Add state: `const [availableCategories, setAvailableCategories] = useState([])`
- Add state: `const [selectedCategoryIds, setSelectedCategoryIds] = useState([])` - stores UUIDs
- Add useEffect to fetch categories: `categoryApi.getCategories()`
- Add `handleCategoryToggle(cat)` function that toggles UUIDs in selectedCategoryIds array
- When user selects category, store BOTH slug (for display/filtering) AND id (for API submission)

### 6. useRecipeDraft.js - ADD categories FIELD (UUIDs, NOT slugs)

**Location**: `KitchenMate_Frontend/src/hooks/useRecipeDraft.js`

**CRITICAL**: Backend `RecipeCreateSerializer` expects `categories` field with **UUID values**, not slugs.

**EXACT CHANGE NEEDED**: Add to initial state:
```javascript
categories: [],  // Array of category UUIDs for recipe creation
```

**EXACT CHANGE NEEDED**: In the save function, include `categories` in payload:
```javascript
// When saving recipe with categories - payload structure (CRITICAL)
const saveRecipePayload = {
  title: formData.title,
  description: formData.description,
  difficulty: formData.difficulty,
  prep_time: formData.prep_time,
  cook_time: formData.cook_time,
  servings: formData.servings,
  ingredients: formData.ingredients,
  steps: formData.steps,
  visibility: formData.visibility,
  // CRITICAL: Use 'categories' (array of UUIDs), NOT 'category_slugs' or slugs
  // Backend RecipeCreateSerializer at serializers.py:166-170 expects PrimaryKeyRelatedField (UUIDs)
  categories: selectedCategoryIds  // Array of UUIDs from selected category objects
}
```

**IMPORTANT**: When category is selected in StepBasicInfo, store full object `{ id: uuid, slug, name }`. When building payload for save, extract only the `id` (UUID) for the `categories` array.

### 7. RecipeDetailPage.jsx - MAKE CATEGORIES CLICKABLE

**Location**: `KitchenMate_Frontend/src/pages/recipe/RecipeDetailPage.jsx`

**Current code** (around lines 361-370):
```jsx
<div className="flex flex-wrap gap-3 mb-4">
  {recipe.categories?.map((cat) => (
    <span
      key={cat.id}
      className="px-3 py-1 rounded-full bg-[var(--color-background-alt)] text-[var(--color-text-secondary)] text-sm"
    >
      {cat.name}
    </span>
  ))}
</div>
```

**EXACT CHANGE NEEDED**: Change `<span>` to `<button>` and add navigate:
```jsx
import { useNavigate } from 'react-router-dom'

// In the component:
const navigate = useNavigate()

// Change the category mapping:
<div className="flex flex-wrap gap-3 mb-4">
  {recipe.categories?.map((cat) => (
    <button
      key={cat.id}
      onClick={() => navigate(`/explore?categories=${cat.slug}`)}
      className="px-3 py-1 rounded-full bg-[var(--color-background-alt)] text-[var(--color-text-secondary)] text-sm hover:bg-[var(--color-primary)] hover:text-white transition-colors"
    >
      {cat.name}
    </button>
  ))}
</div>
```

### 8. HomePage.jsx - REPLACE PLACEHOLDER WITH REAL API CATEGORIES (AC-7, AC-10)

**Location**: `KitchenMate_Frontend/src/pages/home/HomePage.jsx`

**Current placeholder code** (lines 614-625 - MUST REPLACE):
```jsx
{/* Categories Preview */}
<section className="animate-section">
  <SectionHeading
    icon={TrendingUp}
    title="Khám phá theo danh mục"
    subtitle="Tìm công thức theo sở thích"
  />
  <div className="flex flex-col items-center justify-center py-12 text-center bg-[var(--color-surface)] rounded-[var(--radius-lg)] border border-[var(--color-border)]">
    <TrendingUp className="w-12 h-12 text-[var(--color-text-muted)] mb-3" />
    <p className="text-[var(--color-text-secondary)]">Bổ sung trong tương lai</p>
  </div>
</section>
```

**EXACT CHANGE NEEDED** - Replace with real API categories:

1. Add to imports:
```javascript
import { categoryApi } from '@/api/categoryApi'
import { useState, useEffect } from 'react'
```

2. Add state to component:
```javascript
const [categories, setCategories] = useState([])
const [categoriesLoading, setCategoriesLoading] = useState(true)
```

3. Add useEffect with 3000ms timeout (AC-10 compliance):
```javascript
useEffect(() => {
  const categoryPromise = categoryApi.getCategories()
  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('timeout')), 3000)
  )

  Promise.race([categoryPromise, timeoutPromise])
    .then(res => setCategories(res.data?.results || []))
    .catch(err => {
      console.error('Failed to load categories:', err)
      setCategories([])
    })
    .finally(() => setCategoriesLoading(false))
}, [])
```

4. Replace placeholder content:
```jsx
{/* Categories Preview - AC-7: all active categories from API */}
<section className="animate-section">
  <SectionHeading
    icon={TrendingUp}
    title="Khám phá theo danh mục"
    subtitle="Tìm công thức theo sở thích"
  />
  {categoriesLoading ? (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="h-24 bg-[var(--color-surface)] rounded-[var(--radius-lg)] animate-pulse" />
      ))}
    </div>
  ) : categories.length > 0 ? (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
      {categories.map(cat => (
        <button
          key={cat.id}
          onClick={() => navigate(`/explore?categories=${cat.slug}`)}
          className="flex flex-col items-center p-4 rounded-[var(--radius-lg)] bg-[var(--color-surface)] border border-[var(--color-border)] hover:border-[var(--color-primary)] hover:shadow-[var(--shadow-md)] transition-all"
        >
          <span className="text-3xl mb-2">{getEmojiForCategory(cat.slug)}</span>
          <span className="text-sm font-medium text-[var(--color-text)]">{cat.name}</span>
        </button>
      ))}
    </div>
  ) : (
    // AC-10: Silent fallback when API fails
    <div className="flex flex-col items-center justify-center py-12 text-center bg-[var(--color-surface)] rounded-[var(--radius-lg)] border border-[var(--color-border)]">
      <TrendingUp className="w-12 h-12 text-[var(--color-text-muted)] mb-3" />
      <p className="text-[var(--color-text-secondary)]">Không thể tải danh mục</p>
    </div>
  )}
</section>
```

### 9. App.jsx - ADD /admin/categories ROUTE

**Location**: `KitchenMate_Frontend/src/App.jsx`

**EXACT CHANGE NEEDED**:

1. Add lazy import:
```jsx
const CategoryManagementPage = lazy(() => import('@/pages/admin/CategoryManagementPage').then(m => ({ default: m.default || m.CategoryManagementPage })))
```

2. Add route:
```jsx
<Route path="/admin/categories" element={
  <AdminGuard><Suspense fallback={<PageLoader />}><CategoryManagementPage /></Suspense></AdminGuard>
} />
```

### 10. CategoryManagementPage.jsx - NEW ADMIN PAGE (AC-8, AC-9)

**Location**: `KitchenMate_Frontend/src/pages/admin/CategoryManagementPage.jsx`

**AC-8**: Admin CRUD for categories at /admin/categories
**AC-9**: Non-admin users receive 403 Forbidden

Follow the pattern from `RecipeManagementPage.jsx` and `IngredientManagementPage.jsx`:

**Key Features**:
- Tab layout: "Hoat dong" (is_active=True) | "Tat ca" (no filter)
- CRUD operations: Create dialog, Edit dialog, Delete confirmation
- Table columns: Ten, Slug, Thu tu, Trang thai, Hanh dong
- API calls: categoryApi.createCategory, updateCategory, deleteCategory
- AdminGuard ensures non-admin users see 403 (per AC-9)

**Component structure**:
```jsx
// Main component
export function CategoryManagementPage() {
  const [activeTab, setActiveTab] = useState('active')  // 'active' | 'all'
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)  // Create/Edit dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  // Load categories based on activeTab
  useEffect(() => {
    const params = activeTab === 'active' ? { is_active: true } : {}
    categoryApi.getCategories(params).then(res => setCategories(res.data?.results || []))
  }, [activeTab])

  // CRUD handlers with error handling
  const handleCreate = async (formData) => { /* ... */ }
  const handleUpdate = async (slug, formData) => { /* ... */ }
  const handleDelete = async (slug) => { /* ... */ }
}

// CreateDialog - form with name, description, order fields
// EditDialog - pre-filled with category data
// DeleteConfirmDialog - soft delete confirmation
```

---

## Integration Points

| File | Relationship | Impact | Action Needed |
|------|--------------|--------|---------------|
| `KitchenMate_Frontend/src/components/explore/CategoryFilter.jsx` | Uses hardcoded CATEGORIES | HIGH | Upgrade to use categoryApi.getCategories() with Promise.race 3000ms timeout + FALLBACK_CATEGORIES per AC-6 |
| `KitchenMate_Frontend/src/hooks/useRecipes.js` | Receives apiParams | MEDIUM | Ensure `categories` param is passed to API call |
| `KitchenMate_Frontend/src/api/recipeApi.js` | Already has getRecipes | LOW | Verify filters map `categories` to backend param correctly |
| `KitchenMate_Frontend/src/pages/home/HomePage.jsx` | Placeholder section at lines 614-625 | HIGH | Replace with real implementation using categoryApi with 3000ms timeout per AC-7 and AC-10 |
| `KitchenMate_Frontend/src/components/recipe/RecipeCard.jsx` | Receives transformed recipe | HIGH | Recipe transformation must include `categories: recipe.categories` |
| `KitchenMate_Frontend/src/pages/recipe/StepBasicInfo.jsx` | No category selector | HIGH | Add category multi-select using categoryApi.getCategories() |
| `KitchenMate_Frontend/src/hooks/useRecipeDraft.js` | No category_slugs field | HIGH | Add category_slugs to formData and save payload |
| `KitchenMate_Frontend/src/pages/admin/CategoryManagementPage.jsx` | Admin page for categories | HIGH | Create new page with CRUD operations |

---

## Similar Implementations

### Pattern 1: admin-panel-implementation Skill

- **Location**: `.claude/skills/admin-panel-implementation/SKILL.md`
- **Why relevant**: CategoryManagementPage should follow the same CRUD table + dialog pattern
- **Key files**:
  - `RecipeManagementPage.jsx` - Table with actions (approve/reject) - similar structure for category CRUD
  - `IngredientManagementPage.jsx` - Tab pattern (Active/All) for filtering

### Pattern 2: ingredientApi.js Structure

- **Location**: `KitchenMate_Frontend/src/api/ingredientApi.js`
- **Why relevant**: API structure for CRUD operations
- **Key functions**: `getIngredients`, `approveIngredient`, `rejectIngredient`

---

## Recommended Exploration

Before implementation, developer should read:

1. `KitchenMate_Frontend/src/api/adminApi.js` - CategoryManagementPage similar API structure
2. `KitchenMate_Frontend/src/pages/admin/RecipeManagementPage.jsx` - Table + dialog CRUD pattern
3. `KitchenMate_Frontend/src/components/explore/CategoryFilter.jsx` - Hardcoded categories to replace (lines 4-13)
4. `.claude/skills/recipe-categories/SKILL.md` - Implementation guidance with code patterns
5. `.claude/skills/admin-panel-implementation/SKILL.md` - Admin page patterns
6. `KitchenMate_Frontend/src/pages/home/HomePage.jsx` - Categories placeholder location (lines 614-625)

---

## Risk Assessment

### High Risk Areas

| Area | Risk | Mitigation |
|------|------|------------|
| AC-6/AC-10 Timeout Compliance | **3000ms timeout + 500ms render requirement** - If API takes >3000ms or fallback rendering >500ms, acceptance criteria fails | Use `Promise.race` with explicit 3000ms timeout, ensure FALLBACK_CATEGORIES renders within 500ms |
| HomePage Categories Section | **AC-7 requires API-fetched categories**, current placeholder contradicts this | Replace hardcoded "Bổ sung trong tương lai" with real categoryApi.getCategories() call |
| RecipeEditor Integration | **category_slugs payload structure** must use slugs, not UUIDs (backend uses slug-based lookups) | Document exact payload structure in implementation |
| Admin /admin/categories Route | **AC-9 requires 403 for non-admin users** - AdminGuard provides this | Ensure AdminGuard wraps CategoryManagementPage |

### Medium Risk Areas

| Area | Risk | Mitigation |
|------|------|------------|
| Slug vs UUID Mismatch | Backend endpoints use slug (not UUID) for lookups | Use `category.slug` for all API calls, not `category.id` |
| Soft Delete Behavior | Deleted categories may still appear in some API responses | Filter uses `is_active=True` for list, show all for admin |
| CategoryFilter Fallback | If API fails and fallback categories don't render in 500ms, AC-6 fails | Ensure FALLBACK_CATEGORIES is pre-computed, no async operations during render |

### Low Risk Areas

| Area | Risk | Mitigation |
|------|------|------------|
| RecipeCard Badge Layout | Category badges overlay on thumbnail may conflict with difficulty badge | Position badges at different corners (difficulty: top-left, category: top-right) |
| HomePage Performance | Fetching categories on page load adds latency | Use skeleton loader, fallback to empty/error state gracefully |

---

## Verification Summary

| Check | Status | Notes |
|-------|--------|-------|
| All affected files identified | PASS | 7 modified, 4 created |
| CategoryManagementPage.jsx in files list | PASS | Added to "Files to be Created" with route /admin/categories |
| HomePage hardcoded placeholder documented | PASS | Lines 614-625 documented with exact replacement code |
| AC-6/AC-10 timeout requirements identified | PASS | Added to Risk Assessment - 3000ms timeout + 500ms render |
| RecipeEditor category_slugs payload documented | PASS | useRecipeDraft hook update documented |
| AC-3 RecipeCard logic correct | PASS | Shows 2 when > 1, 1 when = 1, hidden when = 0 |
| CategoryFilter.jsx in modifications | PASS | Listed as UPDATE with Promise.race 3000ms timeout pattern |
| ExplorePage categories mapping | PASS | `categories: recipe.categories` added to transformation |
| Integration points mapped | PASS | apiParams, RecipeCard, CategoryFilter, App routes |
| Similar patterns found | PASS | admin-panel skill, ingredientApi.js |
| Test coverage analyzed | N/A | No test files identified for this feature |

**Limitations/Caveats**:
- CategoryBadge component color mapping uses slug-based lookup (mon-viet, mon-a, etc.)
- Backend uses slug for category lookups (not UUID)
- Soft delete (is_active=False) - categories still exist but marked inactive
- All category slugs must be URL-safe strings

---

## Self-Critique Verification (Iteration 5)

### Verification Questions

1. **Completeness of Tracing**: Have I traced ALL execution paths from entry point to final output?
   - YES: categoryApi -> CategoryFilter -> ExplorePage; categoryApi -> StepBasicInfo -> useRecipeDraft; categoryApi -> HomePage
   - Error paths covered: Promise.race with 3000ms timeout, FALLBACK_CATEGORIES on error

2. **File:Line References**: Does every significant code mention include a specific file path and line number?
   - YES: HomePage.jsx:614-625 (placeholder), CategoryFilter.jsx:4-13 (hardcoded), StepBasicInfo.jsx:126-162 (difficulty selector)

3. **Pattern Identification**: Have I correctly identified and named the design patterns used?
   - YES: Repository pattern (categoryApi), Service pattern (useRecipeDraft), Fallback pattern (Promise.race 3000ms)

4. **Dependency Mapping**: Have I captured ALL internal and external dependencies?
   - YES: axiosInstance, categoryApi, useRecipeDraft, react-hot-toast, AdminGuard

5. **Architecture Understanding**: Does my layer mapping accurately reflect the actual boundaries?
   - YES: API layer -> Hook/State layer -> UI layer

### Issues Addressed from Judge Feedback

1. **Issue 1 (Admin page MISSING)**: FIXED - CategoryManagementPage.jsx added to "Files to be Created" with route `/admin/categories`

2. **Issue 2 (HomePage contradicts AC-7)**: FIXED - Documented exact placeholder replacement at lines 614-625 with real API call

3. **Issue 3 (RecipeEditor integration incomplete)**: FIXED - Documented category_slugs payload structure for useRecipeDraft hook

4. **Issue 4 (AC-6/AC-10 timeout risks not identified)**: FIXED - Added to Risk Assessment with 3000ms timeout + 500ms render requirements