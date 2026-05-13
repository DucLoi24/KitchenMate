import { useState, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { suggestionApi } from '@/api/suggestionApi'
import { shoppingListApi, pantryApi } from '@/api/kitchenApi'
import { socialApi } from '@/api/socialApi'
import { useAuth } from '@/components/auth/useAuth'
import { GuestCTA } from '@/components/auth/GuestCTA'
import { AddToCollectionModal } from '@/components/social/AddToCollectionModal'
import { cn } from '@/utils'
import { Clock, Flame, Plus, X, AlertCircle, ShoppingCart, ChefHat, Search, Sparkles, Heart, Library } from 'lucide-react'

// Animation variants for staggered reveal
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
}

// Skeleton component for loading state
function RecipeSkeleton() {
  return (
    <div className="bg-[var(--color-surface)] rounded-[var(--radius-lg)] overflow-hidden animate-pulse">
      <div className="aspect-[16/10] bg-gradient-to-br from-[var(--color-border)] to-[var(--color-background-alt)]" />
      <div className="p-5 space-y-4">
        <div className="h-6 bg-[var(--color-border)] rounded-lg w-3/4" />
        <div className="h-4 bg-[var(--color-border)] rounded w-1/2" />
        <div className="flex gap-3">
          <div className="h-7 w-18 bg-[var(--color-border)] rounded-full" />
          <div className="h-7 w-22 bg-[var(--color-border)] rounded-full" />
        </div>
      </div>
    </div>
  )
}

// Segmented Control Component - Warm Kitchen aesthetic
function SegmentedControl({ mode, onModeChange }) {
  return (
    <div className="relative flex bg-[var(--color-background-alt)] rounded-full p-1.5 shadow-[inset_0_2px_4px_rgba(44,36,32,0.06)]">
      {/* Sliding background */}
      <motion.div
        className="absolute top-1.5 bottom-1.5 bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-dark)] rounded-full shadow-md"
        initial={false}
        animate={{ left: mode === 'COOK_NOW' ? '4px' : '50%', width: mode === 'COOK_NOW' ? 'calc(50% - 4px)' : 'calc(50% - 4px)' }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        style={{ width: 'calc(50% - 4px)' }}
      />
      <button
        onClick={() => onModeChange('COOK_NOW')}
        className="relative z-10 flex-1 py-2.5 px-5 rounded-full text-sm font-medium transition-colors duration-200 flex items-center justify-center gap-2"
      >
        {mode === 'COOK_NOW' ? (
          <Flame className="w-4 h-4" />
        ) : (
          <span className="text-[var(--color-text-secondary)]">Nấu ngay</span>
        )}
        {mode === 'COOK_NOW' && (
          <span className="text-white font-semibold">Nấu ngay</span>
        )}
      </button>
      <button
        onClick={() => onModeChange('ADD_MORE')}
        className="relative z-10 flex-1 py-2.5 px-5 rounded-full text-sm font-medium transition-colors duration-200 flex items-center justify-center gap-2"
      >
        {mode === 'ADD_MORE' ? (
          <Sparkles className="w-4 h-4" />
        ) : (
          <span className="text-[var(--color-text-secondary)]">Thêm chút nữa</span>
        )}
        {mode === 'ADD_MORE' && (
          <span className="text-white font-semibold">Thêm chút nữa</span>
        )}
      </button>
    </div>
  )
}

// Exclude Ingredients Filter Component
function ExcludeIngredientsFilter({ selected, onChange }) {
  const [searchText, setSearchText] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)

  const { data: searchResults } = useQuery({
    queryKey: ['ingredient-search', searchText],
    queryFn: async () => {
      if (searchText.length < 2) return []
      const { default: axiosInstance } = await import('@/lib/axiosInstance')
      const { data } = await axiosInstance.get('/ingredients/', { params: { search: searchText } })
      return data.results?.filter((ing) => !selected.includes(ing.id)) || []
    },
    enabled: searchText.length >= 2,
  })

  const handleSelect = (ingredient) => {
    onChange([...selected, ingredient])
    setSearchText('')
    setShowDropdown(false)
  }

  const handleRemove = (id) => {
    onChange(selected.filter((ingId) => ingId !== id))
  }

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" />
        <input
          type="text"
          value={searchText}
          onChange={(e) => {
            setSearchText(e.target.value)
            setShowDropdown(true)
          }}
          onFocus={() => setShowDropdown(true)}
          onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
          placeholder="Loại trừ nguyên liệu bạn không muốn nấu..."
          className="w-full pl-12 pr-4 py-3 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-lg)] text-sm focus:outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 transition-all"
        />
        {showDropdown && searchResults?.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-lg)] shadow-lg z-20 max-h-56 overflow-y-auto">
            {searchResults.map((ing) => (
              <button
                key={ing.id}
                onMouseDown={() => handleSelect(ing)}
                className="w-full px-4 py-3 text-left text-sm hover:bg-[var(--color-background-alt)] flex items-center justify-between transition-colors"
              >
                <span className="font-medium">{ing.name}</span>
                <span className="text-xs text-[var(--color-text-muted)] px-2 py-0.5 bg-[var(--color-background-alt)] rounded-full">{ing.category_display}</span>
              </button>
            ))}
          </div>
        )}
      </div>
      {selected.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-wrap gap-2"
        >
          {selected.map((id, index) => {
            const ing = searchResults?.find((r) => r.id === id)
            return (
              <motion.span
                key={id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.03 }}
                className="inline-flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-[var(--color-accent-light)] to-[var(--color-accent)] text-[var(--color-accent-dark)] rounded-full text-sm font-medium shadow-sm"
              >
                {ing?.name || `ID: ${id}`}
                <button
                  onClick={() => handleRemove(id)}
                  className="hover:bg-[var(--color-accent-dark)]/20 rounded-full p-0.5 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </motion.span>
            )
          })}
        </motion.div>
      )}
    </div>
  )
}

// Suggestion Recipe Card (custom card with score badge)
function SuggestionRecipeCard({ recipe, score, missingIngredients, onClick }) {
  const { isAuthenticated } = useAuth()
  const [showGuestCTA, setShowGuestCTA] = useState(false)
  const [showCollectionModal, setShowCollectionModal] = useState(false)
  const [favorited, setFavorited] = useState(!!recipe.is_favorited)
  const [inCollection] = useState(!!recipe.is_in_collection)
  const debounceRef = useRef(null)

  const handleFavoriteToggle = useCallback(async (e) => {
    e.stopPropagation()
    if (debounceRef.current) return
    debounceRef.current = setTimeout(() => { debounceRef.current = null }, 300)

    if (!isAuthenticated) {
      setShowGuestCTA(true)
      return
    }

    const prev = favorited
    setFavorited(!prev)

    try {
      const res = await socialApi.toggleFavorite(recipe.id)
      setFavorited(res.is_favorited)
    } catch {
      setFavorited(prev)
    }
  }, [isAuthenticated, favorited, recipe.id])

  const handleCollectionToggle = useCallback((e) => {
    e.stopPropagation()
    if (!isAuthenticated) {
      setShowGuestCTA(true)
      return
    }
    setShowCollectionModal(true)
  }, [isAuthenticated])

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
        whileHover={{ y: -8, transition: { duration: 0.2 } }}
        whileTap={{ scale: 0.98 }}
        onClick={onClick}
        className="group bg-[var(--color-surface)] rounded-[var(--radius-xl)] overflow-hidden cursor-pointer shadow-sm hover:shadow-xl transition-shadow duration-300"
      >
        <div className="aspect-[16/10] relative overflow-hidden">
          <img
            src={recipe.thumbnail_url || '/placeholder-recipe.jpg'}
            alt={recipe.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          {/* Action Buttons - Vertical Stack (top-right, below score badge) */}
          <div className="absolute top-3 right-3 flex flex-col gap-1">
            {/* Favorite (Heart) + Count */}
            <div className="flex flex-col items-center">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleFavoriteToggle}
                className="w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-[var(--shadow-sm)] hover:bg-white transition-colors"
              >
                <Heart
                  className={cn(
                    'w-4 h-4 transition-colors',
                    favorited ? 'fill-red-500 text-red-500' : 'text-gray-400 hover:text-red-500'
                  )}
                />
              </motion.button>
              {recipe.like_count > 0 && (
                <span className="text-xs text-white mt-0.5">{recipe.like_count}</span>
              )}
            </div>

            {/* Collection + Count */}
            <div className="flex flex-col items-center">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleCollectionToggle}
                className="w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-[var(--shadow-sm)] hover:bg-white transition-colors"
              >
                <Library
                  className={cn(
                    'w-4 h-4 transition-colors',
                    inCollection ? 'fill-yellow-500 text-yellow-500' : 'text-gray-400 hover:text-yellow-500'
                  )}
                />
              </motion.button>
              {recipe.save_count > 0 && (
                <span className="text-xs text-white mt-0.5">{recipe.save_count}</span>
              )}
            </div>
          </div>

          {/* Score badge (left side) */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 300 }}
            className="absolute bottom-3 left-3 px-3 py-1.5 bg-gradient-to-br from-[var(--color-accent)] to-[var(--color-accent-dark)] text-white rounded-full text-sm font-bold shadow-lg flex items-center gap-1"
          >
            <Sparkles className="w-3.5 h-3.5" />
            +{score}
          </motion.div>
        </div>
        <div className="p-5">
          <h3 className="font-display text-[var(--color-text)] font-semibold text-lg leading-snug line-clamp-2 group-hover:text-[var(--color-primary)] transition-colors">
            {recipe.title}
          </h3>
          <div className="mt-3 flex items-center gap-3 text-sm text-[var(--color-text-secondary)]">
            <span className="flex items-center gap-1.5 px-3 py-1 bg-[var(--color-background-alt)] rounded-full">
              <Clock className="w-4 h-4 text-[var(--color-primary)]" />
              <span className="font-medium">{recipe.prep_time || 0}</span>
              <span className="text-[var(--color-text-muted)]">phút</span>
            </span>
          </div>
          {missingIngredients.length > 0 && (
            <div className="mt-3 flex items-center gap-2">
              <span className="text-xs px-2.5 py-1 bg-[var(--color-background-alt)] rounded-full border border-[var(--color-border)]">
                Thiếu <span className="font-semibold text-[var(--color-primary)]">{missingIngredients.length}</span> nguyên liệu
              </span>
            </div>
          )}
        </div>
      </motion.div>

      {/* Guest CTA Modal */}
      {showGuestCTA && (
        <GuestCTA
          context="collections"
          onClose={() => setShowGuestCTA(false)}
        />
      )}

      {/* Add to Collection Modal */}
      <AddToCollectionModal
        isOpen={showCollectionModal}
        onClose={() => setShowCollectionModal(false)}
        recipeId={recipe.id}
      />
    </>
  )
}

// Bottom Sheet Preview Component
function RecipeBottomSheet({ recipe, score, missingIngredients, onClose, onViewDetails, onAddToShopping }) {
  if (!recipe) return null

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        onWheel={(e) => e.stopPropagation()}
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[70]"
      />
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        onWheel={(e) => e.stopPropagation()}
        className="fixed inset-4 md:inset-8 lg:inset-16 bg-[var(--color-surface)] rounded-[var(--radius-xl)] shadow-2xl z-[70] flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="flex-shrink-0 px-6 py-4 flex items-center justify-between border-b border-[var(--color-border)]">
          <div />
          <h2 className="font-display text-xl font-semibold">Chi tiết công thức</h2>
          <button onClick={onClose} className="p-2.5 hover:bg-[var(--color-background-alt)] rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {/* Two-column layout: image left, content right on desktop */}
          <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
            {/* Left: Image (45% width on desktop) */}
            <div className="lg:w-[45%] flex-shrink-0">
              <div className="relative">
                <img
                  src={recipe.thumbnail_url || '/placeholder-recipe.jpg'}
                  alt={recipe.title}
                  className="w-full aspect-[4/3] rounded-[var(--radius-lg)] object-cover shadow-lg"
                />
                <div className="absolute top-4 right-4 px-4 py-2 bg-gradient-to-br from-[var(--color-accent)] to-[var(--color-accent-dark)] text-white rounded-full text-sm font-bold shadow-lg flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4" />
                  +{score} điểm
                </div>
              </div>
            </div>

            {/* Right: Content (55% width on desktop) */}
            <div className="lg:w-[55%] space-y-5">

          <div>
            <h3 className="font-display text-2xl font-semibold leading-tight">{recipe.title}</h3>
            <div className="flex items-center gap-4 mt-4 text-sm">
              <span className="flex items-center gap-2 px-4 py-2 bg-[var(--color-background-alt)] rounded-full">
                <Clock className="w-4 h-4 text-[var(--color-primary)]" />
                <span className="font-semibold">{recipe.prep_time || 0}</span>
                <span className="text-[var(--color-text-muted)]">phút</span>
              </span>
            </div>
          </div>

          {recipe.description && (
            <p className="text-[var(--color-text-secondary)] leading-relaxed">{recipe.description}</p>
          )}

          {recipe.categories?.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {recipe.categories.map((cat) => (
                <span key={cat.id} className="px-3 py-1 bg-[var(--color-secondary)]/10 text-[var(--color-secondary)] rounded-full text-sm">
                  {cat.name}
                </span>
              ))}
            </div>
          )}

          {recipe.recipe_ingredients?.length > 0 && (
            <div>
              <h4 className="font-display font-semibold text-sm mb-3 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-primary)]" />
                Nguyên liệu
              </h4>
              <ul className="space-y-2">
                {recipe.recipe_ingredients.slice(0, 8).map((ing) => (
                  <li key={ing.id} className="text-sm flex items-center gap-3 p-2 bg-[var(--color-background-alt)] rounded-lg">
                    <span className="w-2 h-2 rounded-full bg-[var(--color-border-strong)]" />
                    <span className="flex-1 font-medium">{ing.ingredient_name}</span>
                    <span className="text-[var(--color-text-secondary)]">{ing.quantity} {ing.unit}</span>
                  </li>
                ))}
                {recipe.recipe_ingredients.length > 8 && (
                  <li className="text-sm text-[var(--color-text-muted)] pl-5">
                    và {recipe.recipe_ingredients.length - 8} nguyên liệu khác
                  </li>
                )}
              </ul>
            </div>
          )}

          {missingIngredients.length > 0 && (
            <div>
              <h4 className="font-display font-semibold text-sm mb-3 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent)]" />
                Nguyên liệu còn thiếu
              </h4>
              <ul className="space-y-2">
                {missingIngredients.map((ing) => (
                  <li key={ing.id} className="text-sm flex items-center gap-3 p-2 bg-[var(--color-accent)]/5 rounded-lg border border-[var(--color-accent)]/20">
                    <span className="w-2 h-2 rounded-full bg-[var(--color-accent)]" />
                    <span className="flex-1 font-medium">{ing.name}</span>
                    <span className="text-xs px-2 py-0.5 bg-[var(--color-accent)]/20 text-[var(--color-accent-dark)] rounded-full">{ing.category}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {recipe.steps?.length > 0 && (
            <div>
              <h4 className="font-display font-semibold text-sm mb-3 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-secondary)]" />
                Các bước thực hiện
              </h4>
              <ol className="space-y-3">
                {recipe.steps.map((step) => (
                  <li key={step.id} className="flex gap-3 p-3 bg-[var(--color-background-alt)] rounded-lg">
                    <span className="flex-shrink-0 w-6 h-6 bg-[var(--color-secondary)] text-white rounded-full flex items-center justify-center text-xs font-bold">
                      {step.step_number}
                    </span>
                    <span className="text-sm leading-relaxed">{step.instruction}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-[var(--color-border)] flex gap-4 bg-[var(--color-background)] flex-shrink-0">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onViewDetails}
            className="flex-1 py-4 px-6 bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-dark)] text-white rounded-[var(--radius-lg)] font-semibold shadow-lg hover:shadow-xl transition-shadow flex items-center justify-center gap-2"
          >
            <ChefHat className="w-5 h-5" />
            Xem chi tiết
          </motion.button>
          {missingIngredients.length > 0 && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onAddToShopping}
              className="flex-1 py-4 px-6 bg-gradient-to-r from-[var(--color-secondary)] to-[var(--color-secondary-dark)] text-white rounded-[var(--radius-lg)] font-semibold shadow-lg hover:shadow-xl transition-shadow flex items-center justify-center gap-2"
            >
              <ShoppingCart className="w-5 h-5" />
              Thêm vào shopping
            </motion.button>
          )}
        </div>
      </motion.div>
    </>
  )
}

// Add to Shopping Modal Component
function AddToShoppingModal({ missingIngredients, onClose, onSuccess }) {
  const [items, setItems] = useState(
    missingIngredients.map((ing) => ({
      ingredient_id: ing.id,
      name: ing.name,
      quantity: '',
      unit: 'g',
    }))
  )
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const units = ['g', 'kg', 'ml', 'l', 'tsp', 'tbsp', 'cup', 'quả', 'cái', 'gói']

  const handleQuantityChange = (index, value) => {
    const newItems = [...items]
    newItems[index].quantity = value
    setItems(newItems)
    setError('')
  }

  const handleUnitChange = (index, unit) => {
    const newItems = [...items]
    newItems[index].unit = unit
    setItems(newItems)
  }

  const handleSubmit = async () => {
    const validItems = items.filter((item) => parseFloat(item.quantity) > 0)
    if (validItems.length === 0) {
      setError('Vui lòng nhập số lượng cho ít nhất một nguyên liệu')
      return
    }

    setIsSubmitting(true)
    try {
      await shoppingListApi.addToShoppingList({
        items: validItems.map((item) => ({
          ingredient_id: item.ingredient_id,
          quantity: parseFloat(item.quantity),
          unit: item.unit,
        })),
      })
      onSuccess()
    } catch {
      setError('Không thể thêm vào danh sách. Vui lòng thử lại.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="bg-[var(--color-surface)] rounded-[var(--radius-xl)] w-full max-w-md max-h-[80vh] overflow-hidden flex flex-col shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-6 border-b border-[var(--color-border)] flex items-center justify-between bg-gradient-to-r from-[var(--color-secondary)] to-[var(--color-secondary-light)]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <ShoppingCart className="w-5 h-5 text-white" />
              </div>
              <h2 className="font-display text-lg font-semibold text-white">Thêm vào danh sách mua sắm</h2>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full transition-colors">
              <X className="w-5 h-5 text-white" />
            </button>
          </div>

          <div className="p-6 overflow-y-auto flex-1 space-y-4">
            {items.map((item, index) => (
              <motion.div
                key={item.ingredient_id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center gap-4 p-4 bg-[var(--color-background-alt)] rounded-[var(--radius-lg)]"
              >
                <div className="w-2 h-2 rounded-full bg-[var(--color-secondary)]" />
                <span className="flex-1 font-semibold text-sm">{item.name}</span>
                <input
                  type="number"
                  value={item.quantity}
                  onChange={(e) => handleQuantityChange(index, e.target.value)}
                  placeholder="Số lượng"
                  min="0"
                  step="0.1"
                  className="w-24 px-4 py-2.5 bg-white border border-[var(--color-border)] rounded-[var(--radius-md)] text-sm focus:outline-none focus:border-[var(--color-secondary)] focus:ring-2 focus:ring-[var(--color-secondary)]/20"
                />
                <select
                  value={item.unit}
                  onChange={(e) => handleUnitChange(index, e.target.value)}
                  className="w-20 px-2 py-2.5 bg-white border border-[var(--color-border)] rounded-[var(--radius-md)] text-sm focus:outline-none focus:border-[var(--color-secondary)]"
                >
                  {units.map((u) => (
                    <option key={u} value={u}>{u}</option>
                  ))}
                </select>
              </motion.div>
            ))}
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mx-6 mb-4 p-3 bg-red-50 border border-red-200 rounded-[var(--radius-md)]"
            >
              <p className="text-sm text-red-600 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                {error}
              </p>
            </motion.div>
          )}

          <div className="p-6 border-t border-[var(--color-border)] flex gap-4 bg-[var(--color-background)]">
            <button
              onClick={onClose}
              className="flex-1 py-3.5 px-6 border-2 border-[var(--color-border)] rounded-[var(--radius-lg)] font-semibold hover:bg-[var(--color-background-alt)] transition-colors"
            >
              Hủy
            </button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex-1 py-3.5 px-6 bg-gradient-to-r from-[var(--color-secondary)] to-[var(--color-secondary-dark)] text-white rounded-[var(--radius-lg)] font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Đang thêm...
                </>
              ) : (
                <>
                  <Plus className="w-5 h-5" />
                  Thêm vào danh sách
                </>
              )}
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

// Empty State Component
function EmptyState({ onGoToPantry }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col items-center justify-center min-h-[70vh] px-4 text-center"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', delay: 0.2 }}
        className="w-28 h-28 bg-gradient-to-br from-[var(--color-primary)]/10 to-[var(--color-accent)]/10 rounded-full flex items-center justify-center mb-8"
      >
        <ChefHat className="w-14 h-14 text-[var(--color-primary)]" />
      </motion.div>
      <h3 className="font-display text-3xl font-semibold mb-4">Tủ lạnh trống</h3>
      <p className="text-[var(--color-text-secondary)] text-lg mb-8 max-w-md leading-relaxed">
        Thêm nguyên liệu vào tủ lạnh để nhận gợi ý món ăn phù hợp với bạn
      </p>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onGoToPantry}
        className="px-8 py-4 bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-dark)] text-white rounded-[var(--radius-lg)] font-semibold shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
      >
        <span>Đến tủ lạnh</span>
      </motion.button>
    </motion.div>
  )
}

// Error State Component
function ErrorState({ onRetry }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center min-h-[70vh] px-4 text-center"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', delay: 0.2 }}
        className="w-28 h-28 bg-red-50 rounded-full flex items-center justify-center mb-8"
      >
        <AlertCircle className="w-14 h-14 text-red-500" />
      </motion.div>
      <h3 className="font-display text-3xl font-semibold mb-4">Không thể tải gợi ý</h3>
      <p className="text-[var(--color-text-secondary)] text-lg mb-8 max-w-md">
        Đã xảy ra lỗi khi tải dữ liệu. Vui lòng thử lại.
      </p>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onRetry}
        className="px-8 py-4 bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-dark)] text-white rounded-[var(--radius-lg)] font-semibold shadow-lg hover:shadow-xl transition-all"
      >
        Thử lại
      </motion.button>
    </motion.div>
  )
}

// No Results State Component
function NoResultsState({ currentMode, onSwitchMode }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center min-h-[70vh] px-4 text-center"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', delay: 0.2 }}
        className="w-28 h-28 bg-[var(--color-accent)]/10 rounded-full flex items-center justify-center mb-8"
      >
        <Search className="w-14 h-14 text-[var(--color-accent)]" />
      </motion.div>
      <h3 className="font-display text-3xl font-semibold mb-4">Không tìm thấy công thức</h3>
      <p className="text-[var(--color-text-secondary)] text-lg mb-8 max-w-md">
        Không có công thức nào phù hợp với bộ lọc hiện tại
      </p>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onSwitchMode}
        className="px-8 py-4 bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-dark)] text-white rounded-[var(--radius-lg)] font-semibold shadow-lg hover:shadow-xl transition-all"
      >
        Thử chế độ '{currentMode === 'COOK_NOW' ? 'Thêm chút nữa' : 'Nấu ngay'}'
      </motion.button>
    </motion.div>
  )
}

// Page Header Banner Component
function PageHeader({ mode }) {
  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-[var(--color-primary)]/5 via-[var(--color-accent)]/5 to-[var(--color-secondary)]/5 rounded-[var(--radius-xl)] p-6 mb-6">
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[var(--color-accent)]/20 to-transparent rounded-full blur-2xl" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-[var(--color-primary)]/20 to-transparent rounded-full blur-2xl" />
      <div className="relative z-10">
        <h1 className="font-display text-3xl font-semibold mb-2">Gợi ý món ăn</h1>
        <p className="text-[var(--color-text-secondary)]">
          {mode === 'COOK_NOW'
            ? 'Những công thức bạn có thể nấu ngay với nguyên liệu hiện có'
            : 'Khám phá thêm công thức với một vài nguyên liệu cần thêm'}
        </p>
      </div>
    </div>
  )
}

// Main SuggestionPage Component
export default function SuggestionPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  // Filter states - backend only supports mode and exclude_ingredients
  // TODO: Backend needs enhancement for cook_time, categories, and pagination support
  const [mode, setMode] = useState('COOK_NOW')
  const [excludeIngredients, setExcludeIngredients] = useState([])

  // UI states
  const [selectedRecipe, setSelectedRecipe] = useState(null)
  const [showAddToShopping, setShowAddToShopping] = useState(false)

  // Fetch suggestions
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['suggestions', mode, excludeIngredients],
    queryFn: () =>
      suggestionApi.getSuggestions(mode, excludeIngredients),
    placeholderData: (prev) => prev,
  })

  // Fetch pantry to check if empty
  const { data: pantryData } = useQuery({
    queryKey: ['pantry'],
    queryFn: () => pantryApi.getPantry(),
  })

  const recipes = data?.data || []

  const isPantryEmpty = !pantryData || pantryData.length === 0

  const handleModeChange = (newMode) => {
    setMode(newMode)
  }

  const handleExcludeIngredientsChange = (newExclude) => {
    setExcludeIngredients(newExclude)
  }

  const handleRecipeClick = (recipe, score, missing) => {
    setSelectedRecipe({ recipe, score, missing })
  }

  const handleCloseSheet = () => {
    setSelectedRecipe(null)
  }

  const handleViewDetails = () => {
    if (selectedRecipe) {
      navigate(`/recipe/${selectedRecipe.recipe.id}`)
      setSelectedRecipe(null)
    }
  }

  const handleAddToShopping = () => {
    setShowAddToShopping(true)
  }

  const handleAddToShoppingSuccess = () => {
    setShowAddToShopping(false)
    setSelectedRecipe(null)
    queryClient.invalidateQueries({ queryKey: ['shopping-list'] })
  }

  const handleSwitchMode = () => {
    setMode(mode === 'COOK_NOW' ? 'ADD_MORE' : 'COOK_NOW')
  }

  const handleGoToPantry = () => {
    navigate('/pantry')
  }

  // Determine which state to show
  if (isPantryEmpty && !isLoading) {
    return (
      <div className="min-h-screen">
        <EmptyState onGoToPantry={handleGoToPantry} />
      </div>
    )
  }

  if (isError && !isLoading) {
    return (
      <div className="min-h-screen">
        <ErrorState onRetry={refetch} />
      </div>
    )
  }

  if (!isLoading && recipes.length === 0) {
    return (
      <div className="min-h-screen">
        <NoResultsState currentMode={mode} onSwitchMode={handleSwitchMode} />
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen pb-24"
    >
      {/* Header */}
      <div className="px-4 pt-4">
        <PageHeader mode={mode} />

        {/* Segmented Control */}
        <div className="mb-5">
          <SegmentedControl mode={mode} onModeChange={handleModeChange} />
        </div>

        {/* Exclude Ingredients Filter */}
        <div className="mb-6">
          <h3 className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide mb-2">Loại trừ nguyên liệu</h3>
          <ExcludeIngredientsFilter
            selected={excludeIngredients}
            onChange={handleExcludeIngredientsChange}
          />
        </div>
      </div>

      {/* Recipe List */}
      <div className="px-4">
        {isLoading ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
          >
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <RecipeSkeleton key={i} />
            ))}
          </motion.div>
        ) : (
          <>
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
            >
              {recipes.map((item) => (
                <SuggestionRecipeCard
                  key={item.recipe.id}
                  recipe={item.recipe}
                  score={item.score}
                  missingIngredients={item.missing_ingredients}
                  onClick={() => handleRecipeClick(item.recipe, item.score, item.missing_ingredients)}
                />
              ))}
            </motion.div>
          </>
        )}
      </div>

      {/* Bottom Sheet */}
      <AnimatePresence>
        {selectedRecipe && (
          <RecipeBottomSheet
            recipe={selectedRecipe.recipe}
            score={selectedRecipe.score}
            missingIngredients={selectedRecipe.missing}
            onClose={handleCloseSheet}
            onViewDetails={handleViewDetails}
            onAddToShopping={handleAddToShopping}
          />
        )}
      </AnimatePresence>

      {/* Add to Shopping Modal */}
      <AnimatePresence>
        {showAddToShopping && selectedRecipe && (
          <AddToShoppingModal
            missingIngredients={selectedRecipe.missing}
            onClose={() => setShowAddToShopping(false)}
            onSuccess={handleAddToShoppingSuccess}
          />
        )}
      </AnimatePresence>
    </motion.div>
  )
}