# Local Changes Review Report

**Quality Gate**: FAIL
**Issues**: 1 critical, 3 high, 5 medium
**Min Impact Filter**: high

---

## Issues

🔴 **CRITICAL - Session Invalidation Requires Superuser Check**
**File**: `KitchenMate_Backend/apps/admin_panel/views.py:132-151`

**Evidence**: The `block` action only checks `is_staff` (via class-level `IsAdminUser` permission at line 29) but performs superuser-level operations - invalidating ALL active sessions for ANY user, including superusers.

A malicious `is_staff` user could block a superuser account or force-logout all superusers.

**Suggestion**:
```python
@action(detail=True, methods=['post'])
def block(self, request, pk=None):
    if not request.user.is_superuser:
        return Response({'detail': 'Bạn không có quyền thực hiện'}, status=403)
    # ... rest of block logic
```

---

🟠 **HIGH - Incomplete Admin Removal**
**File**: `KitchenMate_Backend/apps/admin_panel/views.py:162-165`

**Evidence**: When removing admin role, only `is_staff` is set. A superuser has `is_superuser=True` which grants full admin access regardless of `is_staff`. So removing staff from a superuser doesn't actually revoke admin privileges.

**Suggestion**: Either set `is_superuser=False` when removing admin, or clarify in UI that this only toggles `is_staff`.

---

🟠 **HIGH - Missing Session Invalidation in set_admin**
**File**: `KitchenMate_Backend/apps/admin_panel/views.py:155-170`

**Evidence**: Unlike `block()` which invalidates all user sessions, `set_admin()` doesn't invalidate sessions when admin rights are removed. User keeps their active session with admin access.

**Suggestion**: Add session invalidation loop to `set_admin` when removing admin (`is_admin=False`).

---

🟠 **HIGH - API Contract Mismatch: String vs Boolean Query Params**
**File**: `KitchenMate_Frontend/src/pages/admin/UserManagementPage.jsx:781-785`

**Evidence**:
```javascript
if (activeTab === 'blocked') {
  params.is_active = 'false'   // String, not Boolean
} else if (activeTab === 'admin') {
  params.is_staff = 'true'    // String, not Boolean
}
```
Backend expects boolean values. Passing strings may cause filter to be ignored.

**Suggestion**:
```javascript
if (activeTab === 'blocked') {
  params.is_active = false   // Boolean, not string
} else if (activeTab === 'admin') {
  params.is_staff = true     // Boolean, not string
}
```

---

🟡 **MEDIUM - Race Condition in Session Invalidation**
**File**: `KitchenMate_Backend/apps/admin_panel/views.py:143-147`

**Evidence**: `Session.objects.all().iterator()` iterates ALL sessions in the database on every block operation. This is slow for large session tables and has race conditions (new sessions created during iteration are processed inconsistently).

**Suggestion**: Add database index on session_data or filter sessions more efficiently.

---

🟡 **MEDIUM - Missing Transaction Atomicity in block**
**File**: `KitchenMate_Backend/apps/admin_panel/views.py:131-153`

**Evidence**: User deactivation and session deletion should be atomic. If session deletion fails partway, user is deactivated but sessions remain active.

**Suggestion**:
```python
from django.db import transaction

with transaction.atomic():
    user.is_active = False
    user.save(update_fields=['is_active'])
    # ... session deletion
```

---

🟡 **MEDIUM - Tab Change Doesn't Reset Page**
**File**: `KitchenMate_Frontend/src/pages/admin/UserManagementPage.jsx:837-840`

**Evidence**: When switching tabs (all → blocked → admin), page stays at previous value. If filtered result has fewer pages, UI shows empty state with stale data.

**Suggestion**: Add `setPage(1)` when changing tabs.

---

🟡 **MEDIUM - is_superuser Exposed in Serializer**
**File**: `KitchenMate_Backend/apps/accounts/serializers.py:64-66`

**Evidence**: `is_superuser` is exposed to all API consumers via UserSerializer. While admin panel needs it, giving all clients access to superuser status is unnecessary security concern.

**Suggestion**: Remove `is_superuser` from UserSerializer fields or create separate admin serializer.

---

🟡 **MEDIUM - Bare `except Exception` in session invalidation**
**File**: `KitchenMate_Backend/apps/admin_panel/views.py:148`

**Evidence**:
```python
except Exception:
    continue
```

Catching all exceptions hides bugs. Should catch specific session-related errors.

**Suggestion**:
```python
except (ValueError, KeyError):
    continue
```

---

## Improvements

1. **Extract duplicated error handling to helper** - `UserManagementPage.jsx:658-746` - Four nearly identical error handling blocks repeated. Extract to `handleApiError(err, context)` helper.

2. **Replace duplicated dialog components with reusable ConfirmDialog** - `UserManagementPage.jsx:317-512` - BlockUserDialog, UnblockUserDialog, AssignAdminDialog, RemoveAdminDialog share ~40 lines of identical structure. Create single `ConfirmDialog` component.

3. **Add self-demotion protection** - `views.py:162-165` - Add check `if user == request.user: return Response(..., status=400)` to prevent superuser from removing their own admin rights.

---

## Summary

| Severity | Count |
|----------|-------|
| Critical | 1 |
| High | 3 |
| Medium | 5 |
| **Total** | **9** |

**Recommendation**: Fix CRITICAL and HIGH issues before committing. The session invalidation permission issue is a security concern that allows any admin to forcibly logout superusers.
