# Phase 4.3: Explore Page — Design Spec

**Created:** 2026-04-23
**Phase:** 4.3 (Trang Khám phá công thức)
**Status:** Approved

---

## 1. Overview

Trang Khám phá cho phép user tìm kiếm và lọc công thức theo nhiều tiêu chí: từ khóa, độ khó, thời gian nấu, và nguyên liệu.

**Route:** `/explore`

---

## 2. API Integration

### Endpoints

| Action | Method | Endpoint |
|--------|--------|----------|
| Search recipes | GET | `/api/recipes/` |
| Ingredient autocomplete | GET | `/api/ingredients/search/` |

### URL Schema

```
/explore?q=<search>&difficulty=<EASY|MEDIUM|HARD>&cooking_time_max=<15|30|60>&ingredients=<id1,id2>&page=<n>
```

| Param | Type | Description |
|-------|------|-------------|
| `q` | string | Search text (title search) |
| `difficulty` | string | EASY \| MEDIUM \| HARD |
| `cooking_time_max` | integer | Max cooking time in minutes (15, 30, 60) |
| `ingredients` | string | Comma-separated ingredient IDs |
| `page` | integer | Pagination page number |

---

## 3. Layout

### Desktop (≥1024px)

```
┌─────────────────────────────────────────────────────────┐
│  [Search Bar ________________________________] [🔍]     │
├──────────────┬──────────────────────────────────────────┤
│ FILTERS      │  Kết quả (12/page)                       │
│              │                                           │
│ □ Độ khó     │  [RecipeCard] [RecipeCard] [RecipeCard]  │
│   ○ EASY     │                                           │
│   ○ MEDIUM   │  [RecipeCard] [RecipeCard] [RecipeCard]  │
│   ○ HARD     │                                           │
│              │  ───────────────────────────────────────  │
│ □ Thời gian  │  [< Prev] Trang 1/5 [Next >]             │
│   ○ <15p     │                                           │
│   ○ 15-30p   │                                           │
│   ○ 30-60p   │                                           │
│   ○ 60p+     │                                           │
│              │                                           │
│ □ Nguyên    │                                           │
│   liệu      │                                           │
│ [🔍 Tìm...] │                                           │
│ [tag1] [x]  │                                           │
│ [tag2] [x]  │                                           │
└──────────────┴──────────────────────────────────────────┘
```

- FilterSidebar: fixed width 250px, left side
- Content area: RecipeCard grid (3 columns desktop)
- Search bar: full width at top

### Mobile (<1024px)

```
┌─────────────────────────┐
│  [🔍 Tìm kiếm...]     │
├─────────────────────────┤
│  [<FaFilter /> Bộ lọc] │  ← tap to expand bottom sheet
├─────────────────────────┤
│                         │
│  [RecipeCard]           │
│  [RecipeCard]           │
│  [RecipeCard]           │
│                         │
│  [< Prev] [1] [Next >] │
└─────────────────────────┘
```

- FilterBottomSheet: modal from bottom, triggered by "Bộ lọc" button
- RecipeCard: 1 column mobile

### Responsive Breakpoints

| Breakpoint | RecipeCard Columns | Filter UI |
|------------|-------------------|-----------|
| < 768px | 1 | FilterBottomSheet |
| 768-1023px | 2 | FilterBottomSheet |
| ≥ 1024px | 3 | FilterSidebar |

---

## 4. Components

### ExplorePage (`pages/ExplorePage.jsx`)

- Container component
- Reads URL params via `useSearchParams`
- Fetches data via `useRecipesFiltered` hook
- Passes filter state down to FilterSidebar/FilterBottomSheet

### SearchBar (`components/explore/SearchBar.jsx`)

- Debounced search input (300ms)
- Updates URL params on change (replace state)
- Icon: `<FaSearch />`
- `aria-label="Tìm kiếm công thức"`

### FilterSidebar (`components/explore/FilterSidebar.jsx`)

- Desktop only (md:hidden above 1024px)
- Sections: Độ khó, Thời gian, Nguyên liệu
- Collapsible sections with `<FaChevronDown />`
- IngredientAutocomplete embedded inside
- On filter change: calls `onChange` callback

### FilterBottomSheet (`components/explore/FilterBottomSheet.jsx`)

- Mobile only (hidden md:block)
- Same filter logic as FilterSidebar
- Uses Headless UI Dialog or custom implementation
- Triggered by "Bộ lọc" button with `<FaFilter />`

### IngredientAutocomplete (`components/explore/IngredientAutocomplete.jsx`)

- Multi-select: selected ingredients shown as removable tags
- Input with debounced autocomplete (300ms)
- Calls `GET /api/ingredients/search/?q=<search>`
- Tags displayed with `<IoMdClose />` for removal
- Icon: `<FaSearch />` for search input

### ErrorState Component

- Icon: `<FaExclamationCircle />`
- Message display
- "Thử lại" button (calls `refetch()`)

### EmptyState Component

- Icon: `<FaSearch />`
- Title: "Không tìm thấy kết quả"
- Description: "Thử điều chỉnh bộ lọc hoặc từ khóa tìm kiếm"
- `role="status"`

---

## 5. Data Flow

```
User types in SearchBar
  ↓
debounce 300ms
  ↓
update URL params (replace state, no history push)
  ↓
useSearchParams() triggers re-render
  ↓
useEffect detect param changes → useRecipesFiltered(params)
  ↓
React Query fetches → GET /api/recipes/?...
  ↓
RecipeCard list rendered
```

### useRecipesFiltered Hook

```javascript
export function useRecipesFiltered(params) {
  return useQuery({
    queryKey: ['recipes', 'filtered', params],
    queryFn: () => recipeApi.searchRecipes(params),
    staleTime: 30_000,
  });
}
```

### recipeApi.searchRecipes

```javascript
export const recipeApi = {
  searchRecipes: async (params) => {
    const { search, difficulty, cooking_time_max, ingredients, page } = params;
    const filteredParams = {
      ...(search && { search }),
      ...(difficulty && { difficulty }),
      ...(cooking_time_max && { cooking_time_max }),
      ...(ingredients?.length && { ingredients: ingredients.join(',') }),
      page,
    };
    const response = await axiosInstance.get('/recipes/', { params: filteredParams });
    return response.data;
  },
};
```

---

## 6. Filter State Logic

### URL → Filter params (read on render)

```javascript
const params = {
  search: searchParams.get('q') || '',
  difficulty: searchParams.get('difficulty') || null,
  cooking_time_max: searchParams.get('cooking_time_max') ? parseInt(searchParams.get('cooking_time_max')) : null,
  ingredients: searchParams.get('ingredients')?.split(',').filter(Boolean) || [],
  page: parseInt(searchParams.get('page') || '1'),
};
```

### Filter change → URL update

```javascript
const handleFilterChange = (newFilters) => {
  setSearchParams(prev => {
    // Merge newFilters into prev
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value === null || value === undefined || (Array.isArray(value) && value.length === 0)) {
        prev.delete(key);
      } else {
        prev.set(key, Array.isArray(value) ? value.join(',') : value);
      }
    });
    return prev;
  }, { replace: false });
};
```

---

## 7. Icons (react-icons)

All icons from `react-icons/fa` or `react-icons/io`:

| Usage | Icon |
|-------|------|
| Search | `<FaSearch />` |
| Filter button | `<FaFilter />` |
| Close/Remove | `<IoMdClose />` |
| Clock | `<FaClock />` |
| Fire (difficulty) | `<FaFire />` |
| Chevron down | `<FaChevronDown />` |
| Chevron left | `<FaChevronLeft />` |
| Chevron right | `<FaChevronRight />` |
| Error | `<FaExclamationCircle />` |
| Loading | `<FaSpinner />` |

---

## 8. Accessibility

- Search input: `aria-label="Tìm kiếm công thức"`, `type="search"`
- Filter checkboxes: `role="checkbox"`, `aria-checked`
- Mobile bottom sheet: `role="dialog"`, `aria-modal="true"`, focus trap when open
- Keyboard navigation: Tab through all interactive elements, Enter to select
- Loading skeleton: `aria-busy="true"` on container
- Empty state: `role="status"`

---

## 9. File Structure

```
src/
├── pages/
│   └── ExplorePage.jsx              (NEW)
├── components/
│   └── explore/
│       ├── SearchBar.jsx            (NEW)
│       ├── FilterSidebar.jsx        (NEW)
│       ├── FilterBottomSheet.jsx     (NEW)
│       └── IngredientAutocomplete.jsx (NEW)
├── hooks/
│   └── useRecipesFiltered.js        (NEW)
└── api/
    └── recipeApi.js                 (MODIFY: add searchRecipes)
```

---

## 10. Dependencies

- `react-icons` (already installed)
- `@headlessui/react` (already installed, for bottom sheet dialog)
- `react-router-dom` (useSearchParams)
- `@tanstack/react-query` (already installed)
- `axios` (already installed)

No new dependencies required.
