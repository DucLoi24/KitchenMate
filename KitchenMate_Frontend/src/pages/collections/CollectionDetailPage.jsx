import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Trash2, Loader2, RefreshCw, Bookmark, Heart, Share2 } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { cn } from '@/utils'
import { Button } from '@/components/ui/Button'
import { RecipeCard } from '@/components/recipe/RecipeCard'
import { socialApi } from '@/api/socialApi'

// Skeleton loading
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

// Empty state
function EmptyState({ name }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-16 px-6 text-center"
    >
      <div className="w-20 h-20 rounded-full bg-[var(--color-primary)]/10 flex items-center justify-center mb-4">
        <Bookmark className="w-10 h-10 text-[var(--color-primary)]" />
      </div>
      <h3 className="font-display text-lg font-semibold text-[var(--color-text)] mb-2">
        Chưa có công thức nào trong "{name}"
      </h3>
      <p className="text-[var(--color-text-secondary)] text-sm mb-6 max-w-md">
        Khám phá công thức và thêm vào danh sách để bắt đầu!
      </p>
      <Link to="/explore">
        <Button variant="primary">
          <Bookmark className="w-4 h-4" />
          Khám phá công thức
        </Button>
      </Link>
    </motion.div>
  )
}

// Delete confirmation dialog
function DeleteConfirmDialog({ isOpen, collectionName, onConfirm, onCancel }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCancel}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="bg-[var(--color-surface)] rounded-[var(--radius-xl)] border border-[var(--color-border)] shadow-[var(--shadow-xl)] p-6 max-w-sm w-full">
              <h3 className="font-display text-lg font-semibold text-[var(--color-text)] mb-2">
                Xóa "{collectionName}"?
              </h3>
              <p className="text-sm text-[var(--color-text-secondary)] mb-6">
                Công thức trong danh sách sẽ không bị xóa.
              </p>
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={onCancel}>
                  Hủy
                </Button>
                <Button variant="danger" className="flex-1" onClick={onConfirm}>
                  <Trash2 className="w-4 h-4" />
                  Xóa
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

export function CollectionDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [collection, setCollection] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const isFavorites = collection?.is_favorites

  const loadCollection = async (collectionId) => {
    setLoading(true)
    setError(false)
    try {
      const res = await socialApi.getCollectionDetail(collectionId)
      setCollection(res.data || res)
    } catch (err) {
      if (err?.response?.status === 404) {
        toast.error('Không tìm thấy danh sách này')
        navigate('/collections')
        return
      }
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (id) {
      loadCollection(id)
    }
  }, [id])

  const handleDelete = async () => {
    try {
      await socialApi.deleteCollection(id)
      toast.success('Đã xóa danh sách')
      navigate('/collections')
    } catch (err) {
      toast.error(err?.response?.data?.error?.message || 'Không thể xóa danh sách')
    }
    setShowDeleteDialog(false)
  }

  const handleRecipeDeleted = () => {
    loadCollection(id)
  }

  if (loading) return <LoadingSkeleton />

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
        <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-4">
          <Bookmark className="w-8 h-8 text-red-400" />
        </div>
        <h3 className="font-display text-lg font-semibold text-[var(--color-text)] mb-2">
          Không thể tải danh sách
        </h3>
        <p className="text-[var(--color-text-secondary)] text-sm mb-6 max-w-md">
          Đã xảy ra lỗi khi tải danh sách. Vui lòng thử lại.
        </p>
        <Button variant="outline" onClick={() => loadCollection(id)}>
          <RefreshCw className="w-4 h-4" />
          Thử lại
        </Button>
      </div>
    )
  }

  if (!collection) return null

  const recipes = collection.collection_recipes?.map(cr => ({
    id: cr.recipe,
    title: cr.recipe_title || 'Công thức',
    thumbnail_url: cr.recipe_thumbnail || null,
    thumbnail: cr.recipe_thumbnail || null,
    is_favorited: isFavorites,
    is_in_collection: true,
  })) || []

  return (
    <div className="pb-20">
      {/* Header */}
      <div className="px-4 py-4 flex items-center gap-3">
        <button
          onClick={() => navigate('/collections')}
          className="p-2 rounded-full hover:bg-[var(--color-background-alt)] transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-[var(--color-text)]" />
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {isFavorites && (
              <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center">
                <Heart className="w-4 h-4 text-white fill-white" />
              </div>
            )}
            <h1 className="font-display text-xl font-bold text-[var(--color-text)] truncate">
              {collection.name}
            </h1>
          </div>
          <p className="text-sm text-[var(--color-text-secondary)]">
            {collection.recipe_count || 0} công thức
          </p>
        </div>

        {!isFavorites && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowDeleteDialog(true)}
            className="text-red-600 border-red-200 hover:bg-red-50"
          >
            <Trash2 className="w-4 h-4" />
            Xóa
          </Button>
        )}
      </div>

      {/* Empty state */}
      {recipes.length === 0 && <EmptyState name={collection.name} />}

      {/* Recipe grid */}
      {recipes.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 p-4">
          {recipes.map(recipe => (
            <RecipeCard
              key={recipe.id}
              recipe={recipe}
              showFavoriteButton
              onClick={() => navigate(`/recipe/${recipe.id}`)}
            />
          ))}
        </div>
      )}

      {/* Delete confirmation dialog */}
      <DeleteConfirmDialog
        isOpen={showDeleteDialog}
        collectionName={collection.name}
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteDialog(false)}
      />
    </div>
  )
}

export default CollectionDetailPage
