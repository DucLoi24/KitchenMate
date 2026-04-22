# Bottom Navigation (Mobile) - Design Spec

**Date:** 2026-04-22
**Status:** Approved

## Overview

Bottom navigation bar cho mobile với 5 tabs, thay đổi nội dung theo trạng thái đăng nhập và hiển thị badge notification trên tab "Hồ sơ".

## Tab Structure

### Guest (chưa đăng nhập)
| Icon | Label | Path | Behavior |
|------|-------|------|----------|
| FaHome | Trang chủ | /home | Normal navigation |
| FaCompass | Khám phá | /explore | Normal navigation |
| FaLightbulb | Gợi ý | - | Redirect to /login + toast |
| FaSnowflake | Tủ lạnh | - | Redirect to /login + toast |
| FaUser | Hồ sơ | - | Redirect to /login + toast |

### Logged in
| Icon | Label | Path | Badge |
|------|-------|------|-------|
| FaHome | Trang chủ | /home | - |
| FaCompass | Khám phá | /explore | - |
| FaLightbulb | Gợi ý | /suggestions | - |
| FaSnowflake | Tủ lạnh | /pantry | - |
| FaUser | Hồ sơ | /profile | 🔴 {count} |

## Components

### BottomNav
- Fixed bottom, full width, white background
- Top border: `border-t border-gray-200`
- Height: `h-16`
- Hidden on desktop: `md:hidden`
- z-index: `z-50`

### NavItem (per tab)
- Flex column, centered
- Width: `w-16`, Height: `h-14`
- Border radius: `rounded-xl`
- Active state: `text-orange-500 bg-orange-50`
- Inactive state: `text-gray-400 hover:text-gray-600`

### Badge
- Position: absolute top-0 right-0, translate to top-right of icon
- Background: `bg-red-500`
- Text: white, `text-xs font-bold`
- Min width: `min-w-[18px]`, height: `h-[18px]`
- Border radius: `rounded-full`
- Overflow: if count > 99, display "99+"

## Logic

1. On mount, read `isAuthenticated` from authStore
2. If guest clicks on protected tabs (Gợi ý, Tủ lạnh, Hồ sơ):
   - Navigate to `/login`
   - Show toast: "Cần đăng nhập để sử dụng tính năng này"
3. Badge count comes from `notificationCount` state in authStore (placeholder for now)
4. Active state: compare `location.pathname` with tab path, handle `/` → `/home` redirect

## Technical Approach

- Component: `BottomNav.jsx` in `src/components/layout/`
- Dependencies: react-router-dom, react-icons/fa, react-hot-toast
- Uses `useAuthStore` for auth state
- Uses `useLocation` for active state detection
- Uses `useNavigate` for redirect