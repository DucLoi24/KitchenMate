import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, useScroll, useTransform } from 'framer-motion'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import {
  Search,
  ArrowRight,
  Clock,
  ChefHat,
  Sparkles,
  Plus,
  UtensilsCrossed,
  ShoppingCart,
  Flame,
  TrendingUp,
  Lightbulb,
} from 'lucide-react'
import { useAuth } from '@/components/auth/useAuth'
import { useRecipes, useMyRecipes } from '@/hooks/useRecipes'
import { useSuggestion } from '@/hooks/useSuggestion'
import { usePantry } from '@/hooks/useKitchen'
import { categoryApi, FALLBACK_CATEGORIES } from '@/api/categoryApi'
import { Button } from '@/components/ui'
import { Badge } from '@/components/ui'
import { RecipeCard } from '@/components/recipe/RecipeCard'
import { RecipeCardSkeleton } from '@/components/recipe/RecipeCardSkeleton'
import { useCollections } from '@/hooks/useCollections'
import { StatsBar } from '@/components/home/StatsBar'
import { cn, getEmojiForCategory } from '@/utils'


// Register GSAP plugins
gsap.registerPlugin(ScrollTrigger)

// Section heading component
function SectionHeading({ icon: Icon, title, subtitle, actionLabel, onAction }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: '-100px' }}
      transition={{ duration: 0.5 }}
      className="flex items-center justify-between mb-6"
    >
      <div className="flex items-center gap-3">
        {Icon && (
          <div className="w-10 h-10 rounded-[var(--radius-md)] bg-[var(--color-primary)]/10 flex items-center justify-center">
            <Icon className="w-5 h-5 text-[var(--color-primary)]" />
          </div>
        )}
        <div>
          <h2 className="font-display text-2xl font-semibold text-[var(--color-text)]">
            {title}
          </h2>
          {subtitle && (
            <p className="text-sm text-[var(--color-text-secondary)] mt-0.5">{subtitle}</p>
          )}
        </div>
      </div>
      {actionLabel && (
        <Button variant="ghost" size="sm" rightIcon={<ArrowRight className="w-4 h-4" />} onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </motion.div>
  )
}

// Hero image carousel
function HeroCarousel({ images }) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)

  useEffect(() => {
    if (isPaused || !images?.length) return
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length)
    }, 3000)
    return () => clearInterval(timer)
  }, [isPaused, images])

  const goTo = (index) => setCurrentIndex(index)
  const goPrev = () => {
    if (!images?.length) return
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length)
  }
  const goNext = () => {
    if (!images?.length) return
    setCurrentIndex((prev) => (prev + 1) % images.length)
  }

  if (!images?.length) return null

  const total = images.length
  const prevIndex = (currentIndex - 1 + total) % total
  const nextIndex = (currentIndex + 1) % total

  return (
    <div
      className="hidden lg:block flex-shrink-0 w-72 h-72 xl:w-80 xl:h-80 relative"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* All images stacked absolutely */}
      {images.map((img, i) => {
        const isCenter = i === currentIndex
        const isPrev = i === prevIndex
        const isNext = i === nextIndex
        const isHidden = !isCenter && !isPrev && !isNext

        return (
          <div
            key={i}
            className="absolute inset-0 rounded-3xl overflow-hidden shadow-[var(--shadow-xl)] border-2 border-[var(--color-border)] transition-all duration-500 ease-out"
            style={{
              opacity: isHidden ? 0 : 1,
              transform: isCenter
                ? 'scale(1) translateX(0) translateY(0)'
                : isPrev
                  ? 'scale(0.7) translateX(calc(-50% - 24px)) translateY(20px)'
                  : isNext
                    ? 'scale(0.7) translateX(calc(50% + 24px)) translateY(20px)'
                    : 'scale(0.6) translateY(30px)',
              zIndex: isCenter ? 3 : 2,
              pointerEvents: isCenter ? 'auto' : 'none',
            }}
          >
            {/* Image */}
            <img
              src={img}
              alt=""
              className="w-full h-full object-cover"
            />

            {/* Fade mask on inner edge */}
            {!isHidden && !isCenter && (
              <div
                className="absolute top-0 bottom-0 w-24 pointer-events-none"
                style={{
                  [isPrev ? 'right' : 'left']: 0,
                  background: isPrev
                    ? 'linear-gradient(to left, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.3) 40%, transparent 100%)'
                    : 'linear-gradient(to right, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.3) 40%, transparent 100%)',
                }}
              />
            )}
          </div>
        )
      })}

      {/* Navigation arrows */}
      <div className="absolute inset-0 z-20">
        <button
          onClick={goPrev}
          className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity shadow-[var(--shadow-md)]"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <button
          onClick={goNext}
          className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity shadow-[var(--shadow-md)]"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Dot indicators */}
      <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-20">
        {images.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            className={`rounded-full transition-all ${
              i === currentIndex
                ? 'w-4 h-4 bg-[var(--color-primary)]'
                : 'w-2 h-2 bg-[var(--color-border-strong)] hover:bg-[var(--color-text-muted)]'
            }`}
          />
        ))}
      </div>
    </div>
  )
}

// Recipe carousel component
function RecipeCarousel({ recipes, isLoading, onRecipeClick }) {
  const carouselRef = useRef(null)

  const scroll = (direction) => {
    if (carouselRef.current) {
      const scrollAmount = 320
      carouselRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      })
    }
  }

  if (isLoading) {
    return (
      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide scroll-smooth">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex-shrink-0 w-72">
            <RecipeCardSkeleton />
          </div>
        ))}
      </div>
    )
  }

  if (!recipes?.length) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center bg-[var(--color-background-alt)] rounded-[var(--radius-lg)]">
        <ChefHat className="w-12 h-12 text-[var(--color-text-muted)] mb-3" />
        <p className="text-[var(--color-text-secondary)]">Chưa có công thức nào</p>
        <Link to="/recipe/new">
          <Button variant="primary" size="sm" className="mt-4" leftIcon={<Plus className="w-4 h-4" />}>
            Tạo công thức đầu tiên
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="relative group">
      {/* Navigation arrows */}
      <button
        onClick={() => scroll('left')}
        className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 z-10 w-10 h-10 rounded-full bg-[var(--color-surface)] shadow-[var(--shadow-md)] border border-[var(--color-border)] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-[var(--color-background-alt)]"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <button
        onClick={() => scroll('right')}
        className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 z-10 w-10 h-10 rounded-full bg-[var(--color-surface)] shadow-[var(--shadow-md)] border border-[var(--color-border)] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-[var(--color-background-alt)]"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {/* Carousel */}
      <div
        ref={carouselRef}
        className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide scroll-smooth"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {recipes.map((recipe, index) => (
          <motion.div
            key={recipe.id}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex-shrink-0 w-72"
          >
            <RecipeCard recipe={recipe} onClick={onRecipeClick} />
          </motion.div>
        ))}
      </div>
    </div>
  )
}

// Quick action card component
function QuickActionCard({ icon: Icon, label, description, color, onClick }) {
  return (
    <motion.button
      whileHover={{ y: -4, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cn(
        'flex flex-col items-start p-5 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)] transition-all text-left w-full',
        color === 'primary' && 'hover:border-[var(--color-primary)]/30',
        color === 'secondary' && 'hover:border-[var(--color-secondary)]/30',
        color === 'accent' && 'hover:border-[var(--color-accent)]/30',
      )}
    >
      <div className={cn(
        'w-10 h-10 rounded-[var(--radius-md)] flex items-center justify-center mb-3',
        color === 'primary' && 'bg-[var(--color-primary)]/10',
        color === 'secondary' && 'bg-[var(--color-secondary)]/10',
        color === 'accent' && 'bg-[var(--color-accent)]/10',
      )}>
        <Icon className={cn(
          'w-5 h-5',
          color === 'primary' && 'text-[var(--color-primary)]',
          color === 'secondary' && 'text-[var(--color-secondary)]',
          color === 'accent' && 'text-[var(--color-accent)]',
        )} />
      </div>
      <span className="font-display font-semibold text-[var(--color-text)] mb-1">{label}</span>
      <span className="text-sm text-[var(--color-text-secondary)]">{description}</span>
    </motion.button>
  )
}

export function HomePage() {
  const { user, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const heroRef = useRef(null)
  const { scrollYProgress } = useScroll()

  // Parallax effect for hero
  const heroY = useTransform(scrollYProgress, [0, 0.3], [0, 100])
  const heroOpacity = useTransform(scrollYProgress, [0, 0.3], [1, 0.5])

  // Fetch data
  const { data: myRecipesData } = useMyRecipes()
  const { data: suggestionsData, isLoading: isSuggestionsLoading } = useSuggestion('COOK_NOW')
  const { data: pantryData } = usePantry()
  const { data: collections } = useCollections()
  const { data: allRecipesData, isLoading: isAllRecipesLoading } = useRecipes({ ordering: '-created_at' })

  // Handle various API response shapes
  const suggestions = Array.isArray(suggestionsData)
    ? suggestionsData
    : suggestionsData?.results || []
  const allRecipes = Array.isArray(allRecipesData)
    ? allRecipesData
    : allRecipesData?.results || []

  // Greeting based on time
  const hour = new Date().getHours()
  const greeting = hour < 12
    ? 'Chào buổi sáng'
    : hour < 18
      ? 'Chào buổi chiều'
      : 'Chào buổi tối'

  // Stats values
  const myRecipesCount = myRecipesData?.data?.count || myRecipesData?.data?.results?.length || 0

  const pantryCount = pantryData?.data?.count || pantryData?.data?.results?.length || 0

  const favoritesCount = collections?.find(c => c.is_favorites)?.recipe_count || 0

  const savedCount = Array.isArray(collections)
    ? collections.reduce((sum, c) => c.is_favorites ? sum : sum + (c.recipe_count || 0), 0)
    : 0

  const statsValues = {
    myRecipes: myRecipesCount,
    pantry: pantryCount,
    favorites: favoritesCount,
    saved: savedCount,
  }

  // Hero carousel images
  const heroImages = [
    'https://plus.unsplash.com/premium_photo-1664472709914-79d53c2b823e?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MXx8dmlldG5hbWVzZSUyMGZvb2R8ZW58MHwyfDB8fHww',
    'https://images.unsplash.com/photo-1634480922159-49cbf50bda99?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NHx8dmlldG5hbWVzZSUyMGZvb2R8ZW58MHwyfDB8fHww',
    'https://images.unsplash.com/photo-1731460202531-bf8389d565f7?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTR8fHZpZXRuYW1lc2UlMjBmb29kfGVufDB8MnwwfHx8MA%3D%3D',
    'https://images.unsplash.com/photo-1545595699-6c2c3c10db5c?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mzd8fHZpZXRuYW1lc2UlMjBmb29kfGVufDB8MnwwfHx8MA%3D%3D',
    'https://images.unsplash.com/photo-1721273057143-852516e2caa7?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MzF8fHZpZXRuYW1lc2UlMjBmb29kfGVufDB8MnwwfHx8MA%3D%3D',
  ]

  // GSAP animations on mount - only for decorative elements, not content
  useEffect(() => {
    const ctx = gsap.context(() => {
      // Decorative elements float
      gsap.to('.float-element', {
        y: -15,
        duration: 2,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
        stagger: 0.5,
      })

      // Scroll-triggered sections
      ScrollTrigger.batch('.animate-section', {
        onEnter: (elements) => {
          gsap.from(elements, {
            y: 40,
            opacity: 0,
            duration: 0.6,
            stagger: 0.1,
            ease: 'power2.out',
          })
        },
        start: 'top 85%',
      })
    }, heroRef)

    return () => ctx.revert()
  }, [])

  const handleRecipeClick = (recipe) => {
    navigate(`/recipe/${recipe.id}`)
  }

  return (
    <div className="min-h-screen bg-[var(--color-background)]">
      {/* Hero Section */}
      <section ref={heroRef} className="relative overflow-hidden bg-gradient-to-b from-[var(--color-background)] via-[var(--color-surface)] to-[var(--color-background)]">
        {/* Decorative background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="float-element absolute top-20 left-[10%] w-32 h-32 rounded-full bg-[var(--color-primary)]/5 blur-3xl" />
          <div className="float-element absolute top-40 right-[15%] w-40 h-40 rounded-full bg-[var(--color-secondary)]/5 blur-3xl" />
          <div className="float-element absolute bottom-10 left-[30%] w-24 h-24 rounded-full bg-[var(--color-accent)]/5 blur-2xl" />

          {/* Grain texture overlay */}
          <div className="absolute inset-0 opacity-30" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
            opacity: 0.03,
          }} />
        </div>

        <motion.div
          style={{ y: heroY, opacity: heroOpacity }}
          className="relative max-w-7xl mx-auto px-4 lg:px-8 pt-12 pb-16 lg:pt-20 lg:pb-24"
        >
          {/* Content wrapper - split layout for desktop */}
          <div className="flex flex-col lg:flex-row items-start lg:items-center gap-8 lg:gap-12">
            {/* Left: Text content */}
            <div className="flex-1 max-w-2xl">
              {/* Greeting */}
              <div className="hero-text mb-4">
                <Badge variant="accent" size="lg" dot>
                  {greeting}
                </Badge>
              </div>

              {/* Main heading */}
              <h1 className="hero-text font-display text-4xl lg:text-5xl xl:text-6xl font-bold text-[var(--color-text)] leading-tight mb-4 whitespace-nowrap">
                {isAuthenticated && user?.full_name
                  ? `Chào ${user.full_name?.split(' ')[0] || user.full_name}!`
                  : 'Hôm nay ăn gì?'}
              </h1>

              <p className="hero-text text-lg text-[var(--color-text-secondary)] mb-8 max-w-xl">
                {isAuthenticated
                  ? 'Khám phá những công thức phù hợp với tủ lạnh của bạn hoặc tạo món mới ngay!'
                  : 'Khám phá hàng ngàn công thức nấu ăn ngon, quản lý tủ lạnh thông minh và chia sẻ đam mê ẩm thực.'}
              </p>

              {/* Search bar */}
              <div className="hero-text mb-8">
                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    const formData = new FormData(e.target)
                    const query = formData.get('q')
                    if (query) navigate(`/explore?q=${encodeURIComponent(query)}`)
                  }}
                  className="relative w-full max-w-md"
                >
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-text-muted)]" />
                  <input
                    name="q"
                    type="search"
                    placeholder="Tìm công thức yêu thích..."
                    className="w-full h-14 pl-12 pr-24 rounded-[var(--radius-lg)] border-2 border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-primary)] focus:ring-4 focus:ring-[var(--color-primary)]/10 transition-all shadow-[var(--shadow-sm)]"
                  />
                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    className="absolute right-2 top-1/2 -translate-y-1/2"
                  >
                    Tìm kiếm
                  </Button>
                </form>
              </div>

              {/* Quick action buttons (guest only) */}
              {!isAuthenticated && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="hero-text flex flex-wrap gap-3"
                >
                  <Button
                    variant="primary"
                    size="lg"
                    onClick={() => navigate('/register')}
                    leftIcon={<Plus className="w-5 h-5" />}
                  >
                    Bắt đầu ngay
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => navigate('/explore')}
                    leftIcon={<UtensilsCrossed className="w-5 h-5" />}
                  >
                    Khám phá công thức
                  </Button>
                </motion.div>
              )}
            </div>

            {/* Right: Hero decorative image - visible for all users */}
            <HeroCarousel images={heroImages} />
          </div>
        </motion.div>
      </section>

      {/* Stats Bar (authenticated only) */}
      {isAuthenticated && (
        <StatsBar stats={statsValues} />
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 lg:px-8 py-12 space-y-16">
        {/* Quick Actions */}
        {isAuthenticated && (
          <section className="animate-section">
            <SectionHeading
              icon={Sparkles}
              title="Bắt đầu nấu"
              subtitle="Những việc bạn có thể làm ngay"
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <QuickActionCard
                icon={Plus}
                label="Tạo công thức"
                description="Chia sẻ món của bạn"
                color="primary"
                onClick={() => navigate('/recipe/new')}
              />
              <QuickActionCard
                icon={UtensilsCrossed}
                label="Quản lý tủ lạnh"
                description="Thêm nguyên liệu"
                color="secondary"
                onClick={() => navigate('/pantry')}
              />
              <QuickActionCard
                icon={ShoppingCart}
                label="Danh sách đi chợ"
                description="Mua sắm thông minh"
                color="accent"
                onClick={() => navigate('/shopping-list')}
              />
              <QuickActionCard
                icon={Lightbulb}
                label="Gợi ý món ăn"
                description="AI gợi ý cho bạn"
                color="primary"
                onClick={() => navigate('/suggest')}
              />
            </div>
          </section>
        )}

        {/* Suggestions Section */}
        {isAuthenticated && suggestions.length > 0 && (
          <section className="animate-section">
            <SectionHeading
              icon={Flame}
              title="Nấu ngay được luôn"
              subtitle="Những công thức phù hợp với tủ lạnh của bạn"
              actionLabel="Xem tất cả"
              onAction={() => navigate('/suggest')}
            />
            <RecipeCarousel
              recipes={suggestions.slice(0, 6)}
              isLoading={isSuggestionsLoading}
              onRecipeClick={handleRecipeClick}
            />
          </section>
        )}

        {/* Recent Recipes */}
        <section className="animate-section">
          <SectionHeading
            icon={Clock}
            title="Công thức mới"
            subtitle="Những công thức vừa được thêm gần đây"
            actionLabel="Khám phá thêm"
            onAction={() => navigate('/explore')}
          />
          <RecipeCarousel
            recipes={allRecipes.slice(0, 8)}
            isLoading={isAllRecipesLoading}
            onRecipeClick={handleRecipeClick}
          />
        </section>

        {/* Categories Preview */}
        <section className="animate-section">
          <SectionHeading
            icon={TrendingUp}
            title="Khám phá theo danh mục"
            subtitle="Tìm công thức theo sở thích"
          />
          <CategoriesSection />
        </section>

        {/* Guest CTA */}
        {!isAuthenticated && (
          <section className="animate-section">
            <div className="relative overflow-hidden bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-dark)] rounded-[var(--radius-xl)] p-8 lg:p-12">
              {/* Decorative elements */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />

              <div className="relative max-w-xl">
                <h2 className="font-display text-2xl lg:text-3xl font-bold text-white mb-4">
                  Sẵn sàng khám phá ẩm thực?
                </h2>
                <p className="text-white/80 text-lg mb-6">
                  Đăng ký ngay để lưu công thức yêu thích, quản lý tủ lạnh thông minh và nhận gợi ý món ăn personalized.
                </p>
                <div className="flex flex-wrap gap-3">
                  <Button
                    variant="accent"
                    size="lg"
                    onClick={() => navigate('/register')}
                    leftIcon={<Plus className="w-5 h-5" />}
                    className="bg-white text-[var(--color-primary)] hover:bg-white/90"
                  >
                    Đăng ký miễn phí
                  </Button>
                  <Button
                    variant="ghost"
                    size="lg"
                    onClick={() => navigate('/login')}
                    className="text-white border-2 border-white/30 hover:bg-white/10 hover:border-white/50"
                  >
                    Đăng nhập
                  </Button>
                </div>
              </div>
            </div>
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-[var(--color-border)] py-8 mt-16">
        <div className="max-w-7xl mx-auto px-4 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-[var(--radius-md)] bg-[var(--color-primary)] flex items-center justify-center">
                <ChefHat className="w-5 h-5 text-white" />
              </div>
              <span className="font-display text-lg font-semibold text-[var(--color-text)]">
                KitchenMate
              </span>
            </div>
            <p className="text-sm text-[var(--color-text-muted)]">
              © 2026 KitchenMate. Nấu ăn thông minh.
            </p>
          </div>
        </div>
      </footer>

      {/* Bottom padding for mobile nav */}
      <div className="lg:hidden h-20" />
    </div>
  )
}

// Categories section with API fetch and 3000ms timeout fallback (AC-10 compliance)
function CategoriesSection() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    // Promise.race with 3000ms timeout
    const categoryPromise = categoryApi.getCategories()
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('timeout')), 3000)
    )

    Promise.race([categoryPromise, timeoutPromise])
      .then(res => {
        // API returns { success, data: { count, next, previous, results } }
        setCategories(res.data?.results || [])
      })
      .catch(err => {
        console.error('Failed to load categories:', err)
        setCategories(FALLBACK_CATEGORIES)
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {[...Array(FALLBACK_CATEGORIES.length)].map((_, i) => (
          <div key={i} className="h-24 bg-[var(--color-surface)] animate-pulse rounded-[var(--radius-lg)]" />
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
      {categories.map(cat => (
        <button
          key={cat.id}
          onClick={() => navigate(`/explore?categories=${cat.slug}`)}
          className="flex flex-col items-center p-4 rounded-[var(--radius-lg)] bg-[var(--color-surface)] border border-[var(--color-border)] hover:border-[var(--color-primary)] transition-colors"
        >
          <span className="text-3xl mb-2">{getEmojiForCategory(cat.slug)}</span>
          <span className="text-sm font-medium text-[var(--color-text)]">{cat.name}</span>
        </button>
      ))}
    </div>
  )
}

export default HomePage
