---
title: Implement Admin Panel pages
---

> **Required Skill**: You MUST use and analyse `admin-panel-implementation` skill before doing any modification to task file or starting implementation of it!
>
> Skill location: `.claude/skills/admin-panel-implementation/SKILL.md`

## Initial User Prompt

Tôi đang muốn làm trang cho admin dựa trên requirement (tạm thời) này: F:\VSCode\KitchenMate\.workflow-plan\requirements\requirements-admin-panel.md

# Description

The Admin Panel provides KitchenMate administrators with a content moderation interface to review items flagged as SUSPECT by the AI moderation system. When users submit public recipes or ingredients, AI (Ollama local LLM) analyzes the content and classifies it as: YES (auto-approve), NO (auto-reject), or SUSPECT (requires human review). This panel allows admins to efficiently review the SUSPECT queue and make final approve/reject decisions.

The admin panel includes:
- **Dashboard**: Overview showing counts of items awaiting moderation (counts only, not analytics charts)
- **Recipe Moderation Queue**: Dedicated page listing SUSPECT recipes with details and AI moderation notes
- **Ingredient Moderation Queue**: Dedicated page listing SUSPECT ingredients with details and AI moderation notes
- **Review Detail View**: Full content view with approve/reject actions

This benefits platform quality by ensuring inappropriate content is prevented from appearing publicly while catching edge cases that AI alone cannot handle.

**Scope**:
- Included: Recipe moderation queue page, Ingredient moderation queue page, Dashboard with counts only, Approve/Reject workflow, Admin-only access
- Excluded: User management (ban/warn accounts), Analytics dashboard, Bulk moderation actions, Moderation audit log, Type filter (redundant with separate pages architecture)

**User Scenarios**:
1. **Primary Flow**: Admin logs in, views dashboard with pending count, opens queue, reviews SUSPECT item, clicks Approve, item status changes to APPROVED
2. **Alternative Flow**: Admin reviews SUSPECT item and clicks Reject (with optional rejection reason), item status changes to REJECTED
3. **Error Handling**: Non-admin user attempting to access admin pages sees "403 - Khong co quyen truy cap" or is redirected to login
4. **Empty State**: When PENDING queue is empty, admin sees "Khong co muc nao can duyet" with visual indicator

---

## Acceptance Criteria

Clear, testable criteria using Given/When/Then or checkbox format:

### Functional Requirements

- [ ] **[Criterion 1]**: Admin dashboard displays count of items awaiting moderation
  - Given: Admin is authenticated
  - When: Admin navigates to /admin
  - Then: Dashboard shows count of SUSPECT recipes and count of SUSPECT ingredients

- [ ] **[Criterion 2]**: Admin can view SUSPECT recipe queue
  - Given: Admin is on dashboard
  - When: Admin clicks "Duyet Cong Thuc"
  - Then: System displays paginated list (20 items per page) of SUSPECT recipes with title, created date, moderation notes

- [ ] **[Criterion 3]**: Admin can view SUSPECT ingredient queue
  - Given: Admin is on dashboard
  - When: Admin clicks "Duyet Nguyen Lieu"
  - Then: System displays paginated list (20 items per page) of SUSPECT ingredients with name, category, moderation notes

- [ ] **[Criterion 4]**: Admin can sort queue by date
  - Given: Admin is on moderation queue page
  - When: Admin selects sort order (newest/oldest)
  - Then: Queue displays items in selected order

- [ ] **[Criterion 5]**: Admin can navigate pagination
  - Given: Admin is viewing a paginated queue (20 items per page)
  - When: Admin clicks Next/Previous button or page number
  - Then: System displays the correct page of items

- [ ] **[Criterion 6]**: Admin can view recipe details
  - Given: Admin is on recipe queue page
  - When: Admin clicks on a SUSPECT recipe
  - Then: System displays full recipe details including title, description, ingredients, steps, and AI moderation notes

- [ ] **[Criterion 7]**: Admin can approve SUSPECT recipe
  - Given: Admin is viewing recipe details
  - When: Admin clicks "Duyet" (Approve) button
  - Then: Recipe status changes to APPROVED, item disappears from SUSPECT queue, success notification appears

- [ ] **[Criterion 8]**: Admin can reject SUSPECT recipe
  - Given: Admin is viewing recipe details
  - When: Admin clicks "Tu choi" (Reject) button, optionally enters rejection reason
  - Then: Recipe status changes to REJECTED, item disappears from SUSPECT queue, success notification appears

- [ ] **[Criterion 9]**: Admin can view ingredient details
  - Given: Admin is on ingredient queue page
  - When: Admin clicks on a SUSPECT ingredient
  - Then: System displays full ingredient details including name, category, unit, and AI moderation notes

- [ ] **[Criterion 10]**: Admin can approve SUSPECT ingredient
  - Given: Admin is viewing ingredient details
  - When: Admin clicks "Duyet" (Approve) button
  - Then: Ingredient status changes to APPROVED, item disappears from SUSPECT queue, success notification appears

- [ ] **[Criterion 11]**: Admin can reject SUSPECT ingredient
  - Given: Admin is viewing ingredient details
  - When: Admin clicks "Tu choi" (Reject) button, optionally enters rejection reason
  - Then: Ingredient status changes to REJECTED, item disappears from SUSPECT queue, success notification appears

- [ ] **[Criterion 12]**: Queue displays empty state when no items pending
  - Given: Admin is on moderation queue page with no SUSPECT items
  - When: Admin views the queue
  - Then: System displays empty state message "Khong co muc nao can duyet" with visual indicator (CheckCircle icon)

- [ ] **[Criterion 13]**: Non-admin users cannot access admin pages
  - Given: User is authenticated but not admin (is_staff=False)
  - When: User navigates to /admin or any admin subpage
  - Then: System returns 403 error with message "Khong co quyen truy cap" or redirects to login

- [ ] **[Criterion 14]**: Unauthenticated users redirected to login
  - Given: User is not authenticated
  - When: User navigates to /admin or any admin subpage
  - Then: System redirects to login page

### API Error Handling Requirements

- [ ] **[Criterion 15]**: System handles network timeout during approve/reject
  - Given: Admin is viewing item details
  - When: Admin clicks Approve/Reject and network timeout occurs (30-second threshold)
  - Then: System displays error toast "Ket noi that bai, vui long thu lai" with retry button, UI remains interactive, item status is NOT changed

- [ ] **[Criterion 16]**: System handles server 500 error during approve/reject
  - Given: Admin is viewing item details
  - When: Admin clicks Approve/Reject and server returns 500 error
  - Then: System displays error toast with server error message, UI remains interactive, no status change occurs

- [ ] **[Criterion 17]**: System handles network timeout during queue loading
  - Given: Admin is loading a moderation queue
  - When: Network timeout occurs (30-second threshold)
  - Then: System displays error message with retry button, allows admin to reload the queue

- [ ] **[Criterion 18]**: System handles session timeout during moderation action
  - Given: Admin is viewing item details
  - When: Admin clicks Approve/Reject and session has expired (401 Unauthorized response)
  - Then: System redirects to login page with return URL preserved, after successful login returns admin to item detail page

- [ ] **[Criterion 19]**: System handles concurrent modification by another admin
  - Given: Admin is viewing item details
  - When: Admin clicks Approve/Reject and item was already moderated by another admin (409 Conflict response)
  - Then: System displays info toast "Muc nay da duoc duyet boi admin khac" and removes item from queue, UI remains interactive

### Non-Functional Requirements

- [ ] **Performance**: Moderation queue with 100 items loads within 3 seconds
- [ ] **Security**: All admin endpoints require authentication and admin role (is_staff or is_superuser)
- [ ] **Usability**: Clear visual badge indicating SUSPECT status (orange/yellow warning color)
- [ ] **Error Recovery**: If approve/reject action fails, UI state is reverted (optimistic update rollback)

### Definition of Done

- [ ] All 19 acceptance criteria pass
- [ ] Admin can complete full moderation workflow (view queue -> review item -> approve/reject)
- [ ] Non-admin users receive 403 or redirect
- [ ] Empty queues display appropriate empty state message
- [ ] API errors display user-friendly error messages with retry options
- [ ] Session timeout and concurrent modification handled gracefully
- [ ] All UI text in Vietnamese
- [ ] Responsive design (mobile-friendly for admins on-the-go)

---

## Solution Strategy

**Approach**: Tab-based admin panel with separate pages per domain (Dashboard, Recipe, Ingredient), using existing patterns from CollectionsPage and PublicProfilePage.

**Key Decisions**:
1. **Dashboard + Two Queue Pages**: Separate pages rather than single nested page - clean separation follows existing codebase patterns and simplifies state management
2. **Inline Detail Panels**: Queue pages expand item details inline rather than modal - less page switching, aligns with list-detail pattern
3. **Reusable ConfirmDialog**: Create reusable confirmation modal - approve/reject requires same pattern across recipes and ingredients
4. **Optimistic Updates with Rollback**: UI updates immediately on action, reverts on error - better UX per non-functional requirement "Error Recovery"

**Trade-offs Accepted**:
- Dashboard stats requires backend endpoint: Show "Tinh nang dang phat trien" placeholder until backend implements `/api/admin/dashboard/stats/`
- No charts (Recharts not installed): Accept simple stat cards per task requirement "counts only, not analytics charts"

**Architecture Pattern**: Clean Architecture with Layered Frontend (API layer → Page components → UI components)

---

## Architecture Decomposition

**Components**:

| Component | File Path | Responsibility | Dependencies |
|-----------|-----------|---------------|--------------|
| adminApi | `src/api/adminApi.js` | All admin API calls | axiosInstance |
| DashboardPage | `src/pages/admin/DashboardPage.jsx` | Stats cards with counts only | adminApi |
| RecipeManagementPage | `src/pages/admin/RecipeManagementPage.jsx` | Recipe queue, tabs, pagination, detail | adminApi, ConfirmDialog, RejectDialog |
| IngredientManagementPage | `src/pages/admin/IngredientManagementPage.jsx` | Ingredient queue, tabs, pagination, detail | adminApi, ConfirmDialog, RejectDialog |
| ConfirmDialog | `src/components/ui/ConfirmDialog.jsx` | Reusable confirmation modal | Button, AnimatePresence |
| RejectDialog | `src/components/ui/RejectDialog.jsx` | Reject with optional reason input | ConfirmDialog pattern |

**Interactions**:
```
App.jsx ──► AdminGuard ──► DashboardPage
                          RecipeManagementPage
                          IngredientManagementPage

RecipeManagementPage ──► adminApi.getPendingRecipes()
                       ──► adminApi.approveRecipe() / rejectRecipe()

IngredientManagementPage ──► adminApi.getPendingIngredients()
                          ──► adminApi.approveIngredient() / rejectIngredient()
```

---

## Implementation Process

You MUST launch for each step a separate agent, instead of performing all steps yourself. And for each step marked as parallel, you MUST launch separate agents in parallel.

**CRITICAL:** For each agent you MUST:
1. Use the **Agent** type specified in the step (e.g., `haiku`, `sonnet`, `tech-writer`)
2. Provide path to task file and prompt which step to implement
3. Require agent to implement exactly that step, not more, not less, not other steps

### Parallelization Overview

```
Step 1 (adminApi.js) [opus]
    │
    ├──────────┬──────────┬──────────────┬──────────────┐
    │          │          │              │              │
    ▼          ▼          ▼              ▼              ▼
Step 2      Step 3      Step 4      Step 5          Step 6          Step 7
[haiku]     [haiku]     [opus]      [opus]          [opus]          [opus]
    │          │          │              │              │              │
    └──────────┴──────────┘              │              │              │
                                        │              │              │
         (Steps 2,3,4,5,6,7 parallel after Step 1)    │              │
                                                      └──────┬───────┘
                                                            │
                                                            ▼
                                                       Step 8
                                                 (Integration)
                                                       [haiku]
```

**Max Parallelization Depth: 6 steps can run simultaneously at peak (Steps 2, 3, 4, 5, 6, 7)**

---

### Step 1: Create adminApi.js

**Model:** opus
**Agent:** opus
**Depends on:** None
**Parallel with:** None
**Note:** Foundation step - must complete first before parallel steps

Create centralized API service for all admin endpoints.

#### Expected Output

- `KitchenMate_Frontend/src/api/adminApi.js`: API service with all admin endpoints documented

#### Success Criteria

- [ ] File `src/api/adminApi.js` exists
- [ ] All verified endpoints from skill file are implemented (getRecipePending, approveRecipe, rejectRecipe, getRecipeAll, getIngredientPending, approveIngredient, rejectIngredient, getIngredientAll, getUsers, blockUser, unblockUser)
- [ ] Missing endpoints documented with comments (dashboard stats, dashboard charts, recipe unpublish, ingredient CRUD)
- [ ] Response normalization handled correctly

#### Subtasks

- [ ] Create `src/api/adminApi.js` with axiosInstance import
- [ ] Add dashboard methods (getStats - marked as MISSING backend)
- [ ] Add recipe methods (getRecipePending, getRecipeAll, approveRecipe, rejectRecipe, unpublishRecipe)
- [ ] Add ingredient methods (getIngredientPending, getIngredientAll, approveIngredient, rejectIngredient, createIngredient, updateIngredient, deleteIngredient)
- [ ] Add user methods (getUsers, blockUser, unblockUser)
- [ ] Document MISSING endpoints with `// TODO: Backend MISSING` comments

#### Verification

**Level:** ✅ Single Judge
**Artifact:** `KitchenMate_Frontend/src/api/adminApi.js`
**Threshold:** 4.0/5.0

**Rubric:**

| Criterion | Weight | Description |
|-----------|--------|-------------|
| Endpoint Coverage | 0.30 | All verified endpoints implemented (getRecipePending, approveRecipe, rejectRecipe, getRecipeAll, getIngredientPending, approveIngredient, rejectIngredient, getIngredientAll, getUsers, blockUser, unblockUser) |
| HTTP Method Correctness | 0.20 | GET for list/fetch, POST for actions, correct paths |
| Response Handling | 0.20 | Properly extracts data from {success, data: {results}} wrapper |
| MISSING Documentation | 0.15 | TODO comments for missing endpoints (dashboard stats, charts, ingredient CRUD) |
| Code Quality | 0.15 | Uses axiosInstance, clear function names, proper params handling |

---

### Step 2: Create ConfirmDialog.jsx

**Model:** haiku
**Agent:** haiku
**Depends on:** Step 1
**Parallel with:** Steps 3, 4, 6, 7

Create reusable confirmation modal component for approve actions.

#### Expected Output

- `KitchenMate_Frontend/src/components/ui/ConfirmDialog.jsx`: Reusable confirmation modal

#### Success Criteria

- [ ] File `src/components/ui/ConfirmDialog.jsx` exists
- [ ] Framer Motion animation (fade in/out, scale)
- [ ] Loading state during confirm action
- [ ] Props: `isOpen`, `title`, `message`, `onConfirm`, `onCancel`, `loading`
- [ ] Backdrop click to dismiss

#### Subtasks

- [ ] Create `src/components/ui/ConfirmDialog.jsx`
- [ ] Import Framer Motion (motion, AnimatePresence)
- [ ] Create backdrop overlay with blur
- [ ] Create centered modal with title, message, and action buttons
- [ ] Add loading state that disables confirm button
- [ ] Handle confirm/cancel callbacks

#### Verification

**Level:** ✅ Single Judge
**Artifact:** `KitchenMate_Frontend/src/components/ui/ConfirmDialog.jsx`
**Threshold:** 4.0/5.0

**Rubric:**

| Criterion | Weight | Description |
|-----------|--------|-------------|
| Animation Quality | 0.25 | Framer Motion fade/scale animations work correctly |
| Loading State | 0.25 | Confirm button disabled during loading, shows loading text |
| Props Interface | 0.20 | isOpen, title, message, onConfirm, onCancel, loading properly typed |
| Backdrop Behavior | 0.15 | Click backdrop to dismiss, escape key handling |
| Visual Polish | 0.15 | Centered modal, proper z-index, blur backdrop |

---

### Step 3: Create RejectDialog.jsx

**Model:** haiku
**Agent:** haiku
**Depends on:** Step 1
**Parallel with:** Steps 2, 4, 6, 7

Create reject dialog with optional reason input.

#### Expected Output

- `KitchenMate_Frontend/src/components/ui/RejectDialog.jsx`: Reject dialog with reason textarea

#### Success Criteria

- [ ] File `src/components/ui/RejectDialog.jsx` exists
- [ ] Same animation pattern as ConfirmDialog
- [ ] Textarea for optional rejection reason
- [ ] Loading state during reject action
- [ ] Props: `isOpen`, `title`, `itemName`, `onConfirm`, `onCancel`, `loading`

#### Subtasks

- [ ] Create `src/components/ui/RejectDialog.jsx`
- [ ] Extend ConfirmDialog pattern
- [ ] Add textarea for rejection reason
- [ ] Pass reason in onConfirm callback
- [ ] Add loading state that disables confirm button

#### Verification

**Level:** ✅ Single Judge
**Artifact:** `KitchenMate_Frontend/src/components/ui/RejectDialog.jsx`
**Threshold:** 4.0/5.0

**Rubric:**

| Criterion | Weight | Description |
|-----------|--------|-------------|
| Pattern Conformance | 0.25 | Same animation pattern as ConfirmDialog |
| Textarea Integration | 0.25 | Rejection reason textarea present and functional |
| Reason Passing | 0.20 | onConfirm receives reason as argument |
| Loading State | 0.15 | Confirm button disabled during loading |
| Props Interface | 0.15 | isOpen, title, itemName, onConfirm, onCancel, loading |

---

### Step 4: Create DashboardPage.jsx

**Model:** opus
**Agent:** opus
**Depends on:** Step 1
**Parallel with:** Steps 2, 3, 6, 7

Create admin dashboard with stat cards showing pending counts.

#### Expected Output

- `KitchenMate_Frontend/src/pages/admin/DashboardPage.jsx`: Dashboard with stat cards

#### Success Criteria

- [ ] File `src/pages/admin/DashboardPage.jsx` exists
- [ ] Displays 4 stat cards: Người dùng, Công thức, Chờ duyệt, Nguyên liệu
- [ ] Graceful fallback when backend stats MISSING ("Tính năng đang phát triển")
- [ ] Loading skeletons while fetching
- [ ] Error state with retry button

#### Subtasks

- [ ] Create `src/pages/admin/DashboardPage.jsx`
- [ ] Create stat cards with icons (Users, BookOpen, Clock, Carrot from lucide-react)
- [ ] Call adminApi.getStats() on mount
- [ ] Handle 404/error with "Tính năng đang phát triển" placeholder
- [ ] Add LoadingSkeleton component
- [ ] Add error boundary with retry

#### Verification

**Level:** ✅ Single Judge
**Artifact:** `KitchenMate_Frontend/src/pages/admin/DashboardPage.jsx`
**Threshold:** 4.0/5.0

**Rubric:**

| Criterion | Weight | Description |
|-----------|--------|-------------|
| Stat Cards Display | 0.25 | 4 stat cards: Người dùng, Công thức, Chờ duyệt, Nguyên liệu |
| Graceful Fallback | 0.25 | "Tính năng đang phát triển" when backend MISSING |
| Loading Skeleton | 0.20 | Skeleton shown while fetching |
| Error Handling | 0.20 | Error state with retry button |
| Icon Usage | 0.10 | Users, BookOpen, Clock, Carrot icons from lucide-react |

---

### Step 5: Update App.jsx with Admin Routes

**Model:** opus
**Agent:** opus
**Depends on:** Step 1
**Parallel with:** Steps 2, 3, 4, 6, 7

Add admin routes and AdminGuard to App.jsx.

#### Expected Output

- Updated `KitchenMate_Frontend/src/App.jsx` with admin routes

#### Success Criteria

- [ ] Route `/admin` -> DashboardPage with AdminGuard
- [ ] Route `/admin/recipes` -> RecipeManagementPage with AdminGuard
- [ ] Route `/admin/ingredients` -> IngredientManagementPage with AdminGuard
- [ ] Import AdminGuard from `@/components/auth/AdminGuard`

#### Subtasks

- [ ] Read existing App.jsx
- [ ] Add admin page imports (DashboardPage, RecipeManagementPage, IngredientManagementPage)
- [ ] Add AdminGuard import
- [ ] Add route definitions for /admin, /admin/recipes, /admin/ingredients
- [ ] Verify existing admin routes not duplicated

#### Verification

**Level:** ✅ Single Judge
**Artifact:** `KitchenMate_Frontend/src/App.jsx`
**Threshold:** 4.0/5.0

**Rubric:**

| Criterion | Weight | Description |
|-----------|--------|-------------|
| Route Completeness | 0.30 | /admin -> DashboardPage, /admin/recipes -> RecipeManagementPage, /admin/ingredients -> IngredientManagementPage |
| AdminGuard Integration | 0.25 | AdminGuard wrapper on all admin routes |
| Import Correctness | 0.20 | All page components and AdminGuard properly imported |
| No Duplication | 0.15 | Existing routes not duplicated |
| Route Path Correctness | 0.10 | Exact paths match specification |

---

### Step 6: Create RecipeManagementPage.jsx

**Model:** opus
**Agent:** opus
**Depends on:** Step 1
**Parallel with:** Steps 2, 3, 4, 7

Create recipe moderation queue with tabs, pagination, and inline detail.

#### Expected Output

- `KitchenMate_Frontend/src/pages/admin/RecipeManagementPage.jsx`: Full recipe management page

#### Success Criteria

- [ ] File `src/pages/admin/RecipeManagementPage.jsx` exists
- [ ] Tab navigation: Chờ duyệt, Tất cả
- [ ] Sort by date (newest/oldest)
- [ ] Pagination (20 items/page)
- [ ] Inline expandable detail panel
- [ ] ApproveConfirmDialog integration
- [ ] RejectDialog integration
- [ ] Empty state with CheckCircle icon
- [ ] Loading skeleton
- [ ] Error handling (401/403/409/500/timeout)

#### Subtasks

- [ ] Create `src/pages/admin/RecipeManagementPage.jsx`
- [ ] Add tab state (pending/all) with framer-motion activeTab indicator
- [ ] Implement recipe list fetching (adminApi.getRecipePending, adminApi.getRecipeAll)
- [ ] Add sort controls (newest/oldest)
- [ ] Implement pagination controls (Next/Previous, page numbers)
- [ ] Create RecipeListItem component with expand/collapse
- [ ] Create inline detail panel showing full recipe info
- [ ] Integrate ApproveConfirmDialog
- [ ] Integrate RejectDialog
- [ ] Add empty state with "Không có mục nào cần duyệt"
- [ ] Add loading skeleton
- [ ] Add error handling with retry

#### Verification

**Level:** ✅ CRITICAL - Panel of 2 Judges with Aggregated Voting
**Artifact:** `KitchenMate_Frontend/src/pages/admin/RecipeManagementPage.jsx`
**Threshold:** 4.0/5.0

**Rubric:**

| Criterion | Weight | Description |
|-----------|--------|-------------|
| Tab Navigation | 0.15 | Chờ duyệt / Tất cả tabs with framer-motion indicator |
| Queue Data Fetching | 0.15 | adminApi.getRecipePending/getRecipeAll called correctly |
| Sort Controls | 0.10 | Sort by date (newest/oldest) functional |
| Pagination | 0.15 | 20 items/page, Next/Previous, page numbers work |
| Inline Detail Panel | 0.15 | Expand/collapse shows full recipe with AI moderation notes |
| Approve/Reject Integration | 0.15 | ApproveConfirmDialog and RejectDialog work correctly |
| Empty State | 0.10 | CheckCircle icon with "Không có mục nào cần duyệt" |
| Error Handling | 0.05 | 401/403/409/500/timeout handled with toast + retry |

---

### Step 7: Create IngredientManagementPage.jsx

**Model:** opus
**Agent:** opus
**Depends on:** Step 1
**Parallel with:** Steps 2, 3, 4, 6

Create ingredient moderation queue (mirrors RecipeManagementPage pattern).

#### Expected Output

- `KitchenMate_Frontend/src/pages/admin/IngredientManagementPage.jsx`: Full ingredient management page

#### Success Criteria

- [ ] File `src/pages/admin/IngredientManagementPage.jsx` exists
- [ ] Same pattern as RecipeManagementPage
- [ ] Tab navigation: Chờ duyệt, Tất cả
- [ ] Sort by date, pagination (20 items/page)
- [ ] Inline detail panel
- [ ] ApproveConfirmDialog + RejectDialog
- [ ] Empty state, loading skeleton, error handling

#### Subtasks

- [ ] Create `src/pages/admin/IngredientManagementPage.jsx`
- [ ] Mirror RecipeManagementPage structure
- [ ] Replace recipe calls with ingredient calls (adminApi.getIngredientPending, etc.)
- [ ] Replace recipe display with ingredient display
- [ ] Test with ingredient data shapes

#### Verification

**Level:** ✅ CRITICAL - Panel of 2 Judges with Aggregated Voting
**Artifact:** `KitchenMate_Frontend/src/pages/admin/IngredientManagementPage.jsx`
**Threshold:** 4.0/5.0

**Rubric:**

| Criterion | Weight | Description |
|-----------|--------|-------------|
| Pattern Mirroring | 0.25 | Same structure as RecipeManagementPage |
| Ingredient API Calls | 0.20 | adminApi.getIngredientPending/getIngredientAll called correctly |
| Display Correctness | 0.20 | Shows ingredient name, category, unit, AI moderation notes |
| Tab/Pagination/Sort | 0.15 | Same as RecipeManagementPage |
| Empty/Error States | 0.10 | CheckCircle icon, error handling |
| Approve/Reject Dialogs | 0.10 | Dialogs work correctly for ingredients |

---

## Verification Summary

| Step | Verification Level | Judges | Threshold | Artifacts |
|------|-------------------|--------|-----------|-----------|
| 1 | ✅ Single Judge | 1 | 4.0/5.0 | adminApi.js |
| 2 | ✅ Single Judge | 1 | 4.0/5.0 | ConfirmDialog.jsx |
| 3 | ✅ Single Judge | 1 | 4.0/5.0 | RejectDialog.jsx |
| 4 | ✅ Single Judge | 1 | 4.0/5.0 | DashboardPage.jsx |
| 5 | ✅ Single Judge | 1 | 4.0/5.0 | App.jsx (updated) |
| 6 | ✅ Panel (2) | 2 | 4.0/5.0 | RecipeManagementPage.jsx |
| 7 | ✅ Panel (2) | 2 | 4.0/5.0 | IngredientManagementPage.jsx |

**Total Evaluations:** 1+1+1+1+1+2+2 = 9

**Implementation Command:** `/implement $TASK_FILE`

---

## Risks & Blockers Summary

### High Priority

| Risk/Blocker | Impact | Likelihood | Mitigation |
|--------------|--------|------------|------------|
| Backend dashboard stats MISSING | HIGH | HIGH | Show "Tính năng đang phát triển" placeholder until backend implements |
| Backend ingredient CRUD MISSING | HIGH | HIGH | Only implement approve/reject, mark other operations as TODO |
| Backend recipe unpublish MISSING | MEDIUM | MEDIUM | Document as TODO, coordinate with backend team |

### Medium Priority

| Risk/Blocker | Impact | Likelihood | Mitigation |
|--------------|--------|------------|------------|
| Recharts not installed | LOW | LOW | Use stat cards only, no charts |
| Response shape inconsistency | LOW | LOW | Handle both paginated and non-paginated formats |

---

## High Complexity/Uncertainty Tasks Requiring Attention

**Task T004: DashboardPage.jsx**
- Complexity: Medium
- Uncertainty: HIGH - Backend dashboard stats endpoint MISSING
- Recommendation: Show "Tính năng đang phát triển" placeholder until backend implements

**Task T006: RecipeManagementPage.jsx**
- Complexity: Medium
- Uncertainty: Medium - Inline detail panel with expand/collapse state per item
- Recommendation: Use PublicProfilePage tabs pattern as reference

---

## Definition of Done (Task Level)

- [ ] All implementation steps completed
- [ ] All 19 acceptance criteria verified
- [ ] Tests written and passing
- [ ] Documentation updated
- [ ] No high-priority risks unaddressed

---

## Expected Changes

```
KitchenMate_Frontend/src/
├── api/
│   └── adminApi.js                         # NEW: Admin API calls
├── components/
│   └── ui/
│       ├── ConfirmDialog.jsx               # NEW: Reusable confirmation modal
│       └── RejectDialog.jsx                # NEW: Reject with optional reason
├── pages/
│   └── admin/
│       ├── DashboardPage.jsx               # NEW: Stats cards (counts only)
│       ├── RecipeManagementPage.jsx        # NEW: Recipe queue + detail view
│       └── IngredientManagementPage.jsx    # NEW: Ingredient queue + detail view
└── App.jsx                                 # UPDATE: Add /admin/* routes

KitchenMate_Backend/apps/admin_panel/
├── views.py                                 # UPDATE: Add dashboard stats action
└── urls.py                                  # UPDATE: Add dashboard stats route
```

**EXCLUDED per task scope**:
- `UserManagementPage.jsx` - User management explicitly out of scope (task line 27)
- `Charts` - Task requires "counts only, not analytics charts"
- `AdminGuard.jsx` - Already exists at `src/components/auth/AdminGuard.jsx`

---

## Building Block View

```
┌─────────────────────────────────────────┐
│              Admin Panel                  │
├─────────────────────────────────────────┤
│  ┌─────────┐  ┌─────────┐  ┌─────────┐   │
│  │Dashboard│  │ Recipe │  │Ingredient│  │
│  │  Page   │  │  Page   │  │  Page   │   │
│  └────┬────┘  └────┬────┘  └────┬────┘   │
│       │            │            │          │
│       └────────────┼────────────┘          │
│                    ▼                       │
│            ┌─────────────┐                │
│            │  adminApi   │                │
│            └─────────────┘                │
│                    │                      │
│                    ▼                      │
│            ┌─────────────┐                │
│            │ axiosInstance│               │
│            └─────────────┘                │
└─────────────────────────────────────────┘
```

---

## Runtime Scenarios

**Scenario: Admin Approves Recipe**

```
Admin ──► /admin/recipes ──► RecipeManagementPage loads
          │
          ▼
        getPendingRecipes() ──► API returns paginated list
          │
          ▼
        Click recipe item ──► Detail panel expands inline
          │
          ▼
        Click "Duyet" ──► ConfirmDialog appears
          │
          ▼
        Click "Duyet" in dialog ──► approveRecipe(id) called
          │                                    │
          │                              API returns 200
          │                                    │
          ▼                                    ▼
        Optimistic update ──► item removed from queue
          │
          ▼
        toast.success("Da duyet cong thuc")
```

**State Transitions**:
```
PENDING ──(approve)──► PUBLIC
        │
        └──(reject)──► PRIVATE/REJECTED
```

**Concurrent Modification Scenario**:
```
Admin clicks Approve ──► API call sent
                          │
                          ▼
                    409 Conflict (already moderated by another admin)
                          │
                          ▼
                    toast.info("Muc nay da duoc duyet boi admin khac")
                          │
                          ▼
                    Item removed from queue
```

---

## High-Level Structure

```
Feature: Admin Panel
├── Entry Point: /admin (requires is_staff)
├── DashboardPage: Stats cards only
│   ├── Pending Recipe Count
│   └── Pending Ingredient Count
├── RecipeManagementPage:
│   ├── Tab: Chờ duyệt (pending list)
│   ├── Tab: Tất cả (all list)
│   └── Inline detail + approve/reject
└── IngredientManagementPage:
    ├── Tab: Chờ duyệt (pending list)
    ├── Tab: Tất cả (all list)
    └── Inline detail + approve/reject
```

---

## Workflow Steps

```
1. Admin navigates to /admin
       │
       ▼
2. Dashboard loads with stats (or "Tinh nang dang phat trien" if backend missing)
       │
       ▼
3. Admin clicks "Duyet Cong Thuc" link
       │
       ▼
4. /admin/recipes loads with pending queue (20 items/page)
       │
       ▼
5. Admin clicks recipe item
       │
       ▼
6. Detail panel expands inline showing full recipe + AI moderation notes
       │
       ▼
7. Admin clicks "Duyet" (Approve) or "Tu choi" (Reject with optional reason)
       │
       ▼
8. Confirmation dialog appears
       │
       ▼
9. Admin confirms ──► API call ──► Success toast + item removed from queue
       │                │
       │          Error ──► toast.error + UI rollback
       ▼
10. Admin continues or navigates to Ingredient management
```

---

## Contracts

**API Contract - Dashboard Stats**
```
Endpoint: GET /api/admin/dashboard/stats/
Input: None (auth header with is_staff required)
Output: {
  success: true,
  data: {
    pending_recipe_count: number,
    pending_ingredient_count: number
  }
}
Errors: 401 (Unauthorized), 403 (Forbidden - not admin)
```

**API Contract - Recipe Actions**
```
Endpoint: POST /api/admin/recipes/{id}/approve/
       POST /api/admin/recipes/{id}/reject/
Input (reject only): { reason?: string }
Output: { success: true, message: "Cong thuc da duoc duyet va cong khai." }
Errors: 401, 403, 409 (already moderated by another admin)
```

**API Contract - Ingredient Actions**
```
Endpoint: POST /api/admin/ingredients/{id}/approve/
       POST /api/admin/ingredients/{id}/reject/
Input (reject only): { reason?: string }
Output: { success: true, message: "Nguyen lieu da duoc duyet." }
Errors: 401, 403, 409 (already moderated by another admin)
```

**Response Shape - Paginated List**
```json
{
  "success": true,
  "data": {
    "count": 20,
    "next": "/api/admin/recipes/pending/?page=2",
    "previous": null,
    "results": [...]
  }
}
```

**Pagination Handler**:
```javascript
const list = res.data?.results || res.data?.data || res.data || []
const total = res.data?.count || res.data?.data?.count || 0
const totalPages = Math.ceil(total / pageSize)
```

---

## Architecture Decisions

### Decision 1: Page Structure

**Context**: Admin panel needs 3 main areas (Dashboard, Recipe queue, Ingredient queue)

**Options**:
1. Single `/admin` page with nested tabs (Approach 2, probability 0.80)
2. Separate pages `/admin`, `/admin/recipes`, `/admin/ingredients` (Approach 1, probability 0.85)

**Decision**: Option 2 - Separate pages

**Consequences**:
- PRO: Each page has independent state, simpler to maintain
- PRO: AdminGuard wraps each page independently
- PRO: URL directly reflects location, browser back works naturally
- CON: More page components to create

---

### Decision 2: Detail Display

**Context**: How to show item details when admin clicks on queue item

**Options**:
1. Modal overlay with full detail
2. Inline expandable panel
3. Navigate to separate detail page

**Decision**: Option 2 - Inline expandable panel

**Consequences**:
- PRO: Less page switching, faster workflow
- PRO: Can see context of list while reviewing detail
- PRO: Matches pattern from PublicProfilePage tabs
- CON: Requires managing expand/collapse state per item

---

### Decision 3: Confirmation Pattern

**Context**: Approve/Reject actions need confirmation

**Options**:
1. Inline buttons with immediate action
2. Confirmation dialog (modal)
3. Confirmation dialog with reason input for reject

**Decision**: Option 3 with separate dialogs - ConfirmDialog for approve, RejectDialog for reject with optional reason

**Consequences**:
- PRO: Prevents accidental approve/reject
- PRO: Reject dialog allows admin to enter reason
- PRO: Reusable ConfirmDialog used for both recipes and ingredients
- CON: Extra click to confirm

---

## High Complexity/Uncertainty Tasks Requiring Attention

**Step 1: Foundation**
1. Create `src/api/adminApi.js`
2. Create `src/components/ui/ConfirmDialog.jsx`
3. Create `src/components/ui/RejectDialog.jsx`
4. Update `App.jsx` with admin routes + AdminGuard

**Step 2: Dashboard**
5. Create `src/pages/admin/DashboardPage.jsx`
6. Add stat cards layout
7. Handle missing backend gracefully

**Step 3: Recipe Management**
8. Create `src/pages/admin/RecipeManagementPage.jsx`
9. Add tabs (Chờ duyệt / Tất cả)
10. Add pagination and sorting
11. Add inline detail panel
12. Add ApproveConfirmDialog and RejectDialog integration

**Step 4: Ingredient Management**
13. Create `src/pages/admin/IngredientManagementPage.jsx`
14. Mirror Recipe Management pattern

**Step 5: Polish**
15. Empty states
16. Loading skeletons
17. Error handling (401/403/409/500/timeout)
18. Toast notifications
19. Responsive design verification
