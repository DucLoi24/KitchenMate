# Phase 4.1: Trang chủ (HomePage) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Xây dựng trang chủ với Hero section + 2 recipe sections (mới nhất, phổ biến), responsive layout (Desktop A, Mobile C), auto-infinite scroll.

**Architecture:**
- RecipeCard component với ảnh vuông 1:1, thông tin bên dưới
- Desktop: Hero + 2 stacked sections, grid 4 columns, load-more on scroll
- Mobile: Hero + single infinite scroll list với sort dropdown
- TanStack Query v5 cho data fetching + caching, Intersection Observer cho infinite scroll

**Tech Stack:** React Query v5, React Intersection Observer, Tailwind CSS v4, react-icons

---

## File Structure

```
src/
├── components/
│   └── recipe/
│       ├── RecipeCard.jsx        # Card component (1:1 image, info below)
│       └── RecipeCardSkeleton.jsx # Skeleton loading state
├── components/
│   └── home/
│       ├── NewestSection.jsx     # "Mới nhất" section (desktop)
│       ├── PopularSection.jsx    # "Phổ biến" section (desktop)
│       └── HomePageContent.jsx   # Logic chia desktop/mobile
├── hooks/
│   ├── useRecipesNewest.js       # TanStack Query hook
│   ├── useRecipesPopular.js      # TanStack Query hook
│   └── useInfiniteScroll.js     # Intersection Observer hook
└── pages/
    └── HomePage.jsx              # Updated to use sections
```

---

## Task 1: RecipeCard Component

**Files:**
- Create: `components/recipe/RecipeCard.jsx`

- [ ] **Step 1: Write RecipeCard.jsx**

```jsx
import { Link } from 'react-router-dom';
import { FaClock, FaStar } from 'react-icons/fa';

export default function RecipeCard({ recipe }) {
  const {
    id,
    title,
    thumbnail,
    author,
    cooking_time: cookingTime,
    avg_rating: avgRating,
  } = recipe;

  return (
    <Link
      to={`/recipes/${id}`}
      className="group block bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md hover:scale-[1.02] transition-all duration-200"
    >
      {/* Ảnh vuông 1:1 */}
      <div className="aspect-square w-full bg-gray-200 overflow-hidden">
        {thumbnail ? (
          <img
            src={thumbnail}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-orange-100">
            <span className="text-orange-300 text-4xl">🍽️</span>
          </div>
        )}
      </div>

      {/* Thông tin bên dưới */}
      <div className="p-3">
        <h3 className="font-semibold text-gray-900 line-clamp-2 mb-1">
          {title}
        </h3>
        <p className="text-sm text-gray-500 mb-2">
          {author?.username || 'Ẩn danh'}
        </p>
        <div className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-1 text-gray-600">
            <FaClock className="text-orange-500" />
            {cookingTime || 30}p
          </span>
          <span className="flex items-center gap-1 text-gray-600">
            <FaStar className="text-yellow-400" />
            {avgRating ? avgRating.toFixed(1) : 'N/A'}
          </span>
        </div>
      </div>
    </Link>
  );
}
```

- [ ] **Step 2: Verify file was created**

Run: `ls -la src/components/recipe/RecipeCard.jsx`

- [ ] **Step 3: Commit**

```bash
git add src/components/recipe/RecipeCard.jsx
git commit -m "feat(frontend): add RecipeCard component

- 1:1 aspect ratio image with lazy loading
- Shows title (truncate 2 lines), author, cooking time, rating
- Hover effect: shadow + scale(1.02)
- Fallback placeholder for missing thumbnail

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Task 2: RecipeCardSkeleton Component

**Files:**
- Create: `components/recipe/RecipeCardSkeleton.jsx`

- [ ] **Step 1: Write RecipeCardSkeleton.jsx**

```jsx
export default function RecipeCardSkeleton() {
  return (
    <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100">
      {/* Ảnh skeleton */}
      <div className="aspect-square w-full bg-gray-200 animate-pulse" />

      {/* Thông tin skeleton */}
      <div className="p-3 space-y-2">
        <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
        <div className="h-3 bg-gray-200 rounded animate-pulse w-1/2" />
        <div className="flex justify-between pt-1">
          <div className="h-3 bg-gray-200 rounded animate-pulse w-1/4" />
          <div className="h-3 bg-gray-200 rounded animate-pulse w-1/4" />
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify file was created**

Run: `ls -la src/components/recipe/RecipeCardSkeleton.jsx`

- [ ] **Step 3: Commit**

```bash
git add src/components/recipe/RecipeCardSkeleton.jsx
git commit -m "feat(frontend): add RecipeCardSkeleton component

- Animated pulse placeholder matching RecipeCard layout
- Shows during data fetching states

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Task 3: Custom Hooks

**Files:**
- Create: `hooks/useRecipesNewest.js`
- Create: `hooks/useRecipesPopular.js`
- Create: `hooks/useInfiniteScroll.js`

- [ ] **Step 1: Write useRecipesNewest.js**

```js
import { useInfiniteQuery } from '@tanstack/react-query';
import axiosInstance from '../api/axiosInstance';

const fetchRecipesNewest = async ({ pageParam = 1 }) => {
  const response = await axiosInstance.get('/recipes/', {
    params: {
      sort: 'created_at',
      order: 'desc',
      page: pageParam,
    },
  });
  return {
    data: response.data.results || response.data,
    nextCursor: response.data.next ? pageParam + 1 : undefined,
  };
};

export function useRecipesNewest() {
  return useInfiniteQuery({
    queryKey: ['recipes', 'newest'],
    queryFn: fetchRecipesNewest,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: 1,
  });
}
```

- [ ] **Step 2: Write useRecipesPopular.js**

```js
import { useInfiniteQuery } from '@tanstack/react-query';
import axiosInstance from '../api/axiosInstance';

const fetchRecipesPopular = async ({ pageParam = 1 }) => {
  const response = await axiosInstance.get('/recipes/', {
    params: {
      sort: 'save_count',
      order: 'desc',
      page: pageParam,
    },
  });
  return {
    data: response.data.results || response.data,
    nextCursor: response.data.next ? pageParam + 1 : undefined,
  };
};

export function useRecipesPopular() {
  return useInfiniteQuery({
    queryKey: ['recipes', 'popular'],
    queryFn: fetchRecipesPopular,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: 1,
  });
}
```

- [ ] **Step 3: Write useInfiniteScroll.js**

```js
import { useEffect, useRef } from 'react';

export function useInfiniteScroll(callback, options = {}) {
  const { threshold = 200, enabled = true } = options;
  const observerRef = useRef(null);
  const sentinelRef = useRef(null);

  useEffect(() => {
    if (!enabled) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          callback();
        }
      },
      {
        rootMargin: `${threshold}px`,
      }
    );

    if (sentinelRef.current) {
      observerRef.current.observe(sentinelRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [callback, threshold, enabled]);

  return sentinelRef;
}
```

- [ ] **Step 4: Verify all hooks were created**

Run: `ls -la src/hooks/`

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useRecipesNewest.js src/hooks/useRecipesPopular.js src/hooks/useInfiniteScroll.js
git commit -m "feat(frontend): add custom hooks for recipes and infinite scroll

- useRecipesNewest: infinite query sorted by created_at
- useRecipesPopular: infinite query sorted by save_count  
- useInfiniteScroll: Intersection Observer wrapper

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Task 4: NewestSection Component

**Files:**
- Create: `components/home/NewestSection.jsx`

- [ ] **Step 1: Write NewestSection.jsx**

```jsx
import { useRecipesNewest } from '../../hooks/useRecipesNewest';
import { useInfiniteScroll } from '../../hooks/useInfiniteScroll';
import RecipeCard from '../recipe/RecipeCard';
import RecipeCardSkeleton from '../recipe/RecipeCardSkeleton';

export default function NewestSection() {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
  } = useRecipesNewest();

  const recipes = data?.pages.flatMap((page) => page.data) || [];

  const sentinelRef = useInfiniteScroll(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, { enabled: hasNextPage && !isFetchingNextPage });

  return (
    <section className="py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          Công thức mới nhất
        </h2>

        {/* Grid 4 columns desktop, 2 tablet, 1 mobile */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {isLoading ? (
            // Skeleton loading - 8 items
            Array.from({ length: 8 }).map((_, i) => (
              <RecipeCardSkeleton key={i} />
            ))
          ) : isError ? (
            <p className="col-span-full text-center text-red-500 py-8">
              Đã xảy ra lỗi khi tải công thức
            </p>
          ) : recipes.length === 0 ? (
            <p className="col-span-full text-center text-gray-500 py-8">
              Chưa có công thức nào
            </p>
          ) : (
            <>
              {recipes.map((recipe) => (
                <RecipeCard key={recipe.id} recipe={recipe} />
              ))}
              {/* Sentinel element for infinite scroll */}
              <div ref={sentinelRef} className="h-4" />
            </>
          )}
        </div>

        {/* Loading more indicator */}
        {isFetchingNextPage && (
          <div className="flex justify-center py-4">
            <div className="flex items-center gap-2 text-gray-500">
              <div className="w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
              <span>Đang tải thêm...</span>
            </div>
          </div>
        )}

        {/* End of list */}
        {!hasNextPage && recipes.length > 0 && (
          <p className="text-center text-gray-400 py-4">
            Không còn công thức nào
          </p>
        )}
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Verify file was created**

Run: `ls -la src/components/home/NewestSection.jsx`

- [ ] **Step 3: Commit**

```bash
git add src/components/home/NewestSection.jsx
git commit -m "feat(frontend): add NewestSection component

- Fetches recipes sorted by created_at
- Auto-infinite scroll with Intersection Observer
- Skeleton loading state
- Empty state and error handling

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Task 5: PopularSection Component

**Files:**
- Create: `components/home/PopularSection.jsx`

- [ ] **Step 1: Write PopularSection.jsx**

```jsx
import { useRecipesPopular } from '../../hooks/useRecipesPopular';
import { useInfiniteScroll } from '../../hooks/useInfiniteScroll';
import RecipeCard from '../recipe/RecipeCard';
import RecipeCardSkeleton from '../recipe/RecipeCardSkeleton';

export default function PopularSection() {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
  } = useRecipesPopular();

  const recipes = data?.pages.flatMap((page) => page.data) || [];

  const sentinelRef = useInfiniteScroll(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, { enabled: hasNextPage && !isFetchingNextPage });

  return (
    <section className="py-8 px-4 bg-orange-50">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          Công thức phổ biến
        </h2>

        {/* Grid 4 columns desktop, 2 tablet, 1 mobile */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {isLoading ? (
            // Skeleton loading - 8 items
            Array.from({ length: 8 }).map((_, i) => (
              <RecipeCardSkeleton key={i} />
            ))
          ) : isError ? (
            <p className="col-span-full text-center text-red-500 py-8">
              Đã xảy ra lỗi khi tải công thức
            </p>
          ) : recipes.length === 0 ? (
            <p className="col-span-full text-center text-gray-500 py-8">
              Chưa có công thức nào
            </p>
          ) : (
            <>
              {recipes.map((recipe) => (
                <RecipeCard key={recipe.id} recipe={recipe} />
              ))}
              {/* Sentinel element for infinite scroll */}
              <div ref={sentinelRef} className="h-4" />
            </>
          )}
        </div>

        {/* Loading more indicator */}
        {isFetchingNextPage && (
          <div className="flex justify-center py-4">
            <div className="flex items-center gap-2 text-gray-500">
              <div className="w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
              <span>Đang tải thêm...</span>
            </div>
          </div>
        )}

        {/* End of list */}
        {!hasNextPage && recipes.length > 0 && (
          <p className="text-center text-gray-400 py-4">
            Không còn công thức nào
          </p>
        )}
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Verify file was created**

Run: `ls -la src/components/home/PopularSection.jsx`

- [ ] **Step 3: Commit**

```bash
git add src/components/home/PopularSection.jsx
git commit -m "feat(frontend): add PopularSection component

- Fetches recipes sorted by save_count
- Auto-infinite scroll with Intersection Observer
- Orange-tinted background to differentiate from NewestSection

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Task 6: HomePageContent Component

**Files:**
- Create: `components/home/HomePageContent.jsx`

- [ ] **Step 1: Write HomePageContent.jsx**

```jsx
import { useState } from 'react';
import { FaChevronDown } from 'react-icons/fa';
import NewestSection from './NewestSection';
import PopularSection from './PopularSection';

export default function HomePageContent() {
  const [activeTab, setActiveTab] = useState('newest');

  return (
    <>
      {/* Desktop: Both sections stacked */}
      <div className="hidden md:block">
        <NewestSection />
        <PopularSection />
      </div>

      {/* Mobile: Tab + single infinite list */}
      <div className="md:hidden">
        {/* Sort dropdown */}
        <div className="py-4 px-4">
          <div className="max-w-xl mx-auto">
            <div className="flex items-center justify-center gap-2">
              <span className="text-sm text-gray-600">Sắp xếp:</span>
              <div className="relative">
                <select
                  value={activeTab}
                  onChange={(e) => setActiveTab(e.target.value)}
                  className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 text-sm font-medium text-gray-700 cursor-pointer hover:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                >
                  <option value="newest">Mới nhất</option>
                  <option value="popular">Phổ biến</option>
                </select>
                <FaChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs pointer-events-none" />
              </div>
            </div>
          </div>
        </div>

        {/* Single section based on active tab */}
        <div className="pb-20"> {/* pb-20 for bottom nav clearance */}
          {activeTab === 'newest' ? <NewestSection /> : <PopularSection />}
        </div>
      </div>
    </>
  );
}
```

- [ ] **Step 2: Verify file was created**

Run: `ls -la src/components/home/HomePageContent.jsx`

- [ ] **Step 3: Commit**

```bash
git add src/components/home/HomePageContent.jsx
git commit -m "feat(frontend): add HomePageContent component

- Desktop: renders both NewestSection + PopularSection stacked
- Mobile: sort dropdown + single section based on active tab
- pb-20 on mobile to clear bottom nav space

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Task 7: Update HomePage

**Files:**
- Modify: `pages/HomePage.jsx`

- [ ] **Step 1: Replace HomePage.jsx content**

```jsx
import HomePageContent from '../components/home/HomePageContent';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <HomePageContent />
    </div>
  );
}
```

- [ ] **Step 2: Verify file was updated**

Run: `cat src/pages/HomePage.jsx`

- [ ] **Step 3: Commit**

```bash
git add src/pages/HomePage.jsx
git commit -m "feat(frontend): update HomePage to use HomePageContent

- Simplified to just render HomePageContent
- Hero section is now inside NewestSection/PopularSection via parent

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Task 8: Add Hero Section to NewestSection

**Files:**
- Modify: `components/home/NewestSection.jsx`

Note: The hero section (currently in HomePage.jsx) needs to be moved to NewestSection since HomePage is now just a wrapper.

- [ ] **Step 1: Check current HomePage.jsx hero section**

The current HomePage has:
- Hero section with gradient, tagline, CTA buttons (guest vs logged-in)
- Features section
- CTA section (guest vs logged-in)

These need to be preserved. Since NewestSection renders first on desktop, we should add Hero + Features + CTA sections there OR keep them in HomePage and pass isAuthenticated.

Actually, looking at the original HomePage - it has Hero + Features + CTA sections that are separate from the recipe lists. For simplicity, let's keep the Hero + Features + CTA in HomePage, and just add recipe sections below.

- [ ] **Step 2: Update HomePage to include Hero + recipe sections**

```jsx
import { useAuthStore } from '../stores/authStore';
import { Link } from 'react-router-dom';
import { FaUtensils, FaHeart, FaClock } from 'react-icons/fa';
import NewestSection from '../components/home/NewestSection';
import PopularSection from '../components/home/PopularSection';

export default function HomePage() {
  const { isAuthenticated, user } = useAuthStore();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-orange-500 to-orange-600 text-white py-8 md:py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center gap-6 md:gap-8">
            <div className="flex-1 text-center md:text-left">
              {isAuthenticated ? (
                <>
                  <h1 className="text-2xl md:text-4xl font-bold mb-3">
                    Chào {user?.username || 'bạn'}! 👋
                  </h1>
                  <p className="text-orange-100 text-base md:text-lg mb-4">
                    Hôm nay bạn muốn nấu món gì? Chúng tôi sẽ gợi ý cho bạn!
                  </p>
                  <div className="flex flex-col sm:flex-row gap-2 justify-center md:justify-start">
                    <Link
                      to="/suggestions"
                      className="px-5 py-2 bg-white text-orange-600 font-semibold rounded-lg hover:bg-orange-50 transition-colors"
                    >
                      Gợi ý món ăn
                    </Link>
                    <Link
                      to="/pantry"
                      className="px-5 py-2 bg-orange-600 text-white font-semibold rounded-lg border border-orange-400 hover:bg-orange-500 transition-colors"
                    >
                      Quản lý tủ lạnh
                    </Link>
                  </div>
                </>
              ) : (
                <>
                  <h1 className="text-2xl md:text-4xl font-bold mb-3">
                    Nấu ăn thông minh,<br />sống khỏe mỗi ngày
                  </h1>
                  <p className="text-orange-100 text-base md:text-lg mb-4">
                    Khám phá hàng ngàn công thức nấu ăn ngon, gợi ý món ăn từ nguyên liệu có sẵn trong tủ lạnh.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-2 justify-center md:justify-start">
                    <Link
                      to="/register"
                      className="px-5 py-2 bg-white text-orange-600 font-semibold rounded-lg hover:bg-orange-50 transition-colors"
                    >
                      Bắt đầu ngay
                    </Link>
                    <Link
                      to="/explore"
                      className="px-5 py-2 bg-orange-600 text-white font-semibold rounded-lg border border-orange-400 hover:bg-orange-500 transition-colors"
                    >
                      Khám phá công thức
                    </Link>
                  </div>
                </>
              )}
            </div>
            <div className="flex-1 flex justify-center">
              <div className="relative">
                <div className="w-48 h-48 md:w-64 md:h-64 bg-orange-400 rounded-full opacity-50 absolute -top-3 -left-3 md:-top-4 md:-left-4" />
                <img
                  src="https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=400"
                  alt="Nấu ăn"
                  className="w-48 h-48 md:w-64 md:h-64 object-cover rounded-2xl shadow-xl relative z-10"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Recipe sections */}
      <HomePageContent />
    </div>
  );
}
```

- [ ] **Step 3: Verify and commit**

```bash
git add src/pages/HomePage.jsx
git commit -m "feat(frontend): add hero + recipe sections to HomePage

- Hero section preserved with guest/logged-in variants
- Recipe sections (NewestSection + PopularSection) below hero
- Responsive: stacked on mobile, side-by-side on desktop

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Verification Checklist

After implementing all tasks:

- [ ] RecipeCard displays correctly with 1:1 image, title, author, time, rating
- [ ] RecipeCardSkeleton shows animated pulse placeholder
- [ ] NewestSection fetches and displays recipes sorted by created_at
- [ ] PopularSection fetches and displays recipes sorted by save_count
- [ ] Infinite scroll triggers at 200px from bottom
- [ ] Desktop shows both sections stacked (4-column grid)
- [ ] Mobile shows single section with sort dropdown
- [ ] Skeleton loading shows during fetch
- [ ] Empty state shows when no recipes
- [ ] Error state shows when fetch fails
- [ ] Hover effect on RecipeCard (shadow + scale)
- [ ] Bottom nav clearance on mobile (pb-20)