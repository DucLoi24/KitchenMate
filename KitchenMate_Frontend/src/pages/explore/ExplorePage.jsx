import { useState, useEffect, useRef, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { motion, useScroll, useTransform } from 'framer-motion'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { BookOpen, SlidersHorizontal, Flame, Users } from 'lucide-react'
import toast from 'react-hot-toast'

import { useRecipesInfinite } from '@/hooks/useRecipes'
import { authApi } from '@/api/authApi'
import { useAuth } from '@/components/auth/useAuth'
import { SearchBar, CategoryFilter, FilterSidebar, FilterBottomSheet, SortDropdown, RecipeGrid, EmptyState, UserSearchResults } from '@/components/explore'
import { cn } from '@/utils'

// Register GSAP plugins
gsap.registerPlugin(ScrollTrigger)

const SEARCH_TABS = [
  { id: 'all', label: 'Tất cả', icon: Flame },
  { id: 'recipes', label: 'Công thức', icon: BookOpen },
  { id: 'users', label: 'Người dùng', icon: Users },
]

function getSearchTab(tab, query) {
  if (SEARCH_TABS.some(item => item.id === tab)) return tab
  return query ? 'all' : 'recipes'
}

// Decorative SVG herb illustrations
function HerbDecoration({ className }) {
  return (
    <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M50 10C50 10 60 30 50 50C40 70 50 90 50 90"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M50 30C40 25 25 30 20 40"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M50 30C60 25 75 30 80 40"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M50 50C35 45 20 55 15 65"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M50 50C65 45 80 55 85 65"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function ExplorePage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()
  const { user: currentUser } = useAuth()
  const heroRef = useRef(null)
  const { scrollYProgress } = useScroll()

  // Filter state from URL
  const [search, setSearch] = useState(searchParams.get('q') || '')
  const [activeTab, setActiveTab] = useState(
    getSearchTab(searchParams.get('tab'), searchParams.get('q') || '')
  )
  const [categories, setCategories] = useState(
    searchParams.get('categories') ? searchParams.get('categories').split(',') : []
  )
  const [difficulties, setDifficulties] = useState(
    searchParams.get('difficulties') ? searchParams.get('difficulties').split(',') : []
  )
  const [cookingTime, setCookingTime] = useState(
    searchParams.get('cooking_time') ? searchParams.get('cooking_time').split(',').map(Number) : []
  )
  const [sort, setSort] = useState(searchParams.get('sort') || 'newest')
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false)
  const [userPage, setUserPage] = useState(1)
  const [updatingUserId, setUpdatingUserId] = useState(null)

  // Sync search state from URL params when URL changes (e.g., from Header search)
  // This effect bridges external URL changes to component state
  const urlSearch = searchParams.get('q') || ''
  const urlTab = searchParams.get('tab')
  useEffect(() => {
    setSearch(urlSearch) // eslint-disable-line react-hooks/set-state-in-effect
    setActiveTab(getSearchTab(urlTab, urlSearch))
    setUserPage(1)
  }, [urlSearch, urlTab])
  const apiParams = useMemo(() => {
    const params = {}

    if (search) params.q = search
    if (categories.length > 0) params.categories = categories.join(',')
    if (difficulties.length > 0) params.difficulty = difficulties.join(',')
    if (cookingTime.length > 0) params.cooking_time = cookingTime.join(',')

    // Map sort to API ordering
    const orderingMap = {
      newest: '-created_at',
      popular: '-save_count',
      rating: '-avg_rating',
    }
    if (sort) params.ordering = orderingMap[sort]

    return params
  }, [search, categories, difficulties, cookingTime, sort])

  // Fetch recipes with infinite scroll
  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useRecipesInfinite(apiParams)

  // Flatten pages to get all recipes
  const recipes = useMemo(() => {
    if (!data?.pages) return []
    // API response: { success: true, data: { count, next, previous, results } }
    // Transform API response to RecipeCard format
    return data.pages.flatMap((page) =>
      (page.data?.results || []).map((recipe) => ({
        id: recipe.id,
        title: recipe.title,
        thumbnail: recipe.thumbnail_url,
        author: {
          full_name: recipe.user_name,
          avatar: recipe.user_avatar,
        },
        prep_time: recipe.prep_time,
        difficulty: recipe.difficulty,
        avg_rating: recipe.avg_rating,
        like_count: recipe.like_count,
        save_count: recipe.save_count,
        is_favorited: recipe.is_favorited,
        categories: recipe.categories || [],
      }))
    )
  }, [data])

  const shouldSearchUsers = Boolean(search && (activeTab === 'all' || activeTab === 'users'))
  const userPageSize = activeTab === 'all' ? 4 : 12
  const {
    data: userSearchData,
    isLoading: isUserSearchLoading,
  } = useQuery({
    queryKey: ['user-search', search, userPage, userPageSize],
    queryFn: () => authApi.searchUsers({
      q: search,
      page: activeTab === 'users' ? userPage : 1,
      page_size: userPageSize,
    }),
    enabled: shouldSearchUsers,
  })

  const userSearchPage = userSearchData?.data || { count: 0, next: null, previous: null, results: [] }
  const userResults = userSearchPage.results || []

  // Update URL when filters change (debounced in SearchBar)
  useEffect(() => {
    const newParams = {}
    if (search) newParams.q = search
    if (search || activeTab !== 'recipes') newParams.tab = activeTab
    if (categories.length > 0) newParams.categories = categories.join(',')
    if (difficulties.length > 0) newParams.difficulties = difficulties.join(',')
    if (cookingTime.length > 0) newParams.cooking_time = cookingTime.join(',')
    if (sort && sort !== 'newest') newParams.sort = sort

    setSearchParams(newParams, { replace: true })
  }, [search, activeTab, categories, difficulties, cookingTime, sort, setSearchParams])

  // Parallax for hero
  const heroY = useTransform(scrollYProgress, [0, 0.3], [0, -80])
  const heroOpacity = useTransform(scrollYProgress, [0, 0.25], [1, 0])

  // GSAP animations - herb float only (Framer Motion handles recipe grid)
  useEffect(() => {
    if (!heroRef.current) return

    const ctx = gsap.context(() => {
      gsap.to('.herb-float', {
        y: -20,
        duration: 3,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
        stagger: 0.8,
      })
    }, heroRef)

    return () => ctx.revert()
  }, [])

  const handleRecipeClick = (recipe) => {
    navigate(`/recipe/${recipe.id}`)
  }

  const handleSearchChange = (nextSearch) => {
    setSearch(nextSearch)
    setUserPage(1)
    if (nextSearch.trim() && activeTab === 'recipes') {
      setActiveTab('all')
    }
  }

  const handleTabChange = (tab) => {
    setActiveTab(tab)
    setUserPage(1)
  }

  const handleToggleUserFollow = async (targetUser) => {
    if (!currentUser) {
      toast.error('Vui lòng đăng nhập để theo dõi người dùng')
      return
    }

    const nextIsFollowing = !targetUser.is_following
    setUpdatingUserId(targetUser.id)
    try {
      if (nextIsFollowing) {
        await authApi.followUser(targetUser.id)
      } else {
        await authApi.unfollowUser(targetUser.id)
      }
      await queryClient.invalidateQueries({ queryKey: ['user-search'] })
      toast.success(nextIsFollowing ? 'Đã theo dõi' : 'Đã hủy theo dõi')
    } catch {
      toast.error('Không thể cập nhật trạng thái theo dõi')
    } finally {
      setUpdatingUserId(null)
    }
  }

  const handleClearFilters = () => {
    setSearch('')
    setActiveTab('recipes')
    setCategories([])
    setDifficulties([])
    setCookingTime([])
    setSort('newest')
    setUserPage(1)
  }

  // Check if any filters are active
  const hasActiveFilters = search || categories.length > 0 || difficulties.length > 0 || cookingTime.length > 0 || sort !== 'newest'
  const showRecipeControls = activeTab === 'recipes'
  const showRecipes = activeTab === 'recipes' || activeTab === 'all'
  const showUsers = activeTab === 'users' || activeTab === 'all'
  const showGlobalEmpty = activeTab === 'all' && !isLoading && !isUserSearchLoading && recipes.length === 0 && userResults.length === 0

  return (
    <div className="min-h-screen bg-[var(--color-background)]">
      {/* Hero Section */}
      <section ref={heroRef} className="relative overflow-hidden">
        {/* Gradient mesh background */}
        <div className="absolute inset-0 bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50" />

        {/* Grain texture overlay */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
            opacity: 0.03,
          }}
        />

        {/* Floating decorative herbs */}
        <motion.div
          className="herb-float absolute top-20 left-[5%] opacity-20 text-[var(--color-secondary)]"
          style={{ y: heroY }}
        >
          <HerbDecoration className="w-20 h-20 md:w-28 md:h-28" />
        </motion.div>
        <motion.div
          className="herb-float absolute top-32 right-[10%] opacity-15 text-[var(--color-secondary)]"
          style={{ y: useTransform(scrollYProgress, [0, 0.3], [0, -60]) }}
        >
          <HerbDecoration className="w-16 h-16 md:w-24 md:h-24" />
        </motion.div>
        <motion.div
          className="herb-float absolute bottom-20 left-[15%] opacity-10 text-[var(--color-primary)]"
          style={{ y: useTransform(scrollYProgress, [0, 0.3], [0, -40]) }}
        >
          <Flame className="w-14 h-14 md:w-20 md:h-20" />
        </motion.div>

        {/* Hero content with parallax */}
        <motion.div
          style={{ y: heroY, opacity: heroOpacity }}
          className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-16 md:pt-20 md:pb-24"
        >
          <div className="text-center">
            {/* Decorative label */}
            <motion.span
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="inline-block font-[Caveat] text-2xl md:text-3xl text-[var(--color-primary)] mb-3"
            >
              Khám phá căn bếp
            </motion.span>

            {/* Main heading */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="font-display text-4xl md:text-5xl lg:text-6xl font-semibold text-[var(--color-text)] mb-4"
            >
              Hãy nấu gì đó tuyệt vời
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-lg text-[var(--color-text-secondary)] max-w-xl mx-auto mb-8"
            >
              Tìm công thức yêu thích và những đầu bếp đang chia sẻ cảm hứng nấu ăn
            </motion.p>

            {/* Search bar */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="max-w-2xl mx-auto mb-8"
            >
              <SearchBar
                value={search}
                onChange={handleSearchChange}
                isLoading={isLoading || isUserSearchLoading}
                placeholder="Tìm công thức, người dùng hoặc @ID..."
              />
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="mb-6 flex flex-wrap gap-2"
        >
          {SEARCH_TABS.map(tab => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleTabChange(tab.id)}
                className={cn(
                  'inline-flex h-11 items-center gap-2 rounded-[var(--radius-full)] border px-4 text-sm font-medium transition-all duration-[var(--transition-base)]',
                  isActive
                    ? 'border-[var(--color-primary)] bg-[var(--color-primary)] text-white shadow-[var(--shadow-sm)]'
                    : 'border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]'
                )}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            )
          })}
        </motion.div>

        {showRecipeControls && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="lg:hidden mb-6"
          >
            <CategoryFilter active={categories} onChange={setCategories} />
          </motion.div>
        )}

        {showRecipeControls && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="flex items-center justify-between mb-6"
          >
            <button
              onClick={() => setIsMobileFilterOpen(true)}
              className={cn(
                'flex items-center gap-2 px-4 py-2.5 rounded-full text-sm',
                'border border-[var(--color-border)] bg-[var(--color-surface)]',
                'hover:border-[var(--color-primary)] transition-colors lg:hidden',
                hasActiveFilters && 'border-[var(--color-primary)] text-[var(--color-primary)]'
              )}
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span>Bộ lọc</span>
              {hasActiveFilters && (
                <span className="w-2 h-2 rounded-full bg-[var(--color-primary)]" />
              )}
            </button>

            <div className="hidden lg:block flex-1" />

            <SortDropdown value={sort} onChange={setSort} />
          </motion.div>
        )}

        {activeTab === 'all' ? (
          <div className="space-y-10">
            {(showRecipes && (recipes.length > 0 || isLoading)) && (
              <section className="space-y-4">
                <div>
                  <h2 className="font-display text-2xl font-semibold text-[var(--color-text)]">
                    Công thức
                  </h2>
                  {search && (
                    <p className="text-sm text-[var(--color-text-secondary)] mt-1">
                      Món ăn phù hợp với "{search}"
                    </p>
                  )}
                </div>
                <RecipeGrid
                  recipes={recipes}
                  isLoading={isLoading}
                  isFetchingNextPage={isFetchingNextPage}
                  hasNextPage={hasNextPage}
                  fetchNextPage={fetchNextPage}
                  onRecipeClick={handleRecipeClick}
                  showFavoriteButton
                />
              </section>
            )}

            {showUsers && (
              <UserSearchResults
                users={userResults}
                searchQuery={search}
                currentUser={currentUser}
                isLoading={isUserSearchLoading}
                compact
                updatingUserId={updatingUserId}
                onToggleFollow={handleToggleUserFollow}
                onViewAll={() => handleTabChange('users')}
              />
            )}

            {showGlobalEmpty && (
              <EmptyState
                onClearFilters={handleClearFilters}
                searchQuery={search}
              />
            )}
          </div>
        ) : activeTab === 'users' ? (
          <div className="space-y-6">
            <UserSearchResults
              users={userResults}
              searchQuery={search}
              currentUser={currentUser}
              isLoading={isUserSearchLoading}
              updatingUserId={updatingUserId}
              onToggleFollow={handleToggleUserFollow}
            />
            {(userSearchPage.previous || userSearchPage.next) && (
              <div className="flex items-center justify-center gap-3">
                <button
                  type="button"
                  disabled={!userSearchPage.previous}
                  onClick={() => setUserPage(prev => Math.max(1, prev - 1))}
                  className="h-10 px-4 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] text-sm text-[var(--color-text)] disabled:opacity-50 disabled:pointer-events-none hover:border-[var(--color-primary)] transition-colors"
                >
                  Trước
                </button>
                <span className="text-sm text-[var(--color-text-muted)]">
                  Trang {userPage}
                </span>
                <button
                  type="button"
                  disabled={!userSearchPage.next}
                  onClick={() => setUserPage(prev => prev + 1)}
                  className="h-10 px-4 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] text-sm text-[var(--color-text)] disabled:opacity-50 disabled:pointer-events-none hover:border-[var(--color-primary)] transition-colors"
                >
                  Sau
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex gap-8">
            <aside className="hidden lg:block w-64 flex-shrink-0">
              <div className="sticky top-24">
                <FilterSidebar
                  categories={categories}
                  difficulties={difficulties}
                  cookingTime={cookingTime}
                  sort={sort}
                  onCategoriesChange={setCategories}
                  onDifficultiesChange={setDifficulties}
                  onTimeChange={setCookingTime}
                  onSortChange={setSort}
                />
              </div>
            </aside>

            <div className="flex-1">
              {recipes.length === 0 && !isLoading ? (
                <EmptyState
                  onClearFilters={handleClearFilters}
                  searchQuery={search}
                />
              ) : (
                <RecipeGrid
                  recipes={recipes}
                  isLoading={isLoading}
                  isFetchingNextPage={isFetchingNextPage}
                  hasNextPage={hasNextPage}
                  fetchNextPage={fetchNextPage}
                  onRecipeClick={handleRecipeClick}
                  showFavoriteButton
                />
              )}
            </div>
          </div>
        )}
      </main>

      {/* Mobile Filter Bottom Sheet */}
      <FilterBottomSheet
        isOpen={isMobileFilterOpen}
        onClose={() => setIsMobileFilterOpen(false)}
        categories={categories}
        difficulties={difficulties}
        cookingTime={cookingTime}
        sort={sort}
        onCategoriesChange={setCategories}
        onDifficultiesChange={setDifficulties}
        onTimeChange={setCookingTime}
        onSortChange={setSort}
        onApply={() => setIsMobileFilterOpen(false)}
        onClear={handleClearFilters}
      />

      {/* Bottom padding for mobile nav */}
      <div className="h-20 lg:h-0" />
    </div>
  )
}

export default ExplorePage
