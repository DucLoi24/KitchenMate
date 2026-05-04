---
title: Codebase Impact Analysis - Add user management to admin panel
task_file: F:\VSCode\KitchenMate\.specs\tasks\draft\admin-user-management.feature.md
scratchpad: F:\VSCode\KitchenMate\.specs\scratchpad\7af442d7.md
created: 2026-05-29
status: complete
---

# Codebase Impact Analysis: Add user management to admin panel

## Summary

- **Files to Modify**: 3 files (2 frontend, 1 backend)
- **Files to Create**: 1 file (UserManagementPage.jsx)
- **Files to Delete**: 0 files
- **Test Files Affected**: 0 files (no tests exist for admin panel)
- **Risk Level**: Low

---

## Files to be Modified/Created

### Frontend Changes

```
KitchenMate_Frontend/src/
├── api/
│   └── adminApi.js              # UPDATE: Add setAdminRole method
├── pages/admin/
│   └── UserManagementPage.jsx   # NEW: User management page
└── App.jsx                      # UPDATE: Add /admin/users route + lazy import
```

### Backend Changes

```
KitchenMate_Backend/apps/admin_panel/
└── views.py                    # UPDATE: Add set_admin action to AdminUserViewSet
```
Note: urls.py does NOT need changes - the DRF router automatically handles `@action` decorated methods.

---

## API Endpoints (Verified)

### Existing Endpoints (in adminApi.js)

| Method | Endpoint | Location |
|--------|----------|----------|
| GET | `/api/admin/users/list/` | `adminApi.js:131-135` |
| POST | `/api/admin/users/{id}/block/` | `adminApi.js:142-146` |
| POST | `/api/admin/users/{id}/unblock/` | `adminApi.js:153-157` |

### Missing Endpoint: set_admin (NEEDS IMPLEMENTATION)

**HTTP Method**: POST
**URL Path**: `/api/admin/users/{id}/set-admin/`
**Backend Location**: `KitchenMate_Backend/apps/admin_panel/views.py` (new action in AdminUserViewSet)

**Request Payload**:
```json
{
  "is_admin": true   // boolean - true to assign admin role, false to remove
}
```

**Success Response** (200 OK):
```json
{
  "success": true,
  "message": "Tai khoan user@example.com da duoc phan quyen quan tri vien."
}
```

**Error Responses**:
- 403 Forbidden: `"Ban khong co quyen thuc hien hanh dong nay"` (non-superuser attempting to modify admin status)
- 404 Not Found: User does not exist

**Implementation Note**: Only superusers (`is_superuser=True`) should be allowed to assign/remove admin roles. Regular admins should receive 403.

---

## Key Interfaces & Contracts

### Backend: AdminUserViewSet (admin_panel/views.py:108-143)

```python
class AdminUserViewSet(viewsets.GenericViewSet):
    permission_classes = [IsAdminUser]

    @action(detail=False, methods=['get'], url_path='list')
    def list_users(self, request):  # EXISTING - line 117

    @action(detail=True, methods=['post'])
    def block(self, request, pk=None):  # EXISTING - line 131

    @action(detail=True, methods=['post'])
    def unblock(self, request, pk=None):  # EXISTING - line 138

    @action(detail=True, methods=['post'], url_path='set-admin')  # NEW - NEED TO ADD
    def set_admin(self, request, pk=None):
        # Permission check: only superuser can assign admin roles
        # Request data: {"is_admin": true/false}
        # Sets user.is_staff based on is_admin value
        # Returns 403 if current user is not superuser
```

### Frontend: adminApi.js methods (KitchenMate_Frontend/src/api/adminApi.js)

| Method | Signature | Line |
|--------|-----------|------|
| `getUsers` | `async (params = {})` | 131 |
| `blockUser` | `async (id)` | 142 |
| `unblockUser` | `async (id)` | 153 |
| `setAdminRole` | `async (id, isAdmin)` | **NEED TO ADD** after line 157 |

### User Data Model (from UserSerializer - accounts/serializers.py:59)

```javascript
{
  id: UUID,
  email: string,
  full_name: string,
  avatar_url: string | null,
  bio: string | null,
  created_at: datetime,
  is_staff: boolean,    // Admin status
  is_superuser: boolean
}
```

---

## Integration Points

### App.jsx Routes (lines 92-101)

```javascript
// CURRENT
<Route path="/admin" element={<AdminGuard><Suspense fallback={<PageLoader />}><DashboardPage /></Suspense></AdminGuard>} />
<Route path="/admin/recipes" element={<AdminGuard><Suspense fallback={<PageLoader />}><RecipeManagementPage /></Suspense></AdminGuard>} />
<Route path="/admin/ingredients" element={<AdminGuard><Suspense fallback={<PageLoader />}><IngredientManagementPage /></Suspense></AdminGuard>} />

// NEED TO ADD
<Route path="/admin/users" element={<AdminGuard><Suspense fallback={<PageLoader />}><UserManagementPage /></Suspense></AdminGuard>} />
```

### Lazy Import Pattern (lines 23-26)

```javascript
// Line 23: // Lazy load admin pages
// Line 24: const DashboardPage = lazy(() => import('@/pages/admin/DashboardPage').then(m => ({ default: m.default || m.DashboardPage })))
// Line 25: const RecipeManagementPage = lazy(() => import('@/pages/admin/RecipeManagementPage').then(m => ({ default: m.default || m.RecipeManagementPage })))
// Line 26: const IngredientManagementPage = lazy(() => import('@/pages/admin/IngredientManagementPage').then(m => ({ default: m.default || m.IngredientManagementPage })))

// NEED TO ADD (after line 26):
const UserManagementPage = lazy(() => import('@/pages/admin/UserManagementPage').then(m => ({ default: m.default || m.UserManagementPage })))
```

---

## Similar Implementations

### Pattern 1: RecipeManagementPage.jsx

**Location**: `KitchenMate_Frontend/src/pages/admin/RecipeManagementPage.jsx`

**Why relevant**: Same admin management page structure - tabs, pagination, expandable cards, confirmation dialogs

**Key components to reuse**:
- `LoadingSkeleton` (line 29-53)
- `EmptyState` (line 57-77)
- `ErrorState` (line 81-103)
- `ApproveConfirmDialog` (line 107-161) - rename for block confirmation
- `RejectDialog` (line 165-242) - can reuse for set-admin confirmation
- `Pagination` (line 510-576)
- `SortControl` (line 485-506)

### Pattern 2: IngredientManagementPage.jsx

**Location**: `KitchenMate_Frontend/src/pages/admin/IngredientManagementPage.jsx`

**Why relevant**: Identical structure to RecipeManagementPage, confirms the pattern is consistent

**Key structure**:
- Main page component `IngredientManagementPage()` at line 585
- Uses `adminApi.getIngredientPending()` and `adminApi.getIngredientAll()` based on tab
- Same dialog patterns

---

## UI Components to Build (UserManagementPage.jsx)

### Components to implement:
1. **UserListItem** - similar to RecipeListItem/IngredientListItem
   - Expandable card with user info
   - Action buttons (Block/Unblock, Set Admin/Unset Admin)
   - Confirmation dialogs for each action

2. **BlockConfirmDialog** - similar to ApproveConfirmDialog
   - Shows user email/name
   - Warns about blocking
   - "Khóa" / "Hủy" buttons

3. **SetAdminDialog** - similar to BlockConfirmDialog
   - Warns about admin privileges
   - "Cấp quyền admin" / "Hủy" buttons

4. **Main page** with:
   - Tabs: "Tất cả", "Đã khóa", "Quản trị viên" (or simpler: just one list with filters)
   - Search input
   - Sort dropdown (Mới nhất / Cũ nhất)
   - User list with pagination

---

## Test Coverage

### Existing Tests to Update
None - no admin panel tests exist

### New Tests Needed
| Test Type | Location | Coverage Target |
|-----------|----------|-----------------|
| Unit | N/A | adminApi.js methods |
| Integration | N/A | User management flow |

---

## Risk Assessment

| Area | Risk | Mitigation |
|------|------|------------|
| Backend missing set_admin action | HIGH - Cannot assign admin role | Implement set_admin action in AdminUserViewSet |
| UserSerializer missing is_active field | MEDIUM - Frontend cannot show blocked status | Check UserSerializer fields - is_active may not be exposed |
| UI pattern consistency | LOW - New page may look different | Follow RecipeManagementPage patterns exactly |

---

## Recommended Exploration

Before implementation, developer should read:

1. `KitchenMate_Frontend/src/pages/admin/RecipeManagementPage.jsx` - Full pattern reference
2. `KitchenMate_Backend/apps/admin_panel/views.py:108-144` - AdminUserViewSet structure
3. `KitchenMate_Frontend/src/api/adminApi.js:124-158` - User management API methods

---

## Verification Summary

| Check | Status | Notes |
|-------|--------|-------|
| All affected files identified | YES | 3 files to modify, 1 new file |
| Integration points mapped | YES | App.jsx routes, adminApi.js, backend views |
| Similar patterns found | YES | RecipeManagementPage and IngredientManagementPage |
| Test coverage analyzed | YES | No existing tests to update |
| Risks assessed | YES | Missing set_admin action is critical |
| Backend endpoints verified | YES | All endpoints exist except set_admin |
| UserSerializer fields verified | YES | Returns id, email, full_name, avatar_url, bio, created_at, is_staff, is_superuser |
| Endpoint contract specified | YES | set_admin POST /api/admin/users/{id}/set-admin/ with request/response format |
| File count corrected | YES | Removed urls.py from modify list (router handles actions automatically) |
| Lazy import line reference | YES | Lines 23-26 are correct (line 23 is comment, lines 24-26 are imports) |

**Limitations/Caveats**:
- UserSerializer does NOT expose `is_active` field - frontend cannot display blocked status directly from user object. May need to check if blocked users have `is_active=False` behavior matches the frontend needs.
- Backend `set_admin` action is missing and needs to be implemented first before frontend can use it.