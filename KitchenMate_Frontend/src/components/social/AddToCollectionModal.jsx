import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Plus, Check, Bookmark, AlertCircle } from 'lucide-react'
import { cn } from '@/utils'
import { Button } from '@/components/ui/Button'
import { socialApi } from '@/api/socialApi'
import { useAuth } from '@/components/auth/useAuth'

export function AddToCollectionModal({
  isOpen,
  onClose,
  recipeId,
  initialCollections = [],
}) {
  const { user } = useAuth()
  const [collections, setCollections] = useState(initialCollections)
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newCollectionName, setNewCollectionName] = useState('')
  const [createLoading, setCreateLoading] = useState(false)
  const [toast, setToast] = useState('')

  // Fetch collections when modal opens
  useEffect(() => {
    if (isOpen && user) {
      const fetchCollections = async () => {
        setLoading(true)
        setError('')
        try {
          const res = await socialApi.getCollections()
          const list = res.data?.results || res.data?.data || res.data || res || []
          setCollections(list.filter(c => !c.is_favorites))
        } catch {
          setError('Không thể tải danh sách bộ sưu tập')
        } finally {
          setLoading(false)
        }
      }
      fetchCollections()
    }
  }, [isOpen, user])

  const handleToggleCollection = async (collection, isInCollection) => {
    if (submitting) return
    setSubmitting(true)

    // Optimistic update
    const prevCollections = [...collections]
    const updated = prevCollections.map(c =>
      c.id === collection.id ? { ...c, is_in: !isInCollection } : c
    )
    setCollections(updated)

    try {
      if (isInCollection) {
        await socialApi.removeFromCollection(collection.id, recipeId)
        setToast(`Đã xóa khỏi "${collection.name}"`)
      } else {
        await socialApi.addToCollection(collection.id, recipeId)
        setToast(`Đã thêm vào "${collection.name}"`)
      }
    } catch {
      // Revert on failure
      setCollections(prevCollections)
      setError('Không thể cập nhật danh sách')
    } finally {
      setSubmitting(false)
      setTimeout(() => setToast(''), 2000)
    }
  }

  const handleCreateAndAdd = async () => {
    if (!newCollectionName.trim()) return

    setCreateLoading(true)
    setError('')
    try {
      const res = await socialApi.createCollection({ name: newCollectionName.trim() })
      const newCollection = res.data || res
      // Add recipe to new collection
      await socialApi.addToCollection(newCollection.id, recipeId)

      // Update local state
      const withNew = [...collections, { ...newCollection, is_in: true }]
      setCollections(withNew)

      setToast(`Đã tạo "${newCollectionName}" và thêm công thức`)
      setNewCollectionName('')
      setShowCreateForm(false)
    } catch (err) {
      setError(err?.response?.data?.error?.message || 'Không thể tạo danh sách mới')
    } finally {
      setCreateLoading(false)
      setTimeout(() => setToast(''), 2000)
    }
  }

  const handleClose = () => {
    setError('')
    setShowCreateForm(false)
    setNewCollectionName('')
    onClose()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100]"
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={cn(
              'fixed bottom-0 left-0 right-0 bg-[var(--color-surface)]',
              'rounded-t-[2rem] z-[110] p-6 pb-10 max-h-[85vh] overflow-y-auto'
            )}
          >
            {/* Drag handle */}
            <div className="w-12 h-1 bg-[var(--color-border)] rounded-full mx-auto mb-6" />

            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-[var(--color-primary)] flex items-center justify-center">
                  <Bookmark className="w-5 h-5 text-white" />
                </div>
                <h2 className="font-display text-xl font-semibold text-[var(--color-text)]">
                  Lưu vào danh sách
                </h2>
              </div>
              <button
                onClick={handleClose}
                className="p-2 rounded-full hover:bg-[var(--color-background-alt)] transition-colors"
              >
                <X className="w-5 h-5 text-[var(--color-text-secondary)]" />
              </button>
            </div>

            {/* Toast */}
            {toast && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mb-4 px-4 py-2 bg-green-50 border border-green-200 rounded-[var(--radius-md)] text-sm text-green-700"
              >
                {toast}
              </motion.div>
            )}

            {/* Error */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mb-4 px-4 py-2 bg-red-50 border border-red-200 rounded-[var(--radius-md)] text-sm text-red-700 flex items-center gap-2"
              >
                <AlertCircle className="w-4 h-4" />
                {error}
              </motion.div>
            )}

            {/* Loading skeleton */}
            {loading && (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-14 bg-[var(--color-background-alt)] rounded-[var(--radius-md)] animate-pulse" />
                ))}
              </div>
            )}

            {/* Collections list */}
            {!loading && (
              <div className="space-y-2 mb-4">
                {collections.length === 0 && !showCreateForm && (
                  <p className="text-sm text-[var(--color-text-secondary)] py-4 text-center">
                    Bạn chưa có bộ sưu tập nào. Tạo một danh sách mới để bắt đầu!
                  </p>
                )}

                {collections.map(collection => (
                  <button
                    key={collection.id}
                    onClick={() => handleToggleCollection(collection, collection.is_in)}
                    disabled={submitting}
                    className={cn(
                      'w-full flex items-center gap-3 p-3 rounded-[var(--radius-md)]',
                      'border border-[var(--color-border)]',
                      'bg-[var(--color-surface)]',
                      'hover:bg-[var(--color-background-alt)]',
                      'transition-colors text-left',
                      collection.is_in && 'border-[var(--color-primary)] bg-[var(--color-primary)]/5'
                    )}
                  >
                    {/* Checkbox */}
                    <div className={cn(
                      'w-5 h-5 rounded border-2 flex items-center justify-center',
                      collection.is_in
                        ? 'border-[var(--color-primary)] bg-[var(--color-primary)]'
                        : 'border-[var(--color-border)]'
                    )}>
                      {collection.is_in && <Check className="w-3 h-3 text-white" />}
                    </div>

                    {/* Name */}
                    <span className="flex-1 text-sm font-medium text-[var(--color-text)]">
                      {collection.name}
                    </span>

                    {/* Count */}
                    <span className="text-xs text-[var(--color-text-secondary)]">
                      {collection.recipe_count || 0} công thức
                    </span>
                  </button>
                ))}
              </div>
            )}

            {/* Create new collection form */}
            {showCreateForm ? (
              <div className="space-y-3">
                <input
                  type="text"
                  value={newCollectionName}
                  onChange={e => setNewCollectionName(e.target.value)}
                  placeholder="Tên danh sách mới..."
                  maxLength={100}
                  className={cn(
                    'w-full h-12 px-4 rounded-[var(--radius-md)]',
                    'border border-[var(--color-border)]',
                    'bg-[var(--color-surface)]',
                    'text-[var(--color-text)]',
                    'placeholder:text-[var(--color-text-muted)]',
                    'focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent',
                    'transition-all duration-[var(--transition-fast)]'
                  )}
                />
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1 h-11"
                    onClick={() => {
                      setShowCreateForm(false)
                      setNewCollectionName('')
                    }}
                  >
                    Hủy
                  </Button>
                  <Button
                    variant="primary"
                    className="flex-1 h-11"
                    onClick={handleCreateAndAdd}
                    disabled={!newCollectionName.trim() || createLoading}
                    isLoading={createLoading}
                  >
                    <Check className="w-4 h-4" />
                    Tạo & thêm
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                variant="outline"
                className="w-full h-11 border-dashed"
                onClick={() => setShowCreateForm(true)}
              >
                <Plus className="w-4 h-4" />
                Tạo danh sách mới
              </Button>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

export default AddToCollectionModal
