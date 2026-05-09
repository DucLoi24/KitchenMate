---
title: Codebase Impact Analysis - Implement Recipe Categories Feature
task_file: .specs/tasks/draft/implement-recipe-categories.feature.md
scratchpad: .specs/scratchpad/244d61cf.md
created: 2026-05-06
status: complete
---

# Codebase Impact Analysis: Implement Recipe Categories Feature

## Summary

- **Files to Modify**: 6 files
- **Files to Create**: 1 file
- **Files to Delete**: 0 files
- **Test Files Affected**: 0 files (no test files yet for categories feature)
- **Risk Level**: MEDIUM

---

## Files to be Modified/Created

```
KitchenMate_Frontend/src/
├── api/
│   └── categoryApi.js              # NEW: Category CRUD API functions
├── components/
│   ├── explore/
│   │   └── CategoryFilter.jsx      # UPDATE: Replace hardcoded with API + fallback
│   └── recipe/
│       └── RecipeCard.jsx          # UPDATE: Add category badge overlay
└── pages/
    ├── explore/
    │   └── ExplorePage.jsx          # UPDATE: Connect category to apiParams, add categories to transformation
    ├── home/
    │   └── HomePage.jsx            # UPDATE: Replace placeholder with categories grid
    └── recipe/
        ├── RecipeDetailPage.jsx    # UPDATE: Make category badges clickable
        └── StepBasicInfo.jsx       # UPDATE: Add category multi-select
```

---

## Useful Resources for Implementation

### Pattern References

```
KitchenMate_Frontend/src/
├── api/
│   └── recipeApi.js                # Pattern to follow for categoryApi.js structure
├── hooks/
│   └── useRecipes.js               # useRecipesInfinite already supports baseParams
└── components/
    └── explore/
        └── CategoryFilter.jsx      # Current hardcoded version to replace

.claude/skills/
├── recipe-categories/SKILL.md      # Full implementation guidance (CRITICAL)
└── admin-panel-implementation/SKILL.md  # For admin categories page pattern
```

---

## Key Interfaces & Contracts

### categoryApi.js (NEW FILE)

| Function | Signature | Description |
|----------|-----------|-------------|
| `getCategories` | `(params?) => Promise` | GET /recipes/categories/ - List active categories |
| `getCategory` | `(slug) => Promise` | GET /recipes/categories/{slug}/ - Get single category |
| `createCategory` | `(data) => Promise` | POST /recipes/categories/ - Create category (admin) |
| `updateCategory` | `(slug, data) => Promise` | PATCH /recipes/categories/{slug}/ - Update category (admin) |
| `deleteCategory` | `(slug) => Promise` | DELETE /recipes/categories/{slug}/ - Soft delete (admin) |

**Response shape for list**:
```json
{
  "success": true,
  "data": {
    "count": 6,
    "next": null,
    "previous": null,
    "results": [
      { "id": "uuid", "name": "Món Việt", "slug": "mon-viet", "description": "...", "order": 1, "is_active": true }
    ]
  }
}
```

### CRITICAL: Slug vs UUID

- **category.id** = UUID, display only
- **category.slug** = string (URL-safe), used for ALL API lookups
- RecipeEditor must store and pass `category.slug` to API, NOT `category.id`

---

## Integration Points

### 1. ExplorePage - Category NOT Connected to apiParams (CRITICAL FIX)

**File**: `KitchenMate_Frontend/src/pages/explore/ExplorePage.jsx:72-89`

**Problem**: The `category` state at line 61 is NOT connected to `apiParams`. Changing category will NOT trigger API re-fetch.

**Current code**:
```javascript
const apiParams = useMemo(() => {
  const params = {}
  if (search) params.q = search
  if (difficulties.length > 0) params.difficulty = difficulties.join(',')
  if (cookingTime.length > 0) params.cooking_time = cookingTime.join(',')
  const orderingMap = { newest: '-created_at', popular: '-save_count', rating: '-avg_rating' }
  if (sort) params.ordering = orderingMap[sort]
  return params
}, [search, difficulties, cookingTime, sort])  // MISSING: category
```

**Required change**:
```javascript
const apiParams = useMemo(() => {
  const params = {}
  if (search) params.q = search
  if (difficulties.length > 0) params.difficulty = difficulties.join(',')
  if (cookingTime.length > 0) params.cooking_time = cookingTime.join(',')
  const orderingMap = { newest: '-created_at', popular: '-save_count', rating: '-avg_rating' }
  if (sort) params.ordering = orderingMap[sort]
  if (category !== 'all') params.categories = category  // ADD THIS LINE
  return params
}, [search, difficulties, cookingTime, sort, category])  // ADD 'category' HERE
```

**Also update URL sync useEffect (lines 124-132)** to include category:
```javascript
if (category && category !== 'all') newParams.categories = category  // ADD THIS
// dependency array must include: category
```

### 2. ExplorePage - Recipe Transformation Missing categories (CRITICAL FIX)

**File**: `KitchenMate_Frontend/src/pages/explore/ExplorePage.jsx:105-120`

**Problem**: Recipe transformation does not include `categories` field, so RecipeCard will not display category badges.

**Current code**:
```javascript
return data.pages.flatMap((page) =>
  (page.data?.results || []).map((recipe) => ({
    id: recipe.id,
    title: recipe.title,
    thumbnail: recipe.thumbnail_url,
    author: { full_name: recipe.user_name, avatar: recipe.user_avatar },
    prep_time: recipe.prep_time,  // MISSING categories
    difficulty: recipe.difficulty,
    avg_rating: recipe.avg_rating,
    save_count: recipe.save_count,
    is_favorited: false,
  }))
)
```

**Required change**:
```javascript
return data.pages.flatMap((page) =>
  (page.data?.results || []).map((recipe) => ({
    id: recipe.id,
    title: recipe.title,
    thumbnail: recipe.thumbnail_url,
    author: { full_name: recipe.user_name, avatar: recipe.user_avatar },
    categories: recipe.categories || [],  // ADD THIS LINE
    prep_time: recipe.prep_time,
    difficulty: recipe.difficulty,
    avg_rating: recipe.avg_rating,
    save_count: recipe.save_count,
    is_favorited: false,
  }))
)
```

### 3. CategoryFilter.jsx - Replace Hardcoded with API Data

**File**: `KitchenMate_Frontend/src/components/explore/CategoryFilter.jsx`

**Changes**:
1. Import `categoryApi`
2. Add `useState` for categories list and loading state
3. Add `useEffect` to fetch from API
4. Add `FALLBACK_CATEGORIES` for error case (AC-6 compliance)
5. Remove hardcoded `CATEGORIES` array (lines 4-13)
6. Map API categories to component format

**Required fallback categories** (AC-6):
```javascript
const FALLBACK_CATEGORIES = [
  { id: 'mon-viet', slug: 'mon-viet', name: 'Món Việt' },
  { id: 'mon-a', slug: 'mon-a', name: 'Món Á' },
  { id: 'mon-tay', slug: 'mon-tay', name: 'Món Tây' },
  { id: 'trang-miem', slug: 'trang-miem', name: 'Tráng miệng' },
  { id: 'do-uong', slug: 'do-uong', name: 'Đồ uống' },
  { id: 'mon-chay', slug: 'mon-chay', name: 'Món chay' },
]
```

### 4. RecipeCard.jsx - Add Category Badges

**File**: `KitchenMate_Frontend/src/components/recipe/RecipeCard.jsx`

**Location**: After line 124 (after Difficulty Badge), before Action Buttons

**Required change**:
```jsx
{/* Category Badges Overlay */}
{recipe.categories?.length > 0 && (
  <div className="absolute top-3 left-3 flex gap-1 flex-wrap">
    {recipe.categories.slice(0, 2).map(cat => (
      <span
        key={cat.id}
        className="px-2 py-0.5 rounded-full bg-white/90 backdrop-blur-sm text-xs font-medium text-[var(--color-text-secondary)]"
      >
        {cat.name}
      </span>
    ))}
  </div>
)}
```

### 5. StepBasicInfo.jsx - Add Category Multi-Select

**File**: `KitchenMate_Frontend/src/pages/recipe/StepBasicInfo.jsx`

**Location**: After line 162 (after difficulty selector closing </div>), before prep_time Input

**Required addition**:
```jsx
<motion.div variants={itemVariants}>
  <label className="text-sm font-medium text-[var(--color-text)] flex items-center gap-1 mb-3">
    Danh mục
  </label>
  <div className="flex flex-wrap gap-2">
    {[
      { slug: 'mon-viet', name: 'Món Việt' },
      { slug: 'mon-a', name: 'Món Á' },
      { slug: 'mon-tay', name: 'Món Tây' },
      { slug: 'trang-miem', name: 'Tráng miệng' },
      { slug: 'do-uong', name: 'Đồ uống' },
      { slug: 'mon-chay', name: 'Món chay' },
    ].map((cat) => {
      const isSelected = (data.categories || []).includes(cat.slug)
      return (
        <button
          key={cat.slug}
          type="button"
          onClick={() => {
            const current = data.categories || []
            const updated = isSelected
              ? current.filter(s => s !== cat.slug)
              : [...current, cat.slug]
            onChange((prev) => ({ ...prev, categories: updated }))
          }}
          className={cn(
            'px-3 py-1.5 rounded-full text-sm border transition-all',
            isSelected
              ? 'bg-[var(--color-primary)] text-white border-transparent'
              : 'bg-transparent border-[var(--color-border)] hover:border-[var(--color-primary)]'
          )}
        >
          {cat.name}
        </button>
      )
    })}
  </div>
</motion.div>
```

**Note**: Store slugs (not UUIDs) in data.categories for backend API compatibility.

### 6. RecipeDetailPage.jsx - Make Category Badges Clickable

**File**: `KitchenMate_Frontend/src/pages/recipe/RecipeDetailPage.jsx:714-723`

**Current code**:
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

**Required change**:
```jsx
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

**Note**: Ensure `useNavigate` is imported (should already be present).

### 7. HomePage.jsx - Replace Placeholder with Categories Grid

**File**: `KitchenMate_Frontend/src/pages/home/HomePage.jsx:614-625`

**Current code**:
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

**Replace with**:
```jsx
{/* Categories Preview */}
<section className="animate-section">
  <SectionHeading
    icon={TrendingUp}
    title="Khám phá theo danh mục"
    subtitle="Tìm công thức theo sở thích"
  />
  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
    {[
      { slug: 'mon-viet', name: 'Món Việt', emoji: '🍜' },
      { slug: 'mon-a', name: 'Món Á', emoji: '🍲' },
      { slug: 'mon-tay', name: 'Món Tây', emoji: '🥩' },
      { slug: 'trang-miem', name: 'Tráng miệng', emoji: '🍰' },
      { slug: 'do-uong', name: 'Đồ uống', emoji: '🥤' },
      { slug: 'mon-chay', name: 'Món chay', emoji: '🥗' },
    ].map((cat) => (
      <button
        key={cat.slug}
        onClick={() => navigate(`/explore?categories=${cat.slug}`)}
        className="flex flex-col items-center p-4 rounded-[var(--radius-lg)] bg-[var(--color-surface)] border border-[var(--color-border)] hover:border-[var(--color-primary)] hover:bg-[var(--color-primary)]/5 transition-all"
      >
        <span className="text-3xl mb-2">{cat.emoji}</span>
        <span className="text-sm font-medium text-[var(--color-text)]">{cat.name}</span>
      </button>
    ))}
  </div>
</section>
```

---

## Test Coverage

### Existing Tests to Update
| Test File | Tests Affected | Update Required |
|-----------|---------------|----------------|
| None identified | N/A | N/A |

### New Tests Needed
| Test Type | Location | Coverage Target |
|-----------|----------|-----------------|
| Integration | CategoryFilter API fetch + fallback | AC-5, AC-6 |
| Integration | ExplorePage category filter → API re-fetch | AC-5 |
| Unit | categoryApi CRUD functions | AC-1 |

---

## Risk Assessment

### High Risk Areas

| Area | Risk | Mitigation |
|------|------|------------|
| ExplorePage apiParams useMemo dependency | HIGH - category filter will silently not work | Ensure `category` added to both params building AND dependency array |
| Slug vs UUID mismatch in StepBasicInfo | MEDIUM - will cause 404 on save | Must use slug for API, not UUID |
| Recipe transformation missing categories | MEDIUM - RecipeCard badges won't show | Add `categories: recipe.categories \|\| []` to transform |

---

## Recommended Exploration

Before implementation, developer should read:

1. `KitchenMate_Frontend/src/pages/explore/ExplorePage.jsx:59-132` - Understanding apiParams and URL sync
2. `KitchenMate_Frontend/src/api/recipeApi.js` - Pattern for categoryApi.js
3. `.claude/skills/recipe-categories/SKILL.md` - Full implementation guidance (CRITICAL)

---

## Verification Summary

| Check | Status | Notes |
|-------|--------|-------|
| All affected files identified | YES | 6 files identified |
| Integration points mapped | YES | 7 integration points with exact line numbers |
| Similar patterns found | YES | recipeApi.js pattern, admin-panel-implementation skill |
| Test coverage analyzed | YES | New tests needed for CategoryFilter and ExplorePage |
| Risks assessed | YES | 3 risk areas identified with mitigations |
| Line-specific guidance provided | YES | All changes show exact file:line:current_code and new_code |
| Self-critique completed | YES | 5 verification questions checked |

Limitations/Caveats: HomePage categories use hardcoded array (not API) per skill guidance for initial integration. Admin categories page (/admin/categories) not included in this analysis - separate task.