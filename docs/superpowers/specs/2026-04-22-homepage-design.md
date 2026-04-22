# Phase 4.1: Trang chủ (HomePage) Implementation Spec

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Xây dựng trang chủ với Hero section + 2 recipe sections (mới nhất, phổ biến), responsive layout (Desktop A, Mobile C), auto-infinite scroll.

**Architecture:**
- Desktop: Hero + 2 stacked sections (newest + popular), grid 4 columns, load-more on scroll
- Mobile: Hero + single infinite scroll list with sort dropdown
- RecipeCard: square image (1:1), info below (name, author, time, rating)
- Data: 2 separate API calls for each section, TanStack Query for caching

**Tech Stack:** React Query v5, React Intersection Observer, Tailwind CSS

---

## Layout Structure

### Desktop (md+)
```
┌─────────────────────────────────────┐
│           Hero Banner                │
│  (Gradient orange, tagline, CTA)     │
├─────────────────────────────────────┤
│     "Công thức mới nhất"             │
│  [Card][Card][Card][Card]            │
│  [Card][Card][Card][Card]            │
│            ↓ Load More               │
├─────────────────────────────────────┤
│     "Công thức phổ biến"             │
│  [Card][Card][Card][Card]            │
│  [Card][Card][Card][Card]            │
│            ↓ Load More               │
└─────────────────────────────────────┘
```

### Mobile (< md)
```
┌───────────────────┐
│   Hero Banner     │
│  (Compact, stacked)│
├───────────────────┤
│ [Sort: Mới | Phổ] │
│                    │
│ [RecipeCard]       │
│ [RecipeCard]       │
│ [RecipeCard]       │
│     ↓ infinite      │
│ [RecipeCard]       │
└───────────────────┘
```

---

## RecipeCard Component

**Visual:**
- Ảnh vuông (1:1 aspect ratio), object-cover, rounded-lg
- Phía dưới ảnh: tên món (font-semibold, truncate 2 lines), tác giả (text-sm, text-gray-500), thời gian + rating icon

**Responsive grid:**
- Mobile (<768px): 1 column
- Tablet (768px-1024px): 2 columns  
- Desktop (>1024px): 4 columns

**States:**
- Default: bình thường
- Hover: subtle shadow, scale(1.02)
- Skeleton loading: animated pulse placeholder

**API data shape:**
```js
{
  id: number,
  title: string,
  thumbnail: string | null,
  author: { id, username, avatar },
  cooking_time: number, // minutes
  difficulty: 'EASY' | 'MEDIUM' | 'HARD',
  avg_rating: number, // 1-5
  save_count: number,
}
```

---

## Data Fetching

### Endpoints
- **Mới nhất:** `GET /api/recipes/?sort=created_at&order=desc&page={n}`
- **Phổ biến:** `GET /api/recipes/?sort=save_count&order=desc&page={n}`

### TanStack Query setup
- `useRecipesNewest(page)` — hook cho section mới nhất
- `useRecipesPopular(page)` — hook cho section phổ biến  
- `queryClient.prefetchQuery()` cho preloading

### Pagination
- Auto-infinite scroll: dùng Intersection Observer khi user scroll gần cuối list (threshold: 200px)
- Load 12 items per page
- "Đang tải..." skeleton khi fetching
- "Không còn nữa" message khi hết data

---

## Component Files

**New files:**
- `src/components/recipe/RecipeCard.jsx` — Recipe card component
- `src/components/recipe/RecipeCardSkeleton.jsx` — Skeleton loading
- `src/components/home/NewestSection.jsx` — "Mới nhất" section  
- `src/components/home/PopularSection.jsx` — "Phổ biến" section
- `src/components/home/HomePageContent.jsx` — Shared content logic
- `src/hooks/useRecipesNewest.js` — Query hook
- `src/hooks/useRecipesPopular.js` — Query hook
- `src/hooks/useInfiniteScroll.js` — Intersection Observer hook

**Modified files:**
- `src/pages/HomePage.jsx` — Update để dùng sections

---

## Implementation Order

1. **RecipeCard** — Component cơ bản nhất
2. **RecipeCardSkeleton** — Loading state
3. **Custom hooks** — useRecipesNewest, useRecipesPopular, useInfiniteScroll
4. **Section components** — NewestSection, PopularSection
5. **HomePageContent** — Logic chia desktop/mobile
6. **Update HomePage** — Import và render HomePageContent
7. **Responsive test** — Verify grid trên các breakpoints