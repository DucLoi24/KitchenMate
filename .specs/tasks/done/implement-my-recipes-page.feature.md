---
title: Implement "Công thức của tôi" page
---

## Initial User Prompt

Tôi muốn bổ sung khu vực "Công thức của tôi", sẽ list ra các công thức của user đó tạo, có thể chỉnh sửa công thức, chuyển trạng thái công thức (Private -> Public (Đi qua kiểm duyệt từ admin/AI) hoặc từ Public -> Private), xem chi tiết công thức và một số chức năng hữu ích khác.

## Description

The "Công thức của tôi" (My Recipes) page provides recipe creators with a dedicated interface to manage their recipes. Users can view all their recipes in a filtered list, edit existing recipes, and control visibility by toggling between Private and Public status. When a recipe is made Public, it enters a moderation workflow where AI (Ollama) reviews the content and sets a status (Pending/Approved/Rejected). Users can see the moderation status of their public recipes through visible badges.

This feature serves authenticated recipe creators who need centralized control over their content and transparency into the review process.

**Scope**:
- Included: List view with status filtering (All/Public/Private), recipe details view, edit redirect to existing editor, status toggle (Private <-> Public) with proper moderation flow, moderation status badge display, empty state handling
- Excluded: Recipe creation, deletion, analytics, sharing, bulk operations

**User Scenarios**:
1. **Primary Flow**: User views their recipe list, filters by status, and edits a recipe
2. **Alternative Flow (Make Public)**: User toggles Private recipe to Public, triggers AI moderation, sees "Đang chờ duyệt" badge
3. **Alternative Flow (Make Private)**: User toggles Public recipe to Private, badge disappears immediately
4. **Error Handling**: Status change failure shows error toast; unauthorized access shows permission error

---

## Acceptance Criteria

### Functional Requirements

- [ ] **[FR1]**: List own recipes with pagination
  - Given: User is authenticated
  - When: User navigates to My Recipes page
  - Then: System displays paginated list of user's recipes with thumbnail, title, status badge, moderation status badge (if public), and created date

- [ ] **[FR2]**: Filter recipes by status - All
  - Given: User is on My Recipes page
  - When: User clicks "Tất cả" filter tab
  - Then: System displays all recipes regardless of status

- [ ] **[FR3]**: Filter recipes by status - Public
  - Given: User is on My Recipes page
  - When: User clicks "Công khai" filter tab
  - Then: System displays only public recipes

- [ ] **[FR4]**: Filter recipes by status - Private
  - Given: User is on My Recipes page
  - When: User clicks "Riêng tư" filter tab
  - Then: System displays only private recipes

- [ ] **[FR5]**: View recipe details
  - Given: User sees recipe list
  - When: User clicks on a recipe card
  - Then: System navigates to existing recipe detail page

- [ ] **[FR6]**: Edit recipe
  - Given: User sees recipe list
  - When: User clicks "Sửa" button on a recipe
  - Then: System navigates to recipe editor with pre-populated data

- [ ] **[FR7]**: Make recipe public (triggers AI moderation)
  - Given: User has a private recipe
  - When: User clicks "Chuyển sang Công khai" and confirms
  - Then: System sets status to Public with moderation_status=PENDING, displays "Đang chờ duyệt" badge

- [ ] **[FR8]**: Make recipe private (immediate)
  - Given: User has a public recipe
  - When: User clicks "Chuyển sang Riêng tư" and confirms
  - Then: System immediately sets status to Private and removes moderation badge

- [ ] **[FR9]**: Display moderation status badge on public recipes
  - Given: User has public recipes with various moderation statuses
  - When: User views their recipe list
  - Then: Public recipes display appropriate badge: "Đã duyệt" (approved), "Đang chờ duyệt" (pending), or "Bị từ chối" (rejected)

- [ ] **[FR10]**: Empty state
  - Given: User has no recipes
  - When: User navigates to My Recipes page
  - Then: System shows empty state message "Bạn chưa có công thức nào. Tạo công thức đầu tiên!"

### Non-Functional Requirements

- [ ] **Performance**: Page load completes within 2 seconds with 20 recipes displayed
- [ ] **Security**: Backend enforces owner-only access; user cannot view/edit other users' recipes
- [ ] **Usability**: Clear status badges with distinct colors, intuitive filter tabs, confirmation dialog before status change

### Definition of Done

- [ ] All acceptance criteria pass (FR1-FR10)
- [ ] List view displays correctly with filtering
- [ ] Edit redirect works with pre-populated data
- [ ] Status toggle triggers correct moderation flow
- [ ] Moderation badges display correctly for each status
- [ ] Empty state shows appropriate message
- [ ] Error handling for failed operations
- [ ] Code follows existing project patterns
- [ ] UI follows design spec (`FRONTEND_DESIGN.md`)

---

## Architecture Overview

### Solution Strategy

1. **Build `MyRecipesPage.jsx`** as a list-based page using existing `RecipeCard` components
2. **Leverage existing `useMyRecipes()` hook** from `useRecipes.js` for data fetching
3. **Implement client-side filtering** via filter tabs (ALL/PRIVATE/PENDING/PUBLIC)
4. **Follow `CollectionsPage.jsx` pattern** for page structure (loading/error/empty states)
5. **Add navigation links** in Header/Sidebar/BottomNav

### Key Architectural Decisions

| Decision | Rationale |
|----------|-----------|
| Client-side filtering | User's recipe list is typically small; avoids N+1 API calls |
| RecipeCard reuse | Consistent UI with other recipe list pages |
| Visibility badge on cards | Mirrors existing moderation status pattern |
| Edit button conditional on PRIVATE | Backend blocks non-PRIVATE edits; UI enforces same |
| Publish via dedicated endpoint | AI moderation is async; `/publish/` handles full flow |

### Backend API (No Changes Required)

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/recipes/my-recipes/` | GET | IsAuthenticated | Returns all user recipes (PRIVATE/PENDING/PUBLIC) |
| `/api/recipes/{id}/publish/` | POST | IsOwner, only PRIVATE | Submit to AI moderation |
| `/api/recipes/{id}/` | PATCH | IsOwner, only PRIVATE | Update recipe |
| `/api/recipes/{id}/` | DELETE | IsOwner | Delete recipe |

### File Changes

**New Files:**
- `src/pages/recipe/MyRecipesPage.jsx`
- `src/hooks/useMyRecipes.js` (optional extension)

**Modify Files:**
- `src/App.jsx` - Add `/my-recipes` route with `AuthGuard`
- `src/components/layout/Header.jsx` - Add "Công thức của tôi" nav link
- `src/components/layout/Sidebar.jsx` - Add nav link
- `src/components/layout/BottomNav.jsx` - Add mobile nav link

### Moderation Flow

```
PRIVATE → [user clicks "Chuyển sang Công khai"] → POST /publish/ 
→ AI moderation → PENDING (SUSPECT) or PUBLIC (YES)
→ "Đang chờ duyệt" or "Đã duyệt" badge displayed
```

### State Management

- `useMyRecipes()` hook manages fetching/caching of user's recipes
- Local React state for active filter tab
- Filter operates client-side from cached data (no re-fetch on filter change)

### Technology Stack

- React + Vite (existing)
- Tailwind CSS v4 (existing)
- Framer Motion (existing)
- `useMyRecipes()` from `src/hooks/useRecipes.js`
- `AuthGuard` wrapper for route protection
- RecipeCard component with `variant` and visibility props

---

## Implementation Process

### Step 1: Setup MyRecipesPage Component and Route [DONE]
**Goal**: Create MyRecipesPage component skeleton with route and navigation
**Output**: `src/pages/recipe/MyRecipesPage.jsx` with route in `src/App.jsx` and nav links
**Agent**: sonnet
**Parallel with**: —
**Depends on**: —
**Success Criteria**:
- `src/pages/recipe/MyRecipesPage.jsx` exists and exports default component
- Route `/my-recipes` added in `src/App.jsx` protected by `AuthGuard`
- "Công thức của tôi" link appears in `src/components/layout/Header.jsx`
- "Công thức của tôi" link appears in `src/components/layout/Sidebar.jsx`
- "Công thức của tôi" link appears in `src/components/layout/BottomNav.jsx`

**Subtasks**:
- [ ] Create `src/pages/recipe/MyRecipesPage.jsx` with basic structure (LoadingPortal pattern)
- [ ] Add route `/my-recipes` in `src/App.jsx` with `AuthGuard`
- [ ] Add "Công thức của tôi" link in `src/components/layout/Header.jsx`
- [ ] Add "Công thức của tôi" link in `src/components/layout/Sidebar.jsx`
- [ ] Add "Công thức của tôi" link in `src/components/layout/BottomNav.jsx`

**Blockers/Risks**:
- **Check**: Existing route patterns in `src/App.jsx`
  - **Resolution if missing**: Follow existing `AuthGuard` + `Route` pattern from other protected routes
- **Check**: Nav component file structure (`Header.jsx`, `Sidebar.jsx`, `BottomNav.jsx`)
  - **Resolution if patterns differ**: Read the nav files to match existing link structure

**Verification**:
- **Level**: Panel (high-level review)
- **Threshold**: 4.0/5.0
- **Rubrics**:
  - Route `/my-recipes` protected by AuthGuard exists in App.jsx
  - Nav links exist in Header, Sidebar, BottomNav with correct label
  - Component exports default properly
  - Follows existing page pattern (like CollectionsPage)
- **Check**:
  - File exists at correct path
  - Import paths are valid
  - Route added correctly with path `/my-recipes`
  - Nav links use correct icon and label "Công thức của tôi"

---

### Step 2: Data Fetching with useMyRecipes Hook [DONE]
**Goal**: Fetch user's recipes using hook
**Output**: Data fetched and available for rendering
**Agent**: sonnet
**Parallel with**: —
**Depends on**: Step 1
**Success Criteria**:
- `useMyRecipes()` from `src/hooks/useRecipes.js` returns user recipes
- Loading state managed via hook
- Error state managed via hook with retry capability

**Subtasks**:
- [ ] Call `useMyRecipes()` hook in component
- [ ] Handle `isLoading` state
- [ ] Handle `error` state with retry button
- [ ] Pass data to render layer

**Blockers/Risks**:
- **Check**: `useMyRecipes()` hook exists in `src/hooks/useRecipes.js`
  - **Resolution if missing**: Use `useRecipes()` with `my_recipes` filter, or create new hook following existing pattern
- **Check**: Hook returns `{ recipes, isLoading, error, refetch }` shape
  - **Resolution if shape differs**: Adapt component to match actual hook API

**Dependencies**: (Already annotated above)

**Verification**:
- **Level**: Per-Item (verify each data flow)
- **Threshold**: 4.0/5.0
- **Rubrics**:
  - Hook call present with `useMyRecipes()` 
  - Loading state displayed via `isLoading` or `isPending`
  - Error state shown with retry capability via `refetch()` or `retry()`
  - Data passed to render layer via `recipes` prop
- **Check**:
  - Correct hook imported from `src/hooks/useRecipes.js`
  - Three states (loading/error/success) all handled
  - Error message displayed in UI
  - Retry button calls refetch function

---

### Step 3: Recipe Card List Display [DONE]
**Goal**: Display recipes using RecipeCard component
**Output**: Recipe cards with thumbnails, titles, status badges
**Agent**: sonnet
**Parallel with**: —
**Depends on**: Step 2
**Success Criteria**:
- `src/pages/recipe/MyRecipesPage.jsx` renders list of RecipeCard components
- Cards display thumbnail via `recipe_thumbnail` flattened field
- Cards display title via `recipe_title` flattened field
- Cards display visibility badge (Public/Private)
- Cards display moderation status badge for public recipes

**Subtasks**:
- [ ] Map recipes to RecipeCard components
- [ ] Use flattened fields: `recipe_thumbnail`, `recipe_title`
- [ ] Display moderation badges: "Đã duyệt" (APPROVED), "Đang chờ duyệt" (PENDING), "Bị từ chối" (REJECTED)
- [ ] Conditional edit button: only for PRIVATE recipes

**Blockers/Risks**:
- **Check**: RecipeCard component exists in `src/components/recipe/`
  - **Resolution if missing**: Create Card from scratch following design spec
- **Check**: RecipeCard accepts `variant` and `moderationStatus` props
  - **Resolution if props differ**: Adapt to match RecipeCard API

**Dependencies**: (Already annotated above)

**Verification**:
- **Level**: Per-Item
- **Threshold**: 4.5/5.0
- **Rubrics**:
  - Recipes mapped to RecipeCard components via `.map()`
  - Flattened field `recipe_thumbnail` used (not nested `recipe.thumbnail_url`)
  - Flattened field `recipe_title` used (not nested `recipe.title`)
  - Visibility badge shows for PUBLIC status
  - Moderation badge shows for public recipes: APPROVED="Đã duyệt", PENDING="Đang chờ duyệt", REJECTED="Bị từ chối"
  - Edit button conditional on `status === 'PRIVATE'`
- **Check**:
  - Correct field names from API serializer
  - Badge conditions match backend status enums
  - Edit button only appears for private recipes

---

### Step 4: Status Filter Tabs
**Goal**: Implement client-side filtering (All/Public/Private tabs)
**Output**: Working filter tabs that switch visible recipes
**Agent**: haiku
**Parallel with**: Steps 5, 6
**Depends on**: Step 3
**Success Criteria**:
- "Tất cả" tab shows all recipes
- "Công khai" tab shows only public recipes (status=PUBLIC)
- "Riêng tư" tab shows only private recipes (status=PRIVATE)
- Active tab visually distinct (underline + color)
- Count displayed per tab (optional)

**Subtasks**:
- [ ] Create filter tab component/buttons
- [ ] Implement client-side filter logic using `filter()` + `status`
- [ ] Style active tab state
- [ ] Update URL param or local state

**Blockers/Risks**:
- **Check**: Recipe status values (PRIVATE, PUBLIC, PENDING)
  - **Resolution if values differ**: Check backend serializer for exact status choices

**Dependencies**: (Already annotated above)

**Verification**:
- **Level**: Per-Item
- **Threshold**: 4.0/5.0
- **Rubrics**:
  - Three tabs rendered: "Tất cả", "Công khai", "Riêng tư"
  - Client-side filter using `.filter()` on recipes array
  - "Tất cả" shows all recipes (no filter)
  - "Công khai" filters to `status === 'PUBLIC'`
  - "Riêng tư" filters to `status === 'PRIVATE'`
  - Active tab has distinct styling (bg/color/underline)
- **Check**:
  - Filter logic correctly matches status values
  - Tab click updates visible recipes
  - Active state persists correctly

---

### Step 5: Card Navigation - View & Edit [DONE]
**Goal**: Add click handlers for card navigation and edit button
**Output**: Cards navigate to detail, edit button navigates to editor
**Agent**: haiku
**Parallel with**: Steps 4, 6, 7
**Depends on**: Step 3
**Success Criteria**:
- Clicking card body navigates to `/recipe/:id` (recipe detail)
- Edit button visible on PRIVATE recipes only
- Edit button navigates to `/recipe/:id/edit`
- Public/PENDING recipes show badge but no edit button

**Subtasks**:
- [ ] Make card clickable (wrap in link or add onClick + useNavigate)
- [ ] Add edit button (icon) to card
- [ ] Conditional render: edit button only for `status === 'PRIVATE'`
- [ ] Navigate to editor on edit click

**Blockers/Risks**:
- **Check**: Recipe detail route path
  - **Resolution if path differs**: Check `src/App.jsx` for existing recipe routes
- **Check**: Recipe editor route path
  - **Resolution if path differs**: Find existing editor route pattern

**Dependencies**: (Already annotated above)

**Verification**:
- **Level**: Per-Item
- **Threshold**: 4.0/5.0
- **Rubrics**:
  - Card body click navigates to `/recipe/{id}`
  - Edit button navigates to `/recipe/{id}/edit`
  - Edit button only rendered when `status === 'PRIVATE'`
  - Navigation uses `useNavigate` hook correctly
  - Edit button click does NOT trigger card navigation (stopPropagation)
- **Check**:
  - `navigate()` called with correct path format
  - `onClick` handlers properly placed
  - `e.stopPropagation()` used on edit button

---

### Step 6: Status Toggle - Make Public (Private → Public) [DONE]
**Goal**: Add "Chuyển sang Công khai" button with confirmation dialog
**Output**: Recipe submitted for AI moderation, "Đang chờ duyệt" badge shown
**Agent**: sonnet
**Parallel with**: Steps 4, 5, 7
**Depends on**: Step 3
**Success Criteria**:
- "Chuyển sang Công khai" button visible on PRIVATE recipes
- Confirmation dialog appears on click
- Confirming triggers POST to `/api/recipes/{id}/publish/`
- On success: recipe enters moderation, "Đang chờ duyệt" badge displayed
- On error: toast error message

**Subtasks**:
- [ ] Add "Chuyển sang Công khai" button to card (PRIVATE only)
- [ ] Confirmation dialog before submission
- [ ] Call POST `/api/recipes/{id}/publish/` API on confirm
- [ ] Update local state with PENDING moderation_status
- [ ] Show error toast on failure
- [ ] Handle loading state during API call

**Blockers/Risks**:
- **Check**: `/publish/` endpoint exists and accepts POST
  - **Resolution if blocked**: Use PATCH to `/api/recipes/{id}/` with `status=PUBLIC` if publish endpoint doesn't exist
- **Check**: Moderation flow returns PENDING for SUSPECT results
  - **Resolution if differs**: Display appropriate badge based on actual moderation status returned

**Dependencies**: Step 3 (card list implementation)

**Verification**:
- **Level**: Per-Item (critical - API mutation)
- **Threshold**: 4.5/5.0
- **Rubrics**:
  - Button rendered only for `status === 'PRIVATE'`
  - Confirmation dialog shown before API call
  - POST request to `/api/recipes/{id}/publish/`
  - Local state updated with `moderation_status: 'PENDING'` on success
  - Error toast displayed on API failure
  - Loading state disabled during API call
- **Check**:
  - Correct API endpoint from recipeApi.js
  - Request body correct (empty or {})
  - Optimistic update OR refetch after success
  - Toast appears with error message on failure

---

### Step 7: Status Toggle - Make Private (Public → Private)
**Goal**: Add "Chuyển sang Riêng tư" button with confirmation dialog
**Output**: Immediate status change, badge removed
**Agent**: sonnet
**Parallel with**: Steps 4, 5, 6
**Depends on**: Step 3
**Success Criteria**:
- "Chuyển sang Riêng tư" button visible on PUBLIC/PENDING recipes
- Confirmation dialog appears on click
- Confirming triggers PATCH to `/api/recipes/{id}/` with `status=PRIVATE`
- On success: badge disappears, recipe moves to private filter
- On error: toast error message

**Subtasks**:
- [ ] Add "Chuyển sang Riêng tư" button to card (PUBLIC/PENDING only)
- [ ] Reuse confirmation dialog
- [ ] Call PATCH API on confirm
- [ ] Update local state
- [ ] Show error toast on failure

**Blockers/Risks**:
- **Check**: PATCH endpoint accepts status change
  - **Resolution if blocked**: Backend enforces owner-only; UI reflects same restriction

**Dependencies**: (Already annotated above)

**Verification**:
- **Level**: Per-Item (critical - API mutation)
- **Threshold**: 4.5/5.0
- **Rubrics**:
  - Button rendered only for `status === 'PUBLIC'` or `status === 'PENDING'`
  - Confirmation dialog shown before API call
  - PATCH request with `status: 'PRIVATE'` in body
  - Local state updated: `status: 'PRIVATE'`, `moderation_status` cleared
  - Error toast displayed on API failure
- **Check**:
  - Correct PATCH endpoint and method
  - Request body contains `status: 'PRIVATE'`
  - State correctly updated after success
  - Toast appears with error message on failure

---

### Step 8: Empty State [DONE]
**Goal**: Display friendly empty state when user has no recipes
**Output**: Empty state UI with message and CTA
**Agent**: haiku
**Parallel with**: —
**Depends on**: Step 4
**Success Criteria**:
- Shows message "Bạn chưa có công thức nào. Tạo công thức đầu tiên!"
- Has CTA button to navigate to recipe creation page (`/recipe/create`)
- Empty state shows when filtered list is empty (not when all recipes empty)

**Subtasks**:
- [ ] Check if filtered recipes array is empty after filter
- [ ] Render empty state component (use existing pattern or create)
- [ ] Add link to recipe creation page

**Blockers/Risks**:
- **Check**: Recipe creation page route
  - **Resolution if route differs**: Check `src/App.jsx` for creation route

**Dependencies**: Step 4 (filter implementation)

**Verification**:
- **Level**: Panel
- **Threshold**: 4.0/5.0
- **Rubrics**:
  - Exact message displayed: "Bạn chưa có công thức nào. Tạo công thức đầu tiên!"
  - CTA button links to `/recipe/create`
  - Empty state shows when filtered list length is 0
  - Empty state NOT shown when recipes exist (even if filtered empty message needed)
- **Check**:
  - Text matches exactly (including punctuation)
  - Button navigates to correct creation route
  - Conditional rendering checks filtered list length

---

### Step 9: Polish - Animations & Error Handling [DONE]
**Goal**: Smooth animations and comprehensive error handling
**Output**: Polished page with animations and toast notifications
**Agent**: sonnet
**Parallel with**: —
**Depends on**: Steps 1-8 complete
**Success Criteria**:
- Page load animation (fade in via Framer Motion)
- Filter tab switch animation
- Card hover animations
- Toast notifications for all errors
- Confirmation dialog animations

**Subtasks**:
- [ ] Add Framer Motion page transitions
- [ ] Add card hover effects
- [ ] Add toast error handling (use existing toast system)
- [ ] Verify all edge cases handled

**Blockers/Risks**: None

**Dependencies**: (Already annotated above)

**Verification**:
- **Level**: Panel
- **Threshold**: 3.5/5.0
- **Rubrics**:
  - Framer Motion `motion.div` or `AnimatePresence` used for page transitions
  - Card hover uses `whileHover` or CSS hover with transition
  - Toast notifications for API errors (useExisting toast system)
  - Confirmation dialog has enter/exit animations
- **Check**:
  - No pure CSS animations without Framer Motion
  - Toast system imported and used correctly
  - Motion components properly configured

---

### Implementation Order Rationale

**Phase 1 (Parallel)**: Step 1 - Setup page, route, and navigation links

**Phase 2a (Sequential Chain)**:
- Step 2: Data fetching (depends on Step 1)
- Step 3: Card list display (depends on Step 2)

**Phase 2b (Parallel - 4 agents)**:
- Step 4: Filter tabs (depends on Step 3)
- Step 5: Card navigation (depends on Step 3)
- Step 6: Make public toggle (depends on Step 3)
- Step 7: Make private toggle (depends on Step 3)

**Phase 2c**: Step 8 - Empty state (depends on Step 4)

**Phase 3**: Step 9 - Polish (depends on Steps 1-8)

### ASCII Parallelization Diagram

```
Phase 1 (Sequential):
Step 1 ──► Step 2 ──► Step 3
              │
              └──────────┬──────────┬──────────┐
                         │          │          │
                         ▼          ▼          ▼
Phase 2b (Parallel):  Step 4   Step 5   Step 6 ──► Step 7
                    Filter   Edit     Make Public  Make Private
                         │          │          │
                         └──────────┴──────────┘
                                    │
                                    ▼
Phase 2c (Sequential):         Step 8
                            Empty State
                                   │
                                   ▼
Phase 3 (Sequential):         Step 9
                            Polish
```

---

## Risk Assessment (with Resolutions)

| Step | Risk | Check | Resolution if Fails |
|------|------|-------|---------------------|
| Step 2 | `useMyRecipes()` hook may not exist | `src/hooks/useRecipes.js` | Use `useRecipes()` with filter, or create new hook |
| Step 3 | RecipeCard component may not exist | `src/components/recipe/RecipeCard.jsx` | Create card from scratch following design spec |
| Step 6 | `/publish/` endpoint may differ | `src/api/recipeApi.js` | Adapt to match actual endpoint name |
| Step 7 | PATCH may not allow status change | Backend permissions | UI already reflects same restriction |
| Step 8 | Recipe creation page route unknown | `src/App.jsx` | Find route from existing code |

---

## Verification Summary

| Step | Verification Level | Threshold | Key Check |
|------|-------------------|-----------|-----------|
| Step 1: Setup | Panel | 4.0/5.0 | Route AuthGuard, nav links in Header/Sidebar/BottomNav |
| Step 2: Data Fetching | Per-Item | 4.0/5.0 | Hook returns {recipes, isLoading, error, refetch} |
| Step 3: Recipe Card List | Per-Item | 4.5/5.0 | Flattened fields, moderation badges, conditional edit |
| Step 4: Filter Tabs | Per-Item | 4.0/5.0 | Client-side filter logic, active tab styling |
| Step 5: Card Actions | Per-Item | 4.0/5.0 | Navigation paths, conditional edit button |
| Step 6: Make Public | Per-Item | 4.5/5.0 | POST /publish/, PENDING status, error toast |
| Step 7: Make Private | Per-Item | 4.5/5.0 | PATCH with status=PRIVATE, state update |
| Step 8: Empty State | Panel | 4.0/5.0 | Exact message, CTA to /recipe/create |
| Step 9: Polish | Panel | 3.5/5.0 | Framer Motion, toast system, hover effects |

(End of file - total 497 lines)