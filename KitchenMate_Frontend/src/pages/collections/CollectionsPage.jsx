import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Bookmark, Heart, Trash2, RefreshCw, MoreHorizontal } from 'lucide-react'
import toast from 'react-hot-toast'

import { cn } from '@/utils'
import { Button } from '@/components/ui/Button'
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
function EmptyState() {
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
        Bạn chưa có bộ sưu tập nào
      </h3>
      <p className="text-[var(--color-text-secondary)] text-sm mb-6">
        Khám phá công thức và lưu lại những món yêu thích để bắt đầu!
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
function DeleteConfirmDialog({ isOpen, collection, onConfirm, onCancel }) {
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
            <div className="bg-[var(--color-surface)] rounded-[var(--radius-xl)] border border-[var(--color-border)] shadow-[var(--shadow-xl)] p-6 max-w-md w-full">
              <h3 className="font-display text-lg font-semibold text-[var(--color-text)] mb-2">
                Xóa "{collection?.name}"?
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

// Collection card
function CollectionCard({ collection, onDelete }) {
  const [showMenu, setShowMenu] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const isFavorites = collection.is_favorites

  const thumbnails = collection.collection_recipes?.slice(0, 4) || []

  const handleDelete = async () => {
    try {
      await socialApi.deleteCollection(collection.id)
      toast.success('Đã xóa danh sách')
      onDelete(collection.id)
    } catch {
      toast.error('Không thể xóa danh sách')
    }
    setShowDeleteDialog(false)
    setShowMenu(false)
  }

  return (
    <>
      <Link to={`/collections/${collection.id}`}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ y: -4 }}
          className={cn(
            'bg-[var(--color-surface)] rounded-[var(--radius-lg)] overflow-hidden border border-[var(--color-border)]',
            'shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)]',
            'transition-all duration-[var(--transition-base)] cursor-pointer'
          )}
        >
          {/* Thumbnail grid */}
          <div className="aspect-square bg-[var(--color-background-alt)] relative overflow-hidden">
            {thumbnails.length > 0 ? (
              <div className="grid grid-cols-2 grid-rows-2 w-full h-full gap-0.5">
                {thumbnails.map((cr, i) => (
                  <div key={i} className="relative bg-[var(--color-background-alt)] overflow-hidden">
                    {cr.recipe_thumbnail ? (
                      <img
                        src={cr.recipe_thumbnail}
                        alt={cr.recipe_title}
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-2xl bg-gradient-to-br from-orange-50 to-amber-50">
                        🍽️
                      </div>
                    )}
                  </div>
                ))}
                {thumbnails.length < 4 && Array.from({ length: 4 - thumbnails.length }).map((_, i) => (
                  <div key={`empty-${i}`} className="bg-[var(--color-background-alt)]" />
                ))}
              </div>
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-[var(--color-primary)]/10 flex items-center justify-center">
                  {isFavorites ? (
                    <Heart className="w-8 h-8 text-red-400 fill-red-400" />
                  ) : (
                    <Bookmark className="w-8 h-8 text-[var(--color-primary)]" />
                  )}
                </div>
              </div>
            )}

            {/* Favorite badge for favorites collection */}
            {isFavorites && (
              <div className="absolute top-3 left-3">
                <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center shadow-[var(--shadow-sm)]">
                  <Heart className="w-4 h-4 text-white fill-white" />
                </div>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="p-4">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-display text-base font-semibold text-[var(--color-text)] line-clamp-1 flex-1">
                {collection.name}
              </h3>
              {!isFavorites && (
                <button
                  onClick={(e) => {
                    e.preventDefault()
                    setShowMenu(true)
                  }}
                  className="p-1 rounded hover:bg-[var(--color-background-alt)] transition-colors"
                >
                  <MoreHorizontal className="w-4 h-4 text-[var(--color-text-secondary)]" />
                </button>
              )}
            </div>
            <p className="text-xs text-[var(--color-text-secondary)] mt-1">
              {collection.recipe_count || 0} công thức
            </p>
          </div>
        </motion.div>
      </Link>

      {/* Context menu */}
      {showMenu && !isFavorites && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={(e) => {
              e.preventDefault()
              setShowMenu(false)
            }}
          />
          <div className="absolute z-50 right-4 top-auto bottom-auto mt-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-md)] shadow-[var(--shadow-lg)] py-1 min-w-[120px]">
            <button
              onClick={(e) => {
                e.preventDefault()
                setShowMenu(false)
                setShowDeleteDialog(true)
              }}
              className="w-full px-4 py-2 text-sm text-left text-red-600 hover:bg-red-50 flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Xóa danh sách
            </button>
          </div>
        </>
      )}

      {/* Delete confirmation */}
      <DeleteConfirmDialog
        isOpen={showDeleteDialog}
        collection={collection}
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteDialog(false)}
      />
    </>
  )
}

// Create collection dialog
function CreateCollectionDialog({ isOpen, onClose, onCreated }) {
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleCreate = async () => {
    if (!name.trim()) return

    setLoading(true)
    setError('')
    try {
      const res = await socialApi.createCollection({ name: name.trim() })
      const newCollection = res.data || res
      toast.success(`Đã tạo "${name}"`)
      setName('')
      onCreated(newCollection)
      onClose()
    } catch (err) {
      setError(err?.response?.data?.error?.message || 'Không thể tạo danh sách mới')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        <div className="bg-[var(--color-surface)] rounded-[var(--radius-xl)] border border-[var(--color-border)] shadow-[var(--shadow-xl)] p-6 max-w-md w-full">
          <h3 className="font-display text-lg font-semibold text-[var(--color-text)] mb-4">
            Tạo danh sách mới
          </h3>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Tên danh sách..."
            maxLength={100}
            autoFocus
            className={cn(
              'w-full h-12 px-4 rounded-[var(--radius-md)]',
              'border border-[var(--color-border)]',
              'bg-[var(--color-surface)]',
              'text-[var(--color-text)]',
              'placeholder:text-[var(--color-text-muted)]',
              'focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent',
              'transition-all duration-[var(--transition-fast)] mb-4'
            )}
          />
          {error && (
            <p className="text-sm text-red-600 mb-4">{error}</p>
          )}
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={onClose}>
              Hủy
            </Button>
            <Button
              variant="primary"
              className="flex-1"
              onClick={handleCreate}
              disabled={!name.trim() || loading}
              isLoading={loading}
            >
              Tạo
            </Button>
          </div>
        </div>
      </motion.div>
    </>
  )
}

export function CollectionsPage() {
  const [collections, setCollections] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [showCreateDialog, setShowCreateDialog] = useState(false)

  const loadCollections = useCallback(async () => {
    setLoading(true)
    setError(false)
    try {
      const res = await socialApi.getCollections()
      // Backend wraps paginated response as {success, data: {count, next, previous, results}}
      // Non-paginated: res.data = array directly. Paginated: res.data.data.results = array
      const list = res.data?.results || res.data?.data || res.data || res || []
      // Sort: favorites first, then by creation date
      const sorted = list.sort((a, b) => {
        if (a.is_favorites && !b.is_favorites) return -1
        if (!a.is_favorites && b.is_favorites) return 1
        return 0
      })
      setCollections(sorted)
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      loadCollections()
    }, 0)

    return () => clearTimeout(timer)
  }, [loadCollections])

  const handleCollectionCreated = (newCollection) => {
    setCollections(prev => [newCollection, ...prev])
  }

  const handleCollectionDeleted = (deletedId) => {
    setCollections(prev => prev.filter(c => c.id !== deletedId))
  }

  if (loading) return <LoadingSkeleton />

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
        <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-4">
          <Bookmark className="w-8 h-8 text-red-400" />
        </div>
        <h3 className="font-display text-lg font-semibold text-[var(--color-text)] mb-2">
          Không thể tải bộ sưu tập
        </h3>
        <p className="text-[var(--color-text-secondary)] text-sm mb-6 max-w-md">
          Đã xảy ra lỗi khi tải danh sách. Vui lòng thử lại.
        </p>
        <Button variant="outline" onClick={loadCollections}>
          <RefreshCw className="w-4 h-4" />
          Thử lại
        </Button>
      </div>
    )
  }

  if (collections.length === 0) return <EmptyState />

  return (
    <div className="pb-20">
      {/* Header */}
      <div className="px-4 py-4 flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-[var(--color-text)]">
          Bộ sưu tập
        </h1>
        <Button variant="primary" size="sm" onClick={() => setShowCreateDialog(true)}>
          <Plus className="w-4 h-4" />
          Tạo mới
        </Button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 p-4">
        {collections.map(collection => (
          <CollectionCard
            key={collection.id}
            collection={collection}
            onDelete={handleCollectionDeleted}
          />
        ))}
      </div>

      {/* Create dialog */}
      <CreateCollectionDialog
        isOpen={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        onCreated={handleCollectionCreated}
      />
    </div>
  )
}

export default CollectionsPage
