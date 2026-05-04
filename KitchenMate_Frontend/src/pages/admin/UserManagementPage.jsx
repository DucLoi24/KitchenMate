import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  List,
  Users,
  ShieldAlert,
  Search,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  UserX,
  UserCheck,
  Shield,
  ShieldOff,
  X,
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import { cn } from '@/utils'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { adminApi } from '@/api/adminApi'
import { useAuthStore } from '@/stores'

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
            <div className="w-12 h-12 rounded-full bg-[var(--color-background-alt)] animate-pulse" />
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

function EmptyState({ tab, searchTerm }) {
  const messages = {
    all: { title: 'Không có người dùng nào', desc: 'Danh sách người dùng trống.' },
    blocked: { title: 'Không có người dùng bị khóa', desc: 'Không có tài khoản nào bị khóa.' },
    admin: { title: 'Không có quản trị viên', desc: 'Không có tài khoản quản trị viên nào.' },
  }

  const msg = messages[tab] || messages.all

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-16 px-6 text-center"
    >
      <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-4">
        <Users className="w-10 h-10 text-green-500" />
      </div>
      <h3 className="font-display text-lg font-semibold text-[var(--color-text)] mb-2">
        {searchTerm ? `Không tìm thấy người dùng nào phù hợp` : msg.title}
      </h3>
      <p className="text-[var(--color-text-secondary)] text-sm">
        {searchTerm
          ? `Không có kết quả cho "${searchTerm}". Hãy thử từ khóa khác.`
          : msg.desc}
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
        {message || 'Không thể tải danh sách người dùng. Vui lòng thử lại.'}
      </p>
      <Button variant="outline" onClick={onRetry}>
        <RefreshCw className="w-4 h-4" />
        Thử lại
      </Button>
    </motion.div>
  )
}

// ============ User List Item ============

function UserListItem({ user, onBlock, onUnblock, onAssignAdmin, onRemoveAdmin, currentUserId }) {
  const [expanded, setExpanded] = useState(false)
  const isSelf = user.id === currentUserId

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }

  const statusBadge = user.is_active
    ? { variant: 'success', label: 'Hoạt động' }
    : { variant: 'danger', label: 'Bị khóa' }

  const roleBadge = user.is_staff
    ? { variant: 'primary', label: 'Quản trị viên' }
    : { variant: 'muted', label: 'Người dùng' }

  return (
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
        {/* Avatar */}
        <div className="w-12 h-12 rounded-full bg-[var(--color-background-alt)] overflow-hidden flex-shrink-0">
          {user.avatar_url ? (
            <img
              src={user.avatar_url}
              alt={user.full_name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-lg font-semibold text-[var(--color-text-muted)]">
              {user.full_name?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase() || '?'}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h3 className="font-display text-base font-semibold text-[var(--color-text)]">
            {user.full_name || 'N/A'}
          </h3>
          <p className="text-sm text-[var(--color-text-secondary)] mt-1">
            {user.email}
          </p>
          <div className="flex items-center gap-3 mt-2 text-xs text-[var(--color-text-muted)]">
            <span>Tham gia: {formatDate(user.created_at)}</span>
          </div>
        </div>

        {/* Badges & expand */}
        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-2">
            <Badge variant={roleBadge.variant} size="sm">
              {roleBadge.label}
            </Badge>
            <Badge variant={statusBadge.variant} size="sm">
              {statusBadge.label}
            </Badge>
          </div>
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
                  <h4 className="text-sm font-medium text-[var(--color-text)] mb-1">Họ tên</h4>
                  <p className="text-sm text-[var(--color-text-secondary)]">{user.full_name || 'N/A'}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-[var(--color-text)] mb-1">Email</h4>
                  <p className="text-sm text-[var(--color-text-secondary)]">{user.email}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-[var(--color-text)] mb-1">Ngày tham gia</h4>
                  <p className="text-sm text-[var(--color-text-secondary)]">{formatDate(user.created_at)}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-[var(--color-text)] mb-1">Trạng thái</h4>
                  <p className="text-sm text-[var(--color-text-secondary)]">
                    {user.is_active ? 'Hoạt động' : 'Bị khóa'}
                  </p>
                </div>
              </div>

              {/* Bio if available */}
              {user.bio && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-[var(--color-text)] mb-1">Giới thiệu</h4>
                  <p className="text-sm text-[var(--color-text-secondary)]">{user.bio}</p>
                </div>
              )}

              {/* Action buttons - disabled for self */}
              {!isSelf && (
                <div className="flex gap-3 pt-4 border-t border-[var(--color-border)]">
                  {user.is_active ? (
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        onBlock(user)
                      }}
                    >
                      <UserX className="w-4 h-4" />
                      Khóa
                    </Button>
                  ) : (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        onUnblock(user)
                      }}
                    >
                      <UserCheck className="w-4 h-4" />
                      Mở khóa
                    </Button>
                  )}
                  {user.is_staff ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        onRemoveAdmin(user)
                      }}
                    >
                      <ShieldOff className="w-4 h-4" />
                      Xóa quyền admin
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        onAssignAdmin(user)
                      }}
                    >
                      <Shield className="w-4 h-4" />
                      Phân quyền admin
                    </Button>
                  )}
                </div>
              )}

              {/* Self indicator */}
              {isSelf && (
                <div className="pt-4 border-t border-[var(--color-border)]">
                  <p className="text-sm text-[var(--color-text-muted)] italic">
                    Đây là tài khoản của bạn
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ============ Block User Dialog ============

function BlockUserDialog({ isOpen, user, onConfirm, onCancel, loading, error }) {
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
                Khóa tài khoản "{user?.full_name}"?
              </h3>
              <p className="text-sm text-[var(--color-text-secondary)] mb-6">
                Người dùng này sẽ không thể đăng nhập cho đến khi được mở khóa. Hành động này có thể hoàn tác.
              </p>
              {error && (
                <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-600">
                  {error}
                </div>
              )}
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
                  <UserX className="w-4 h-4" />
                  Khóa
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

// ============ Unblock User Dialog ============

function UnblockUserDialog({ isOpen, user, onConfirm, onCancel, loading, error }) {
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
                Mở khóa tài khoản "{user?.full_name}"?
              </h3>
              <p className="text-sm text-[var(--color-text-secondary)] mb-6">
                Người dùng này sẽ có thể đăng nhập trở lại.
              </p>
              {error && (
                <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-600">
                  {error}
                </div>
              )}
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={onCancel} disabled={loading}>
                  Hủy
                </Button>
                <Button
                  variant="primary"
                  className="flex-1"
                  onClick={onConfirm}
                  disabled={loading}
                  isLoading={loading}
                >
                  <UserCheck className="w-4 h-4" />
                  Mở khóa
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

// ============ Assign Admin Dialog ============

function AssignAdminDialog({ isOpen, user, onConfirm, onCancel, loading, error }) {
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
                Phân quyền admin cho "{user?.full_name}"?
              </h3>
              <p className="text-sm text-[var(--color-text-secondary)] mb-6">
                Người dùng này sẽ có quyền truy cập trang quản trị và quản lý nội dung.
              </p>
              {error && (
                <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-600">
                  {error}
                </div>
              )}
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={onCancel} disabled={loading}>
                  Hủy
                </Button>
                <Button
                  variant="primary"
                  className="flex-1"
                  onClick={onConfirm}
                  disabled={loading}
                  isLoading={loading}
                >
                  <Shield className="w-4 h-4" />
                  Phân quyền
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

// ============ Remove Admin Dialog ============

function RemoveAdminDialog({ isOpen, user, onConfirm, onCancel, loading, error }) {
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
                Xóa quyền admin của "{user?.full_name}"?
              </h3>
              <p className="text-sm text-[var(--color-text-secondary)] mb-6">
                Người dùng này sẽ mất quyền truy cập trang quản trị.
              </p>
              {error && (
                <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-600">
                  {error}
                </div>
              )}
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
                  <ShieldOff className="w-4 h-4" />
                  Xóa quyền
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
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
        <option value="full_name">Tên A-Z</option>
        <option value="-full_name">Tên Z-A</option>
        <option value="email">Email A-Z</option>
        <option value="-email">Email Z-A</option>
      </select>
    </div>
  )
}

// ============ Search Input ============

function SearchInput({ value, onChange }) {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" />
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder="Tìm kiếm theo tên hoặc email..."
        className={cn(
          'h-9 pl-9 pr-4 rounded-[var(--radius-md)]',
          'border border-[var(--color-border)]',
          'bg-[var(--color-surface)]',
          'text-[var(--color-text)] text-sm',
          'placeholder:text-[var(--color-text-muted)]',
          'focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent',
          'w-64'
        )}
      />
      {value && (
        <button
          onClick={() => onChange('')}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  )
}

// ============ Pagination ============

function Pagination({ page, totalPages, totalCount, onPageChange }) {
  if (totalPages <= 0) return null

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-[var(--color-border)]">
      <div className="text-sm text-[var(--color-text-secondary)]">
        Trang {page} / {totalPages} • {totalCount} người dùng
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
        >
          <ChevronLeft className="w-4 h-4" />
          Trước
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
        >
          Sau
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}

// ============ Main Page ============

export function UserManagementPage() {
  const [activeTab, setActiveTab] = useState('all')
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [sort, setSort] = useState('-created_at')
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  const currentUser = useAuthStore(state => state.user)
  const currentUserId = currentUser?.id

  const [dialogState, setDialogState] = useState({
    block: { isOpen: false, user: null, loading: false, error: null },
    unblock: { isOpen: false, user: null, loading: false, error: null },
    assignAdmin: { isOpen: false, user: null, loading: false, error: null },
    removeAdmin: { isOpen: false, user: null, loading: false, error: null },
  })

  const openDialog = (type, user) => {
    setDialogState(prev => ({
      ...prev,
      [type]: { isOpen: true, user, loading: false, error: null },
    }))
  }

  const closeDialog = (type) => {
    setDialogState(prev => ({
      ...prev,
      [type]: { isOpen: false, user: null, loading: false, error: null },
    }))
  }

  const handleBlockUser = async () => {
    const user = dialogState.block.user
    setDialogState(prev => ({ ...prev, block: { ...prev.block, loading: true, error: null } }))
    try {
      await adminApi.blockUser(user.id)
      toast.success(`Đã khóa tài khoản ${user.email}`)
      closeDialog('block')
      loadUsers()
    } catch (err) {
      const status = err?.response?.status
      let errorMsg = 'Không thể khóa tài khoản.'
      if (status === 401) {
        errorMsg = 'Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.'
      } else if (status === 403) {
        errorMsg = 'Bạn không có quyền thực hiện thao tác này.'
      } else if (status === 500) {
        errorMsg = 'Lỗi server. Vui lòng thử lại.'
      } else {
        errorMsg = err?.response?.data?.message || 'Không thể khóa tài khoản.'
      }
      setDialogState(prev => ({ ...prev, block: { ...prev.block, loading: false, error: errorMsg } }))
    }
  }

  const handleUnblockUser = async () => {
    const user = dialogState.unblock.user
    setDialogState(prev => ({ ...prev, unblock: { ...prev.unblock, loading: true, error: null } }))
    try {
      await adminApi.unblockUser(user.id)
      toast.success(`Đã mở khóa tài khoản ${user.email}`)
      closeDialog('unblock')
      loadUsers()
    } catch (err) {
      const status = err?.response?.status
      let errorMsg = 'Không thể mở khóa tài khoản.'
      if (status === 401) {
        errorMsg = 'Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.'
      } else if (status === 403) {
        errorMsg = 'Bạn không có quyền thực hiện thao tác này.'
      } else if (status === 500) {
        errorMsg = 'Lỗi server. Vui lòng thử lại.'
      } else {
        errorMsg = err?.response?.data?.message || 'Không thể mở khóa tài khoản.'
      }
      setDialogState(prev => ({ ...prev, unblock: { ...prev.unblock, loading: false, error: errorMsg } }))
    }
  }

  const handleAssignAdmin = async () => {
    const user = dialogState.assignAdmin.user
    setDialogState(prev => ({ ...prev, assignAdmin: { ...prev.assignAdmin, loading: true, error: null } }))
    try {
      await adminApi.setAdminRole(user.id, true)
      toast.success(`Đã phân quyền admin cho ${user.email}`)
      closeDialog('assignAdmin')
      loadUsers()
    } catch (err) {
      const status = err?.response?.status
      let errorMsg = 'Không thể phân quyền admin.'
      if (status === 401) {
        errorMsg = 'Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.'
      } else if (status === 403) {
        errorMsg = 'Bạn không có quyền thực hiện thao tác này. Chỉ quản trị viên mới có thể thực hiện.'
      } else if (status === 500) {
        errorMsg = 'Lỗi server. Vui lòng thử lại.'
      } else {
        errorMsg = err?.response?.data?.message || 'Không thể phân quyền admin.'
      }
      setDialogState(prev => ({ ...prev, assignAdmin: { ...prev.assignAdmin, loading: false, error: errorMsg } }))
    }
  }

  const handleRemoveAdmin = async () => {
    const user = dialogState.removeAdmin.user
    setDialogState(prev => ({ ...prev, removeAdmin: { ...prev.removeAdmin, loading: true, error: null } }))
    try {
      await adminApi.setAdminRole(user.id, false)
      toast.success(`Đã xóa quyền admin của ${user.email}`)
      closeDialog('removeAdmin')
      loadUsers()
    } catch (err) {
      const status = err?.response?.status
      let errorMsg = 'Không thể xóa quyền admin.'
      if (status === 401) {
        errorMsg = 'Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.'
      } else if (status === 403) {
        errorMsg = 'Bạn không có quyền thực hiện thao tác này. Chỉ quản trị viên mới có thể thực hiện.'
      } else if (status === 500) {
        errorMsg = 'Lỗi server. Vui lòng thử lại.'
      } else {
        errorMsg = err?.response?.data?.message || 'Không thể xóa quyền admin.'
      }
      setDialogState(prev => ({ ...prev, removeAdmin: { ...prev.removeAdmin, loading: false, error: errorMsg } }))
    }
  }

  const tabs = [
    { id: 'all', label: 'Tất cả', icon: List },
    { id: 'blocked', label: 'Bị khóa', icon: ShieldAlert },
    { id: 'admin', label: 'Quản trị viên', icon: Shield },
  ]

  // Debounce search input (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (search.length === 0 || search.length >= 2) {
        setDebouncedSearch(search)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [search])

  const loadUsers = useCallback(async (isMounted = true) => {
    setLoading(true)
    setError(null)
    try {
      const params = {
        page,
        page_size: PAGE_SIZE,
        ordering: sort,
      }

      if (debouncedSearch) {
        params.search = debouncedSearch
      }

      // Tab-based filtering
      if (activeTab === 'blocked') {
        params.is_active = false
      } else if (activeTab === 'admin') {
        params.is_staff = true
      }

      const res = await adminApi.getUsers(params)

      // Handle paginated response: { success, data: { count, next, previous, results } }
      const results = res.data?.results || res.data?.data || res.data || []
      const count = res.data?.count || res.data?.data?.count || 0

      if (isMounted) {
        setUsers(results)
        setTotalCount(count)
        setTotalPages(Math.ceil(count / PAGE_SIZE) || 1)
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
          setError(err?.response?.data?.message || 'Không thể tải danh sách người dùng.')
        }
      }
    } finally {
      if (isMounted) {
        setLoading(false)
      }
    }
  }, [activeTab, page, sort, debouncedSearch])

  useEffect(() => {
    let isMounted = true
    loadUsers(isMounted)
    return () => {
      isMounted = false
    }
  }, [loadUsers])

  const handleSortChange = (newSort) => {
    setSort(newSort)
  }

  const handlePageChange = (newPage) => {
    setPage(newPage)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleTabChange = (tabId) => {
    setActiveTab(tabId)
    setPage(1)
    setUsers([])
  }

  const handleSearchChange = (value) => {
    setSearch(value)
  }

  return (
    <div className="min-h-screen bg-[var(--color-background)]">
      {/* Header */}
      <div className="px-4 py-4">
        <h1 className="font-display text-2xl font-bold text-[var(--color-text)]">
          Quản lý người dùng
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
          {totalCount > 0 && `${totalCount} người dùng`}
        </div>
        <div className="flex items-center gap-3">
          <SearchInput value={search} onChange={handleSearchChange} />
          <SortControl sort={sort} onSortChange={handleSortChange} />
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <LoadingSkeleton />
      ) : error ? (
        <ErrorState message={error} onRetry={loadUsers} />
      ) : users.length === 0 ? (
        <EmptyState tab={activeTab} searchTerm={debouncedSearch} />
      ) : (
        <>
          <div className="p-4 space-y-3">
            {users.map(user => (
              <UserListItem
                key={user.id}
                user={user}
                onBlock={(u) => openDialog('block', u)}
                onUnblock={(u) => openDialog('unblock', u)}
                onAssignAdmin={(u) => openDialog('assignAdmin', u)}
                onRemoveAdmin={(u) => openDialog('removeAdmin', u)}
                currentUserId={currentUserId}
              />
            ))}
          </div>
          <Pagination
            page={page}
            totalPages={totalPages}
            totalCount={totalCount}
            onPageChange={handlePageChange}
          />
        </>
      )}

      {/* Dialogs */}
      <BlockUserDialog
        isOpen={dialogState.block.isOpen}
        user={dialogState.block.user}
        onConfirm={handleBlockUser}
        onCancel={() => closeDialog('block')}
        loading={dialogState.block.loading}
        error={dialogState.block.error}
      />
      <UnblockUserDialog
        isOpen={dialogState.unblock.isOpen}
        user={dialogState.unblock.user}
        onConfirm={handleUnblockUser}
        onCancel={() => closeDialog('unblock')}
        loading={dialogState.unblock.loading}
        error={dialogState.unblock.error}
      />
      <AssignAdminDialog
        isOpen={dialogState.assignAdmin.isOpen}
        user={dialogState.assignAdmin.user}
        onConfirm={handleAssignAdmin}
        onCancel={() => closeDialog('assignAdmin')}
        loading={dialogState.assignAdmin.loading}
        error={dialogState.assignAdmin.error}
      />
      <RemoveAdminDialog
        isOpen={dialogState.removeAdmin.isOpen}
        user={dialogState.removeAdmin.user}
        onConfirm={handleRemoveAdmin}
        onCancel={() => closeDialog('removeAdmin')}
        loading={dialogState.removeAdmin.loading}
        error={dialogState.removeAdmin.error}
      />
    </div>
  )
}

export default UserManagementPage