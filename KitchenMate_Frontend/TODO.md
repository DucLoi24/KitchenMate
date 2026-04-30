# KitchenMate Frontend - TODO

> Tech Stack: React + Tailwind CSS (custom config), Framer Motion (animation/physics-based), GSAP (scroll-triggered), Lenis (smooth scroll)

---

## Tổng quan hệ thống

- **Đề tài**: Xây dựng ứng dụng Web hỗ trợ quản lý nguyên liệu và gợi ý món ăn thông minh tích hợp chia sẻ công thức
- **Backend**: Django REST Framework + PostgreSQL + JWT + Local LLM (Llama 3/Gemma)
- **Frontend**: React + Tailwind CSS + Framer Motion + GSAP + Lenis

---

## PHASE 1: Foundation & Setup

### 1.1 Project Setup

- [x] Initialize Vite + React project
- [x] Configure Tailwind CSS v4 với custom theme từ design spec
- [x] Setup ESLint + Prettier
- [x] Setup project structure (src/components, src/pages, src/hooks, src/api, src/stores)
- [x] Setup Husky + lint-staged

### 1.2 Core Dependencies

- [x] Install & configure Framer Motion
- [x] Install & configure GSAP + ScrollTrigger
- [x] Install & configure Lenis smooth scroll
- [x] Install Axios + axios-instance (backend API client)
- [x] Install React Router v6
- [x] Install Zustand / Jotai (state management)
- [x] Install React Query (server state)
- [x] Install React Hook Form + Zod (form handling)
- [x] Install Lucide React (icons)
- [x] Install clsx + tailwind-merge (className utilities)

### 1.3 Design System Base

- [x] Setup Tailwind custom theme colors (primary, secondary, accent)
- [x] Setup typography scale
- [x] Setup spacing system
- [x] Create Button, Input, Card, Badge components
- [x] Create responsive breakpoints

### 1.4 API Layer

- [x] Setup axiosInstance với interceptors (auth token, error handling)
- [x] Create API modules: authApi, recipeApi, ingredientApi, kitchenApi, socialApi
- [x] Setup React Query hooks (useAuth, useRecipes, usePantry, etc.)
- [x] Setup API error handling + toast notifications

### 1.5 Testing Foundation

- [x] Setup Vitest + React Testing Library
- [x] Write tests cho: Button, Input components
- [x] Write tests cho: axiosInstance interceptor

---

## PHASE 2: Authentication & User Profile

### 2.1 Authentication Pages

- [x] **LoginPage** (`/login`)
  - Email/password form với validation
  - Google OAuth2 button
  - "Quên mật khẩu" link
  - Redirect to intended page after login
  - **User Flow**: Mở app → Login → HomePage

- [x] **RegisterPage** (`/register`)
  - Email, password, confirm password, full_name fields
  - Password strength indicator
  - Terms & conditions checkbox
  - **User Flow**: Login → Register → Login

- [x] **ForgotPasswordPage** (`/forgot-password`)
  - Email input để gửi reset link
  - Success/error feedback

### 2.2 Auth Components

- [x] **AuthGuard** - Protected route wrapper (redirect to login if not authenticated)
- [x] **AdminGuard** - Admin-only route protection
- [x] **AuthContext** - Global auth state (user, token, login, logout)
- [x] **GoogleOAuthButton** - Google sign-in integration

### 2.3 Profile Management

- [x] **ProfilePage** (`/profile`)
  - View/edit full_name, bio
  - Avatar upload with preview
  - View own recipes count, collections count
  - **User Flow**: Profile icon → ProfilePage → Edit → Save

- [x] **PublicProfilePage** (`/profile/:userId`)
  - View user's public recipes
  - View user's collections
  - Follow/unfollow button (future)
  - **User Flow**: Click username → PublicProfilePage

### 2.4 Auth Testing

- [x] Write tests cho LoginPage (form validation, API error handling)
- [x] Write tests cho RegisterPage (password match validation)
- [x] Write tests cho AuthContext (login, logout, token persistence)

---

## PHASE 3: Recipe Management

### 3.1 Recipe Browsing

- [ ] **ExplorePage** (`/explore`)
  - Hero section với GSAP scroll animation
  - Category filters (horizontal scroll on mobile)
  - Recipe grid với Framer Motion stagger entrance
  - Search bar với debounced autocomplete
  - Difficulty filter (Dễ/Trung bình/Khó)
  - Time filter (prep_time)
  - Sort options (newest, most popular, top rated)
  - Infinite scroll với React Query pagination
  - **User Flow**: Home → ExplorePage → Scroll/Search/Filter → RecipeCard → RecipeDetail

- [ ] **RecipeCard** component
  - Thumbnail image với lazy loading
  - Title, description preview (2 lines)
  - Author avatar + name
  - Prep time badge
  - Difficulty badge (color-coded)
  - Rating stars (average)
  - Favorite button (heart icon)
  - Swipe-to-favorite (mobile)
  - **User Flow**: RecipeCard click → RecipeDetail

### 3.2 Recipe Detail

- [ ] **RecipeDetailPage** (`/recipe/:id`)
  - Full-width hero image với parallax
  - Title, description
  - Author info (avatar, name) → click to PublicProfile
  - Prep time, difficulty, servings
  - Rating display (average stars + count)
  - Favorite/Collection button
  - Ingredient list với checkbox (check off while cooking)
  - Steps list với numbered cards
  - Media (images/videos per step)
  - Comments section
  - Related recipes carousel
  - **Cook Mode** toggle button
  - **User Flow**: RecipeCard → RecipeDetail → Cook Mode / Add to Collection / Rate

- [ ] **CookMode** overlay
  - Keep screen awake (Wake Lock API)
  - Enlarged text (accessibility)
  - Step-by-step navigation (swipe/arrow)
  - Ingredient reference sidebar
  - Exit button
  - **User Flow**: RecipeDetail → Cook Mode → Follow steps → Finish

### 3.3 Recipe Creation/Editing

- [ ] **RecipeEditorPage** (`/recipe/new`, `/recipe/:id/edit`)
  - Multi-step form wizard
  - Step 1: Basic info (title, description, difficulty, prep_time, servings, thumbnail)
  - Step 2: Ingredients (search/add from ingredient database, quantity, unit)
  - Step 3: Steps (add/edit/reorder steps, add media per step)
  - Step 4: Preview & Visibility (PRIVATE/PUBLIC)
  - Auto-save draft (localStorage)
  - AI moderation notice (text analyzed on PUBLIC submit)
  - **User Flow**: Create Recipe → Editor (4 steps) → Preview → Submit → Pending/Public

- [ ] **RecipeEditor** components
  - **IngredientSearch** - Autocomplete search existing ingredients
  - **IngredientInput** - Quantity + unit selector + add button
  - **StepEditor** - Drag-and-drop step reordering
  - **MediaUploader** - Image upload per step
  - **VisibilityToggle** - PRIVATE/PUBLIC radio

### 3.4 Recipe Testing

- [ ] Write tests cho RecipeCard rendering
- [ ] Write tests cho RecipeDetailPage data fetching
- [ ] Write tests cho RecipeEditor form validation
- [ ] Write tests cho CookMode component

---

## PHASE 4: Smart Kitchen (Pantry & Shopping)

### 4.1 Digital Pantry

- [ ] **PantryPage** (`/pantry`)
  - Pantry items grid/list view toggle
  - Search/filter by ingredient name
  - Category filters (Protein, Carb, Vegetable, Spice, Other)
  - Each item: ingredient name, quantity, unit, expiry warning
  - Expiry color coding (red = expired, yellow = expiring soon, green = fresh)
  - Quick edit quantity inline
  - Delete item (swipe on mobile)
  - Add item FAB (floating action button)
  - **User Flow**: Bottom nav → Pantry → View/Edit/Add items

- [ ] **PantryItem** component
  - Ingredient icon/image
  - Name, quantity, unit display
  - Expiry status badge
  - Edit/Delete actions
  - Swipe-to-delete gesture (mobile)

- [ ] **PantryAddBottomSheet**
  - Ingredient search autocomplete
  - Quantity input (numeric keyboard)
  - Unit selector dropdown
  - Expiry date picker (optional)
  - Save button
  - **User Flow**: PantryPage → FAB → BottomSheet → Search → Add

### 4.2 Shopping List

- [ ] **ShoppingListPage** (`/shopping-list`)
  - Active items list (not purchased)
  - Purchased items (collapsible section)
  - Each item: ingredient, quantity, unit, checkbox
  - Check item → auto-sync to Pantry (transaction)
  - Quick add via search
  - Clear purchased items button
  - Swipe-to-delete (mobile)
  - **User Flow**: Pantry → Shopping List icon → View items → Check purchased → Auto-add to Pantry

- [ ] **ShoppingListItem** component
  - Checkbox + ingredient info
  - Swipe actions (delete, edit quantity)
  - Mark as purchased animation
  - **User Flow**: Check → Item moves to Pantry + "purchased" section

- [ ] **ShoppingListAddBottomSheet**
  - Same UI pattern as PantryAddBottomSheet
  - Quick quantity adjust
  - Add to list button

### 4.3 Food Suggestion (AI-Powered)

- [ ] **SuggestionPage** (`/suggest`)
  - Two filter tabs: "Nấu Ngay" (0 missing), "Thêm Chút Nữa" (≤2 missing + score ≥0)
  - Suggested recipes list với match percentage
  - Missing ingredients preview per recipe
  - "Add missing to shopping list" button per recipe
  - Pull-to-refresh
  - **Algorithm display**: Show scoring breakdown (debug mode)
  - **User Flow**: Pantry → Suggest tab → View suggestions → Click recipe → RecipeDetail

- [ ] **SuggestionCard** component
  - Recipe thumbnail
  - Title
  - Match percentage badge
  - Missing ingredients count
  - "Nấu Ngay" / "Thêm Chút Nữa" tag
  - Quick actions (view, add to shopping)

### 4.4 Pantry & Shopping Testing

- [ ] Write tests cho PantryPage (add/edit/delete operations)
- [ ] Write tests cho ShoppingListPage (check/uncheck operations)
- [ ] Write tests cho SuggestionPage (filter tabs, recipe matching)
- [ ] Write tests cho Check-to-Pantry transaction flow

---

## PHASE 5: Social Features

### 5.1 Rating & Comments

- [ ] **RatingComponent**
  - 5-star interactive rating input
  - Hover preview
  - Submit on click
  - Update existing rating
  - **User Flow**: RecipeDetail → Rate stars → Submit

- [ ] **CommentSection**
  - Comments list (paginated)
  - Each comment: user avatar, name, text, timestamp, image
  - Add comment form (text + optional image)
  - Reply button (future threaded comments)
  - Edit/Delete own comments
  - **User Flow**: RecipeDetail → Scroll to Comments → Add comment

- [ ] **CommentItem** component
  - User avatar → click to PublicProfile
  - Comment text
  - Timestamp (relative: "2 giờ trước")
  - Image thumbnail (click to expand)
  - Edit/Delete menu (own comments only)

### 5.2 Collections/Favorites

- [ ] **CollectionsPage** (`/collections`)
  - List of user's collections (folders)
  - Create new collection
  - Collection card: name, recipe count, cover image (first recipe thumbnail)
  - **User Flow**: Profile → Collections → View/Manage

- [ ] **CollectionDetailPage** (`/collection/:id`)
  - Collection name + edit
  - Recipe grid
  - Remove from collection (swipe)
  - Share collection (future)
  - **User Flow**: Collections → Collection → View recipes

- [ ] **AddToCollectionModal**
  - List existing collections
  - Create new collection
  - Checkbox per collection
  - **User Flow**: RecipeDetail → Favorite → Modal → Select collection → Save

### 5.3 Social Testing

- [ ] Write tests cho RatingComponent interaction
- [ ] Write tests cho CommentSection CRUD
- [ ] Write tests cho CollectionsPage management

---

## PHASE 6: Admin Panel

### 6.1 Admin Dashboard

- [ ] **AdminPage** (`/admin`)
  - Stats overview (pending recipes, active users, reports)
  - Quick actions (recent pending list)
  - **AdminGuard**: redirect non-admins

- [ ] **AdminSidebar** navigation
  - Dashboard
  - Pending Recipes
  - Users Management
  - Reports
  - Ingredients (approve/reject)

### 6.2 Content Moderation

- [ ] **PendingRecipesPage** (`/admin/pending`)
  - List recipes with PENDING status
  - Recipe preview card
  - AI moderation result badge (YES/NO/SUSPECT)
  - Approve/Reject buttons
  - View full recipe detail
  - **User Flow**: Admin login → Pending → Review → Approve/Reject

- [ ] **ModerationResultBadge**
  - Color-coded: Green (YES), Red (NO), Yellow (SUSPECT)
  - Tooltip showing AI confidence

### 6.3 User Management

- [ ] **UsersPage** (`/admin/users`)
  - User list table
  - Search by email/name
  - Ban/Unban user toggle
  - View user profile link
  - **User Flow**: Admin → Users → Search → Ban

### 6.4 Ingredient Management

- [ ] **IngredientsAdminPage** (`/admin/ingredients`)
  - List pending ingredient submissions
  - Approve/reject new ingredients
  - Edit existing ingredient (name, category, unit)
  - **User Flow**: Admin → Ingredients → Review → Approve

### 6.5 Admin Testing

- [ ] Write tests cho AdminGuard protection
- [ ] Write tests cho PendingRecipesPage approval flow
- [ ] Write tests cho User ban/unban

---

## PHASE 7: Global Components & UX

### 7.1 Navigation

- [ ] **BottomNav** (mobile)
  - Home, Explore, Add (FAB), Pantry, Profile icons
  - Active state indicator
  - Badge for notifications (future)
  - **User Flow**: Any page → Bottom nav click → Navigate

- [ ] **Header**
  - Logo/brand
  - Search bar (expandable on mobile)
  - Notification bell (future)
  - Profile avatar dropdown

- [ ] **Sidebar** (desktop)
  - Logo
  - Nav links with icons
  - Collapse toggle
  - Active state highlight

### 7.2 Search

- [ ] **GlobalSearch**
  - Command+K / search icon trigger
  - Debounced search results
  - Recent searches
  - Result categories: Recipes, Users, Collections
  - Keyboard navigation (arrow keys + enter)
  - **User Flow**: Search icon → Type → Results → Click → Navigate

- [ ] **SearchResults** components
  - Recipe result card
  - User result card
  - Collection result card

### 7.3 Animations & Micro-interactions

- [ ] **Page Transitions** (Framer Motion)
  - Fade + slide between pages
  - Exit animations

- [ ] **Skeleton Loaders**
  - RecipeCard skeleton
  - RecipeDetail skeleton
  - List item skeleton

- [ ] **Pull-to-refresh** (mobile)
- [ ] **Infinite scroll** loader
- [ ] **Toast notifications**
  - Success (green), Error (red), Info (blue)
  - Auto-dismiss
  - Action button option

- [ ] **Empty States**
  - No recipes, No pantry items, No collections
  - Illustrated empty states with CTA

- [ ] **Error States**
  - Network error retry
  - Not found page (404)

### 7.4 Accessibility

- [ ] Keyboard navigation support
- [ ] ARIA labels on interactive elements
- [ ] Focus management on modals/sheets
- [ ] Reduced motion support (prefers-reduced-motion)
- [ ] Screen reader announcements (aria-live)

### 7.5 Performance

- [ ] Image lazy loading (Intersection Observer)
- [ ] Code splitting per route
- [ ] Memoization (React.memo, useMemo)
- [ ] Virtual list for long recipe collections

---

## PHASE 8: Responsive & Polish

### 8.1 Mobile-First Responsive

- [ ] Test all pages on mobile viewport (375px)
- [ ] Test all pages on tablet viewport (768px)
- [ ] Test all pages on desktop viewport (1280px+)
- [ ] Touch targets minimum 44x44px
- [ ] One-handed operation zones

### 8.2 Gesture Support (Mobile)

- [ ] Swipe-to-delete on list items
- [ ] Swipe-to-favorite on recipe cards
- [ ] Pull-to-refresh
- [ ] Bottom sheet gestures (drag to dismiss)

### 8.3 Polish

- [ ] Custom scrollbar styling
- [ ] Text selection color
- [ ] Smooth scroll (Lenis)
- [ ] GSAP scroll-triggered animations (hero, section reveals)
- [ ] Framer Motion physics-based animations (buttons, cards)
- [ ] Loading states với spinners
- [ ] Confirmation dialogs for destructive actions

---

## PHASE 9: Integration & E2E Testing

### 9.1 API Integration

- [ ] Connect all API endpoints tới backend
- [ ] Verify JWT token flow (login → protected routes)
- [ ] Test Google OAuth2 flow
- [ ] Test image upload (recipe thumbnail, user avatar, comment images)
- [ ] Test file upload progress indicators

### 9.2 E2E Tests (Playwright)

- [ ] Login flow: `/login` → home redirect
- [ ] Register flow: `/register` → `/login`
- [ ] Recipe creation: `Explore` → `Create` → `RecipeDetail`
- [ ] Pantry flow: Add → Edit → Delete
- [ ] Shopping list: Add → Check → Pantry sync
- [ ] Suggestion flow: View suggestions → Recipe detail
- [ ] Rating flow: Recipe detail → Rate → See rating
- [ ] Comment flow: Recipe detail → Add comment → View comment
- [ ] Collection flow: Recipe → Add to collection → View collection
- [ ] Admin flow: Login as admin → Pending → Approve

### 9.3 Performance Testing

- [ ] Lighthouse audit (Performance, Accessibility, Best Practices, SEO)
- [ ] Core Web Vitals (LCP, INP, CLS)
- [ ] Bundle size analysis

---

## Backend API Endpoints Reference

### Accounts (`/api/accounts/`)
- `POST /register/` - Register new user
- `POST /login/` - Login (email/password)
- `POST /google-auth/` - Google OAuth2
- `GET /profile/` - Get current user profile
- `PUT /profile/` - Update profile
- `GET /profile/:id/` - Get public profile

### Recipes (`/api/recipes/`)
- `GET /` - List recipes (public only, with filters)
- `GET /:id/` - Recipe detail
- `POST /` - Create recipe (auth required)
- `PUT /:id/` - Update recipe (owner only)
- `DELETE /:id/` - Delete recipe (owner only)
- `GET /:id/steps/` - Get recipe steps
- `POST /:id/rate/` - Rate recipe

### Ingredients (`/api/ingredients/`)
- `GET /` - List all ingredients
- `POST /` - Create ingredient (admin only in thesis, but may allow user submission)
- `GET /:id/` - Ingredient detail
- `GET /categories/` - List categories

### Kitchen (`/api/kitchen/`)
- `GET /pantry/` - Get user's pantry
- `POST /pantry/` - Add to pantry
- `PUT /pantry/:id/` - Update pantry item
- `DELETE /pantry/:id/` - Delete pantry item
- `GET /shopping/` - Get shopping list
- `POST /shopping/` - Add to shopping list
- `PUT /shopping/:id/` - Update shopping item (mark purchased)
- `DELETE /shopping/:id/` - Delete shopping item
- `POST /shopping/:id/purchase/` - Mark purchased → sync to Pantry (transaction)
- `GET /suggest/` - Get food suggestions based on pantry

### Social (`/api/social/`)
- `GET /comments/recipe/:id/` - Get comments for recipe
- `POST /comments/` - Add comment
- `PUT /comments/:id/` - Update comment (owner only)
- `DELETE /comments/:id/` - Delete comment (owner only)
- `GET /collections/` - Get user's collections
- `POST /collections/` - Create collection
- `GET /collections/:id/` - Get collection detail
- `POST /collections/:id/recipes/` - Add recipe to collection
- `DELETE /collections/:id/recipes/:recipeId/` - Remove recipe from collection

### Admin (`/api/admin/`)
- `GET /pending-recipes/` - List pending recipes
- `POST /moderate/recipe/:id/` - Approve/Reject recipe
- `GET /users/` - List users
- `PUT /users/:id/ban/` - Ban/Unban user

---

## User Flows Summary

### Main User Flows

1. **Explore & Cook**: Home → Explore → Browse/Search/Filter → RecipeDetail → Cook Mode
2. **Create Recipe**: Profile → Create Recipe → Editor (4 steps) → Submit → Pending → Public
3. **Manage Pantry**: Pantry → View items → Add/Edit/Delete → Suggest → Cook
4. **Shopping Flow**: Suggestion → Add missing to shopping → ShoppingList → Check purchased → Pantry sync
5. **Social**: RecipeDetail → Rate ★★★★★ → Comment → Add to Collection

### Admin Flows

1. **Content Moderation**: Admin → Pending Recipes → Review → AI result → Approve/Reject
2. **User Management**: Admin → Users → Search → Ban/Unban

---

## Key Technical Notes

### AI Content Moderation (Backend)
- On PUBLIC recipe submit → text analyzed by local LLM
- Result: YES (auto-approve) / NO (auto-reject) / SUSPECT (pending manual review)
- Frontend shows moderation status badge

### Check-to-Pantry Transaction
- When shopping item marked `is_purchased=True`
- Backend uses `transaction.atomic()` to ensure both:
  1. ShoppingList updated
  2. Pantry item added/updated
- If either fails → both rollback

### Food Suggestion Algorithm
1. Ignore STAPLE spices (salt, sugar, fish sauce)
2. 3-tier scoring:
   - Match Points: 20pts per matching ingredient
   - Risk Penalty: Protein -100, Carb -80, Vegetable -50, Other -25, Spice -10
   - Affinity Bonus: 50pts for previously liked recipes
3. Filter: "Nấu Ngay" = 0 missing | "Thêm Chút Nữa" = ≤2 missing + score ≥0

### Tech Stack Details
- **Framer Motion**: Page transitions, stagger animations, gestures
- **GSAP**: Hero parallax, scroll-triggered section reveals
- **Lenis**: Smooth scroll normalization across browsers

---

## File Structure

```
KitchenMate_Frontend/
├── src/
│   ├── api/
│   │   ├── axiosInstance.js
│   │   ├── authApi.js
│   │   ├── recipeApi.js
│   │   ├── ingredientApi.js
│   │   ├── kitchenApi.js
│   │   └── socialApi.js
│   ├── assets/
│   │   └── (images, icons)
│   ├── components/
│   │   ├── ui/              # Base components (Button, Input, Card, Badge)
│   │   ├── auth/            # Auth-related (AuthGuard, GoogleOAuthButton)
│   │   ├── recipe/          # Recipe components
│   │   ├── pantry/          # Pantry components
│   │   ├── shopping/        # Shopping list components
│   │   ├── social/          # Comments, ratings, collections
│   │   ├── admin/           # Admin components
│   │   └── layout/           # Header, Footer, Sidebar, BottomNav
│   ├── hooks/
│   │   ├── useAuth.js
│   │   ├── useRecipes.js
│   │   ├── usePantry.js
│   │   └── ...
│   ├── pages/
│   │   ├── auth/            # Login, Register, ForgotPassword
│   │   ├── home/            # HomePage
│   │   ├── explore/         # ExplorePage
│   │   ├── recipe/          # RecipeDetail, RecipeEditor
│   │   ├── pantry/          # PantryPage
│   │   ├── shopping/        # ShoppingListPage
│   │   ├── suggestion/      # SuggestionPage
│   │   ├── profile/         # ProfilePage, PublicProfilePage
│   │   ├── collections/     # CollectionsPage, CollectionDetailPage
│   │   └── admin/           # AdminPages
│   ├── stores/              # Zustand/Jotai stores
│   ├── utils/               # Helpers (cn, formatDate, etc.)
│   ├── App.jsx
│   └── main.jsx
├── public/
├── index.html
├── tailwind.config.js
├── vite.config.js
└── package.json
```

---

## Dependencies Checklist

```json
{
  "dependencies": {
    "react": "^18.x",
    "react-dom": "^18.x",
    "react-router-dom": "^6.x",
    "axios": "^1.x",
    "@tanstack/react-query": "^5.x",
    "zustand": "^4.x",
    "jotai": "^2.x",
    "react-hook-form": "^7.x",
    "zod": "^3.x",
    "@hookform/resolvers": "^3.x",
    "framer-motion": "^11.x",
    "gsap": "^3.x",
    "@studio-freight/lenis": "^1.x",
    "lucide-react": "^0.x",
    "clsx": "^2.x",
    "tailwind-merge": "^2.x",
    "react-hot-toast": "^2.x"
  },
  "devDependencies": {
    "vite": "^5.x",
    "tailwindcss": "^4.x",
    "@vitejs/plugin-react": "^4.x",
    "eslint": "^8.x",
    "prettier": "^3.x",
    "vitest": "^1.x",
    "@testing-library/react": "^14.x",
    "playwright": "^1.x"
  }
}
```

---

## Priority Order

1. **Phase 1** (Foundation) - Must complete first
2. **Phase 2** (Auth) - Required for all other features
3. **Phase 3** (Recipes) - Core feature
4. **Phase 4** (Smart Kitchen) - Core feature
5. **Phase 5** (Social) - Engagement features
6. **Phase 6** (Admin) - Moderation
7. **Phase 7** (Global Components) - UX polish
8. **Phase 8** (Responsive) - Mobile experience
9. **Phase 9** (Integration & E2E) - Final verification
