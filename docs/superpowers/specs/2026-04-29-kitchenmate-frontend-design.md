# KitchenMate Frontend Design Spec

**Date:** 2026-04-29
**Project:** KitchenMate Frontend
**Status:** Approved

---

## 1. Overview

Full-featured frontend for KitchenMate - a recipe sharing and smart kitchen management web application.

### Tech Stack
- **Framework:** React 18 + Vite
- **Styling:** Tailwind CSS (custom config)
- **Animation:** Framer Motion + GSAP + Lenis
- **State:** Zustand (client) + TanStack Query (server)
- **Routing:** React Router DOM v6
- **HTTP:** Axios
- **Forms:** React Hook Form + Zod

### Design Direction
Food/Cooking App — Warm, organic, natural colors (green, brown, orange)

---

## 2. Priority Order

| Priority | Phase | Description |
|----------|-------|-------------|
| 1 | Auth & Profile | Register, Login, Profile |
| 2 | Recipe Explore + Detail | Home, Search, Recipe Detail, Cook Mode |
| 3 | Smart Kitchen | Pantry, Shopping List |
| 4 | Recommendation | COOK_NOW / ADD_MORE modes |
| 5 | Recipe Create/Edit | Multi-step form, AI moderation |
| 6 | Social Collections | Save to collections |
| 7 | Social Rating/Comment | Reviews + Cooksnap |
| 8 | Admin Panel | Dashboard, moderation |

---

## 3. Pages (25 pages total)

### Public (4): Landing, Login, Register, ForgotPassword, RecipeDetail
### User (16): Home, CookMode, CreateRecipe, EditRecipe, MyRecipes, Pantry, ShoppingList, Recommendations, Profile, EditProfile, Collections, CollectionDetail
### Admin (4): AdminDashboard, AdminRecipes, AdminIngredients, AdminUsers

---

## 4. Key User Flows

1. **Auth:** Guest → Register/Login → Home
2. **Recipe Discovery:** Home → Search/Filter → Recipe Detail → Cook Mode
3. **Smart Kitchen:** Pantry → Add Items → Recommendations → Cook Mode
4. **Shopping Sync:** Shopping → Mark Purchased → Auto-sync to Pantry
5. **Recipe Creation:** Create → Fill → [Private: Save | Public: AI Mod → Publish]
6. **Social:** Recipe Detail → Rate/Comment → Save to Collection

---

## 5. Component Architecture

### Layout: MainLayout, AdminLayout, BottomNav, Navbar
### UI: Button, Input, Modal, BottomSheet, Toast, Skeleton, Avatar, Badge, EmptyState
### Recipe: RecipeCard, RecipeDetail, CookModeView, CreateRecipeForm, IngredientInput, StepInput
### Kitchen: PantryList, ShoppingListItem
### Social: StarRating, ReviewSection, CollectionGrid
### Admin: AdminDashboard, ModerationModal

---

## 6. API Integration

All endpoints from backend with JWT auth. Response format: `{success: true, data: ...}`

---

## 7. State Management

Zustand stores: auth, recipe, pantry, shopping, recommendation, collection, ui
React Query for server state caching

---

## 8. Key Features

- Cook Mode: Large text, wake lock, step timer
- Swipe actions on shopping list
- Optimistic updates for rating/check
- AI moderation states: YES/NO/SUSPECT
- Recipe visibility: PRIVATE/PENDING/PUBLIC
- Recommendation scoring: MATCH×20 - PENALTY + AFFINITY

---

## 9. Testing

- Unit: Vitest (components, stores, utils)
- Integration: API flows
- E2E: Playwright (full user journeys)

---

## 10. Performance & Accessibility

- FCP < 1.5s, LCP < 2.5s, TT1 < 3s
- Lazy loading, skeleton states, pagination
- ARIA labels, keyboard nav, color contrast ≥ 4.5:1
