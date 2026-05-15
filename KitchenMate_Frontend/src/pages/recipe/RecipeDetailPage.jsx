import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import {
  Clock, ChefHat, Heart, ArrowLeft, Play, Library,
  ChevronLeft, ChevronRight, X, Utensils, ShoppingBasket, Flag
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import { createPortal } from 'react-dom'

import { useRecipe } from '@/hooks/useRecipes'
import { useAddToShoppingList, useShoppingList, usePantry } from '@/hooks/useKitchen'
import { useAuth } from '@/components/auth/useAuth'
import { socialApi } from '@/api/socialApi'
import { Badge, Button, CategoryBadge, StarRatingDisplay } from '@/components/ui'
import { cn, buildIngredientUnitOptions } from '@/utils'
import { RecipeCard } from '@/components/recipe/RecipeCard'
import { AddToCollectionModal } from '@/components/social/AddToCollectionModal'
import { recipeApi } from '@/api/recipeApi'
import { ReviewsSection } from '@/components/recipe/ReviewsSection'
import { ReportModal } from '@/components/report/ReportModal'
import { adminApi } from '@/api/adminApi'

gsap.registerPlugin(ScrollTrigger)

const difficultyConfig = {
  EASY: { label: 'Dễ', variant: 'success' },
  MEDIUM: { label: 'Trung bình', variant: 'warning' },
  HARD: { label: 'Khó', variant: 'danger' },
}

function formatRating(rating) {
  if (!rating || rating === 0) return null
  return Number(rating).toFixed(1)
}

function HeroParallax({ imageUrl, title }) {
  const heroRef = useRef(null)
  const { scrollYProgress } = useScroll()
  const y = useTransform(scrollYProgress, [0, 0.5], [0, 100])

  useEffect(() => {
    if (!heroRef.current) return
    const ctx = gsap.context(() => {
      gsap.to('.hero-parallax-img', {
        y: 60,
        ease: 'none',
        scrollTrigger: {
          trigger: '.hero-section',
          start: 'top top',
          end: 'bottom top',
          scrub: true,
        },
      })
    }, heroRef)
    return () => ctx.revert()
  }, [])

  return (
    <section ref={heroRef} className="hero-section relative">
      {/* Decorative background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-amber-900/20 via-transparent to-[var(--color-background)] z-10 pointer-events-none" />

      {/* Main hero container */}
      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-0">
        {/* Floating back button */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="relative z-20 pt-4"
        >
          <button
            onClick={() => window.history.back()}
            className="flex items-center gap-2 text-[var(--color-text-secondary)] hover:text-[var(--color-text)] mb-4 transition-colors group"
          >
            <div className="w-8 h-8 rounded-full bg-[var(--color-surface)] shadow-[var(--shadow-md)] flex items-center justify-center group-hover:shadow-[var(--shadow-lg)] transition-shadow">
              <ArrowLeft className="w-4 h-4" />
            </div>
            <span className="text-sm font-medium">Quay lại</span>
          </button>
        </motion.div>

        {/* Image container with decorative frame */}
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.15, duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="relative"
        >
          {/* Decorative outer frame */}
          <div className="absolute -inset-3 bg-gradient-to-br from-[var(--color-primary)]/10 via-transparent to-[var(--color-secondary)]/10 rounded-[var(--radius-xl)] blur-sm" />

          {/* Inner decorative border */}
          <div className="absolute -inset-1.5 border-2 border-[var(--color-surface)]/20 rounded-[var(--radius-lg)] pointer-events-none" />

          {/* Main image container - 16:10 aspect ratio */}
          <div className="relative aspect-[16/10] rounded-[var(--radius-lg)] overflow-hidden shadow-[var(--shadow-xl)] bg-[var(--color-background-alt)]">
            {/* Subtle vignette overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent z-10 pointer-events-none" />

            {/* Image with proper contain */}
            <img
              src={imageUrl}
              alt={title}
              className="hero-parallax-img w-full h-full object-cover"
            />

            {/* Bottom fade for text readability if needed */}
            <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black/40 to-transparent z-10 pointer-events-none" />
          </div>

          {/* Floating accent element */}
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4, type: 'spring', stiffness: 200 }}
            className="absolute -bottom-3 -right-3 w-16 h-16 rounded-full bg-[var(--color-accent)] flex items-center justify-center shadow-[var(--shadow-lg)]"
          >
            <ChefHat className="w-8 h-8 text-white" />
          </motion.div>

          {/* Corner decoration */}
          <div className="absolute -top-2 -left-2 w-12 h-12 border-t-2 border-l-2 border-[var(--color-primary)]/30 rounded-tl-[var(--radius-md)]" />
        </motion.div>
      </div>

      {/* Parallax wrapper for scroll effect */}
      <motion.div
        style={{ y }}
        className="relative z-0 -mt-16 pointer-events-none"
      >
        <div className="h-16 bg-gradient-to-b from-transparent to-[var(--color-background)]" />
      </motion.div>
    </section>
  )
}

function AuthorInfo({ user }) {
  if (!user) return null
  return (
    <Link
      to={`/profile/${user.id}`}
      className="flex items-center gap-3 group"
    >
      {user.avatar ? (
        <img
          src={user.avatar}
          alt={user.full_name}
          className="w-10 h-10 rounded-full object-cover ring-2 ring-white/50"
        />
      ) : (
        <div className="w-10 h-10 rounded-full bg-[var(--color-primary)] text-white flex items-center justify-center text-lg font-medium">
          {user.full_name?.[0]?.toUpperCase() || '?'}
        </div>
      )}
      <div>
        <p className="font-medium text-white group-hover:underline">{user.full_name}</p>
        <p className="text-sm text-white/70">Đăng vào {new Date().toLocaleDateString('vi-VN')}</p>
      </div>
    </Link>
  )
}

function MetaBadges({ prepTime, difficulty }) {
  const difficultyInfo = difficultyConfig[difficulty] || difficultyConfig.MEDIUM
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Badge variant={difficultyInfo.variant}>
        {difficultyInfo.label}
      </Badge>
      {prepTime && (
        <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--color-primary)]/80 backdrop-blur-sm text-white text-sm">
          <Clock className="w-4 h-4" />
          <span>{prepTime} phút</span>
        </span>
      )}
    </div>
  )
}

function RatingDisplay({ rating, reviewCount }) {
  const formattedRating = formatRating(rating)
  if (!formattedRating) return null
  return (
    <div className="flex items-center gap-2">
      <StarRatingDisplay value={Math.round(rating)} size="lg" />
      <span className="font-semibold text-lg text-[var(--color-accent)]">{formattedRating}</span>
      <span className="text-white/70">({reviewCount || 0} review)</span>
    </div>
  )
}

function IngredientList({ ingredients, onAddToShoppingList, shoppingIngredients = [], pantryIngredients = [] }) {
  const [addingIngredient, setAddingIngredient] = useState(null)
  const [editQuantity, setEditQuantity] = useState('')
  const [editUnit, setEditUnit] = useState('')
  const [availableUnits, setAvailableUnits] = useState([])
  const [isLoadingUnits, setIsLoadingUnits] = useState(false)

  // Create sets for fast lookup - check by ingredient id (recipe_ingredients has 'ingredient' field)
  const shoppingIds = new Set(shoppingIngredients.map(i => i.ingredient).filter(Boolean))
  const pantryIds = new Set(pantryIngredients.map(i => i.ingredient?.id || i.ingredient).filter(Boolean))

  const handleStartAdd = async (ing) => {
    setAddingIngredient(ing)
    setEditQuantity(String(ing.quantity || 1))
    setEditUnit('')
    setAvailableUnits([])
    setIsLoadingUnits(true)

    try {
      let unitData = null

      if (ing.allowed_units?.length) {
        unitData = {
          default_unit: ing.default_unit || null,
          allowed_units: ing.allowed_units,
        }
      } else {
        const response = await adminApi.getIngredientUnits(ing.ingredient)
        unitData = response?.data || null
      }

      const { options, defaultValue } = buildIngredientUnitOptions(unitData)
      setAvailableUnits(options)
      setEditUnit(defaultValue)
    } catch {
      setAvailableUnits([])
      setEditUnit('')
    } finally {
      setIsLoadingUnits(false)
    }
  }

  const handleCancelAdd = () => {
    setAddingIngredient(null)
    setEditQuantity('')
    setEditUnit('')
    setAvailableUnits([])
    setIsLoadingUnits(false)
  }

  const handleConfirmAdd = () => {
    const qty = parseFloat(editQuantity)
    if (qty > 0 && addingIngredient && editUnit) {
      onAddToShoppingList(addingIngredient, qty, editUnit)
    }
    handleCancelAdd()
  }

  if (!ingredients?.length) return null

  return (
    <div className="bg-[var(--color-surface)] rounded-[var(--radius-lg)] p-6 border border-[var(--color-border)]">
      <h2 className="font-display text-xl font-semibold text-[var(--color-text)] mb-4 flex items-center gap-2">
        <Utensils className="w-5 h-5 text-[var(--color-primary)]" />
        Nguyên liệu
      </h2>
      <ul className="space-y-2">
        {ingredients.map((ing) => {
          // ing.ingredient is the ingredient id
          const inShoppingList = shoppingIds.has(ing.ingredient)
          const inPantry = pantryIds.has(ing.ingredient)
          const isAdded = inShoppingList || inPantry
          const unitLabel = ing.unit_display || ing.unit

          return (
            <li key={ing.id}>
              <div className="flex items-center gap-2">
                <div className="flex-1 flex items-center gap-3 p-3 rounded-[var(--radius-md)] bg-[var(--color-background-alt)]">
                  <span className="flex-1 text-[var(--color-text)]">
                    {ing.ingredient_name}
                  </span>
                  <span className="text-sm text-[var(--color-text-secondary)]">
                    {ing.quantity} {unitLabel}
                  </span>
                </div>
                {!isAdded && (
                  <button
                    onClick={() => handleStartAdd(ing)}
                    className="p-2 rounded-full hover:bg-[var(--color-accent)]/20 text-[var(--color-accent)] transition-colors flex-shrink-0"
                    title="Thêm vào danh sách đi chợ"
                  >
                    <ShoppingBasket className="w-5 h-5" />
                  </button>
                )}
                {isAdded && (
                  <span className="px-2 py-1 text-xs text-[var(--color-secondary)] bg-[var(--color-secondary)]/10 rounded-full">
                    {inShoppingList ? 'Đã thêm vào đi chợ' : 'Có trong tủ lạnh'}
                  </span>
                )}
              </div>
            </li>
          )
        })}
      </ul>

      {/* Add ingredient popup */}
      <AnimatePresence>
        {addingIngredient && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
              onClick={handleCancelAdd}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-[var(--color-surface)] rounded-t-[2rem] p-6 pb-8 shadow-[var(--shadow-xl)]"
            >
              <div className="w-12 h-1 bg-[var(--color-border)] rounded-full mx-auto mb-4" />
              <h3 className="font-display text-lg font-semibold text-[var(--color-text)] mb-4 text-center">
                Thêm vào danh sách đi chợ
              </h3>
              <div className="bg-[var(--color-background-alt)] rounded-[var(--radius-lg)] p-4 mb-4">
                <p className="font-medium text-[var(--color-text)]">{addingIngredient.ingredient_name}</p>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <label className="block text-sm text-[var(--color-text-secondary)] mb-1">Số lượng</label>
                  <input
                    type="number"
                    value={editQuantity}
                    onChange={(e) => setEditQuantity(e.target.value)}
                    min="0.1"
                    step="0.1"
                    className="w-full h-12 px-4 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] text-center text-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-sm text-[var(--color-text-secondary)] mb-1">Đơn vị</label>
                  <select
                    value={editUnit}
                    onChange={(e) => setEditUnit(e.target.value)}
                    disabled={isLoadingUnits || availableUnits.length === 0}
                    className="w-full h-12 px-4 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] text-center text-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoadingUnits ? (
                      <option value="">Đang tải đơn vị...</option>
                    ) : availableUnits.length === 0 ? (
                      <option value="">Chưa có đơn vị</option>
                    ) : (
                      availableUnits.map((u) => (
                        <option key={u.value} value={u.value}>{u.label}</option>
                      ))
                    )}
                  </select>
                </div>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1 h-12" onClick={handleCancelAdd}>
                  Hủy
                </Button>
                <Button variant="primary" className="flex-1 h-12" onClick={handleConfirmAdd} disabled={!editUnit || isLoadingUnits}>
                  Thêm
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

function StepsList({ steps }) {
  if (!steps?.length) return null

  return (
    <div className="bg-[var(--color-surface)] rounded-[var(--radius-lg)] p-6 border border-[var(--color-border)]">
      <h2 className="font-display text-xl font-semibold text-[var(--color-text)] mb-4 flex items-center gap-2">
        <ChefHat className="w-5 h-5 text-[var(--color-primary)]" />
        Các bước thực hiện
      </h2>
      <ol className="space-y-6">
        {steps.map((step) => (
          <li key={step.id} className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[var(--color-primary)] text-white flex items-center justify-center font-semibold text-sm">
              {step.step_number}
            </div>
            <div className="flex-1 pt-1">
              <p className="text-[var(--color-text)] leading-relaxed">{step.instruction}</p>
              {step.media_url && (
                <img
                  src={step.media_url}
                  alt={`Bước ${step.step_number}`}
                  className="mt-3 rounded-[var(--radius-md)] w-full max-w-md"
                />
              )}
            </div>
          </li>
        ))}
      </ol>
    </div>
  )
}

function RelatedRecipesCarousel({ categoryIds }) {
  const [recipes, setRecipes] = useState([])
  const scrollRef = useRef(null)

  useEffect(() => {
    if (!categoryIds?.length) return
    const fetchRelated = async () => {
      try {
        const categoryId = categoryIds[0]
        const response = await recipeApi.getRecipes({ category: categoryId, page_size: 6 })
        const results = response.data?.results || []
        setRecipes(results.slice(0, 5))
      } catch (err) {
        console.warn('Failed to fetch related recipes:', err)
      }
    }
    fetchRelated()
  }, [categoryIds])

  const scroll = (direction) => {
    if (!scrollRef.current) return
    const scrollAmount = 320
    scrollRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    })
  }

  if (recipes.length === 0) return null

  return (
    <section className="mt-12">
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-display text-xl font-semibold text-[var(--color-text)]">
          Công thức liên quan
        </h2>
        <div className="flex gap-2">
          <button
            onClick={() => scroll('left')}
            className="p-2 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] hover:bg-[var(--color-background-alt)] transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => scroll('right')}
            className="p-2 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] hover:bg-[var(--color-background-alt)] transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scroll-smooth"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {recipes.map((recipe) => (
          <div key={recipe.id} className="snap-start flex-shrink-0 w-72">
            <RecipeCard
              recipe={{
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
              }}
              onClick={() => {}}
            />
          </div>
        ))}
      </div>
    </section>
  )
}

function CookModeOverlay({ recipe, isOpen, onClose }) {
  const [currentStep, setCurrentStep] = useState(0)
  const startX = useRef(0)
  const steps = recipe?.steps || []
  const ingredients = recipe?.recipe_ingredients || []

  useEffect(() => {
    if (isOpen) {
      let isActive = true
      queueMicrotask(() => {
        if (isActive) {
          setCurrentStep(0)
        }
      })
      document.body.style.overflow = 'hidden'
      return () => {
        isActive = false
        document.body.style.overflow = ''
      }
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    let wakeLock = null
    const requestWakeLock = async () => {
      if ('wakeLock' in navigator) {
        try {
          wakeLock = await navigator.wakeLock.request('screen')
        } catch (err) {
          console.warn('Wake Lock not supported:', err)
        }
      }
    }
    requestWakeLock()
    return () => {
      if (wakeLock) {
        wakeLock.release()
      }
    }
  }, [isOpen])

  const goNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1)
    }
  }

  const goPrev = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1)
    }
  }

  const handlePointerDown = (e) => {
    startX.current = e.clientX
  }

  const handlePointerUp = (e) => {
    const delta = e.clientX - startX.current
    if (delta > 50) goPrev()
    if (delta < -50) goNext()
  }

  if (!isOpen) return null

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-[var(--color-dark-bg)] flex flex-col"
    >
      <header className="flex items-center justify-between p-4 border-b border-[var(--color-dark-border)]">
        <button
          onClick={onClose}
          className="flex items-center gap-2 text-[var(--color-dark-text)] hover:text-[var(--color-accent)] transition-colors"
        >
          <X className="w-6 h-6" />
          <span>Thoát</span>
        </button>
        <span className="text-[var(--color-dark-text-secondary)] text-sm">
          Bước {currentStep + 1} / {steps.length}
        </span>
        <div className="w-20" />
      </header>

      <div className="flex-1 flex overflow-hidden">
        <main
          className="flex-1 flex flex-col items-center justify-center p-8 cursor-pointer"
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
        >
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="max-w-2xl text-center"
          >
            <div className="w-16 h-16 rounded-full bg-[var(--color-primary)] text-white flex items-center justify-center text-2xl font-bold mx-auto mb-6">
              {steps[currentStep]?.step_number}
            </div>
            <p className="text-2xl md:text-3xl text-[var(--color-dark-text)] leading-relaxed font-body">
              {steps[currentStep]?.instruction}
            </p>
            {steps[currentStep]?.media_url && (
              <img
                src={steps[currentStep].media_url}
                alt={`Bước ${steps[currentStep].step_number}`}
                className="mt-6 rounded-[var(--radius-lg)] max-w-md mx-auto"
              />
            )}
          </motion.div>

          <div className="flex gap-4 mt-8">
            <button
              onClick={goPrev}
              disabled={currentStep === 0}
              className="p-4 rounded-full bg-[var(--color-dark-surface)] text-[var(--color-dark-text)] disabled:opacity-30 hover:bg-[var(--color-dark-border)] transition-colors"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={goNext}
              disabled={currentStep === steps.length - 1}
              className="p-4 rounded-full bg-[var(--color-primary)] text-white disabled:opacity-30 hover:bg-[var(--color-primary-light)] transition-colors"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>

          <p className="mt-6 text-[var(--color-dark-text-secondary)] text-sm">
            ← Vuốt để chuyển bước →
          </p>
        </main>

        <aside className="hidden md:flex w-72 flex-col border-l border-[var(--color-dark-border)] p-4 overflow-y-auto">
          <h3 className="font-display text-lg font-semibold text-[var(--color-dark-text)] mb-4">
            Nguyên liệu
          </h3>
          <ul className="space-y-2">
            {ingredients.map((ing) => (
              <li key={ing.id} className="text-sm text-[var(--color-dark-text-secondary)]">
                <span className="text-[var(--color-dark-text)]">{ing.ingredient_name}</span>
                <span className="ml-1">
                  - {ing.quantity} {ing.unit_display || ing.unit}
                </span>
              </li>
            ))}
          </ul>
        </aside>
      </div>

      <div className="p-4 border-t border-[var(--color-dark-border)]">
        <div className="flex justify-center gap-2">
          {steps.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentStep(i)}
              className={cn(
                'w-2 h-2 rounded-full transition-colors',
                i === currentStep ? 'bg-[var(--color-primary)]' : 'bg-[var(--color-dark-border)]'
              )}
            />
          ))}
        </div>
      </div>
    </motion.div>,
    document.body
  )
}

export function RecipeDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [isCookMode, setIsCookMode] = useState(false)
  const [showCollectionModal, setShowCollectionModal] = useState(false)
  const [showReportModal, setShowReportModal] = useState(false)

  const { data, isLoading, error } = useRecipe(id)
  const addToShoppingList = useAddToShoppingList()
  const { data: shoppingData } = useShoppingList()
  const { data: pantryData } = usePantry()
  const { isAuthenticated } = useAuth()

  const recipe = data?.data
  const shoppingIngredients = shoppingData?.data?.results || []
  const pantryIngredients = pantryData?.data?.results || []

  const handleFavorite = async () => {
    if (!isAuthenticated) {
      // GuestCTA handled in RecipeCard context
      return
    }
    try {
      const res = await socialApi.toggleFavorite(id)
      toast.success(res.is_favorited ? 'Đã thêm vào Yêu thích' : 'Đã xóa khỏi Yêu thích')
    } catch {
      toast.error('Không thể cập nhật yêu thích')
    }
  }

  const handleAddToShoppingList = async (ingredient, quantity, unit) => {
    try {
      await addToShoppingList.mutateAsync({
        ingredient: ingredient.ingredient, // ingredient id from recipe_ingredient
        ingredient_name: ingredient.ingredient_name,
        quantity: quantity,
        unit: unit,
      })
      toast.success(`Đã thêm "${ingredient.ingredient_name}" vào danh sách đi chợ`)
    } catch {
      toast.error('Không thể thêm vào danh sách đi chợ. Vui lòng thử lại.')
    }
  }

  const categoryIds = recipe?.categories?.map(c => c.id) || []

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--color-background)] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[var(--color-border)] border-t-[var(--color-primary)] rounded-full animate-spin" />
          <p className="text-[var(--color-text-secondary)]">Đang tải công thức...</p>
        </div>
      </div>
    )
  }

  if (error || !recipe) {
    return (
      <div className="min-h-screen bg-[var(--color-background)] flex items-center justify-center">
        <div className="text-center">
          <h1 className="font-display text-2xl font-semibold text-[var(--color-text)] mb-2">
            Công thức không tìm thấy
          </h1>
          <p className="text-[var(--color-text-secondary)] mb-4">
            Có thể công thức đã bị xóa hoặc không tồn tại.
          </p>
          <button
            onClick={() => navigate('/explore')}
            className="px-6 py-3 rounded-[var(--radius-md)] bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-light)] transition-colors"
          >
            Khám phá công thức khác
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--color-background)]">
      <HeroParallax imageUrl={recipe.thumbnail_url} title={recipe.title} />

      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 relative z-20">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-[var(--color-surface)] rounded-[var(--radius-xl)] shadow-[var(--shadow-xl)] p-6 md:p-8"
        >
          <header className="mb-6">
            {recipe.categories?.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {recipe.categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => navigate(`/explore?categories=${cat.slug}`)}
                    className="transition-colors duration-200 cursor-pointer hover:opacity-80"
                  >
                    <CategoryBadge category={cat} size="md" />
                  </button>
                ))}
              </div>
            )}

            <h1 className="font-display text-3xl md:text-4xl font-semibold text-[var(--color-text)] mb-4">
              {recipe.title}
            </h1>

            <p className="text-lg text-[var(--color-text-secondary)] mb-6">
              {recipe.description}
            </p>

            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <AuthorInfo user={recipe.user} />
              <RatingDisplay rating={recipe.avg_rating} reviewCount={0} />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <MetaBadges prepTime={recipe.prep_time} difficulty={recipe.difficulty} />
            </div>
          </header>

          <div className="flex flex-wrap gap-3 mb-8 border-t border-b border-[var(--color-border)] py-4">
            <button
              onClick={handleFavorite}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-full border transition-colors',
                recipe.is_favorited
                  ? 'border-red-300 bg-red-50 hover:bg-red-100 text-red-500'
                  : 'border-[var(--color-border)] hover:bg-[var(--color-background-alt)]'
              )}
            >
              <Heart className={cn('w-5 h-5', recipe.is_favorited && 'fill-current')} />
              <span>{recipe.is_favorited ? 'Đã lưu' : 'Lưu'}</span>
              {recipe.like_count > 0 && (
                <span className="ml-1 text-sm">({recipe.like_count})</span>
              )}
            </button>
            <button
              onClick={() => setShowCollectionModal(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-full border border-[var(--color-border)] hover:bg-[var(--color-background-alt)] transition-colors"
            >
              <Library className="w-5 h-5" />
              <span>Lưu vào danh sách</span>
            </button>
            <button
              onClick={() => setIsCookMode(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--color-secondary)] text-white hover:bg-[var(--color-secondary-light)] transition-colors"
            >
              <Play className="w-5 h-5" />
              <span>Chế độ nấu</span>
            </button>
            <button
              onClick={() => setShowReportModal(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-full border border-[var(--color-border)] hover:bg-[var(--color-background-alt)] transition-colors text-red-500"
            >
              <Flag className="w-5 h-5" />
              <span>Báo cáo</span>
            </button>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="md:col-span-1">
              <IngredientList ingredients={recipe.recipe_ingredients} onAddToShoppingList={handleAddToShoppingList} shoppingIngredients={shoppingIngredients} pantryIngredients={pantryIngredients} />
            </div>
            <div className="md:col-span-2">
              <StepsList steps={recipe.steps} />
            </div>
          </div>

          <div className="mt-8">
            <ReviewsSection recipeId={recipe.id} />
          </div>
        </motion.div>

        <RelatedRecipesCarousel categoryIds={categoryIds} />
      </article>

      <CookModeOverlay
        recipe={recipe}
        isOpen={isCookMode}
        onClose={() => setIsCookMode(false)}
      />

      <AddToCollectionModal
        isOpen={showCollectionModal}
        onClose={() => setShowCollectionModal(false)}
        recipeId={id}
      />

      <ReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        targetType="recipe"
        targetId={id}
        targetLabel={recipe?.title}
      />

      <div className="h-20 lg:h-0" />
    </div>
  )
}

export default RecipeDetailPage
