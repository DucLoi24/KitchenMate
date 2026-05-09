---
title: Implement recipe categories feature
status: draft
issue_type: feature
complexity: L
---

> **Required Skill**: You MUST use and analyse `recipe-categories` skill before doing any modification to task file or starting implementation of it!
>
> Skill location: `.claude/skills/recipe-categories/SKILL.md`

## Initial User Prompt

Xử lý recipes categories như đã brainstorm - Frontend chưa làm phần nào liên quan đến category. Cần thêm:
- API functions cho categories (CRUD)
- Category field trong Recipe Editor (StepBasicInfo)
- Category badge trên RecipeCard
- Category badge trên RecipeDetailPage
- Explore page với category filter
- Categories section trên HomePage
- Admin CRUD categories tại /admin/categories

## Description

This feature adds recipe category functionality across the KitchenMate frontend. Recipe categories allow users to organize and discover recipes by type (cuisine: Vietnamese, Asian, European; meal type: breakfast, dessert, BBQ, etc.).

**Why needed**: Users struggle to find recipes without categories. Categories improve discovery, help recipe creators organize content, and provide admins a way to manage recipe classification.

**Who benefits**: End users (browsing/discovery), recipe creators (organization), admins (content management).

**Key implementation areas**:
1. API functions for category CRUD operations
2. Category selector in Recipe Editor (StepBasicInfo)
3. Category badges on RecipeCard and RecipeDetailPage
4. Dynamic category filter on Explore page (replacing hardcoded static data)
5. Categories section on HomePage
6. Admin CRUD page at /admin/categories

**Constraints**: Backend category API already exists at `/recipes/categories/`. Categories use soft delete. Multiple categories per recipe supported.

**Deletion Behavior**: Backend prevents deletion of categories with attached recipes. Admin attempting to delete such a category receives 400 error with message "Không thể xóa danh mục đã có công thức liên kết". Only categories with zero attached recipes can be successfully deleted.

**Scope**:
- Included: categoryApi.js with CRUD functions; Category multi-select in Recipe Editor StepBasicInfo; Category badge on RecipeCard (first 2 categories); Category badges on RecipeDetailPage (all categories, clickable); Explore page dynamic category filter; HomePage categories section; Admin CRUD page at /admin/categories with soft delete
- Excluded: Backend category implementation (already exists), ingredient categories, category-based recommendations algorithm, category statistics/analytics

**User Scenarios**:
1. **Primary Flow**: User on HomePage clicks category -> navigates to Explore filtered by category -> browses recipes with category badges -> clicks recipe detail -> clicks category badge -> Explore filtered again
2. **Alternative Flow**: Recipe creator opens editor -> selects categories in StepBasicInfo -> saves recipe -> categories persist on recipe
3. **Error Handling**: Explore page falls back to hardcoded categories if API fails; non-admin users see 403 on admin pages; admin delete with attached recipes shows 400 error with message "Không thể xóa danh mục đã có công thức liên kết"

## Acceptance Criteria

### Functional Requirements

- [ ] **AC-1**: categoryApi.js exports functions: getCategories(), getCategory(slug), createCategory(data), updateCategory(slug, data), deleteCategory(slug)
  - Given: categoryApi.js exists in src/api/
  - When: Frontend code imports and calls any exported function
  - Then: Function makes correct API call to backend and returns response data; getCategories() returns a flat array of category objects; single resource responses return data directly

- [ ] **AC-2**: Recipe Editor StepBasicInfo renders category multi-select component with checkbox/pill selection, supporting selection of 0-N categories
  - Given: User opens Recipe Editor at StepBasicInfo step
  - When: User views the category selector
  - Then: All active categories are displayed as selectable options; user can select multiple categories; selection persists via React form state within the same browser session when user proceeds to next step and returns; selection resets on page reload

- [ ] **AC-3**: RecipeCard displays category badges showing first 2 category names when recipe.categories.length > 1, a single badge showing that category name when recipe.categories.length equals 1, and no badge when recipe.categories.length is 0
  - Given: RecipeCard component receives a recipe object with categories array
  - When: recipe.categories has 2 or more elements
  - Then: Badges showing the first 2 category names are visible on the card
  - When: recipe.categories has exactly 1 element
  - Then: A single badge showing that category name is visible
  - When: recipe.categories is empty
  - Then: No category badge is displayed

- [ ] **AC-4**: RecipeDetailPage displays all category badges in styled pills below recipe title; clicking badge navigates to Explore page with category pre-selected
  - Given: User is viewing a recipe detail page
  - When: recipe has 1 or more categories
  - Then: All category badges are displayed as clickable pills below the recipe title
  - When: User clicks a category badge
  - Then: User is navigated to /explore with that category pre-selected in the filter

- [ ] **AC-5**: Explore page CategoryFilter loads categories from getCategories() API on mount; filter recipes by selected category using "categories" query parameter with category slug value
  - Given: User is on Explore page
  - When: Page loads
  - Then: CategoryFilter fetches categories from getCategories() API and displays them
  - When: User selects a category in CategoryFilter
  - Then: Recipe list is filtered to show only recipes in that category using "categories" query parameter

- [ ] **AC-6**: Given user is on Explore page, when API response exceeds 3000ms, then CategoryFilter falls back to FALLBACK_CATEGORIES and renders within 500ms of detecting failure, and user can still filter recipes using the fallback categories without error
  - Given: User is on Explore page
  - When: getCategories() API call fails or response exceeds 3000ms
  - Then: CategoryFilter displays hardcoded FALLBACK_CATEGORIES within 500ms of detecting failure; error is logged to console; no loading spinner remains indefinitely; user can still filter recipes using the fallback categories

- [ ] **AC-7**: HomePage renders categories section with grid layout displaying all active categories from API; each category is clickable and navigates to Explore with category pre-selected
  - Given: User is on HomePage
  - When: Page loads
  - Then: A grid layout displaying all active categories fetched from API is visible
  - When: User clicks a category
  - Then: User is navigated to /explore with that category pre-selected

- [ ] **AC-8**: Given admin deletes a category with NO attached recipes from /admin/categories, then the category immediately disappears from all active category lists, the deleted category no longer appears in recipe filters, and a success toast shows "Đã xóa danh mục"
  - Given: Admin user is logged in and visits /admin/categories with a category that has NO attached recipes
  - When: Admin clicks "Delete" on that category row
  - Then: Category immediately disappears from all active category lists; the deleted category no longer appears in recipe filters; a success toast shows "Đã xóa danh mục"

- [ ] **AC-8b**: Given admin attempts to delete a category from /admin/categories that has attached public recipes, then backend returns 400 error with message "Không thể xóa danh mục đã có công thức liên kết", and an error toast displays this message
  - Given: Admin user is logged in and visits /admin/categories with a category that has attached recipes
  - When: Admin clicks "Delete" on that category row
  - Then: Backend returns 400 Bad Request; error toast shows "Không thể xóa danh mục có công thức đính kèm"; category remains in the list; no soft delete occurs

- [ ] **AC-9**: Non-admin users visiting /admin/categories receive 403 Forbidden response
  - Given: User is logged in but is not an admin (is_staff=False)
  - When: User navigates to /admin/categories
  - Then: User receives a 403 Forbidden response with Vietnamese error message

- [ ] **AC-10**: Given user is on HomePage, when categories API response exceeds 3000ms, then the "Khám phá theo danh mục" section either shows a silent fallback to cached data or displays the existing placeholder gracefully within 500ms of failure detection, and error is logged to console; no white screen or infinite spinner shown
  - Given: User is on HomePage
  - When: Categories API call fails or response exceeds 3000ms
  - Then: Fallback placeholder grid is displayed within 500ms of failure detection; error is logged to console; no white screen or infinite loading spinner shown

- [ ] **AC-11**: Given admin is on /admin/categories, when page loads, then a table displays all categories with columns: name, slug, order, is_active, actions; admin can click "Create" to open dialog with name, description, order fields; admin can click "Edit" on a category row to open pre-filled dialog; admin can click "Delete" on a category row with NO attached recipes to soft delete it
  - Given: Admin user is logged in and visits /admin/categories
  - When: Page loads
  - Then: A table displays all categories with columns: name, slug, order, is_active, actions
  - When: Admin clicks "Create"
  - Then: A dialog opens with form fields: name, description, order; submitting creates a new category
  - When: Admin clicks "Edit" on a category row
  - Then: A dialog opens pre-filled with category data; submitting updates the category
  - When: Admin clicks "Delete" on a category row with NO attached recipes
  - Then: Category is soft deleted (is_active=False); category disappears from all active category lists; success toast shows "Đã xóa danh mục"

### Non-Functional Requirements

- [ ] **Performance**: Category list API response is displayed within 500ms on standard connection
- [ ] **Compatibility**: Category features work on mobile and desktop browsers
- [ ] **Loading States**: When API call is in progress, show skeleton loaders matching the component's layout; loading indicator displayed within 200ms; maximum acceptable loading time: 3000ms before timeout

### Definition of Done

- [ ] All 11 acceptance criteria pass (AC-1 through AC-11, plus AC-8b)
- [ ] No console errors on any affected page (HomePage, ExplorePage, RecipeDetailPage, RecipeEditorPage, /admin/categories)
- [ ] Responsive layout works on mobile (320px) and desktop (1280px)
- [ ] Code reviewed

---

## Solution Strategy

**Approach**: Implement recipe categories across frontend using API-first pattern with centralized fallback handling.

**Key Decisions**:
1. **slug vs UUID handling**: Store both `{ id: uuid, slug, name }` when user selects; use UUID for recipe creation payload, slug for filtering and API lookups
2. **Fallback pattern**: Promise.race with 3000ms timeout ensures AC-6/AC-10 compliance; FALLBACK_CATEGORIES defined as constant per DRY
3. **Admin page structure**: Follow existing RecipeManagementPage pattern with tabs (Active/All), table, and CRUD dialogs

**Trade-offs Accepted**:
- **Code duplication**: Each component manages its own category state rather than shared hook - accepted because category state is simple and localized
- **CategoryBadge color**: Uses slug-based hash for dynamic colors - accepted to support admin-created categories without hardcoded mapping

**Architecture Pattern**: Layered Architecture with Repository Pattern

**Justification** (tied to existing codebase patterns):
- **ingredientApi.js precedent** (`src/api/ingredientApi.js` lines 1-50): The codebase already uses the Repository Pattern for API access - an exported object with async CRUD methods using axiosInstance. categoryApi.js follows this exact pattern.
- **RecipeManagementPage pattern** (`src/pages/admin/RecipeManagementPage.jsx` lines 1-100): Admin pages follow consistent CRUD pattern with tabs and dialogs. CategoryManagementPage uses this same structure.
- **Component-level state pattern**: Each component manages its own category state (like CategoryFilter, HomePage) following codebase convention where simple localized state is preferred over global state.

**Codebase precedent**: Following the exact pattern of `ingredientApi.js`, `RecipeManagementPage.jsx`, and `IngredientManagementPage.jsx`.

---

## Expected Changes

```
KitchenMate_Frontend/src/
├── api/
│   └── categoryApi.js                    # NEW: exports FALLBACK_CATEGORIES constant + CRUD functions
├── components/
│   ├── ui/
│   │   └── CategoryBadge.jsx             # NEW: Reusable pill component
│   ├── explore/
│   │   └── CategoryFilter.jsx            # UPDATE: API + timeout fallback
│   └── recipe/
│       └── RecipeCard.jsx               # UPDATE: Category badge overlay
├── hooks/
│   └── useRecipeDraft.js               # UPDATE: Add categories field (UUID array)
├── pages/
│   ├── admin/
│   │   └── CategoryManagementPage.jsx   # NEW: Admin CRUD page
│   ├── explore/
│   │   └── ExplorePage.jsx              # UPDATE: Category param + mapping
│   ├── home/
│   │   └── HomePage.jsx                 # UPDATE: Replace placeholder with grid
│   └── recipe/
│       ├── RecipeDetailPage.jsx         # UPDATE: Clickable category badges
│       └── StepBasicInfo.jsx            # UPDATE: Category multi-select (stores full objects with UUID+slug, sends UUIDs in recipe payload, uses slug for filtering)
└── App.jsx                              # UPDATE: Add /admin/categories route
```

---

## Architecture Decomposition

**Components**:

| Component | Responsibility | Dependencies |
|-----------|---------------|--------------|
| categoryApi.js | CRUD operations | axiosInstance |
| CategoryBadge.jsx | Reusable pill component | cn utility |
| CategoryFilter.jsx | Filter UI + API + fallback | categoryApi, FALLBACK_CATEGORIES |
| StepBasicInfo.jsx | Category selector in editor | categoryApi, useRecipeDraft |
| RecipeCard.jsx | Category overlay badge | - |
| RecipeDetailPage.jsx | Clickable category badges | useNavigate |
| ExplorePage.jsx | Category filter integration | useRecipes hook |
| HomePage.jsx | Categories grid section | categoryApi, navigate |
| CategoryManagementPage.jsx | Admin CRUD | categoryApi, AdminGuard |
| useRecipeDraft.js | Category field in formData | - |

**Interactions**:
```
categoryApi ──► CategoryFilter ──► ExplorePage ──► RecipeCard/RecipeDetailPage
     │                                         │
     └──► StepBasicInfo ──► useRecipeDraft ────┘
     │
     └──► HomePage
     │
     └──► CategoryManagementPage
```

---

## Building Block View

```
┌─────────────────────────────────────────┐
│           Recipe Categories              │
├─────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐       │
│  │categoryApi │  │CategoryBadge│       │
│  └──────┬─────┘  └──────┬──────┘       │
│         │                │               │
│  ┌──────┴─────┐  ┌──────┴──────┐       │
│  │Category    │  │CategoryFilter│       │
│  │Management  │  │              │       │
│  └──────┬─────┘  └──────┬──────┘       │
│         │                │               │
│         └───────┬────────┘               │
│                 ▼                         │
│         ┌─────────────┐                  │
│         │  Explore    │                  │
│         │  Page       │                  │
│         └──────┬──────┘                  │
│                │                         │
│    ┌───────────┼───────────┐            │
│    ▼           ▼           ▼            │
│ RecipeCard  HomePage  RecipeDetail      │
└─────────────────────────────────────────┘
```

---

## Runtime Scenarios

**Scenario: User filters recipes by category**

```
User clicks category pill
    │
    ▼
CategoryFilter.onChange(category_slug)
    │
    ▼
ExplorePage state: category = slug
    │
    ▼
apiParams includes: params.categories = slug
    │
    ▼
useRecipes hook fetches /recipes/?categories=slug
    │
    ▼
RecipeCard displays with category badge (first 2)
```

**Scenario: Admin deletes category with no recipes**

```
Admin clicks "Delete" on category row
    │
    ▼
CategoryManagementPage.handleDelete(slug)
    │
    ▼
categoryApi.deleteCategory(slug)
    │
    ├─── 200 OK ──► toast.success("Đã xóa danh mục")
    │               │
    │               ▼
    │           Category removed from list
    │
└─── 400 Bad Request ──► toast.error("Không thể xóa danh mục có công thức đính kèm")
                            │
                            ▼
                        Category stays in list
```

**State Transitions**:
```
CategoryFilter states:
  loading=true ──► (API resolves) ──► loading=false, categories=apiData
  loading=true ──► (3000ms timeout) ──► loading=false, categories=FALLBACK_CATEGORIES
  loading=true ──► (API error) ──► loading=false, categories=FALLBACK_CATEGORIES
```

---

## Architecture Decisions

### Decision: slug vs UUID for category operations

**Status**: Accepted

**Context**: Backend endpoints use slug for lookups (e.g., /recipes/categories/{slug}/) but RecipeCreateSerializer PrimaryKeyRelatedField expects UUIDs for write operations.

**Options**:
1. Store only slugs in frontend state
2. Store full objects { id: uuid, slug, name }
3. Store slugs but convert to UUIDs when needed

**Decision**: Store full category objects with both id (UUID) and slug. Use slug for filter params and API lookups. Use id (UUID) for recipe creation payload.

**Consequences**:
- Positive: Single source of truth, no conversion needed when switching contexts
- Positive: Name is available without additional API call
- Negative: Slightly more memory per selection

### Decision: FALLBACK_CATEGORIES constant location

**Status**: Accepted

**Context**: AC-6 and AC-10 require fallback to hardcoded categories when API fails or exceeds 3000ms.

**Options**:
1. Define FALLBACK_CATEGORIES in each component
2. Define once in shared constants file
3. Define in categoryApi.js as exported constant

**Decision**: Define in `src/api/categoryApi.js` as exported constant (DRY, already has category-related exports).

**Consequences**:
- Positive: Single definition, easy to update
- Positive: All components import from same source (`import { FALLBACK_CATEGORIES } from '@/api/categoryApi'`)
- Negative: categoryApi becomes slightly coupled to UI constants

---

## High-Level Structure

```
Feature: Recipe Categories
├── Entry Point: categoryApi.js (API layer)
├── Core Logic: Category selector, filter, display
├── Data Layer: Backend API /recipes/categories/
└── Output: User can view, filter, and manage categories
```

---

## Workflow Steps

```
1. Create categoryApi.js ──► 2. Create CategoryBadge ──► 3. Update CategoryFilter
         │                          │                        │
         ▼                          ▼                        ▼
4. Update RecipeCard      5. Update RecipeDetailPage      │
         │                          │                        │
         └──────────────────────────┼────────────────────────┘
                                    ▼
6. Update StepBasicInfo ──► 7. Update useRecipeDraft ──► 8. Update ExplorePage
                                                              │
9. Update HomePage ◄──────────────────────────────────────────┘
         │
         ▼
10. Create CategoryManagementPage ──► 11. Update App.jsx route
```

---

## Implementation Process

You MUST launch for each step a separate agent, instead of performing all steps yourself. And for each step marked as parallel, you MUST launch separate agents in parallel.

**CRITICAL:** For each agent you MUST:
1. Use the **Agent** type specified in the step (e.g., `haiku`, `sonnet`, `opus`)
2. Provide path to task file and prompt which step to implement
3. Require agent to implement exactly that step, not more, not less, not other steps

### Parallelization Overview

```
Phase 1 (Foundation - 3 parallel) [haiku/haiku/haiku]:
Step 1 [haiku] ──┬──► Phase 2 (3 parallel) ──► Phase 3 (3 parallel) ──► Phase 4 (Sequential)
Step 2 [haiku] ──┤   ├── Step 3 [opus]           ├── Step 7 [opus]           ├── Step 10 [opus]
Step 6 [haiku] ──┘   ├── Step 4 [opus]           ├── Step 8 [opus]           └── Step 11 [haiku]
                    └── Step 5 [opus]           └── Step 9 [opus]
```

**Max Parallelization Depth:** 3 steps can run simultaneously
- Phase 1: Steps 1, 2, 6 run in parallel (all have no dependencies)
- Phase 2: Steps 3, 4, 5 run in parallel (depend on 1, 2)
- Phase 3: Steps 7, 8, 9 run in parallel (7 depends on 6, 8 depends on 4, 9 depends on 1)

**Agent Distribution:**
- haiku: 4 steps (1, 2, 6, 11) - trivial file creation/updates
- opus: 10 steps (3, 4, 5, 7, 8, 9, 10, 12, 13, 14) - requires design decisions/complexity

### Implementation Strategy

**Approach**: Mixed (Bottom-Up for foundation, Top-Down for user-facing flows)
**Rationale**: categoryApi.js and CategoryBadge.jsx have zero dependencies and form the foundation. Then components build upward through RecipeCard, CategoryFilter, RecipeDetailPage, ExplorePage, HomePage, RecipeEditor, and finally Admin page.

**Phase Overview**:

```
Phase 1: Setup (Level 0 - Foundation)
    │
    ├── Step 1: categoryApi.js (API layer + FALLBACK_CATEGORIES)
    └── Step 2: CategoryBadge.jsx (Reusable UI component)
    │
    ▼
Phase 2: Core Display (Level 1 - RecipeCard + CategoryFilter)
    │
    ├── Step 3: RecipeCard.jsx (Category badge overlay)
    └── Step 4: CategoryFilter.jsx (API + 3000ms timeout fallback)
    │
    ▼
Phase 3: Detail & State (Level 2 - RecipeDetailPage + useRecipeDraft)
    │
    ├── Step 5: RecipeDetailPage.jsx (Clickable category badges)
    └── Step 6: useRecipeDraft.js (Add categories field)
    │
    ▼
Phase 4: Editor (Level 3 - StepBasicInfo)
    │
    └── Step 7: StepBasicInfo.jsx (Category multi-select)
    │
    ▼
Phase 5: Integration (Level 4-5 - ExplorePage + HomePage)
    │
    ├── Step 8: ExplorePage.jsx (Category filter integration)
    └── Step 9: HomePage.jsx (Categories grid section)
    │
    ▼
Phase 6: Admin (Level 6-7 - Admin CRUD)
    │
    ├── Step 10: CategoryManagementPage.jsx (Admin CRUD page)
    └── Step 11: App.jsx (Add /admin/categories route)
    │
    ▼
Phase 7: Polish (Final Integration & Verification)

---

### Step 12: Final Integration Test

**Model:** opus
**Agent:** opus
**Depends on:** Steps 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11
**Parallel with:** None (sequential final verification)

**Goal**: Verify all category-related pages work together without console errors.

**Expected Output**:
- All category feature integration points verified

**Success Criteria**:
- [ ] HomePage categories section loads and navigates correctly
- [ ] ExplorePage category filter works with both API and fallback categories
- [ ] RecipeCard badges display for recipes with categories
- [ ] RecipeDetailPage clickable badges navigate to Explore with category
- [ ] RecipeEditor category multi-select persists selection
- [ ] Admin /admin/categories page CRUD operations all work

**Subtasks**:
- [ ] Test HomePage category navigation to Explore with pre-selected category
- [ ] Test ExplorePage category filter with "Tất cả" and specific categories
- [ ] Test RecipeDetailPage category badge click navigation
- [ ] Test RecipeEditor category selection and persistence
- [ ] Test Admin category Create/Edit/Delete operations

**Blockers**: All previous steps must complete

**Risks**:
- Risk: Cross-page navigation state not preserved
- Mitigation: Verify URL params are passed correctly

**Complexity**: Medium
**Dependencies**: All previous steps
**Uncertainty Rating**: Low

**Definition of Done**:
- [ ] All pages load without errors
- [ ] Navigation between pages works correctly
- [ ] No console errors on any affected page

#### Verification

**Level:** Single Judge
**Artifact:** Cross-component integration verification
**Threshold:** 4.0/5.0

**Rubric:**

| Criterion | Weight | Description |
|-----------|--------|-------------|
| Page Loading | 0.30 | All category-related pages load without errors |
| Navigation Flow | 0.30 | HomePage -> ExplorePage -> RecipeDetailPage navigation works |
| URL State | 0.25 | Category filter state preserved in URL |
| No Console Errors | 0.15 | No console errors on affected pages |

**Reference Pattern:** None (verification step)

---

### Step 13: Error Handling Review

**Model:** opus
**Agent:** opus
**Depends on:** Step 12
**Parallel with:** Step 14

**Goal**: Confirm all error states (400, 403, 404) display appropriate toast messages.

**Expected Output**:
- Error handling verified across all category operations

**Success Criteria**:
- [ ] Admin delete category with recipes shows 400 error toast
- [ ] Non-admin accessing /admin/categories shows 403 toast
- [ ] API timeout shows fallback categories with no crash
- [ ] All error responses logged to console

**Subtasks**:
- [ ] Test AC-8b: Delete category with attached recipes shows "Không thể xóa danh mục đã có công thức liên kết"
- [ ] Test AC-9: Non-admin accessing admin page gets 403 response
- [ ] Test AC-6: API timeout falls back to FALLBACK_CATEGORIES gracefully
- [ ] Test AC-10: HomePage timeout falls back gracefully within 500ms

**Blockers**: Step 12 must complete

**Risks**:
- Risk: Some error paths not triggered in testing
- Mitigation: Code review confirms error handlers present

**Complexity**: Small
**Dependencies**: Step 12
**Uncertainty Rating**: Low

**Definition of Done**:
- [ ] AC-8b error handling verified
- [ ] AC-9 error handling verified (AdminGuard)
- [ ] AC-6/AC-10 timeout fallback verified

#### Verification

**Level:** Single Judge
**Artifact:** Error handling verification
**Threshold:** 4.0/5.0

**Rubric:**

| Criterion | Weight | Description |
|-----------|--------|-------------|
| AC-8b Error Path | 0.30 | Delete with attached recipes shows correct 400 error message |
| AC-9 403 Path | 0.25 | Non-admin accessing /admin/categories gets 403 |
| AC-6 Fallback | 0.25 | API timeout falls back to FALLBACK_CATEGORIES gracefully |
| AC-10 Fallback | 0.20 | HomePage timeout falls back within 500ms |

**Reference Pattern:** `.claude/skills/recipe-categories/SKILL.md` (lines 604-629)

---

### Step 14: Responsive Verification

**Model:** opus
**Agent:** opus
**Depends on:** Step 12
**Parallel with:** Step 13

**Goal**: Verify category features work on mobile (320px) and desktop (1280px).

**Expected Output**:
- Responsive layout verified for all category components

**Success Criteria**:
- [ ] CategoryFilter scrolls horizontally on mobile without overflow
- [ ] RecipeCard category badges visible on mobile thumbnail
- [ ] RecipeDetailPage category badges wrap correctly on small screens
- [ ] HomePage categories grid adapts from 2 columns (mobile) to 6 columns (desktop)
- [ ] Admin category table scrolls horizontally on mobile

**Subtasks**:
- [ ] Test CategoryFilter horizontal scroll on mobile viewport
- [ ] Test RecipeCard badge visibility at 320px width
- [ ] Test RecipeDetailPage badge wrapping at small widths
- [ ] Test HomePage grid responsive breakpoints
- [ ] Test Admin table horizontal scroll on mobile

**Blockers**: Step 12 must complete

**Risks**:
- Risk: Some components overflow on mobile
- Mitigation: Test all breakpoints before completion

**Complexity**: Small
**Dependencies**: Step 12
**Uncertainty Rating**: Low

**Definition of Done**:
- [ ] CategoryFilter responsive verified
- [ ] RecipeCard responsive verified
- [ ] RecipeDetailPage responsive verified
- [ ] HomePage responsive verified
- [ ] Admin table responsive verified

#### Verification

**Level:** Single Judge
**Artifact:** Responsive layout verification
**Threshold:** 4.0/5.0

**Rubric:**

| Criterion | Weight | Description |
|-----------|--------|-------------|
| CategoryFilter | 0.25 | Horizontal scroll without overflow on mobile |
| RecipeCard | 0.25 | Badges visible at 320px width |
| RecipeDetailPage | 0.25 | Badges wrap correctly on small screens |
| HomePage Grid | 0.25 | Grid adapts: 2 cols (mobile) to 6 cols (desktop) |

**Reference Pattern:** None (verification step)

---

### Least-to-Most Decomposition Chain

**Level 0 (Zero Dependencies - Foundation):**

| # | Subproblem | Why This Level | Dependencies |
|---|------------|---------------|--------------|
| S01 | categoryApi.js | Foundation for all API calls; exports FALLBACK_CATEGORIES constant | None |
| S02 | CategoryBadge.jsx | Reusable pill component used by RecipeCard and RecipeDetailPage | None |

**Level 1 (Depends on Level 0):**

| # | Subproblem | Why This Level | Dependencies |
|---|------------|---------------|--------------|
| S03 | RecipeCard.jsx | Uses CategoryBadge to display first 2 category badges on thumbnail | S02 (CategoryBadge) |
| S04 | CategoryFilter.jsx | Uses categoryApi.getCategories() with Promise.race 3000ms timeout | S01 (categoryApi) |

**Level 2 (Depends on Level 0 and Level 1):**

| # | Subproblem | Why This Level | Dependencies |
|---|------------|---------------|--------------|
| S05 | RecipeDetailPage.jsx | Uses CategoryBadge for clickable pills below recipe title | S02 (CategoryBadge) |
| S06 | useRecipeDraft.js | Add categories field (UUIDs array) to formData for recipe creation | None (own state) |

**Level 3 (Depends on Level 0, Level 2):**

| # | Subproblem | Why This Level | Dependencies |
|---|------------|---------------|--------------|
| S07 | StepBasicInfo.jsx | Fetches categories via categoryApi, stores selection in useRecipeDraft | S01 (categoryApi), S06 (useRecipeDraft) |

**Level 4 (Depends on Level 1):**

| # | Subproblem | Why This Level | Dependencies |
|---|------------|---------------|--------------|
| S08 | ExplorePage.jsx | Receives CategoryFilter state, passes categories param to useRecipes | S04 (CategoryFilter) |

**Level 5 (Depends on Level 0):**

| # | Subproblem | Why This Level | Dependencies |
|---|------------|---------------|--------------|
| S09 | HomePage.jsx | Fetches and displays categories grid with Promise.race 3000ms timeout | S01 (categoryApi) |

**Level 6 (Admin - Depends on Level 0):**

| # | Subproblem | Why This Level | Dependencies |
|---|------------|---------------|--------------|
| S10 | CategoryManagementPage.jsx | Admin CRUD page using categoryApi (Create/Edit/Delete with 400 error handling) | S01 (categoryApi) |

**Level 7 (Final Integration):**

| # | Subproblem | Why This Level | Dependencies |
|---|------------|---------------|--------------|
| S11 | App.jsx | Add /admin/categories route with AdminGuard | S10 (CategoryManagementPage) |

---

### Step 1: Create categoryApi.js

**Model:** haiku
**Agent:** haiku
**Depends on:** None
**Parallel with:** Step 2, Step 6

**Goal**: Create the API layer for category CRUD operations and export FALLBACK_CATEGORIES constant.

**Expected Output**:
- `KitchenMate_Frontend/src/api/categoryApi.js`: Exports categoryApi object with getCategories, getCategory, createCategory, updateCategory, deleteCategory functions
- Exports FALLBACK_CATEGORIES constant for timeout fallback

**Success Criteria**:
- [ ] File `src/api/categoryApi.js` exists
- [ ] `categoryApi.getCategories()` calls `GET /recipes/categories/`
- [ ] `categoryApi.getCategory(slug)` calls `GET /recipes/categories/${slug}/`
- [ ] `categoryApi.createCategory(data)` calls `POST /recipes/categories/`
- [ ] `categoryApi.updateCategory(slug, data)` calls `PATCH /recipes/categories/${slug}/`
- [ ] `categoryApi.deleteCategory(slug)` calls `DELETE /recipes/categories/${slug}/`
- [ ] `FALLBACK_CATEGORIES` constant exported with 6 default categories

**Subtasks**:
- [ ] Create `src/api/categoryApi.js`
- [ ] Implement getCategories() with axiosInstance
- [ ] Implement getCategory(slug) with axiosInstance
- [ ] Implement createCategory(data) with axiosInstance
- [ ] Implement updateCategory(slug, data) with axiosInstance
- [ ] Implement deleteCategory(slug) with axiosInstance
- [ ] Define and export FALLBACK_CATEGORIES constant
- [ ] Write unit tests for each function

**Blockers**: None - axiosInstance already exists

**Risks**:
- Risk: Backend endpoint slug vs UUID mismatch
- Mitigation: Use slug for URL lookups per backend API design

**Complexity**: Small
**Dependencies**: None
**Uncertainty Rating**: Low
**Integration Points**: All category-aware components

**Definition of Done**:
- [ ] All 5 API functions implemented
- [ ] FALLBACK_CATEGORIES exported
- [ ] Unit tests written and passing

#### Verification

**Level:** Single Judge
**Artifact:** `KitchenMate_Frontend/src/api/categoryApi.js`
**Threshold:** 4.0/5.0

**Rubric:**

| Criterion | Weight | Description |
|-----------|--------|-------------|
| Function Correctness | 0.20 | All 5 functions (getCategories, getCategory, createCategory, updateCategory, deleteCategory) call correct endpoints |
| getCategories Returns Flat Array | 0.20 | getCategories extracts res.data.results not paginated wrapper |
| FALLBACK_CATEGORIES | 0.20 | Constant exported with 6 default categories matching backend seed data |
| Response Handling | 0.20 | getCategories correctly extracts res.data.results; single resource returns data directly |
| Endpoint Accuracy | 0.20 | All HTTP methods (GET, POST, PATCH, DELETE) match backend API contract |

**Reference Pattern:** `.claude/skills/recipe-categories/SKILL.md` (lines 62-76)

---

### Step 2: Create CategoryBadge.jsx

**Model:** haiku
**Agent:** haiku
**Depends on:** None
**Parallel with:** Step 1, Step 6

**Goal**: Create a reusable category pill component with dynamic color based on slug hash.

**Expected Output**:
- `KitchenMate_Frontend/src/components/ui/CategoryBadge.jsx`: Reusable pill component

**Success Criteria**:
- [ ] File `src/components/ui/CategoryBadge.jsx` exists
- [ ] CategoryBadge accepts `category` prop with `slug` and `name`
- [ ] Badge renders with dynamic color class based on slug hash
- [ ] Badge supports `size` prop (sm/md)
- [ ] Badge uses cn utility for className merging
- [ ] Color palette: 6 colors `['green', 'blue', 'purple', 'orange', 'pink', 'cyan']` with bg-{color}-100/text-{color}-700 classes
- [ ] Hash function: `slug.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % 6` determines color index

**Subtasks**:
- [ ] Create `src/components/ui/CategoryBadge.jsx`
- [ ] Define `CATEGORY_COLOR_CLASSES` array with 6 color pairs (green, blue, purple, orange, pink, cyan)
- [ ] Implement `getCategoryColorClass(slug)` function using hash-based color selection
- [ ] Export CategoryBadge component with size variants (sm/md)
- [ ] Write unit tests for color assignment

**Blockers**: None - simple UI component

**Risks**:
- Risk: Color collision for different slugs
- Mitigation: 6 color options provides reasonable distribution

**Complexity**: Small
**Dependencies**: None
**Uncertainty Rating**: Low
**Integration Points**: RecipeCard, RecipeDetailPage

**Definition of Done**:
- [ ] CategoryBadge renders correctly
- [ ] Dynamic color class applied
- [ ] Size variants work
- [ ] Unit tests written and passing

#### Verification

**Level:** Single Judge
**Artifact:** `KitchenMate_Frontend/src/components/ui/CategoryBadge.jsx`
**Threshold:** 4.0/5.0

**Rubric:**

| Criterion | Weight | Description |
|-----------|--------|-------------|
| Color Assignment | 0.30 | Hash function correctly maps slug to 1 of 6 color classes |
| Size Variants | 0.20 | sm/md size variants render with correct padding/text classes |
| Props Interface | 0.20 | Accepts category prop with slug and name; cn utility used for className |
| Render Correctness | 0.20 | Badge renders category.name in pill with dynamic color |
| Test Coverage | 0.10 | Unit tests verify color assignment for different slugs |

**Reference Pattern:** `.claude/skills/recipe-categories/SKILL.md` (lines 198-237)

---

### Step 3: Update RecipeCard.jsx

**Model:** opus
**Agent:** opus
**Depends on:** Step 2
**Parallel with:** Step 4, Step 5

**Goal**: Add category badge overlay showing first 2 categories on recipe thumbnail.

**Expected Output**:
- Updated `KitchenMate_Frontend/src/components/recipe/RecipeCard.jsx` with category badge overlay

**Success Criteria**:
- [ ] When `recipe.categories.length > 1`: Badges showing first 2 category names visible
- [ ] When `recipe.categories.length === 1`: Single badge showing that category name visible
- [ ] When `recipe.categories.length === 0`: No category badge displayed
- [ ] Badges positioned at top-right corner of thumbnail (opposite to difficulty badge)

**Subtasks**:
- [ ] Read current RecipeCard.jsx implementation
- [ ] Add `categories` to recipe destructuring
- [ ] Import CategoryBadge component
- [ ] Add category badge overlay after difficulty badge
- [ ] Implement conditional logic per AC-3
- [ ] Write unit tests for badge display logic

**Blockers**: Step 2 must complete (CategoryBadge needed)

**Risks**:
- Risk: Badge overlap with difficulty badge
- Mitigation: Position at top-right vs top-left for difficulty

**Complexity**: Small
**Dependencies**: Step 2 (CategoryBadge)
**Uncertainty Rating**: Low
**Integration Points**: ExplorePage (passes categories to RecipeCard)

**Definition of Done**:
- [ ] AC-3 criteria verified
- [ ] Badges display correctly for all 3 cases
- [ ] Unit tests written and passing

#### Verification

**Level:** Single Judge
**Artifact:** `KitchenMate_Frontend/src/components/recipe/RecipeCard.jsx`
**Threshold:** 4.0/5.0

**Rubric:**

| Criterion | Weight | Description |
|-----------|--------|-------------|
| AC-3 Compliance | 0.40 | Correct conditional: >1 shows 2 badges, ===1 shows 1 badge, ===0 shows none |
| Badge Positioning | 0.25 | Badges at top-right (or top-left) of thumbnail, non-overlapping |
| Import Correctness | 0.20 | CategoryBadge imported and used correctly |
| Categories Destructuring | 0.15 | recipe.categories properly accessed |

**Reference Pattern:** None (new implementation)

---

### Step 4: Update CategoryFilter.jsx

**Model:** opus
**Agent:** opus
**Depends on:** Step 1
**Parallel with:** Step 3, Step 5

**Goal**: Replace hardcoded categories with API data and add 3000ms timeout fallback.

**Expected Output**:
- Updated `KitchenMate_Frontend/src/components/explore/CategoryFilter.jsx` with API integration and Promise.race timeout

**Success Criteria**:
- [ ] CategoryFilter fetches from `categoryApi.getCategories()` on mount
- [ ] Promise.race with 3000ms timeout implemented using explicit setTimeout
- [ ] On timeout/error: Falls back to FALLBACK_CATEGORIES
- [ ] Fallback renders within 500ms of detecting failure
- [ ] Category pills are selectable and call onChange(categorySlug)
- [ ] CategoryFilter displays selected category with filled background (not outlined), confirming visual selection state is distinguishable

**Implementation Details**:
```javascript
// Promise.race with 3000ms timeout pattern - AC-6 compliance
const categoryPromise = categoryApi.getCategories()
const timeoutPromise = new Promise((_, reject) =>
  setTimeout(() => reject(new Error('timeout')), 3000)
)
const categories = await Promise.race([categoryPromise, timeoutPromise])
  .then(res => res.data.results)
  .catch(() => FALLBACK_CATEGORIES)
```

**Subtasks**:
- [ ] Read current CategoryFilter.jsx implementation (hardcoded CATEGORIES)
- [ ] Import categoryApi and FALLBACK_CATEGORIES
- [ ] Replace hardcoded CATEGORIES with useEffect fetching API
- [ ] Implement Promise.race with 3000ms timeout as shown above
- [ ] Update catch block to set FALLBACK_CATEGORIES
- [ ] Ensure "Tất cả" option is first in list
- [ ] Write integration test for timeout fallback

**Blockers**: Step 1 must complete (categoryApi needed)

**Risks**:
- Risk: AC-6 compliance failure (timeout >3000ms or render >500ms)
- Mitigation: Promise.race ensures timeout; FALLBACK_CATEGORIES is pre-computed

**Complexity**: Medium
**Dependencies**: Step 1 (categoryApi)
**Uncertainty Rating**: Medium
**Integration Points**: ExplorePage

**Definition of Done**:
- [ ] AC-5 criteria verified (API fetch on mount)
- [ ] AC-6 criteria verified (3000ms timeout + fallback)
- [ ] Integration tests written and passing

#### Verification

**Level:** CRITICAL - Panel of 2 Judges with Aggregated Voting
**Artifact:** `KitchenMate_Frontend/src/components/explore/CategoryFilter.jsx`
**Threshold:** 4.5/5.0

**Rubric:**

| Criterion | Weight | Description |
|-----------|--------|-------------|
| AC-6 Timeout Compliance | 0.35 | Promise.race with 3000ms explicit setTimeout implemented correctly |
| Fallback Rendering | 0.25 | FALLBACK_CATEGORIES renders within 500ms of failure detection |
| API Integration | 0.20 | categoryApi.getCategories() called on mount |
| Visual Selection State | 0.15 | Selected category shows filled background, distinguishable from unselected |
| Error Logging | 0.05 | Errors logged to console on fallback |

**Reference Pattern:** `.claude/skills/recipe-categories/SKILL.md` (lines 263-325)

---

### Step 5: Update RecipeDetailPage.jsx

**Model:** opus
**Agent:** opus
**Depends on:** Step 2
**Parallel with:** Step 3, Step 4

**Goal**: Add clickable category badges below recipe title that navigate to Explore with category pre-selected.

**Expected Output**:
- Updated `KitchenMate_Frontend/src/pages/recipe/RecipeDetailPage.jsx` with clickable category badges

**Success Criteria**:
- [ ] All category badges displayed as clickable pills below recipe title
- [ ] Clicking badge navigates to `/explore?categories=${cat.slug}`
- [ ] Badge hover causes background color shift within 200ms; cursor changes to pointer
- [ ] Badges only shown when `recipe.categories.length > 0`

**Subtasks**:
- [ ] Read current RecipeDetailPage.jsx implementation
- [ ] Import useNavigate from react-router-dom
- [ ] Replace plain spans with buttons
- [ ] Add onClick handler with navigate
- [ ] Add hover styles for transition
- [ ] Write unit tests for navigation behavior

**Blockers**: Step 2 must complete (CategoryBadge needed)

**Risks**:
- Risk: Navigation state conflict
- Mitigation: Simple navigate call, no complex state

**Complexity**: Small
**Dependencies**: Step 2 (CategoryBadge)
**Uncertainty Rating**: Low
**Integration Points**: RecipeCard (receives same categories)

**Definition of Done**:
- [ ] AC-4 criteria verified
- [ ] Click navigates to correct explore URL
- [ ] Unit tests written and passing

#### Verification

**Level:** Single Judge
**Artifact:** `KitchenMate_Frontend/src/pages/recipe/RecipeDetailPage.jsx`
**Threshold:** 4.0/5.0

**Rubric:**

| Criterion | Weight | Description |
|-----------|--------|-------------|
| AC-4 Navigation | 0.35 | Clicking badge navigates to /explore?categories=${cat.slug} |
| Badge Display | 0.25 | All categories shown as pills below recipe title |
| Hover Feedback | 0.20 | Hover causes color shift; cursor pointer |
| Conditional Display | 0.20 | Badges only shown when recipe.categories.length > 0 |

**Reference Pattern:** None (new implementation)

---

### Step 6: Update useRecipeDraft.js

**Model:** haiku
**Agent:** haiku
**Depends on:** None
**Parallel with:** Step 1, Step 2

**Goal**: Add categories field to formData state for recipe creation payload.

**Expected Output**:
- Updated `KitchenMate_Frontend/src/hooks/useRecipeDraft.js` with categories array field

**Success Criteria**:
- [ ] `formData.categories` initialized as empty array
- [ ] Save function includes `categories` field in payload
- [ ] Payload uses UUIDs (not slugs) per backend PrimaryKeyRelatedField

**Subtasks**:
- [ ] Read current useRecipeDraft.js implementation
- [ ] Add `categories: []` to initial formData state
- [ ] Update save function to include `categories: formData.categories`
- [ ] Document that categories expects UUIDs for backend compliance
- [ ] Write unit tests for categories field in payload

**Blockers**: None - purely state management

**Risks**:
- Risk: Payload uses slugs instead of UUIDs (backend expects UUIDs)
- Mitigation: Document clearly; StepBasicInfo stores full objects with UUIDs

**Complexity**: Small
**Dependencies**: None
**Uncertainty Rating**: Low
**Integration Points**: StepBasicInfo, RecipeEditorPage

**Definition of Done**:
- [ ] categories field in formData
- [ ] Payload includes categories array
- [ ] Unit tests written and passing

#### Verification

**Level:** Single Judge
**Artifact:** `KitchenMate_Frontend/src/hooks/useRecipeDraft.js`
**Threshold:** 4.0/5.0

**Rubric:**

| Criterion | Weight | Description |
|-----------|--------|-------------|
| Categories Field | 0.35 | formData.categories initialized as empty array |
| Payload Inclusion | 0.35 | Save function includes categories field in payload |
| UUID Usage | 0.20 | Documented that categories expects UUIDs not slugs for backend compliance |
| No Side Effects | 0.10 | Other formData fields unaffected by categories changes |

**Reference Pattern:** `.claude/skills/recipe-categories/SKILL.md` (lines 327-398)

---

### Step 7: Update StepBasicInfo.jsx

**Model:** opus
**Agent:** opus
**Depends on:** Step 1, Step 6

**Goal**: Add category multi-select component with checkbox/pill selection.

**Expected Output**:
- Updated `KitchenMate_Frontend/src/pages/recipe/StepBasicInfo.jsx` with category selector

**Success Criteria**:
- [ ] Category multi-select renders with all active categories
- [ ] User can select multiple categories (0-N)
- [ ] Selection persists when user proceeds to next step and returns
- [ ] selectedCategories stores full category objects with both id (UUID) and slug; recipe creation payload uses only the id field from selected objects
- [ ] Category pill displays filled/primary background when selected, outlined when unselected

**Subtasks**:
- [ ] Read current StepBasicInfo.jsx implementation
- [ ] Import categoryApi, useState, useEffect
- [ ] Add state for availableCategories and selectedCategoryIds
- [ ] Fetch categories from categoryApi.getCategories() on mount
- [ ] Implement handleCategoryToggle function
- [ ] Add category selector UI (pill buttons with toggle)
- [ ] Update onChange to pass categories array to parent
- [ ] Write integration tests for multi-select behavior

**Blockers**: Step 1 (categoryApi), Step 6 (useRecipeDraft) must complete

**Risks**:
- Risk: Selection not persisting across steps
- Mitigation: Store in formData which is lifted to parent state

**Complexity**: Medium
**Dependencies**: Step 1 (categoryApi), Step 6 (useRecipeDraft)
**Uncertainty Rating**: Medium
**Integration Points**: useRecipeDraft, RecipeEditorPage

**Definition of Done**:
- [ ] AC-2 criteria verified
- [ ] Multi-select works correctly
- [ ] Selection persists across steps
- [ ] Integration tests written and passing

#### Verification

**Level:** Single Judge
**Artifact:** `KitchenMate_Frontend/src/pages/recipe/StepBasicInfo.jsx`
**Threshold:** 4.0/5.0

**Rubric:**

| Criterion | Weight | Description |
|-----------|--------|-------------|
| AC-2 Persistence | 0.30 | Selection persists across steps within same session |
| Multi-Select | 0.25 | User can select 0-N categories |
| Category API Fetch | 0.20 | categoryApi.getCategories() called on mount |
| Visual Feedback | 0.15 | Selected categories show filled/primary background |
| Payload Structure | 0.10 | categories array passed to parent via onChange |

**Reference Pattern:** `.claude/skills/recipe-categories/SKILL.md` (lines 327-369)

---

### Step 8: Update ExplorePage.jsx

**Model:** opus
**Agent:** opus
**Depends on:** Step 4

**Goal**: Connect CategoryFilter to recipe list with categories query parameter.

**Expected Output**:
- Updated `KitchenMate_Frontend/src/pages/explore/ExplorePage.jsx` with category filter integration

**Success Criteria**:
- [ ] `category` state initialized from URL searchParams
- [ ] CategoryFilter receives `active` prop and `onChange` handler
- [ ] apiParams includes `categories` when category is selected
- [ ] Recipe transformation includes `categories: recipe.categories`
- [ ] Selecting category updates URL and refetches recipes

**Subtasks**:
- [ ] Read current ExplorePage.jsx implementation
- [ ] Add `category` state initialized from URL params
- [ ] Pass `active={category}` and `onChange={setCategory}` to CategoryFilter
- [ ] Add `if (category && category !== 'all') params.categories = category` to apiParams
- [ ] Add `categories: recipe.categories` to recipe transformation
- [ ] Update useMemo dependency array to include `category`
- [ ] Write integration tests for category filtering

**Blockers**: Step 4 (CategoryFilter) must complete

**Risks**:
- Risk: Category filter not connected to recipe fetching
- Mitigation: Verify apiParams includes categories param

**Complexity**: Small
**Dependencies**: Step 4 (CategoryFilter)
**Uncertainty Rating**: Low
**Integration Points**: CategoryFilter, useRecipes hook

**Definition of Done**:
- [ ] AC-5 criteria verified
- [ ] Category filter updates recipe list
- [ ] Integration tests written and passing

#### Verification

**Level:** Single Judge
**Artifact:** `KitchenMate_Frontend/src/pages/explore/ExplorePage.jsx`
**Threshold:** 4.0/5.0

**Rubric:**

| Criterion | Weight | Description |
|-----------|--------|-------------|
| URL Param Handling | 0.30 | category state initialized from URL searchParams |
| Filter Connection | 0.25 | CategoryFilter receives active and onChange props |
| API Param | 0.25 | apiParams includes categories when category is selected |
| recipes.map Categories | 0.20 | recipes.map includes categories: recipe.categories |

**Reference Pattern:** None (new implementation)

---

### Step 9: Update HomePage.jsx

**Model:** opus
**Agent:** opus
**Depends on:** Step 1
**Parallel with:** None

**Goal**: Replace placeholder with API-fetched categories grid section.

**Expected Output**:
- Updated `KitchenMate_Frontend/src/pages/home/HomePage.jsx` with real categories grid

**Success Criteria**:
- [ ] Categories grid fetches from `categoryApi.getCategories()` on mount
- [ ] Promise.race with 3000ms timeout implemented
- [ ] On timeout/error: Falls back gracefully (silent or empty state)
- [ ] Each category is clickable and navigates to `/explore?categories=${cat.slug}`
- [ ] Loading skeleton shown while fetching
- [ ] Grid displays within 500ms of failure detection

**Subtasks**:
- [ ] Read current HomePage.jsx implementation (lines 614-625 placeholder)
- [ ] Import categoryApi, useState, useEffect
- [ ] Add state for categories and categoriesLoading
- [ ] Add useEffect with Promise.race 3000ms timeout
- [ ] Replace placeholder with grid layout
- [ ] Add loading skeleton
- [ ] Add error fallback (silent or empty state)
- [ ] Write integration tests for fallback behavior

**Blockers**: Step 1 (categoryApi) must complete

**Risks**:
- Risk: AC-10 compliance failure (fallback not graceful)
- Mitigation: Silent fallback or empty state; no infinite spinner

**Complexity**: Medium
**Dependencies**: Step 1 (categoryApi)
**Uncertainty Rating**: Medium
**Integration Points**: categoryApi

**Definition of Done**:
- [ ] AC-7 criteria verified
- [ ] AC-10 criteria verified
- [ ] Integration tests written and passing

#### Verification

**Level:** CRITICAL - Panel of 2 Judges with Aggregated Voting
**Artifact:** `KitchenMate_Frontend/src/pages/home/HomePage.jsx`
**Threshold:** 4.5/5.0

**Rubric:**

| Criterion | Weight | Description |
|-----------|--------|-------------|
| AC-7 Grid Display | 0.30 | Categories grid fetches and displays from API |
| AC-10 Timeout Fallback | 0.30 | Promise.race 3000ms timeout; fallback renders within 500ms |
| Navigation | 0.20 | Clickable categories navigate to /explore?categories=${cat.slug} |
| Loading State | 0.20 | Skeleton shown while fetching |

**Reference Pattern:** `.claude/skills/recipe-categories/SKILL.md` (lines 508-553)

---

### Step 10: Create CategoryManagementPage.jsx

**Model:** opus
**Agent:** opus
**Depends on:** Step 1
**Parallel with:** None

**Goal**: Create admin CRUD page for category management at /admin/categories.

**Expected Output**:
- `KitchenMate_Frontend/src/pages/admin/CategoryManagementPage.jsx`: Full admin CRUD page

**Success Criteria**:
- [ ] Table displays all categories with columns: name, slug, order, is_active, actions
- [ ] Admin can click "Create" to open dialog with name, description, order fields
- [ ] Admin can click "Edit" on a category row to open pre-filled dialog
- [ ] Admin can click "Delete" on a category row with NO attached recipes
- [ ] Deletion shows success toast "Đã xóa danh mục"
- [ ] Deletion of category with attached recipes shows error toast with 400 message
- [ ] Tab layout: Active | All (with is_active filter)
- [ ] Non-admin users receive 403 (handled by AdminGuard)

**Subtasks**:
- [ ] Create `src/pages/admin/CategoryManagementPage.jsx`
- [ ] Implement tab state (active/all)
- [ ] Implement useEffect to fetch categories based on tab
- [ ] Create CreateDialog component with form
- [ ] Create EditDialog component with pre-filled form
- [ ] Create DeleteConfirmDialog component
- [ ] Implement handleCreate with 409 uniqueness error handling
- [ ] Implement handleUpdate with 409/404 error handling
- [ ] Implement handleDelete with 400 deletion constraint error handling
- [ ] Implement handleDeleted callback to remove from local state
- [ ] Write integration tests for CRUD operations and error handling

**Blockers**: Step 1 (categoryApi) must complete

**Risks**:
- Risk: 400 error not handled for deletion with attached recipes
- Mitigation: Check error.response?.status === 400 and show specific message

**Complexity**: Large
**Dependencies**: Step 1 (categoryApi)
**Uncertainty Rating**: Medium
**Integration Points**: categoryApi, AdminGuard

**Definition of Done**:
- [ ] AC-8 criteria verified
- [ ] AC-8b criteria verified
- [ ] AC-9 criteria verified (AdminGuard provides 403)
- [ ] AC-11 criteria verified
- [ ] Integration tests written and passing

#### Verification

**Level:** CRITICAL - Panel of 2 Judges with Aggregated Voting
**Artifact:** `KitchenMate_Frontend/src/pages/admin/CategoryManagementPage.jsx`
**Threshold:** 4.5/5.0

**Rubric:**

| Criterion | Weight | Description |
|-----------|--------|-------------|
| AC-11 Table Structure | 0.20 | Table displays name, slug, order, is_active, actions columns |
| AC-8 Delete Success | 0.20 | Delete with no attached recipes shows "Đã xóa danh mục" toast |
| AC-8b Delete Constraint | 0.20 | Delete with attached recipes returns 400 with specific message |
| AC-9 403 Handling | 0.15 | Non-admin sees 403 response (AdminGuard) |
| Create/Edit Dialogs | 0.15 | Create and Edit dialogs with proper form fields |
| Error Handling | 0.10 | 409 uniqueness, 404 not found, 400 deletion constraint all handled |

**Reference Pattern:** `.claude/skills/recipe-categories/SKILL.md` (lines 409-493)

---

### Step 11: Update App.jsx

**Model:** haiku
**Agent:** haiku
**Depends on:** Step 10

**Goal**: Add /admin/categories route with AdminGuard and lazy loading.

**Expected Output**:
- Updated `KitchenMate_Frontend/src/App.jsx` with /admin/categories route

**Success Criteria**:
- [ ] CategoryManagementPage lazy imported
- [ ] Route `/admin/categories` added with AdminGuard wrapper
- [ ] Route wrapped in Suspense with PageLoader fallback

**Subtasks**:
- [ ] Read current App.jsx implementation
- [ ] Add lazy import for CategoryManagementPage
- [ ] Add route for /admin/categories
- [ ] Wrap with AdminGuard and Suspense
- [ ] Write unit test for route registration

**Blockers**: Step 10 (CategoryManagementPage) must complete

**Risks**:
- Risk: Route conflict with existing admin routes
- Mitigation: Follow existing pattern for admin routes

**Complexity**: Small
**Dependencies**: Step 10 (CategoryManagementPage)
**Uncertainty Rating**: Low
**Integration Points**: React Router

**Definition of Done**:
- [ ] Route registered correctly
- [ ] AdminGuard protects the route
- [ ] Unit tests written and passing

#### Verification

**Level:** NOT NEEDED
**Rationale:** Simple route addition with no business logic. Binary success - route registered or not. Verification done via smoke test.

---

## Implementation Summary

| Step | Goal | Output | Est. Effort | Dependencies |
|------|------|--------|-------------|--------------|
| 1 | Create categoryApi.js | API functions + FALLBACK_CATEGORIES | Small | None |
| 2 | Create CategoryBadge.jsx | Reusable pill component | Small | None |
| 3 | Update RecipeCard.jsx | Category badge overlay | Small | Step 2 |
| 4 | Update CategoryFilter.jsx | API + timeout fallback | Medium | Step 1 |
| 5 | Update RecipeDetailPage.jsx | Clickable category badges | Small | Step 2 |
| 6 | Update useRecipeDraft.js | Add categories field | Small | None |
| 7 | Update StepBasicInfo.jsx | Category multi-select | Medium | Steps 1, 6 |
| 8 | Update ExplorePage.jsx | Category filter integration | Small | Step 4 |
| 9 | Update HomePage.jsx | Categories grid section | Medium | Step 1 |
| 10 | Create CategoryManagementPage.jsx | Admin CRUD page | Large | Step 1 |
| 11 | Update App.jsx | Add admin route | Small | Step 10 |
| 12 | Final Integration Test | Verify all pages work together | Medium | All |
| 13 | Error Handling Review | Confirm 400/403/404 toasts | Small | Step 12 |
| 14 | Responsive Verification | Test mobile/desktop layouts | Small | Step 12 |

**Total Steps**: 14
**Critical Path**: Steps 1-2 (foundation) -> Step 4 (filter) -> Step 8 (explore integration) -> Step 9 (home) -> Step 10 (admin) -> Step 11 (route)
**Parallel Opportunities**: Steps 1 and 2 can run concurrently; Steps 3 and 4 can run concurrently (both depend on 1 and 2); Steps 5 and 6 can run concurrently (depend on 1 and 2)

---

## Risks & Blockers Summary

### High Priority

| Risk/Blocker | Impact | Likelihood | Mitigation |
|--------------|--------|------------|------------|
| AC-6/AC-10 Timeout Compliance: 3000ms timeout + 500ms render | High | Medium | Use Promise.race with explicit 3000ms timeout; FALLBACK_CATEGORIES pre-computed |
| RecipeEditor Payload: UUIDs vs slugs for categories field | High | High | Store full category objects with UUIDs; extract .id for payload |
| AC-8b Deletion Constraint: 400 error for categories with recipes | High | Medium | Handle 400 status in catch block with specific message |

### Medium Priority

| Risk/Blocker | Impact | Likelihood | Mitigation |
|--------------|--------|------------|------------|
| CategoryFilter Fallback: FALLBACK_CATEGORIES not rendering in 500ms | Medium | Low | Pre-computed constant, no async during render |
| Slug vs UUID Mismatch: Backend endpoints use slug for lookups | Medium | High | Use slug for URL params, UUID for recipe creation payload |
| HomePage Fallback: Silent failure must not show white screen | Medium | Low | Graceful empty state or keep placeholder |

### Low Priority

| Risk/Blocker | Impact | Likelihood | Mitigation |
|--------------|--------|------------|------------|
| RecipeCard Badge Overlap: Difficulty and category badges | Low | Low | Position at opposite corners |
| CategoryBadge Color Collision: Different slugs get same color | Low | Low | 6 colors provides reasonable distribution |

---

## High Complexity/Uncertainty Tasks Requiring Attention

**Task S10: CategoryManagementPage.jsx**
- Complexity: Large (full admin CRUD page with Create/Edit/Delete dialogs, tab layout, error handling)
- Uncertainty: Medium (admin page patterns vary; deletion constraint 400 handling needs care)
- Recommendations:
  1. Follow existing RecipeManagementPage pattern closely
  2. Handle 400 status specifically for deletion constraint
  3. Test with category that has attached recipes to verify error message

**Task S04: CategoryFilter.jsx (Timeout Implementation)**
- Complexity: Medium (Promise.race with state management)
- Uncertainty: Medium (AC-6 compliance requires exact timing)
- Recommendations:
  1. Implement Promise.race before state updates
  2. Ensure FALLBACK_CATEGORIES renders immediately on catch
  3. Test timeout behavior by simulating slow API

---

## Definition of Done (Task Level)

- [ ] All 14 implementation steps completed
- [ ] All acceptance criteria verified (AC-1 through AC-11, plus AC-8b)
- [ ] No console errors on affected pages
- [ ] Responsive layout works on mobile (320px) and desktop (1280px)
- [ ] Error handling verified for 400/403/404 responses
- [ ] Integration tests pass across all pages
- [ ] Code reviewed

---

## References

- Skill: .claude/skills/recipe-categories/SKILL.md
- Analysis: .specs/analysis/analysis-recipe-categories.md
- Scratchpad: .specs/scratchpad/e4e4c615.md

---

## Contracts

**API Contract**:
```
GET  /api/recipes/categories/           → { success, data: { count, results: [...] } }
POST /api/recipes/categories/           → { success, data: { id, name, slug, ... } }
GET  /api/recipes/categories/{slug}/    → { success, data: { id, name, slug, ... } }
PATCH /api/recipes/categories/{slug}/   → { success, data: { id, name, slug, ... } }
DELETE /api/recipes/categories/{slug}/   → 204 No Content (success, no attached recipes)
                                       → 400 Bad Request (failure, has attached recipes, message: "Không thể xóa danh mục đã có công thức liên kết")

Recipe filter: GET /api/recipes/?categories=mon-viet,mon-a
Recipe create payload: { ..., categories: [uuid1, uuid2] }
```

**Data Model**:
```
Category {
  id: UUID (for API write operations)
  name: string
  slug: string (for API lookups, filtering)
  description: string
  order: number
  is_active: boolean
}

Recipe.categories: Category[] (M2M, includes full category objects)
```

---

## Verification Summary

| Step | Verification Level | Judges | Threshold | Artifacts |
|------|-------------------|--------|-----------|-----------|
| 1 | Single Judge | 1 | 4.0/5.0 | categoryApi.js with CRUD functions + FALLBACK_CATEGORIES |
| 2 | Single Judge | 1 | 4.0/5.0 | CategoryBadge.jsx reusable pill component |
| 3 | Single Judge | 1 | 4.0/5.0 | RecipeCard.jsx with category badge overlay |
| 4 | Panel (2) | 2 | 4.5/5.0 | CategoryFilter.jsx with API + 3000ms timeout |
| 5 | Single Judge | 1 | 4.0/5.0 | RecipeDetailPage.jsx with clickable badges |
| 6 | Single Judge | 1 | 4.0/5.0 | useRecipeDraft.js with categories field |
| 7 | Single Judge | 1 | 4.0/5.0 | StepBasicInfo.jsx with category multi-select |
| 8 | Single Judge | 1 | 4.0/5.0 | ExplorePage.jsx with category filter integration |
| 9 | Panel (2) | 2 | 4.5/5.0 | HomePage.jsx with categories grid section |
| 10 | Panel (2) | 2 | 4.5/5.0 | CategoryManagementPage.jsx admin CRUD page |
| 11 | None | 0 | N/A | App.jsx route addition (binary success) |
| 12 | Single Judge | 1 | 4.0/5.0 | Integration verification across pages |
| 13 | Single Judge | 1 | 4.0/5.0 | Error handling verification |
| 14 | Single Judge | 1 | 4.0/5.0 | Responsive layout verification |

**Total Evaluations:** 16
**Panel Evaluations:** 6 (Steps 4, 9, 10 with 2 judges each)
**Single Judge Evaluations:** 10 (Steps 1, 2, 3, 5, 6, 7, 8, 12, 13, 14)
**No Verification:** 1 (Step 11)

**Implementation Command:** `/implement .specs/tasks/draft/implement-recipe-categories.feature.md`

---

## References

- **Skill**: .claude/skills/recipe-categories/SKILL.md
- **Codebase Analysis**: .specs/analysis/analysis-recipe-categories.md
- **Scratchpad**: .specs/scratchpad/29e1f52a.md