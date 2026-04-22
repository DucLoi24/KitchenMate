# Bottom Navigation (Mobile) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement BottomNav component with 5 tabs, guest/logged-in state differentiation, and notification badge on Hồ sơ tab.

**Architecture:** Single `BottomNav.jsx` component with conditional rendering based on `isAuthenticated` from authStore. Guest users get redirect-to-login behavior on protected tabs. Badge displays notification count from authStore.

**Tech Stack:** React, react-router-dom (useNavigate), react-icons, react-hot-toast

---

## File Structure

- Modify: `KitchenMate_Frontend/kitchenmate-frontend/src/components/layout/BottomNav.jsx` (main implementation)

---

## Tasks

### Task 1: Update BottomNav with guest/logged-in tabs and redirect logic

**Files:**
- Modify: `KitchenMate_Frontend/kitchenmate-frontend/src/components/layout/BottomNav.jsx`

- [ ] **Step 1: Read current implementation**

```jsx
// Current BottomNav.jsx - verify current structure
import { Link, useLocation } from 'react-router-dom';
import { FaHome, FaCompass, FaLightbulb, FaSnowflake, FaUser } from 'react-icons/fa';

const navItems = [
  { path: '/home', label: 'Trang chủ', icon: FaHome },
  { path: '/explore', label: 'Khám phá', icon: FaCompass },
  { path: '/suggestions', label: 'Gợi ý', icon: FaLightbulb },
  { path: '/pantry', label: 'Tủ lạnh', icon: FaSnowflake },
  { path: '/profile', label: 'Hồ sơ', icon: FaUser },
];
```

- [ ] **Step 2: Write complete new implementation**

```jsx
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FaHome, FaCompass, FaLightbulb, FaSnowflake, FaUser } from 'react-icons/fa';
import { useAuthStore } from '../../stores/authStore';
import toast from 'react-hot-toast';

// Tabs cho guest (chua dang nhap)
const guestNavItems = [
  { path: '/home', label: 'Trang chủ', icon: FaHome },
  { path: '/explore', label: 'Khám phá', icon: FaCompass },
  { path: null, label: 'Gợi ý', icon: FaLightbulb, protected: true },
  { path: null, label: 'Tủ lạnh', icon: FaSnowflake, protected: true },
  { path: null, label: 'Hồ sơ', icon: FaUser, protected: true },
];

// Tabs cho logged in
const loggedInNavItems = [
  { path: '/home', label: 'Trang chủ', icon: FaHome },
  { path: '/explore', label: 'Khám phá', icon: FaCompass },
  { path: '/suggestions', label: 'Gợi ý', icon: FaLightbulb },
  { path: '/pantry', label: 'Tủ lạnh', icon: FaSnowflake },
  { path: '/profile', label: 'Hồ sơ', icon: FaUser, hasBadge: true },
];

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();
  
  // Placeholder notification count - will come from API later
  const notificationCount = user?.notification_count || 0;

  const navItems = isAuthenticated ? loggedInNavItems : guestNavItems;

  const handleProtectedClick = (e, item) => {
    if (item.protected) {
      e.preventDefault();
      toast.error('Cần đăng nhập để sử dụng tính năng này');
      navigate('/login');
    }
  };

  const isActive = (path) => {
    if (!path) return false;
    return location.pathname === path || 
      (path === '/home' && (location.pathname === '/' || location.pathname === ''));
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 md:hidden z-50">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);

          if (item.protected) {
            return (
              <button
                key={item.label}
                onClick={(e) => handleProtectedClick(e, item)}
                className="flex flex-col items-center justify-center w-16 h-14 rounded-xl text-gray-400 hover:text-gray-600 transition-colors"
              >
                <div className="relative">
                  <Icon className="text-lg mb-0.5" />
                </div>
                <span className="text-xs font-medium">{item.label}</span>
              </button>
            );
          }

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center w-16 h-14 rounded-xl transition-colors ${
                active
                  ? 'text-orange-500 bg-orange-50'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <div className="relative">
                <Icon className="text-lg mb-0.5" />
                {item.hasBadge && notificationCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                    {notificationCount > 99 ? '99+' : notificationCount}
                  </span>
                )}
              </div>
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
```

- [ ] **Step 3: Verify build**

Run: `cd KitchenMate_Frontend/kitchenmate-frontend && npm run build`
Expected: SUCCESS with no errors

- [ ] **Step 4: Commit**

```bash
git add KitchenMate_Frontend/kitchenmate-frontend/src/components/layout/BottomNav.jsx
git commit -m "feat: implement BottomNav with guest/logged-in tabs and notification badge"
```

---

## Spec Coverage Check

| Spec Item | Task |
|-----------|------|
| Guest 5 tabs (Trang chủ, Khám phá, Gợi ý, Tủ lạnh, Hồ sơ) | Task 1 |
| Logged in 5 tabs | Task 1 |
| Redirect to /login + toast on protected tabs (guest) | Task 1 |
| Badge on Hồ sơ tab | Task 1 |
| Badge shows notificationCount from authStore | Task 1 |
| Active state detection | Task 1 |
| 99+ overflow display | Task 1 |

## Placeholder Scan

- notificationCount: Currently uses `user?.notification_count || 0` - this is a placeholder that will be connected to real API later. Spec noted this.
- All other items fully implemented.

---

**Plan complete and saved to `docs/superpowers/plans/2026-04-22-bottom-nav-implementation.md`.**

Two execution options:

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**