import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  List,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  AlertCircle,
  Plus,
  Pencil,
  Trash2,
  X,
} from 'lucide-react'
import toast from 'react-hot-toast'

import { cn } from '@/utils'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { categoryApi } from '@/api/categoryApi'
import { AdminNav } from '@/components/admin/AdminNav'

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
            <div className="w-12 h-12 rounded-[var(--radius-md)] bg-[var(--color-background-alt)] animate-pulse" />
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
        {tab === 'active' ? 'Không có danh mục nào đang hoạt động' : 'Không có danh mục nào'}
      </h3>
      <p className="text-[var(--color-text-secondary)] text-sm">
        {tab === 'active'
          ? 'Tất cả danh mục đã bị vô hiệu hóa.'
          : 'Danh sách danh mục trống.'}
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
        {message || 'Không thể tải danh sách danh mục. Vui lòng thử lại.'}
      </p>
      <Button variant="outline" onClick={onRetry}>
        <RefreshCw className="w-4 h-4" />
        Thử lại
      </Button>
    </motion.div>
  )
}

// ============ Category Form Dialog ============

function CategoryFormDialog({ isOpen, category, onConfirm, onCancel, loading }) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [order, setOrder] = useState(0)
  const [errors, setErrors] = useState({})

  const isEdit = Boolean(category)

  // Reset form when dialog opens/closes or category changes
  useEffect(() => {
    if (!isOpen) return

    let isActive = true
    queueMicrotask(() => {
      if (!isActive) return

      if (category) {
        setName(category.name || '')
        setDescription(category.description || '')
        setOrder(category.order || 0)
      } else {
        setName('')
        setDescription('')
        setOrder(0)
      }
      setErrors({})
    })

    return () => {
      isActive = false
    }
  }, [isOpen, category])

  const validate = () => {
    const newErrors = {}
    if (!name.trim()) {
      newErrors.name = 'Tên danh mục là bắt buộc'
    } else if (name.length > 100) {
      newErrors.name = 'Tên danh mục không được vượt quá 100 ký tự'
    }
    if (description.length > 500) {
      newErrors.description = 'Mô tả không được vượt quá 500 ký tự'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleConfirm = async () => {
    if (!validate()) return
    try {
      await onConfirm({ name: name.trim(), description: description.trim(), order })
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
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-display text-lg font-semibold text-[var(--color-text)]">
                  {isEdit ? 'Sửa danh mục' : 'Tạo danh mục mới'}
                </h3>
                <button
                  onClick={onCancel}
                  className="text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Name field */}
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text)] mb-1.5">
                    Tên danh mục <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="VD: Món Việt, Món Á, Tráng miệng..."
                    maxLength={100}
                    className={cn(
                      'w-full px-4 py-3 rounded-[var(--radius-md)]',
                      'border border-[var(--color-border)]',
                      'bg-[var(--color-surface)]',
                      'text-[var(--color-text)] text-sm',
                      'placeholder:text-[var(--color-text-muted)]',
                      'focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent',
                      'transition-all duration-[var(--transition-fast)]',
                      errors.name && 'border-red-500 focus:ring-red-500'
                    )}
                  />
                  <p className="mt-1 text-xs text-[var(--color-text-muted)] text-right">
                    {name.length}/100 ký tự
                  </p>
                  {errors.name && (
                    <p className="mt-1 text-xs text-red-500">{errors.name}</p>
                  )}
                </div>

                {/* Description field */}
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text)] mb-1.5">
                    Mô tả
                  </label>
                  <textarea
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="Mô tả ngắn về danh mục (tùy chọn)..."
                    rows={3}
                    maxLength={500}
                    className={cn(
                      'w-full px-4 py-3 rounded-[var(--radius-md)]',
                      'border border-[var(--color-border)]',
                      'bg-[var(--color-surface)]',
                      'text-[var(--color-text)] text-sm',
                      'placeholder:text-[var(--color-text-muted)]',
                      'focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent',
                      'transition-all duration-[var(--transition-fast)]',
                      'resize-none',
                      errors.description && 'border-red-500 focus:ring-red-500'
                    )}
                  />
                  <p className="mt-1 text-xs text-[var(--color-text-muted)] text-right">
                    {description.length}/500 ký tự
                  </p>
                  {errors.description && (
                    <p className="mt-1 text-xs text-red-500">{errors.description}</p>
                  )}
                </div>

                {/* Order field */}
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text)] mb-1.5">
                    Thứ tự
                  </label>
                  <input
                    type="number"
                    value={order}
                    onChange={e => setOrder(parseInt(e.target.value, 10) || 0)}
                    min={0}
                    className={cn(
                      'w-full px-4 py-3 rounded-[var(--radius-md)]',
                      'border border-[var(--color-border)]',
                      'bg-[var(--color-surface)]',
                      'text-[var(--color-text)] text-sm',
                      'focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent',
                      'transition-all duration-[var(--transition-fast)]'
                    )}
                  />
                  <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                    Số thấp hơn sẽ hiển thị trước
                  </p>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <Button variant="outline" className="flex-1" onClick={onCancel} disabled={loading}>
                  Hủy
                </Button>
                <Button
                  variant="primary"
                  className="flex-1"
                  onClick={handleConfirm}
                  disabled={loading || !name.trim() || name.length > 100 || description.length > 500}
                  isLoading={loading}
                >
                  {isEdit ? 'Lưu' : 'Tạo'}
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

// ============ Delete Confirm Dialog ============

function DeleteConfirmDialog({ isOpen, item, onConfirm, onCancel, loading }) {
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
                Xóa "{item?.name}"?
              </h3>
              <p className="text-sm text-[var(--color-text-secondary)] mb-6">
                Danh mục này sẽ bị vô hiệu hóa và không còn hiển thị cho người dùng.
              </p>
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={onCancel} disabled={loading}>
                  Hủy
                </Button>
                <Button
                  variant="danger"
                  className="flex-1"
                  onClick={onConfirm}
                  disabled={loading}
                  isLoading={loading}
                >
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

// ============ Category List Item ============

function CategoryListItem({ category, onEdit, onDelete, loadCategories }) {
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)

  const handleEdit = async (data) => {
    setActionLoading(true)
    try {
      await onEdit(category.slug, data)
      setShowEditDialog(false)
    } catch (err) {
      const status = err?.response?.status
      if (status === 401) {
        toast.error('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.')
      } else if (status === 403) {
        toast.error('Bạn không có quyền thực hiện thao tác này.')
      } else if (status === 404) {
        toast.error('Danh mục không tồn tại.')
      } else if (status === 409) {
        toast.error('Tên danh mục đã tồn tại. Vui lòng chọn tên khác.')
      } else if (status === 500) {
        toast.error('Lỗi server. Vui lòng thử lại.')
      } else {
        toast.error(err?.response?.data?.message || 'Không thể cập nhật danh mục.')
      }
      throw err
    } finally {
      setActionLoading(false)
    }
  }

  const handleDelete = async () => {
    setActionLoading(true)
    try {
      await onDelete(category.slug)
      setShowDeleteDialog(false)
    } catch (err) {
      const status = err?.response?.status
      if (status === 401) {
        toast.error('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.')
      } else if (status === 403) {
        toast.error('Bạn không có quyền thực hiện thao tác này.')
      } else if (status === 400) {
        // Category has attached recipes - backend returns specific message
        const message = err?.response?.data?.message || 'Không thể xóa danh mục có công thức đính kèm'
        toast.error(message)
      } else if (status === 500) {
        toast.error('Lỗi server. Vui lòng thử lại.')
      } else {
        toast.error(err?.response?.data?.message || 'Không thể xóa danh mục.')
      }
      throw err
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          'bg-[var(--color-surface)] rounded-[var(--radius-lg)] border border-[var(--color-border)]',
          'transition-all duration-[var(--transition-base)]'
        )}
      >
        <div className="p-4 flex items-center gap-4">
          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-display text-base font-semibold text-[var(--color-text)]">
                {category.name}
              </h3>
              <Badge
                variant={category.is_active ? 'success' : 'muted'}
                size="sm"
              >
                {category.is_active ? 'Hoạt động' : 'Không hoạt động'}
              </Badge>
            </div>
            <div className="flex items-center gap-3 mt-1 text-sm text-[var(--color-text-secondary)]">
              <span className="font-mono text-xs bg-[var(--color-background-alt)] px-2 py-0.5 rounded">
                {category.slug}
              </span>
              {category.description && (
                <>
                  <span>•</span>
                  <span className="truncate max-w-[200px]">{category.description}</span>
                </>
              )}
            </div>
            <div className="mt-1 text-xs text-[var(--color-text-muted)]">
              Thứ tự: {category.order ?? 0}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {category.is_active ? (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowEditDialog(true)}
                >
                  <Pencil className="w-4 h-4" />
                  Sửa
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDeleteDialog(true)}
                  className="text-red-500 hover:text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                  Xóa
                </Button>
              </>
            ) : (
              <Button
                variant="primary"
                size="sm"
                onClick={async () => {
                  setActionLoading(true)
                  try {
                    await categoryApi.restoreCategory(category.slug)
                    toast.success('Đã khôi phục danh mục')
                    loadCategories?.()
                  } catch (err) {
                    toast.error(err?.response?.data?.message || 'Không thể khôi phục danh mục')
                  } finally {
                    setActionLoading(false)
                  }
                }}
                disabled={actionLoading}
              >
                <RefreshCw className="w-4 h-4" />
                Khôi phục
              </Button>
            )}
          </div>
        </div>
      </motion.div>

      {/* Dialogs */}
      <CategoryFormDialog
        isOpen={showEditDialog}
        category={category}
        onConfirm={handleEdit}
        onCancel={() => setShowEditDialog(false)}
        loading={actionLoading}
      />
      <DeleteConfirmDialog
        isOpen={showDeleteDialog}
        item={category}
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteDialog(false)}
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
        <option value="-order,name">Thứ tự (cao → thấp)</option>
        <option value="order,name">Thứ tự (thấp → cao)</option>
        <option value="-name">Tên (Z → A)</option>
        <option value="name">Tên (A → Z)</option>
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

export function CategoryManagementPage() {
  const [activeTab, setActiveTab] = useState('active')
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [sort, setSort] = useState('-order,name')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [createLoading, setCreateLoading] = useState(false)

  const tabs = [
    { id: 'active', label: 'Hoạt động', icon: CheckCircle },
    { id: 'all', label: 'Tất cả', icon: List },
  ]

  const loadCategories = useCallback(async (isMounted = true) => {
    setLoading(true)
    setError(null)
    try {
      const params = {
        page,
        page_size: PAGE_SIZE,
        ordering: sort,
      }

      // Filter by tab in admin management only
      if (activeTab === 'active') {
        params.is_active = true
      } else if (activeTab === 'all') {
        params.include_inactive = true
      }

      const res = await categoryApi.getCategories(params)

      // Handle paginated response: { count, next, previous, results: [...] }
      const results = res?.results || res?.data?.results || []
      const count = res?.count || res?.data?.count || 0

      if (isMounted) {
        setCategories(results)
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
          setError(err?.response?.data?.message || 'Không thể tải danh sách danh mục.')
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
    const timer = setTimeout(() => {
      loadCategories(isMounted)
    }, 0)
    return () => {
      isMounted = false
      clearTimeout(timer)
    }
  }, [loadCategories])

  const handleCreate = async (data) => {
    setCreateLoading(true)
    try {
      await categoryApi.createCategory(data)
      toast.success('Đã tạo danh mục mới')
      setShowCreateDialog(false)
      loadCategories()
    } catch (err) {
      const status = err?.response?.status
      if (status === 401) {
        toast.error('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.')
      } else if (status === 403) {
        toast.error('Bạn không có quyền thực hiện thao tác này.')
      } else if (status === 409) {
        toast.error('Tên danh mục đã tồn tại. Vui lòng chọn tên khác.')
      } else if (status === 500) {
        toast.error('Lỗi server. Vui lòng thử lại.')
      } else {
        toast.error(err?.response?.data?.message || 'Không thể tạo danh mục.')
      }
      throw err
    } finally {
      setCreateLoading(false)
    }
  }

  const handleEdit = async (slug, data) => {
    await categoryApi.updateCategory(slug, data)
    toast.success('Đã cập nhật danh mục')
    loadCategories()
  }

  const handleDelete = async (slug) => {
    await categoryApi.deleteCategory(slug)
    toast.success('Đã xóa danh mục')
    loadCategories()
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
    setCategories([])
  }

  return (
    <div className="min-h-screen bg-[var(--color-background)]">
      <AdminNav />
      {/* Header */}
      <div className="px-4 py-4 flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-[var(--color-text)]">
          Quản lý danh mục
        </h1>
        <Button
          variant="primary"
          onClick={() => setShowCreateDialog(true)}
        >
          <Plus className="w-4 h-4" />
          Tạo danh mục
        </Button>
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
          {totalCount > 0 && `${totalCount} danh mục`}
        </div>
        <div className="flex items-center gap-3">
          <SortControl sort={sort} onSortChange={handleSortChange} />
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <LoadingSkeleton />
      ) : error ? (
        <ErrorState message={error} onRetry={loadCategories} />
      ) : categories.length === 0 ? (
        <EmptyState tab={activeTab} />
      ) : (
        <>
          <div className="p-4 space-y-3">
            {categories.map(category => (
              <CategoryListItem
                key={category.id || category.slug}
                category={category}
                onEdit={handleEdit}
                onDelete={handleDelete}
                loadCategories={loadCategories}
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

      {/* Create Dialog */}
      <CategoryFormDialog
        isOpen={showCreateDialog}
        category={null}
        onConfirm={handleCreate}
        onCancel={() => setShowCreateDialog(false)}
        loading={createLoading}
      />
    </div>
  )
}

export default CategoryManagementPage
