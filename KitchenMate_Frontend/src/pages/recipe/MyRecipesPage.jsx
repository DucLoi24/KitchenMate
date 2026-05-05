import { useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Utensils, RefreshCw, Pencil, Lock, Globe } from 'lucide-react'
import toast from 'react-hot-toast'

import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { RecipeCard } from '@/components/recipe/RecipeCard'
import { useMyRecipes, useUpdateRecipe } from '@/hooks/useRecipes'
import recipeApi from '@/api/recipeApi'

const TABS = {
  ALL: { label: 'Tất cả', value: 'ALL' },
  PUBLIC: { label: 'Công khai', value: 'PUBLIC' },
  PRIVATE: { label: 'Riêng tư', value: 'PRIVATE' },
}

const visibilityConfig = {
  PRIVATE: { label: 'Riêng tư', variant: 'muted' },
  PENDING: { label: 'Đang chờ duyệt', variant: 'warning' },
  PUBLIC: { label: 'Công khai', variant: 'success' },
}

const moderationConfig = {
  APPROVED: { label: 'Đã duyệt', variant: 'success' },
  PENDING: { label: 'Đang chờ duyệt', variant: 'warning' },
  REJECTED: { label: 'Bị từ chối', variant: 'danger' },
}

function FilterTabs({ activeTab, onTabChange, counts }) {
  return (
    <div className="flex gap-1 px-4 py-2 bg-[var(--color-background)] border-b border-[var(--color-border)]">
      {Object.values(TABS).map((tab) => {
        const isActive = activeTab === tab.value
        const count = counts[tab.value] ?? 0
        return (
          <button
            key={tab.value}
            onClick={() => onTabChange(tab.value)}
            className={`
              relative px-4 py-2 text-sm font-medium transition-colors duration-200
              ${isActive
                ? 'text-[var(--color-primary)]'
                : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text)]'
              }
            `}
          >
            <span>{tab.label}</span>
            <span className={`
              ml-1.5 text-xs ${isActive ? 'text-[var(--color-primary)]' : 'text-[var(--color-text-secondary)]'}
            `}>
              ({count})
            </span>
            {isActive && (
              <motion.div
                layoutId="activeTab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--color-primary)]"
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            )}
          </button>
        )
      })}
    </div>
  )
}

function RecipeItem({ recipe, onClick, onMakePrivate, onMakePublic }) {
  const visibility = visibilityConfig[recipe.visibility] || visibilityConfig.PRIVATE
  const canEdit = recipe.visibility === 'PRIVATE'
  const canMakePrivate = recipe.visibility === 'PUBLIC' || recipe.visibility === 'PENDING'
  const canMakePublic = recipe.visibility === 'PRIVATE'

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-4 p-4 bg-[var(--color-surface)] rounded-[var(--radius-lg)] border border-[var(--color-border)] hover:shadow-[var(--shadow-md)] transition-shadow cursor-pointer"
      onClick={onClick}
    >
      <div className="w-20 h-20 rounded-[var(--radius-md)] overflow-hidden bg-[var(--color-background-alt)] flex-shrink-0">
        {recipe.thumbnail_url ? (
          <img src={recipe.thumbnail_url} alt={recipe.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-3xl">🍽️</div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-2 mb-1">
          <h3 className="font-display font-semibold text-[var(--color-text)] line-clamp-1 flex-1">
            {recipe.title}
          </h3>
          <Badge variant={visibility.variant} size="sm">{visibility.label}</Badge>
        </div>

        {recipe.prep_time && (
          <p className="text-sm text-[var(--color-text-secondary)] mb-2">
            {recipe.prep_time}p
          </p>
        )}

        {recipe.visibility === 'PUBLIC' && recipe.moderation_status && (
          <Badge variant={moderationConfig[recipe.moderation_status]?.variant || 'muted'} size="sm">
            {moderationConfig[recipe.moderation_status]?.label || recipe.moderation_status}
          </Badge>
        )}
      </div>

      <div className="flex flex-col gap-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
        {canEdit && (
          <Link to={`/recipe/${recipe.id}/edit`}>
            <Button variant="outline" size="sm">
              <Pencil className="w-3 h-3" />
              Sửa
            </Button>
          </Link>
        )}
        {canMakePrivate && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onMakePrivate(recipe)}
          >
            <Lock className="w-3 h-3" />
          </Button>
        )}
        {canMakePublic && (
          <Button
            variant="primary"
            size="sm"
            onClick={() => onMakePublic(recipe)}
          >
            <Globe className="w-3 h-3" />
          </Button>
        )}
      </div>
    </motion.div>
  )
}

function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 p-4">
      {[1, 2, 3, 4].map(i => (
        <motion.div
          key={i}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: i * 0.08 }}
          className="bg-[var(--color-surface)] rounded-[var(--radius-lg)] overflow-hidden border border-[var(--color-border)]"
        >
          <div className="aspect-square bg-[var(--color-background-alt)] animate-pulse" />
          <div className="p-4 space-y-2">
            <div className="h-4 w-3/4 bg-[var(--color-background-alt)] rounded animate-pulse" />
            <div className="h-3 w-1/2 bg-[var(--color-background-alt)] rounded animate-pulse" />
          </div>
        </motion.div>
      ))}
    </div>
  )
}

function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-16 px-6 text-center"
    >
      <div className="w-20 h-20 rounded-full bg-[var(--color-primary)]/10 flex items-center justify-center mb-4">
        <Utensils className="w-10 h-10 text-[var(--color-primary)]" />
      </div>
      <h3 className="font-display text-lg font-semibold text-[var(--color-text)] mb-2">
        Bạn chưa có công thức nào
      </h3>
      <p className="text-[var(--color-text-secondary)] text-sm mb-6">
        Tạo công thức đầu tiên!
      </p>
      <Link to="/recipe/new">
        <Button variant="primary">
          <Utensils className="w-4 h-4" />
          Tạo công thức
        </Button>
      </Link>
    </motion.div>
  )
}

export function MyRecipesPage() {
  const { data, isLoading, error, refetch } = useMyRecipes()
  const updateRecipe = useUpdateRecipe()
  const navigate = useNavigate()
  const recipes = data?.data?.results || data?.results || data || []

  const [visibilityFilter, setVisibilityFilter] = useState('ALL')
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, recipe: null, type: null })
  const [isUpdating, setIsUpdating] = useState(false)

  const filteredRecipes = useMemo(() => {
    if (visibilityFilter === 'ALL') return recipes
    return recipes.filter(r => r.visibility === visibilityFilter)
  }, [recipes, visibilityFilter])

  const tabCounts = useMemo(() => ({
    ALL: recipes.length,
    PUBLIC: recipes.filter(r => r.visibility === 'PUBLIC').length,
    PRIVATE: recipes.filter(r => r.visibility === 'PRIVATE').length,
  }), [recipes])

  const handleMakePrivate = async () => {
    if (!confirmDialog.recipe) return
    setIsUpdating(true)
    try {
      await updateRecipe.mutateAsync({
        id: confirmDialog.recipe.id,
        data: { visibility: 'PRIVATE' },
      })
      toast.success('Đã chuyển công thức sang chế độ riêng tư')
      setConfirmDialog({ isOpen: false, recipe: null, type: null })
      refetch()
    } catch (err) {
      const status = err?.response?.status
      if (status === 401) {
        toast.error('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.')
      } else if (status === 403) {
        toast.error('Bạn không có quyền thực hiện thao tác này.')
      } else {
        toast.error('Không thể chuyển sang chế độ riêng tư. Vui lòng thử lại.')
      }
    } finally {
      setIsUpdating(false)
    }
  }

  const handleMakePublic = async () => {
    if (!confirmDialog.recipe) return
    setIsUpdating(true)
    try {
      await recipeApi.publishRecipe(confirmDialog.recipe.id)
      toast.success('Đã đăng công khai công thức. Công thức đang chờ duyệt.')
      setConfirmDialog({ isOpen: false, recipe: null, type: null })
      refetch()
    } catch (err) {
      const status = err?.response?.status
      if (status === 401) {
        toast.error('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.')
      } else if (status === 403) {
        toast.error('Bạn không có quyền thực hiện thao tác này.')
      } else {
        toast.error('Không thể đăng công khai công thức. Vui lòng thử lại.')
      }
    } finally {
      setIsUpdating(false)
    }
  }

  if (isLoading) return <LoadingSkeleton />

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center py-16 px-6 text-center"
      >
        <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-4">
          <Utensils className="w-8 h-8 text-red-400" />
        </div>
        <h3 className="font-display text-lg font-semibold text-[var(--color-text)] mb-2">
          Không thể tải công thức
        </h3>
        <p className="text-[var(--color-text-secondary)] text-sm mb-6 max-w-md">
          Đã xảy ra lỗi khi tải danh sách công thức. Vui lòng thử lại.
        </p>
        <Button variant="outline" onClick={() => refetch()}>
          <RefreshCw className="w-4 h-4" />
          Thử lại
        </Button>
      </motion.div>
    )
  }

  if (recipes.length === 0) return <EmptyState />

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="pb-20"
    >
      <div className="px-4 py-4">
        <h1 className="font-display text-2xl font-bold text-[var(--color-text)]">
          Công thức của tôi
        </h1>
      </div>

      <FilterTabs
        activeTab={visibilityFilter}
        onTabChange={setVisibilityFilter}
        counts={tabCounts}
      />

      {filteredRecipes.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-16 px-6 text-center"
        >
          <p className="text-[var(--color-text-secondary)] text-sm">
            Không có công thức nào trong mục này
          </p>
        </motion.div>
) : (
        <div className="space-y-3 px-4 pb-4">
          {filteredRecipes.map((recipe, index) => (
            <RecipeItem
              key={recipe.id}
              recipe={recipe}
              onClick={() => navigate(`/recipe/${recipe.id}`)}
              onMakePrivate={(r) => setConfirmDialog({ isOpen: true, recipe: r, type: 'private' })}
              onMakePublic={(r) => setConfirmDialog({ isOpen: true, recipe: r, type: 'public' })}
            />
          ))}
        </div>
      )}

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.type === 'public' ? 'Đăng công khai công thức' : 'Chuyển sang chế độ riêng tư'}
        message={confirmDialog.type === 'public'
          ? `Bạn có chắc muốn đăng công khai công thức "${confirmDialog.recipe?.title}"? Công thức sẽ được gửi để duyệt trước khi hiển thị với người khác.`
          : `Bạn có chắc muốn chuyển công thức "${confirmDialog.recipe?.title}" sang chế độ riêng tư? Công thức sẽ không còn hiển thị với người khác.`
        }
        onConfirm={confirmDialog.type === 'public' ? handleMakePublic : handleMakePrivate}
        onCancel={() => setConfirmDialog({ isOpen: false, recipe: null, type: null })}
        loading={isUpdating}
        confirmText={confirmDialog.type === 'public' ? 'Đăng công khai' : 'Chuyển sang riêng tư'}
        cancelText="Hủy"
        variant={confirmDialog.type === 'public' ? 'primary' : 'warning'}
      />
    </motion.div>
  )
}

export default MyRecipesPage