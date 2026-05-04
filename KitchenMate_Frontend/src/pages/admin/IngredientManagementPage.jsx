import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Clock,
  List,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  AlertCircle,
  ThumbsUp,
  XCircle,
  Carrot,
} from 'lucide-react'
import toast from 'react-hot-toast'

import { cn } from '@/utils'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { adminApi } from '@/api/adminApi'

const PAGE_SIZE = 20

// ============ Loading Skeleton ============

function LoadingSkeleton() {
  return (
    <div className="space-y-4 p-4">
      {[1, 2, 3, 4, 5].map(i => (
        <motion.div
          key={i}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: i * 0.06 }}
          className="bg-[var(--color-surface)] rounded-[var(--radius-lg)] border border-[var(--color-border)] p-4"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-[var(--radius-md)] bg-[var(--color-background-alt)] animate-pulse flex items-center justify-center">
              <Carrot className="w-6 h-6 text-[var(--color-text-muted)]" />
            </div>
            <div className="flex-1 space-y-2">
              <div className="h-5 w-3/4 bg-[var(--color-background-alt)] rounded animate-pulse" />
              <div className="h-4 w-1/2 bg-[var(--color-background-alt)] rounded animate-pulse" />
              <div className="h-4 w-1/3 bg-[var(--color-background-alt)] rounded animate-pulse" />
            </div>
            <div className="h-8 w-24 bg-[var(--color-background-alt)] rounded animate-pulse" />
          </div>
        </motion.div>
      ))}
    </div>
  )
}

// ============ Empty State ============

function EmptyState({ tab }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-16 px-6 text-center"
    >
      <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-4">
        <CheckCircle className="w-10 h-10 text-green-500" />
      </div>
      <h3 className="font-display text-lg font-semibold text-[var(--color-text)] mb-2">
        {tab === 'pending' ? 'Không có mục nào cần duyệt' : 'Không có nguyên liệu nào'}
      </h3>
      <p className="text-[var(--color-text-secondary)] text-sm">
        {tab === 'pending'
          ? 'Tất cả nguyên liệu đã được duyệt.'
          : 'Danh sách nguyên liệu trống.'}
      </p>
    </motion.div>
  )
}

// ============ Error State ============

function ErrorState({ message, onRetry }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-16 px-6 text-center"
    >
      <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center mb-4">
        <AlertCircle className="w-10 h-10 text-red-400" />
      </div>
      <h3 className="font-display text-lg font-semibold text-[var(--color-text)] mb-2">
        Đã xảy ra lỗi
      </h3>
      <p className="text-[var(--color-text-secondary)] text-sm mb-6 max-w-md">
        {message || 'Không thể tải danh sách nguyên liệu. Vui lòng thử lại.'}
      </p>
      <Button variant="outline" onClick={onRetry}>
        <RefreshCw className="w-4 h-4" />
        Thử lại
      </Button>
    </motion.div>
  )
}

// ============ Confirm Dialog (Approve) ============

function ApproveConfirmDialog({ isOpen, item, onConfirm, onCancel, loading }) {
  const handleConfirm = async () => {
    try {
      await onConfirm()
    } catch {
      // Error handled by caller
    }
  }

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
                Duyệt "{item?.name}"?
              </h3>
              <p className="text-sm text-[var(--color-text-secondary)] mb-6">
                Nguyên liệu này sẽ được hiển thị trong danh sách nguyên liệu.
              </p>
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={onCancel} disabled={loading}>
                  Hủy
                </Button>
                <Button
                  variant="primary"
                  className="flex-1"
                  onClick={handleConfirm}
                  disabled={loading}
                  isLoading={loading}
                >
                  <ThumbsUp className="w-4 h-4" />
                  Duyệt
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

// ============ Reject Dialog ============

function RejectDialog({ isOpen, item, onConfirm, onCancel, loading }) {
  const [reason, setReason] = useState('')

  const handleConfirm = async () => {
    try {
      await onConfirm(reason)
    } catch {
      // Error handled by caller
    }
  }

  // Reset reason when dialog closes
  useEffect(() => {
    if (!isOpen) setReason('')
  }, [isOpen])

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
                Từ chối "{item?.name}"?
              </h3>
              <p className="text-sm text-[var(--color-text-secondary)] mb-4">
                Nguyên liệu này sẽ không được hiển thị. Lý do là tùy chọn.
              </p>
              <textarea
                value={reason}
                onChange={e => setReason(e.target.value)}
                placeholder="Lý do từ chối (tùy chọn)..."
                rows={3}
                className={cn(
                  'w-full px-4 py-3 rounded-[var(--radius-md)]',
                  'border border-[var(--color-border)]',
                  'bg-[var(--color-surface)]',
                  'text-[var(--color-text)] text-sm',
                  'placeholder:text-[var(--color-text-muted)]',
                  'focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent',
                  'transition-all duration-[var(--transition-fast)] mb-4',
                  'resize-none'
                )}
              />
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={onCancel} disabled={loading}>
                  Hủy
                </Button>
                <Button
                  variant="danger"
                  className="flex-1"
                  onClick={handleConfirm}
                  disabled={loading}
                  isLoading={loading}
                >
                  <XCircle className="w-4 h-4" />
                  Từ chối
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

// ============ Ingredient List Item ============

function IngredientListItem({ ingredient, onApprove, onReject }) {
  const [expanded, setExpanded] = useState(false)
  const [showApproveDialog, setShowApproveDialog] = useState(false)
  const [showRejectDialog, setShowRejectDialog] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)

  const handleApprove = async () => {
    setActionLoading(true)
    try {
      await adminApi.approveIngredient(ingredient.id)
      toast.success('Đã duyệt nguyên liệu')
      onApprove(ingredient.id)
    } catch (err) {
      const status = err?.response?.status
      if (status === 401) {
        toast.error('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.')
      } else if (status === 403) {
        toast.error('Bạn không có quyền thực hiện thao tác này.')
      } else if (status === 409) {
        toast.info('Nguyên liệu này đã được duyệt bởi admin khác.')
        onApprove(ingredient.id)
      } else if (status === 500) {
        toast.error('Lỗi server. Vui lòng thử lại.')
      } else {
        toast.error(err?.response?.data?.message || 'Không thể duyệt nguyên liệu.')
      }
      throw err
    } finally {
      setActionLoading(false)
    }
  }

  const handleReject = async (reason) => {
    setActionLoading(true)
    try {
      await adminApi.rejectIngredient(ingredient.id, reason)
      toast.success('Đã từ chối nguyên liệu')
      onReject(ingredient.id)
    } catch (err) {
      const status = err?.response?.status
      if (status === 401) {
        toast.error('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.')
      } else if (status === 403) {
        toast.error('Bạn không có quyền thực hiện thao tác này.')
      } else if (status === 409) {
        toast.info('Nguyên liệu này đã được duyệt bởi admin khác.')
        onReject(ingredient.id)
      } else if (status === 500) {
        toast.error('Lỗi server. Vui lòng thử lại.')
      } else {
        toast.error(err?.response?.data?.message || 'Không thể từ chối nguyên liệu.')
      }
      throw err
    } finally {
      setActionLoading(false)
    }
  }

  const statusBadge = {
    PENDING: { variant: 'warning', label: 'Chờ duyệt' },
    APPROVED: { variant: 'success', label: 'Đã duyệt' },
    REJECTED: { variant: 'danger', label: 'Đã từ chối' },
  }

  const badge = statusBadge[ingredient.status] || { variant: 'muted', label: ingredient.status }

  const categoryLabels = {
    PROTEIN: 'Protein',
    CARB: 'Carbohydrate',
    VEGETABLE: 'Rau củ',
    SPICE: 'Gia vị',
    OTHER: 'Khác',
  }

  const categoryColors = {
    PROTEIN: 'bg-red-100 text-red-700',
    CARB: 'bg-amber-100 text-amber-700',
    VEGETABLE: 'bg-green-100 text-green-700',
    SPICE: 'bg-purple-100 text-purple-700',
    OTHER: 'bg-gray-100 text-gray-700',
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          'bg-[var(--color-surface)] rounded-[var(--radius-lg)] border border-[var(--color-border)]',
          'transition-all duration-[var(--transition-base)]',
          expanded && 'shadow-[var(--shadow-md)]'
        )}
      >
        {/* Main row */}
        <div
          className="p-4 flex items-start gap-4 cursor-pointer"
          onClick={() => setExpanded(!expanded)}
        >
          {/* Icon */}
          <div className="w-12 h-12 rounded-[var(--radius-md)] bg-[var(--color-background-alt)] flex items-center justify-center flex-shrink-0">
            <Carrot className="w-6 h-6 text-[var(--color-text-muted)]" />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-display text-base font-semibold text-[var(--color-text)]">
                {ingredient.name}
              </h3>
              <span
                className={cn(
                  'px-2 py-0.5 rounded-full text-xs font-medium',
                  categoryColors[ingredient.category] || categoryColors.OTHER
                )}
              >
                {categoryLabels[ingredient.category] || ingredient.category}
              </span>
            </div>
            <div className="flex items-center gap-3 mt-2 text-xs text-[var(--color-text-muted)]">
              <span>
                Người tạo: {ingredient.created_by?.full_name || ingredient.created_by?.email || 'N/A'}
              </span>
              <span>•</span>
              <span>{formatDate(ingredient.created_at)}</span>
            </div>
          </div>

          {/* Status & expand */}
          <div className="flex flex-col items-end gap-2">
            <Badge variant={badge.variant} size="sm">
              {badge.label}
            </Badge>
            <div className="text-[var(--color-text-muted)]">
              {expanded ? (
                <ChevronUp className="w-5 h-5" />
              ) : (
                <ChevronDown className="w-5 h-5" />
              )}
            </div>
          </div>
        </div>

        {/* Expanded detail panel */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="px-4 pb-4 border-t border-[var(--color-border)] pt-4">
                {/* Details grid */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <h4 className="text-sm font-medium text-[var(--color-text)] mb-1">Tên nguyên liệu</h4>
                    <p className="text-sm text-[var(--color-text-secondary)]">{ingredient.name}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-[var(--color-text)] mb-1">Danh mục</h4>
                    <p className="text-sm text-[var(--color-text-secondary)]">
                      {categoryLabels[ingredient.category] || ingredient.category}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-[var(--color-text)] mb-1">Người tạo</h4>
                    <p className="text-sm text-[var(--color-text-secondary)]">
                      {ingredient.created_by?.full_name || ingredient.created_by?.email || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-[var(--color-text)] mb-1">Ngày tạo</h4>
                    <p className="text-sm text-[var(--color-text-secondary)]">{formatDate(ingredient.created_at)}</p>
                  </div>
                </div>

                {/* Actions for PENDING ingredients */}
                {ingredient.status === 'PENDING' && (
                  <div className="flex gap-3 pt-4 border-t border-[var(--color-border)]">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        setShowApproveDialog(true)
                      }}
                      disabled={actionLoading}
                    >
                      <ThumbsUp className="w-4 h-4" />
                      Duyệt
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        setShowRejectDialog(true)
                      }}
                      disabled={actionLoading}
                    >
                      <XCircle className="w-4 h-4" />
                      Từ chối
                    </Button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Dialogs */}
      <ApproveConfirmDialog
        isOpen={showApproveDialog}
        item={ingredient}
        onConfirm={handleApprove}
        onCancel={() => setShowApproveDialog(false)}
        loading={actionLoading}
      />
      <RejectDialog
        isOpen={showRejectDialog}
        item={ingredient}
        onConfirm={handleReject}
        onCancel={() => setShowRejectDialog(false)}
        loading={actionLoading}
      />
    </>
  )
}

// ============ Sort Control ============

function SortControl({ sort, onSortChange }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-[var(--color-text-secondary)]">Sắp xếp:</span>
      <select
        value={sort}
        onChange={e => onSortChange(e.target.value)}
        className={cn(
          'h-9 px-3 rounded-[var(--radius-md)]',
          'border border-[var(--color-border)]',
          'bg-[var(--color-surface)]',
          'text-[var(--color-text)] text-sm',
          'focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent',
          'cursor-pointer'
        )}
      >
        <option value="-created_at">Mới nhất</option>
        <option value="created_at">Cũ nhất</option>
      </select>
    </div>
  )
}

// ============ Pagination ============

function Pagination({ page, totalPages, onPageChange }) {
  if (totalPages <= 1) return null

  const pages = []
  const maxPages = 5
  let startPage = Math.max(1, page - Math.floor(maxPages / 2))
  let endPage = Math.min(totalPages, startPage + maxPages - 1)

  if (endPage - startPage < maxPages - 1) {
    startPage = Math.max(1, endPage - maxPages + 1)
  }

  for (let i = startPage; i <= endPage; i++) {
    pages.push(i)
  }

  return (
    <div className="flex items-center justify-center gap-2 py-4">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
      >
        <ChevronLeft className="w-5 h-5" />
      </Button>

      {startPage > 1 && (
        <>
          <Button variant="ghost" size="sm" onClick={() => onPageChange(1)}>
            1
          </Button>
          {startPage > 2 && <span className="text-[var(--color-text-muted)]">...</span>}
        </>
      )}

      {pages.map(p => (
        <Button
          key={p}
          variant={p === page ? 'primary' : 'ghost'}
          size="sm"
          onClick={() => onPageChange(p)}
        >
          {p}
        </Button>
      ))}

      {endPage < totalPages && (
        <>
          {endPage < totalPages - 1 && <span className="text-[var(--color-text-muted)]">...</span>}
          <Button variant="ghost" size="sm" onClick={() => onPageChange(totalPages)}>
            {totalPages}
          </Button>
        </>
      )}

      <Button
        variant="ghost"
        size="icon"
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
      >
        <ChevronRight className="w-5 h-5" />
      </Button>
    </div>
  )
}

// ============ Main Page ============

export function IngredientManagementPage() {
  const [activeTab, setActiveTab] = useState('pending')
  const [ingredients, setIngredients] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [sort, setSort] = useState('-created_at')

  const tabs = [
    { id: 'pending', label: 'Chờ duyệt', icon: Clock },
    { id: 'all', label: 'Tất cả', icon: List },
  ]

  const loadIngredients = useCallback(async (isMounted = true) => {
    setLoading(true)
    setError(null)
    try {
      const params = {
        page,
        page_size: PAGE_SIZE,
        ordering: sort,
      }

      let res
      if (activeTab === 'pending') {
        res = await adminApi.getIngredientPending(params)
      } else {
        res = await adminApi.getIngredientAll(params)
      }

      // Handle paginated response: { success, data: { count, next, previous, results } }
      const results = res.data?.results || res.data?.data || res.data || []
      const count = res.data?.count || res.data?.data?.count || 0

      if (isMounted) {
        setIngredients(results)
        setTotalCount(count)
        setTotalPages(Math.ceil(count / PAGE_SIZE))
      }
    } catch (err) {
      if (isMounted) {
        const status = err?.response?.status
        if (status === 401) {
          setError('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.')
        } else if (status === 403) {
          setError('Bạn không có quyền truy cập trang này.')
        } else if (status === 500) {
          setError('Lỗi server. Vui lòng thử lại sau.')
        } else if (err.code === 'ECONNABORTED') {
          setError('Kết nối bị timeout. Vui lòng thử lại.')
        } else {
          setError(err?.response?.data?.message || 'Không thể tải danh sách nguyên liệu.')
        }
      }
    } finally {
      if (isMounted) {
        setLoading(false)
      }
    }
  }, [activeTab, page, sort])

  useEffect(() => {
    let isMounted = true
    loadIngredients(isMounted)
    return () => {
      isMounted = false
    }
  }, [loadIngredients])

  const handleApprove = (id) => {
    setIngredients(prev => prev.filter(i => i.id !== id))
    // Refresh to update counts
    loadIngredients()
  }

  const handleReject = (id) => {
    setIngredients(prev => prev.filter(i => i.id !== id))
    // Refresh to update counts
    loadIngredients()
  }

  const handleSortChange = (newSort) => {
    setSort(newSort)
    setPage(1)
  }

  const handlePageChange = (newPage) => {
    setPage(newPage)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleTabChange = (tabId) => {
    setActiveTab(tabId)
    setPage(1)
    setIngredients([])
  }

  return (
    <div className="min-h-screen bg-[var(--color-background)]">
      {/* Header */}
      <div className="px-4 py-4">
        <h1 className="font-display text-2xl font-bold text-[var(--color-text)]">
          Quản lý nguyên liệu
        </h1>
      </div>

      {/* Tab navigation */}
      <div className="flex border-b border-[var(--color-border)]">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id)}
            className={cn(
              'flex items-center gap-2 px-6 py-4 font-medium transition-colors relative',
              activeTab === tab.id
                ? 'text-[var(--color-primary)]'
                : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
            )}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
            {activeTab === tab.id && (
              <motion.div
                layoutId="activeTab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--color-primary)]"
              />
            )}
          </button>
        ))}
      </div>

      {/* Controls */}
      <div className="px-4 py-3 flex items-center justify-between border-b border-[var(--color-border)]">
        <div className="text-sm text-[var(--color-text-secondary)]">
          {totalCount > 0 && `${totalCount} nguyên liệu`}
        </div>
        <SortControl sort={sort} onSortChange={handleSortChange} />
      </div>

      {/* Content */}
      {loading ? (
        <LoadingSkeleton />
      ) : error ? (
        <ErrorState message={error} onRetry={loadIngredients} />
      ) : ingredients.length === 0 ? (
        <EmptyState tab={activeTab} />
      ) : (
        <>
          <div className="p-4 space-y-3">
            {ingredients.map(ingredient => (
              <IngredientListItem
                key={ingredient.id}
                ingredient={ingredient}
                onApprove={handleApprove}
                onReject={handleReject}
              />
            ))}
          </div>
          <Pagination
            page={page}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </>
      )}
    </div>
  )
}

export default IngredientManagementPage