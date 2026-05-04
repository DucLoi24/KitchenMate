import { useState } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Pencil, Trash2, ChevronLeft, ChevronRight, MessageCircle } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { StarRatingDisplay } from '@/components/ui/StarRatingInput'
import { socialApi } from '@/api/socialApi'
import { cn } from '@/utils'

function formatDate(dateString) {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString('vi-VN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function DeleteConfirmDialog({ isOpen, onConfirm, onCancel }) {
  if (!isOpen) return null

  return createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
        onClick={onCancel}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2 }}
          className="bg-[var(--color-surface)] rounded-[var(--radius-lg)] p-6 max-w-[28rem] w-full shadow-[var(--shadow-xl)]"
          onClick={(e) => e.stopPropagation()}
        >
          <h3 className="font-display text-xl font-semibold text-[var(--color-text)] mb-2">
            Xóa đánh giá
          </h3>
          <p className="text-[var(--color-text-secondary)] mb-6">
            Bạn có chắc muốn xóa đánh giá này? Hành động này không thể hoàn tác.
          </p>
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-2.5 rounded-[var(--radius-md)] border border-[var(--color-border)] text-[var(--color-text)] font-medium hover:bg-[var(--color-background-alt)] transition-colors"
            >
              Hủy
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 px-4 py-2.5 rounded-[var(--radius-md)] bg-[var(--color-primary)] text-white font-medium hover:bg-[var(--color-primary-light)] transition-colors"
            >
              Xóa
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  )
}

function ReviewItem({ review, isOwner, onEdit, onDelete }) {
  return (
    <div className="flex gap-4 p-4 bg-[var(--color-background-alt)] rounded-[var(--radius-lg)]">
      <Link to={`/profile/${review.user}`} className="flex-shrink-0">
        <div className="w-10 h-10 rounded-full bg-[var(--color-primary)] text-white flex items-center justify-center text-lg font-medium">
          {review.user_name?.[0]?.toUpperCase() || '?'}
        </div>
      </Link>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-1">
          <div>
            <Link
              to={`/profile/${review.user}`}
              className="font-medium text-[var(--color-text)] hover:underline"
            >
              {review.user_name || 'Người dùng'}
            </Link>
            <div className="flex items-center gap-2 mt-0.5">
              <StarRatingDisplay value={review.rating} size="sm" />
              <span className="text-xs text-[var(--color-text-muted)]">
                {formatDate(review.created_at)}
              </span>
            </div>
          </div>
          {isOwner && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => onEdit(review)}
                className="p-2 rounded-full hover:bg-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors"
                title="Chỉnh sửa"
              >
                <Pencil className="w-4 h-4" />
              </button>
              <button
                onClick={() => onDelete(review)}
                className="p-2 rounded-full hover:bg-[var(--color-primary)]/10 text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] transition-colors"
                title="Xóa"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
        {review.comment && (
          <p className="text-[var(--color-text)] text-sm leading-relaxed whitespace-pre-wrap">
            {review.comment}
          </p>
        )}
        {review.cooksnap_url && (
          <div className="mt-3">
            <img
              src={review.cooksnap_url}
              alt="Cooksnap"
              className="w-32 h-32 object-cover rounded-[var(--radius-md)]"
            />
          </div>
        )}
      </div>
    </div>
  )
}

export function ReviewList({
  reviews = [],
  pagination = null,
  currentUserId = null,
  onPageChange,
  onReviewUpdated,
  onReviewDeleted,
}) {
  const [deleteTarget, setDeleteTarget] = useState(null)

  const handleDeleteClick = (review) => {
    setDeleteTarget(review)
  }

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return
    try {
      await socialApi.deleteReview(deleteTarget.id)
      toast.success('Xóa đánh giá thành công')
      onReviewDeleted(deleteTarget.id)
    } catch {
      toast.error('Không thể xóa đánh giá. Vui lòng thử lại.')
    } finally {
      setDeleteTarget(null)
    }
  }

  const handleDeleteCancel = () => {
    setDeleteTarget(null)
  }

  if (reviews.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-16 h-16 rounded-full bg-[var(--color-background-alt)] flex items-center justify-center mb-4">
          <MessageCircle className="w-8 h-8 text-[var(--color-text-muted)]" />
        </div>
        <h3 className="font-display text-lg font-semibold text-[var(--color-text)] mb-2">
          Chưa có đánh giá nào
        </h3>
        <p className="text-[var(--color-text-secondary)] text-sm max-w-[12rem]">
          Hãy là người đầu tiên đánh giá công thức này!
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display text-lg font-semibold text-[var(--color-text)]">
          Đánh giá ({pagination?.total || reviews.length})
        </h3>
      </div>

      <div className="space-y-3">
        {reviews.map((review) => (
          <ReviewItem
            key={review.id}
            review={review}
            isOwner={currentUserId === review.user}
            onEdit={(r) => onReviewUpdated?.(r)}
            onDelete={handleDeleteClick}
          />
        ))}
      </div>

      {pagination && pagination.total_pages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <button
            onClick={() => onPageChange?.(pagination.current_page - 1)}
            disabled={pagination.current_page <= 1}
            className={cn(
              'p-2 rounded-full border transition-colors',
              pagination.current_page <= 1
                ? 'border-[var(--color-border)] text-[var(--color-text-muted)] cursor-not-allowed'
                : 'border-[var(--color-border)] text-[var(--color-text)] hover:bg-[var(--color-background-alt)]'
            )}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-sm text-[var(--color-text-secondary)] px-4">
            Trang {pagination.current_page} / {pagination.total_pages}
          </span>
          <button
            onClick={() => onPageChange?.(pagination.current_page + 1)}
            disabled={pagination.current_page >= pagination.total_pages}
            className={cn(
              'p-2 rounded-full border transition-colors',
              pagination.current_page >= pagination.total_pages
                ? 'border-[var(--color-border)] text-[var(--color-text-muted)] cursor-not-allowed'
                : 'border-[var(--color-border)] text-[var(--color-text)] hover:bg-[var(--color-background-alt)]'
            )}
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}

      <DeleteConfirmDialog
        isOpen={!!deleteTarget}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />
    </div>
  )
}

export default ReviewList