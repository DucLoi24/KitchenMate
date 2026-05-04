import { useState, useEffect, useRef, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion, useScroll, useTransform } from 'framer-motion'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SlidersHorizontal, Flame } from 'lucide-react'

import { useRecipesInfinite } from '@/hooks/useRecipes'
import { SearchBar, CategoryFilter, FilterSidebar, FilterBottomSheet, SortDropdown, RecipeGrid, EmptyState } from '@/components/explore'
import { cn } from '@/utils'

// Register GSAP plugins
gsap.registerPlugin(ScrollTrigger)

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
  const [searchParams, setSearchParams] = useSearchParams()
  const heroRef = useRef(null)
  const { scrollYProgress } = useScroll()

  // Filter state from URL
  const [search, setSearch] = useState(searchParams.get('q') || '')
  const [category, setCategory] = useState('all')
  const [difficulty, setDifficulty] = useState(searchParams.get('difficulty') || null)
  const [cookingTimeMax, setCookingTimeMax] = useState(
    searchParams.get('cooking_time_max') ? parseInt(searchParams.get('cooking_time_max')) : null
  )
  const [sort, setSort] = useState(searchParams.get('sort') || 'newest')
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false)

  // Build API params
  const apiParams = useMemo(() => {
    const params = {}

    if (search) params.q = search
    if (difficulty) params.difficulty = difficulty
    if (cookingTimeMax) params.cooking_time_max = cookingTimeMax

    // Map sort to API ordering
    const orderingMap = {
      newest: '-created_at',
      popular: '-save_count',
      rating: '-avg_rating',
    }
    if (sort) params.ordering = orderingMap[sort]

    return params
  }, [search, difficulty, cookingTimeMax, sort])

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
        save_count: recipe.save_count,
        is_favorited: false,
      }))
    )
  }, [data])

  // Update URL when filters change (debounced in SearchBar)
  useEffect(() => {
    const newParams = {}
    if (search) newParams.q = search
    if (difficulty) newParams.difficulty = difficulty
    if (cookingTimeMax) newParams.cooking_time_max = cookingTimeMax
    if (sort && sort !== 'newest') newParams.sort = sort

    setSearchParams(newParams, { replace: true })
  }, [search, difficulty, cookingTimeMax, sort, setSearchParams])

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

  const handleClearFilters = () => {
    setSearch('')
    setCategory('all')
    setDifficulty(null)
    setCookingTimeMax(null)
    setSort('newest')
  }

  // Check if any filters are active
  const hasActiveFilters = search || difficulty || cookingTimeMax || sort !== 'newest'

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
              Khám phá công thức
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
              Tìm kiếm công thức yêu thích từ hàng ngàn món ăn Việt Nam và quốc tế
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
                onChange={setSearch}
                isLoading={isLoading}
              />
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Category Filter (Mobile) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="lg:hidden mb-6"
        >
          <CategoryFilter active={category} onChange={setCategory} />
        </motion.div>

        {/* Controls Row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="flex items-center justify-between mb-6"
        >
          {/* Left: Mobile filter button */}
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

          {/* Spacer for desktop */}
          <div className="hidden lg:block flex-1" />

          {/* Right: Sort dropdown */}
          <SortDropdown value={sort} onChange={setSort} />
        </motion.div>

        {/* Content Layout */}
        <div className="flex gap-8">
          {/* Filter Sidebar (Desktop) */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="sticky top-24">
              <FilterSidebar
                difficulty={difficulty}
                cookingTimeMax={cookingTimeMax}
                sort={sort}
                onDifficultyChange={setDifficulty}
                onTimeChange={setCookingTimeMax}
                onSortChange={setSort}
              />
            </div>
          </aside>

          {/* Recipe Grid */}
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
      </main>

      {/* Mobile Filter Bottom Sheet */}
      <FilterBottomSheet
        isOpen={isMobileFilterOpen}
        onClose={() => setIsMobileFilterOpen(false)}
        difficulty={difficulty}
        cookingTimeMax={cookingTimeMax}
        sort={sort}
        onDifficultyChange={setDifficulty}
        onTimeChange={setCookingTimeMax}
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