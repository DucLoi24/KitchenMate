---
title: Add user management to admin panel
---

## Initial User Prompt

Thêm chức năng quản lý user vào trong admin panel hiện tại. Bao gồm: xem danh sách users, block/unblock user, phân quyền admin. Đây là feature bổ sung cho admin panel đã có.

## Description

Add user management functionality to the existing admin panel. This feature allows platform administrators to view all registered users, block/unblock user accounts to control access, and manage admin privileges by assigning or removing admin roles. The primary goal is to provide self-service user management tools without requiring direct database access, enabling efficient platform administration and security enforcement.

Target users are platform administrators and superusers who need to manage user access and permissions. Key considerations include role-based permissions (only superusers can assign admin roles), self-protection (admins cannot block themselves), and maintaining user content visibility even when accounts are blocked.

**Scope**:
- Included: Paginated user list (20 per page), search by name or email, sort by name/email/join date, block user (sets is_active=False), unblock user (sets is_active=True), assign admin role (sets is_staff=True), remove admin role (sets is_staff=False)
- Excluded: User deletion, password reset by admin, user activity history/logs, email verification management, bulk user operations

**User Scenarios**:
1. **Primary Flow**: Admin views paginated user list, uses search to find a specific user, and blocks them after confirming action
2. **Alternative Flow**: Superuser assigns admin role to a trusted user who will help manage the platform
3. **Error Handling**: When network errors occur, system displays error toast with retry option; permission denied (403) shows appropriate message

## Acceptance Criteria

### Functional Requirements

- [ ] **[R1 - View User List]**: Admin can view paginated list of all users with 20 users per page
  - Given: Admin is on the user management page (`/admin/users`)
  - When: Page loads successfully
  - Then: First page displays up to 20 users with avatar, name, email, role badge, status badge, and join date

- [ ] **[R2 - Pagination]**: Admin can navigate between pages using Previous/Next buttons and page numbers
  - Given: User list has more than 20 users
  - When: Admin clicks "Next" or a page number
  - Then: List updates to show the corresponding page of users

- [ ] **[R3 - Search by Name or Email]**: Admin can search users by name or email with debounced input (300ms)
  - Given: Admin is on user management page
  - When: Admin types a search term in the search box
  - Then: After 300ms, list filters to show only users where name or email contains the search term (case-insensitive)

- [ ] **[R4 - Sort Users]**: Admin can sort users by name, email, or join date
  - Given: Admin is on user management page
  - When: Admin clicks a column header (Name, Email, or Joined)
  - Then: Users are sorted by the selected column in ascending order; clicking again reverses to descending order

- [ ] **[R5 - Block User]**: Admin can block a user, preventing them from logging in
  - Given: Admin is viewing user list and has identified a user to block
  - When: Admin clicks "Khoa" button on the user's row and confirms the action
  - Then: User's `is_active` field is set to `False`, user status shows "Bi khoa" badge, and blocked user cannot log in

- [ ] **[R6 - Unblock User]**: Admin can unblock a previously blocked user, restoring their ability to log in
  - Given: Admin is viewing a blocked user (status "Bi khoa")
  - When: Admin clicks "Mo khoa" button and confirms the action
  - Then: User's `is_active` field is set to `True`, status badge changes to "Hoat dong", and user can log in again

- [ ] **[R7 - Assign Admin Role]**: Superuser can assign admin role to a user, granting them admin panel access
  - Given: Superuser is viewing a non-admin user
  - When: Superuser clicks "Phan quyen admin" button and confirms the action
  - Then: User's `is_staff` field is set to `True`, role badge changes to "Quan tri vien", and user gains admin panel access

- [ ] **[R8 - Remove Admin Role]**: Superuser can remove admin role from a user, revoking their admin panel access
  - Given: Superuser is viewing an admin user
  - When: Superuser clicks "Xoa quyen admin" button and confirms the action
  - Then: User's `is_staff` field is set to `False`, role badge changes to "Nguoi dung", and user loses admin panel access

- [ ] **[R9 - Self-Block Prevention]**: Admin cannot block, unblock, or modify their own account
  - Given: Admin is viewing their own user row in the list
  - When: Admin looks at the action buttons
  - Then: All action buttons (Khoa, Mo khoa, Phan quyen admin, Xoa quyen admin) are disabled or hidden for their own account

- [ ] **[R10 - Admin Role Permission]**: Only superuser can assign or remove admin roles; regular admin receives error message
  - Given: Regular admin (is_staff=True but not superuser) is on user management page
  - When: Regular admin clicks "Phan quyen admin" on another user
  - Then: Backend returns 403 Forbidden and UI displays error toast "Ban khong co quyen thuc hien hanh dong nay. Chi quan tri vien moi co the thuc hien."

- [ ] **[R10b - Session Invalidation on Block]**: When a user is blocked, their active sessions are invalidated immediately
  - Given: Admin is blocking an active user (is_active=True) who currently has an active session
  - When: Admin confirms the block action
  - Then: Backend invalidates all active sessions for that user, blocked user is logged out on their next action, and cannot log in until unblocked

- [ ] **[R11 - Pagination Boundary - First Page]**: Previous button is disabled on first page
  - Given: Admin is on page 1 of the user list
  - When: Admin views the pagination controls
  - Then: Previous button is disabled/grayed out, and page number shows "1 / N"

- [ ] **[R12 - Pagination Boundary - Last Page]**: Next button is disabled on last page
  - Given: Admin is on the last page of the user list (page N where N is total pages)
  - When: Admin views the pagination controls
  - Then: Next button is disabled/grayed out, and clicking it does not navigate to a non-existent page

- [ ] **[R13 - Empty Search Results]**: System displays empty state when search returns no users
  - Given: Admin has entered a search term that matches no users
  - When: After 300ms debounce, the search completes
  - Then: User list area shows empty state with message "Khong tim thay nguoi dung nao phu hop voi tu khoa '[search term]'" and suggestion to try different keywords or clear search

### Non-Functional Requirements

- [ ] **Performance**: User list page loads within 2 seconds
- [ ] **Security**: Backend enforces permission checks (only superuser can modify is_staff)
- [ ] **Usability**: All destructive actions (block, unblock, assign/remove admin) show confirmation dialog before executing; success/error toasts are displayed after action completes

### Definition of Done

- [ ] All acceptance criteria pass
- [ ] User management page integrated into existing admin panel with consistent styling
- [ ] All actions (block, unblock, assign admin, remove admin) show confirmation dialogs
- [ ] Toast notifications appear on success or failure
- [ ] Loading states displayed during API calls
- [ ] Empty state shown when no users found
- [ ] Error state with retry button when API fails

---

## Solution Strategy

**Approach**: Tab-based admin page following existing RecipeManagementPage patterns with three-tab layout (Tat ca, Da khoa, Quan tri vien), confirmation dialogs for all destructive actions, and self-block prevention.

**Key Decisions**:
1. **Tab Layout**: Three tabs provide clear categorization - matches admin panel conventions
2. **Dialog Confirmation**: All actions (block, unblock, assign/remove admin) require confirmation - security critical
3. **Self-Block Prevention**: Action buttons disabled for own account via user.id === currentUser.id
4. **Backend First**: Implement set_admin endpoint before frontend - frontend depends on it

**Architecture Pattern**: Clean Architecture with Django/React Separation
- Backend follows Django DRF patterns with ViewSet `@action` decorators (admin_panel/views.py)
- Frontend follows React component patterns (RecipeManagementPage as template)
- Clear separation between data layer (adminApi), UI components (UserManagementPage), and dialogs
- Codebase precedent: RecipeManagementPage.jsx, IngredientManagementPage.jsx, adminApi.js

**Trade-offs Accepted**:
- Tab complexity for better UX filtering by status
- Four separate dialog components for proper confirmation flows
- Backend session invalidation adds overhead but ensures immediate block effect (R10b)

---

## References

- **Skill**: F:\VSCode\KitchenMate\.claude\skills\admin-panel-implementation\SKILL.md
- **Analysis**: F:\VSCode\KitchenMate\.specs\analysis\analysis-admin-user-management.md
- **Scratchpad**: F:\VSCode\KitchenMate\.specs\scratchpad\9a230b75.md

---

## Expected Changes

**Frontend Changes**:
```
KitchenMate_Frontend/src/
  api/
    adminApi.js              UPDATE: Add setAdminRole method
  pages/admin/
    UserManagementPage.jsx   NEW: User management page with tabs, search, sort, pagination
  App.jsx                    UPDATE: Add /admin/users route + lazy import
```

**Backend Changes**:
```
KitchenMate_Backend/apps/
├── admin_panel/
│   └── views.py               UPDATE: Add set_admin action + session invalidation in block() for R10b
└── accounts/
    └── serializers.py         UPDATE: Add is_active field to UserSerializer for blocked status display
```

---

## Architecture Decomposition

**Components**:

| Component | File Path | Responsibility |
|-----------|-----------|----------------|
| UserManagementPage | src/pages/admin/UserManagementPage.jsx | Main page with tabs, user list, search, sort, pagination |
| UserListItem | Inline in UserManagementPage | User row with avatar, name, badges, action buttons |
| BlockUserDialog | Inline in UserManagementPage | Confirmation for block action |
| UnblockUserDialog | Inline in UserManagementPage | Confirmation for unblock action |
| AssignAdminDialog | Inline in UserManagementPage | Confirmation for assign admin action |
| RemoveAdminDialog | Inline in UserManagementPage | Confirmation for remove admin action |

---

## Implementation Process

You MUST launch for each step a separate agent, instead of performing all steps yourself. And for each step marked as parallel, you MUST launch separate agents in parallel.

**CRITICAL:** For each agent you MUST:
1. Use the **Agent** type specified in the step (e.g., `haiku`, `sonnet`, `developer`)
2. Provide path to task file and prompt which step to implement
3. Require agent to implement exactly that step, not more, not less, not other steps

### Parallelization Overview

```
Step 1 (Add set_admin action) [developer/opus]
    │
    ├─────────────────┐
    ▼                 ▼
Step 2              Step 3
(Session)      (setAdminRole API)
[developer/opus]  [developer/sonnet]
    │                 │
    └───────┬────────┘
            ▼
         Step 4
    (UserManagementPage)
        [developer/opus]
            │
    ┌───────┴───────┐
    ▼               ▼
Step 5           Step 6
(Dialogs)      (Route)
[developer/opus]  [developer/haiku]
```

**Max Parallelization Depth:** 2 steps can run simultaneously (Steps 2 & 3, then Steps 5 & 6)

---

### Step 1: Add set_admin action to AdminUserViewSet

**Model:** opus
**Agent:** developer
**Depends on:** None
**Parallel with:** None

**Goal**: Backend provides admin role assignment endpoint

**Expected Output**:
- `KitchenMate_Backend/apps/admin_panel/views.py`: New `set_admin` action in AdminUserViewSet
- POST /api/admin/users/{id}/set-admin/ with {is_admin: boolean}
- Permission: IsSuperuser (returns 403 for non-superusers)

**Success Criteria**:
- [ ] `set_admin` action exists in AdminUserViewSet
- [ ] Only superuser can assign admin role
- [ ] Regular admin (is_staff but not superuser) receives 403
- [ ] Returns success message on completion

**Subtasks**:
- [X] Add `set_admin` action with @action decorator (url_path='set-admin')
- [X] Add permission check: `if not request.user.is_superuser: return Response(403, status=403)`
- [X] Implement user.is_staff toggle based on is_admin value
- [X] Tests written and passing for set_admin action

#### Verification

**Level:** CRITICAL - Panel of 2 Judges with Aggregated Voting
**Artifact:** `KitchenMate_Backend/apps/admin_panel/views.py`
**Threshold:** 4.0/5.0
**Status:** PASS (4.9/5.0) [DONE]

**Rubric:**

| Criterion | Weight | Description |
|-----------|--------|-------------|
| Correctness | 0.25 | set_admin action exists and toggles is_staff correctly based on is_admin value |
| Security | 0.35 | Only superuser can call set_admin; 403 returned for non-superusers |
| Error Handling | 0.20 | Returns 404 for non-existent users; proper error messages |
| Code Quality | 0.10 | Follows Django DRF conventions; proper @action decorator usage |
| Performance | 0.10 | No obvious inefficiencies in the action |

**Reference Pattern:** `KitchenMate_Backend/apps/admin_panel/views.py` (existing block/unblock actions)

---

### Step 2: Add session invalidation to block() action

**Model:** opus
**Agent:** developer
**Depends on:** Step 1
**Parallel with:** Step 3

**Goal**: When user is blocked, all their sessions are invalidated immediately (R10b)

**Expected Output**:
- `KitchenMate_Backend/apps/admin_panel/views.py`: Updated `block()` action with session deletion

**Success Criteria**:
- [ ] After setting user.is_active=False, query django_session table for user sessions
- [ ] Delete all sessions for that user using SessionStore.delete() for each session_key
- [ ] Blocked user cannot access any API on their next request
- [ ] Tests written and passing for session invalidation

**Subtasks**:
- [X] Import SessionStore from django.contrib.sessions
- [X] Query sessions for user_id from django_session table
- [X] Loop through session_keys and delete each session via SessionStore.delete()
- [X] Tests written and passing

#### Verification

**Level:** CRITICAL - Panel of 2 Judges with Aggregated Voting
**Artifact:** `KitchenMate_Backend/apps/admin_panel/views.py`
**Threshold:** 4.0/5.0
**Status:** PASS (4.9/5.0) [DONE]

**Rubric:**

| Criterion | Weight | Description |
|-----------|--------|-------------|
| Correctness | 0.30 | SessionStore.delete() called for each user session; proper session table query |
| Security | 0.30 | All sessions invalidated; blocked user cannot re-authenticate after block |
| Error Handling | 0.20 | Handles missing sessions gracefully; no exceptions thrown |
| Code Quality | 0.10 | Proper import of SessionStore from django.contrib.sessions; clean query |
| Performance | 0.10 | Batch deletion without memory issues on large session tables |

**Reference Pattern:** `KitchenMate_Backend/apps/admin_panel/views.py` block() action

---

### Step 3: Add setAdminRole to adminApi.js

**Model:** sonnet
**Agent:** developer
**Depends on:** Step 1
**Parallel with:** Step 2

**Goal**: Frontend API client can call set_admin endpoint

**Expected Output**:
- `KitchenMate_Frontend/src/api/adminApi.js`: New `setAdminRole(id, isAdmin)` method

**Success Criteria**:
- [ ] Method exists and calls POST /api/admin/users/${id}/set-admin/
- [ ] Sends {is_admin: boolean} in request body
- [ ] Returns promise that resolves to response
- [ ] Tests written and passing

**Subtasks**:
- [X] Add setAdminRole method to adminApi object after unblockUser method
- [X] Tests written and passing

#### Verification

**Level:** Single Judge
**Artifact:** `KitchenMate_Frontend/src/api/adminApi.js`
**Threshold:** 4.0/5.0
**Status:** PASS (4.9/5.0) [DONE]

**Rubric:**

| Criterion | Weight | Description |
|-----------|--------|-------------|
| Contract Correctness | 0.30 | Calls POST /api/admin/users/${id}/set-admin/ with correct HTTP method |
| Request Shape | 0.25 | Sends {is_admin: boolean} in request body |
| Error Handling | 0.25 | Returns promise that resolves to response; handles errors appropriately |
| Consistency | 0.20 | Follows existing adminApi patterns (blockUser, unblockUser) |

**Reference Pattern:** `KitchenMate_Frontend/src/api/adminApi.js` (existing blockUser, unblockUser methods)

---

### Step 4: Create UserManagementPage.jsx

**Model:** opus
**Agent:** developer
**Depends on:** Steps 2, 3
**Parallel with:** None

**Goal**: Full user management page with tabs, search, sort, pagination

**Expected Output**:
- `KitchenMate_Frontend/src/pages/admin/UserManagementPage.jsx`: Complete page component

**Success Criteria**:
- [ ] Three tabs: 'all', 'blocked', 'admin' with correct filtering logic
- [ ] Search input with 300ms debounce (minimum 2 characters)
- [ ] Sort controls for name/email/created_at (default: -created_at)
- [ ] Pagination with Previous/Next buttons (20 users per page)
- [ ] LoadingSkeleton during initial load
- [ ] EmptyState when no users found
- [ ] ErrorState with retry on API failure
- [ ] Tests written and passing

**Subtasks**:
- [X] Create page component structure (following RecipeManagementPage pattern)
- [X] Implement tab state and filtering logic (all/blocked/admin tabs)
- [X] Implement search with 300ms debounce
- [X] Implement sort controls
- [X] Implement pagination controls
- [X] Add LoadingSkeleton, EmptyState, ErrorState components
- [X] Tests written and passing

#### Verification

**Level:** CRITICAL - Panel of 2 Judges with Aggregated Voting
**Artifact:** `KitchenMate_Frontend/src/pages/admin/UserManagementPage.jsx`
**Threshold:** 4.0/5.0
**Status:** PASS (4.5/5.0) [DONE]

**Rubric:**

| Criterion | Weight | Description |
|-----------|--------|-------------|
| Functional Completeness | 0.25 | All tabs, search, sort, pagination implemented per success criteria |
| State Management | 0.20 | Correct tab filtering, debounce, sort state handling |
| UI Components | 0.20 | LoadingSkeleton, EmptyState, ErrorState present and functional |
| User Experience | 0.20 | 300ms debounce, pagination controls work correctly |
| Code Quality | 0.15 | Follows RecipeManagementPage pattern; clean component structure |

**Reference Pattern:** `KitchenMate_Frontend/src/pages/admin/RecipeManagementPage.jsx` (existing admin page pattern)

---

### Step 5: Implement confirmation dialogs

**Model:** opus
**Agent:** developer
**Depends on:** Step 4
**Parallel with:** Step 6

**Goal**: All destructive actions have confirmation dialogs with self-block prevention

**Expected Output**:
- BlockUserDialog, UnblockUserDialog, AssignAdminDialog, RemoveAdminDialog as inline components

**Success Criteria**:
- [ ] BlockUserDialog shows user name, warning text, confirm/cancel buttons
- [ ] UnblockUserDialog shows user name, confirm/cancel buttons
- [ ] AssignAdminDialog shows user name, confirm/cancel buttons
- [ ] RemoveAdminDialog shows user name, confirm/cancel buttons
- [ ] All dialogs show loading state during API call
- [ ] All dialogs display success/error toast on completion
- [ ] Self-block prevention: user.id === currentUser.id disables all action buttons
- [ ] Tests written and passing

**Subtasks**:
- [X] Implement BlockUserDialog with adminApi.blockUser call
- [X] Implement UnblockUserDialog with adminApi.unblockUser call
- [X] Implement AssignAdminDialog with adminApi.setAdminRole(id, true) call
- [X] Implement RemoveAdminDialog with adminApi.setAdminRole(id, false) call
- [X] Implement self-block prevention (user.id === currentUser.id check)
- [X] Tests written and passing

#### Verification

**Level:** Per-Item Judges (4 separate evaluations in parallel - one per dialog)
**Artifacts:** `KitchenMate_Frontend/src/pages/admin/UserManagementPage.jsx` (4 dialog components)
**Threshold:** 4.0/5.0
**Status:** PASS (4.0-4.8/5.0) [DONE]

**Rubric (per dialog):**

| Criterion | Weight | Description |
|-----------|--------|-------------|
| Functional Correctness | 0.30 | Dialog shows correct user info; calls correct API method |
| User Confirmation Flow | 0.25 | Confirm/cancel buttons work; loading state during API call |
| Toast Notifications | 0.20 | Success/error toast displayed after action |
| Self-Block Prevention | 0.25 | user.id === currentUser.id disables buttons correctly |

**Reference Pattern:** RecipeManagementPage confirm dialogs

---

### Step 6: Add route in App.jsx

**Model:** haiku
**Agent:** developer
**Depends on:** Step 4
**Parallel with:** Step 5

**Goal**: User management page accessible at /admin/users

**Expected Output**:
- `KitchenMate_Frontend/src/App.jsx`: New route and lazy import for UserManagementPage

**Success Criteria**:
- [ ] Lazy import added for UserManagementPage
- [ ] Route /admin/users added with AdminGuard and Suspense
- [ ] Tests written and passing

**Subtasks**:
- [X] Add lazy import after existing admin page imports
- [X] Add route after /admin/ingredients route
- [X] Tests written and passing

#### Verification

**Level:** Single Judge
**Artifact:** `KitchenMate_Frontend/src/App.jsx`
**Threshold:** 4.0/5.0
**Status:** PASS (5.0/5.0) [DONE]

**Rubric:**

| Criterion | Weight | Description |
|-----------|--------|-------------|
| Correctness | 0.40 | Route /admin/users added; lazy import for UserManagementPage present |
| Integration | 0.30 | AdminGuard and Suspense applied correctly to route |
| Consistency | 0.30 | Follows existing admin route patterns in App.jsx |

**Reference Pattern:** `KitchenMate_Frontend/src/App.jsx` (existing admin routes)

---

## Implementation Summary

| Step | Goal | Output | Est. Effort |
|------|------|--------|-------------|
| 1 | Add set_admin action | Backend endpoint for admin role assignment | Small |
| 2 | Session invalidation on block | Blocked user sessions deleted | Medium |
| 3 | Add setAdminRole to adminApi | Frontend API method | Small |
| 4 | Create UserManagementPage | Complete page with tabs, search, sort, pagination | Large |
| 5 | Implement confirmation dialogs | Four dialog components with self-block prevention | Medium |
| 6 | Add route in App.jsx | /admin/users route accessible | Small |

**Total Steps**: 6
**Critical Path**: Steps 1 -> 2 -> 3 -> 4 -> 6 (Step 5 can run in parallel with Step 4)
**Parallel Opportunities**: Step 2 depends on Step 1 only; Steps 5 can begin after Step 4 structure exists
**High Priority Risks**: R10b session invalidation complexity (Medium - involves Django session management)
**Estimated Total Effort**: Medium (6 steps, mix of Small/Medium/Large)

---

## Risks & Blockers Summary

### High Priority

| Risk/Blocker | Impact | Likelihood | Mitigation |
|--------------|--------|------------|------------|
| set_admin endpoint missing | HIGH - Cannot assign admin role | LOW (well-documented, simple endpoint) | Implement Step 1 first |
| Session invalidation (R10b) complexity | MEDIUM - Blocked user sessions may persist | LOW (Django session API is well-documented) | Use Django SessionStore.delete() approach |
| Self-block prevention (R9) not working | HIGH - Security issue | LOW (simple user.id === currentUser.id check) | Verify in Step 5 testing |

### Medium Priority

| Risk/Blocker | Impact | Likelihood | Mitigation |
|--------------|--------|------------|------------|
| UserSerializer missing is_active field | MEDIUM - Cannot display blocked status | LOW (analysis confirmed field exists) | Verify before Phase 3 |

---

## Definition of Done

- [X] All 6 implementation steps completed
- [X] All acceptance criteria verified (R1-R13)
- [X] Tests written and passing for backend actions (Steps 1, 2)
- [X] Tests written and passing for frontend API (Step 3)
- [X] Tests written and passing for UserManagementPage (Steps 4, 5, 6)
- [X] User management page integrated into existing admin panel with consistent styling
- [X] All actions (block, unblock, assign admin, remove admin) show confirmation dialogs
- [X] Toast notifications appear on success or failure
- [X] Loading states displayed during API calls
- [X] Empty state shown when no users found
- [X] Error state with retry button when API fails
- [X] Self-block prevention verified (R9)
- [X] Admin-only actions verified to return 403 for non-superusers (R10)
- [X] Session invalidation verified on block (R10b)

---

## Build Sequence

**Phase 1 - Backend Core** (Prerequisite - must complete before frontend):
1. Add `set_admin` action to AdminUserViewSet in admin_panel/views.py
   - POST /api/admin/users/{id}/set-admin/
   - Body: {is_admin: boolean}
   - Permission: superuser only (returns 403 for non-superusers)

2. **Session Invalidation (R10b)**: Add session invalidation to `block()` action
   - After `user.is_active = False`, query all user sessions from django_session table
   - Delete each session via SessionStore.delete(session_key)
   - Ensures blocked user is logged out immediately

3. Add `is_active` field to UserSerializer (accounts/serializers.py)
   - Frontend needs this field to display blocked status ("Bi khoa" badge)
   - User model has `is_active` field - just need to expose in serializer output

**Phase 2 - Frontend API**:
2. Add setAdminRole(id, isAdmin) to adminApi.js

**Phase 3 - Frontend Page**:
3. Create UserManagementPage.jsx
   - Tab state: 'all' | 'blocked' | 'admin'
   - LoadingSkeleton, EmptyState, ErrorState
   - Search with 300ms debounce (min 2 chars)
   - Sort by name/email/created_at
   - Pagination controls

4. Implement confirmation dialogs:
   - BlockUserDialog, UnblockUserDialog
   - AssignAdminDialog, RemoveAdminDialog

**Phase 4 - Route Integration**:
5. Add lazy import + route in App.jsx

**Phase 5 - Testing**:
6. Test all user interactions
7. Verify self-block prevention (R9)
8. Verify admin-only actions return 403 for non-superusers (R10)
9. **Verify session invalidation on block (R10b)** - blocked user cannot access any API after being blocked

**Phase 1 - Backend Core** (Prerequisite - must complete before frontend):
1. Add `set_admin` action to AdminUserViewSet in admin_panel/views.py
   - POST /api/admin/users/{id}/set-admin/
   - Body: {is_admin: boolean}
   - Permission: superuser only (returns 403 for non-superusers)

2. **Session Invalidation (R10b)**: Add session invalidation to `block()` action
   - After `user.is_active = False`, query all user sessions from django_session table
   - Delete each session via SessionStore.delete(session_key)
   - Ensures blocked user is logged out immediately

3. Add `is_active` field to UserSerializer (accounts/serializers.py)
   - Frontend needs this field to display blocked status ("Bi khoa" badge)
   - User model has `is_active` field - just need to expose in serializer output

**Phase 2 - Frontend API**:
2. Add setAdminRole(id, isAdmin) to adminApi.js

**Phase 3 - Frontend Page**:
3. Create UserManagementPage.jsx
   - Tab state: 'all' | 'blocked' | 'admin'
   - LoadingSkeleton, EmptyState, ErrorState
   - Search with 300ms debounce (min 2 chars)
   - Sort by name/email/created_at
   - Pagination controls

4. Implement confirmation dialogs:
   - BlockUserDialog, UnblockUserDialog
   - AssignAdminDialog, RemoveAdminDialog

**Phase 4 - Route Integration**:
5. Add lazy import + route in App.jsx

**Phase 5 - Testing**:
6. Test all user interactions
7. Verify self-block prevention (R9)
8. Verify admin-only actions return 403 for non-superusers (R10)
9. **Verify session invalidation on block (R10b)** - blocked user cannot access any API after being blocked

---

## Verification Summary

| Step | Verification Level | Judges | Threshold | Artifacts |
|------|-------------------|--------|-----------|-----------|
| 1 | CRITICAL - Panel (2) | 2 | 4.0/5.0 | admin_panel/views.py (set_admin action) |
| 2 | CRITICAL - Panel (2) | 2 | 4.0/5.0 | admin_panel/views.py (session invalidation) |
| 3 | Single Judge | 1 | 4.0/5.0 | adminApi.js (setAdminRole method) |
| 4 | CRITICAL - Panel (2) | 2 | 4.0/5.0 | UserManagementPage.jsx (full page) |
| 5 | Per-Item | 4 | 4.0/5.0 | 4 dialog components (Block/Unblock/Assign/Remove) |
| 6 | Single Judge | 1 | 4.0/5.0 | App.jsx (route config) |

**Total Evaluations:** 12 (Panel: 6 + Single: 2 + Per-Item: 4)
**Implementation Command:** `/implement $TASK_FILE`

---

## Runtime Scenarios

**Scenario: Block User**
1. Admin clicks "Khoa" button on user row
2. BlockUserDialog opens with user name confirmation
3. Admin clicks "Khoa" to confirm
4. Loading state shows on dialog button
5. adminApi.blockUser(id) called
6. Success: toast shows, dialog closes, list reloads
7. Error: toast shows error message, dialog stays open

**Scenario: Self-Block Prevention (R9)**
1. Admin viewing their own row
2. All action buttons (Khoa, Mo khoa, Phan quyen, Xoa quyen) are disabled/hidden
3. user.id === currentUser.id check disables buttons

**Scenario: Assign Admin Role (R10)**
1. Superuser clicks "Phan quyen admin"
2. AssignAdminDialog opens
3. Superuser confirms
4. adminApi.setAdminRole(id, true) called
5. Backend sets user.is_staff = True
6. Success: toast shows, role badge changes to "Quan tri vien"

---

## Contracts

**API: set_admin Endpoint**
```
POST /api/admin/users/{id}/set-admin/
Request: { "is_admin": true/false }
Response (200): { "success": true, "message": "Tai khoan user@example.com da duoc phan quyen quan tri vien." }
Errors:
  - 403: "Ban khong co quyen thuc hien hanh dong nay" (non-superuser)
  - 404: User does not exist
```

**API: getUsers Endpoint**
```
GET /api/admin/users/list/?page=1&search=term&ordering=-created_at
Response (200): {
  "success": true,
  "data": {
    "count": 150,
    "next": "...",
    "previous": null,
    "results": [{ id, email, full_name, avatar_url, bio, is_active, is_staff, created_at }]
  }
}
```

---

## Architecture Decisions

**Decision: Tab-based vs Single List**

| Option | Pros | Cons | Decision |
|--------|------|------|----------|
| Tab-based (Tat ca, Da khoa, Quan tri vien) | Clear categorization, matches RecipeManagementPage | More complex | SELECTED |
| Single List with Filter | Simpler UI | Different from other admin pages | Rejected |

**Decision: Dialog-based Confirmations**

| Option | Pros | Cons | Decision |
|--------|------|------|----------|
| Confirmation Dialogs | Secure, clear intent | More components | SELECTED |
| Inline Toggle | Faster workflow | No confirmation, security risk | Rejected |

**Decision: Self-Block Prevention**

- Frontend: Disable buttons when user.id === currentUser.id
- Backend: No self-check required (frontend hides the buttons)
- Rationale: R9 requires self-account protection; frontend approach is sufficient since backend already requires is_staff authentication