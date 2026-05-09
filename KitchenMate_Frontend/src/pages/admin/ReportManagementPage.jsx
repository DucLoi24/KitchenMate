/**
 * Admin Report Management Page - KitchenMate
 *
 * Trang quản lý báo cáo cho admin.
 * Hiển thị danh sách báo cáo với filter theo status.
 * Cho phép duyệt/bỏ qua/xử lý báo cáo.
 */

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Flag,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Search,
  Eye,
  Ban,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import toast from 'react-hot-toast'

import { cn } from '@/utils'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'

const PAGE_SIZE = 20

const STATUS_FILTERS = [
  { value: '', label: 'Tất cả' },
  { value: 'PENDING', label: 'Chờ xử lý' },
  { value: 'REVIEWED', label: 'Đã xử lý' },
  { value: 'DISMISSED', label: 'Bỏ qua' },
]

const STATUS_CONFIG = {
  PENDING: {
    label: 'Chờ xử lý',
    icon: Clock,
    bg: 'bg-amber-100',
    text: 'text-amber-700',
    border: 'border-amber-200',
  },
  REVIEWED: {
    label: 'Đã xử lý',
    icon: CheckCircle,
    bg: 'bg-emerald-100',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
  },
  DISMISSED: {
    label: 'Bỏ qua',
    icon: XCircle,
    bg: 'bg-gray-100',
    text: 'text-gray-600',
    border: 'border-gray-200',
  },
}

const TARGET_TYPE_CONFIG = {
  recipe: { label: 'Công thức', icon: Flag },
  review: { label: 'Đánh giá', icon: MessageSquare },
  user: { label: 'Người dùng', icon: Ban },
}

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
            <div className="h-6 w-24 bg-[var(--color-background-alt)] rounded animate-pulse" />
          </div>
        </motion.div>
      ))}
    </div>
  )
}

// ============ Empty State ============

function EmptyState() {
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
        Không có báo cáo nào
      </h3>
      <p className="text-[var(--color-text-secondary)] text-sm">
        Tất cả báo cáo đã được xử lý.
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
        <AlertTriangle className="w-10 h-10 text-red-400" />
      </div>
      <h3 className="font-display text-lg font-semibold text-[var(--color-text)] mb-2">
        Đã xảy ra lỗi
      </h3>
      <p className="text-[var(--color-text-secondary)] text-sm mb-6 max-w-md">
        {message || 'Không thể tải danh sách báo cáo. Vui lòng thử lại.'}
      </p>
      <Button variant="outline" onClick={onRetry}>
        <RefreshCw className="w-4 h-4" />
        Thử lại
      </Button>
    </motion.div>
  )
}

// ============ Status Badge ============

function StatusBadge({ status }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.PENDING
  const Icon = config.icon

  return (
    <span className={cn(
      'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border',
      config.bg,
      config.text,
      config.border
    )}>
      <Icon className="w-3 h-3" />
      {config.label}
    </span>
  )
}

// ============ Report Card ============

function ReportCard({ report, onView, onProcess }) {
  const targetConfig = TARGET_TYPE_CONFIG[report.target_type] || TARGET_TYPE_CONFIG.recipe
  const TargetIcon = targetConfig.icon

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[var(--color-surface)] rounded-[var(--radius-lg)] border border-[var(--color-border)] p-4 hover:shadow-[var(--shadow-md)] transition-shadow"
    >
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
          <Flag className="w-6 h-6 text-red-500" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div>
              <h3 className="font-medium text-[var(--color-text)] mb-1">
                Báo cáo {targetConfig.label}
              </h3>
              <p className="text-sm text-[var(--color-text-secondary)]">
                Người báo cáo: <span className="font-medium">{report.reporter_name || 'Không xác định'}</span>
              </p>
            </div>
            <StatusBadge status={report.status} />
          </div>

          <div className="bg-[var(--color-background-alt)] rounded-[var(--radius-md)] p-3 mb-3">
            <p className="text-sm text-[var(--color-text)]">
              <span className="text-[var(--color-text-secondary)]">Lý do: </span>
              <span className="font-medium">{report.reason_display || report.reason}</span>
            </p>
            {report.target_label && (
              <p className="text-sm text-[var(--color-text-secondary)] mt-1">
                <span className="text-[var(--color-text-secondary)]">Nội dung: </span>
                <span className="font-medium text-[var(--color-text)]">{report.target_label}</span>
              </p>
            )}
            {report.additional_info && (
              <p className="text-sm text-[var(--color-text-secondary)] mt-1 line-clamp-2">
                {report.additional_info}
              </p>
            )}
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {report.target_url && (
                <a
                  href={report.target_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-[var(--color-primary)] hover:underline flex items-center gap-1"
                >
                  <Eye className="w-3 h-3" />
                  Xem nội dung
                </a>
              )}
            </div>
            <span className="text-xs text-[var(--color-text-muted)]">
              {new Date(report.created_at).toLocaleDateString('vi-VN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onView(report)}
              >
                <Eye className="w-4 h-4" />
                Chi tiết
              </Button>

              {report.status === 'PENDING' && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => onProcess(report)}
                >
                  Xử lý
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// ============ Process Dialog ============

function ProcessDialog({ isOpen, report, onConfirm, onCancel, loading }) {
  const [action, setAction] = useState('')
  const [note, setNote] = useState('')

  useEffect(() => {
    if (!isOpen) {
      setAction('')
      setNote('')
    }
  }, [isOpen])

  const handleConfirm = async () => {
    if (!action) return
    try {
      await onConfirm(action, note)
    } catch {
      // Error handled by caller
    }
  }

  const actions = [
    { value: 'dismiss', label: 'Bỏ qua', description: 'Báo cáo không hợp lệ', icon: XCircle, variant: 'outline' },
    { value: 'remove_content', label: 'Xóa nội dung', description: 'Xóa nội dung vi phạm', icon: Ban, variant: 'danger' },
    { value: 'warn_user', label: 'Cảnh báo', description: 'Gửi cảnh báo đến người dùng', icon: AlertTriangle, variant: 'warning' },
  ]

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
            <div className="bg-[var(--color-surface)] rounded-[var(--radius-xl)] border border-[var(--color-border)] shadow-[var(--shadow-xl)] p-6 max-w-lg w-full">
              <h3 className="font-display text-lg font-semibold text-[var(--color-text)] mb-4">
                Xử lý báo cáo
              </h3>

              {/* Action selection */}
              <div className="space-y-3 mb-4">
                {actions.map(a => {
                  const Icon = a.icon
                  return (
                    <button
                      key={a.value}
                      onClick={() => setAction(a.value)}
                      className={cn(
                        'w-full flex items-center gap-3 p-3 rounded-[var(--radius-md)] border transition-all text-left',
                        action === a.value
                          ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10'
                          : 'border-[var(--color-border)] hover:border-[var(--color-primary)]/50'
                      )}
                    >
                      <div className={cn(
                        'w-10 h-10 rounded-full flex items-center justify-center',
                        a.variant === 'danger' ? 'bg-red-100' :
                        a.variant === 'warning' ? 'bg-amber-100' : 'bg-gray-100'
                      )}>
                        <Icon className={cn(
                          'w-5 h-5',
                          a.variant === 'danger' ? 'text-red-500' :
                          a.variant === 'warning' ? 'text-amber-500' : 'text-gray-500'
                        )} />
                      </div>
                      <div>
                        <p className="font-medium text-[var(--color-text)]">{a.label}</p>
                        <p className="text-sm text-[var(--color-text-secondary)]">{a.description}</p>
                      </div>
                    </button>
                  )
                })}
              </div>

              {/* Note */}
              <textarea
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder="Ghi chú (tùy chọn)..."
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
                  variant={action === 'remove_content' ? 'danger' : 'primary'}
                  className="flex-1"
                  onClick={handleConfirm}
                  disabled={!action || loading}
                  isLoading={loading}
                >
                  Xác nhận
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

// ============ Detail Dialog ============

function DetailDialog({ isOpen, report, onClose }) {
  if (!report) return null

  const targetConfig = TARGET_TYPE_CONFIG[report.target_type] || TARGET_TYPE_CONFIG.recipe
  const TargetIcon = targetConfig.icon

  return (
    <AnimatePresence>
      {isOpen && (
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
            <div className="bg-[var(--color-surface)] rounded-[var(--radius-xl)] border border-[var(--color-border)] shadow-[var(--shadow-xl)] p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto">
              <h3 className="font-display text-lg font-semibold text-[var(--color-text)] mb-4">
                Chi tiết báo cáo
              </h3>

              <div className="space-y-4">
                {/* Status */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[var(--color-text-secondary)]">Trạng thái:</span>
                  <StatusBadge status={report.status} />
                </div>

                {/* Target type */}
                <div className="flex items-center gap-2">
                  <TargetIcon className="w-4 h-4 text-[var(--color-text-secondary)]" />
                  <span className="text-sm text-[var(--color-text-secondary)]">Loại:</span>
                  <span className="text-sm font-medium text-[var(--color-text)]">{targetConfig.label}</span>
                </div>

                {/* Reason */}
                <div className="bg-[var(--color-background-alt)] rounded-[var(--radius-md)] p-3">
                  <p className="text-sm text-[var(--color-text-secondary)] mb-1">Lý do báo cáo:</p>
                  <p className="font-medium text-[var(--color-text)]">{report.reason_display || report.reason}</p>
                </div>

                {/* Additional info */}
                {report.additional_info && (
                  <div className="bg-[var(--color-background-alt)] rounded-[var(--radius-md)] p-3">
                    <p className="text-sm text-[var(--color-text-secondary)] mb-1">Thông tin bổ sung:</p>
                    <p className="text-sm text-[var(--color-text)]">{report.additional_info}</p>
                  </div>
                )}

                {/* Reporter */}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-[var(--color-text-secondary)]">Người báo cáo:</span>
                  <span className="text-sm font-medium text-[var(--color-text)]">{report.reporter_name || 'Không xác định'}</span>
                </div>

                {/* Created at */}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-[var(--color-text-secondary)]">Thời gian:</span>
                  <span className="text-sm text-[var(--color-text)]">
                    {new Date(report.created_at).toLocaleDateString('vi-VN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>

                {/* Review info */}
                {report.reviewed_by_name && (
                  <div className="border-t border-[var(--color-border)] pt-4 mt-4">
                    <p className="text-sm text-[var(--color-text-secondary)] mb-2">Đã xử lý bởi: {report.reviewed_by_name}</p>
                    {report.review_note && (
                      <p className="text-sm text-[var(--color-text-secondary)]">Ghi chú: {report.review_note}</p>
                    )}
                  </div>
                )}
              </div>

              <div className="mt-6">
                <Button variant="outline" className="w-full" onClick={onClose}>
                  Đóng
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

// ============ Main Page ============

export function ReportManagementPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [reports, setReports] = useState([])
  const [pagination, setPagination] = useState(null)
  const [statusFilter, setStatusFilter] = useState('')

  // Dialogs
  const [selectedReport, setSelectedReport] = useState(null)
  const [showDetail, setShowDetail] = useState(false)
  const [showProcess, setShowProcess] = useState(false)
  const [processLoading, setProcessLoading] = useState(false)

  const fetchReports = async (page = 1) => {
    setLoading(true)
    setError(null)

    try {
      const { adminApi: api } = await import('@/api/adminApi')
      const params = { page, page_size: PAGE_SIZE }
      if (statusFilter) params.status = statusFilter

      const res = await api.getReports(params)
      setReports(res?.data?.results || res?.data?.data || res?.data || [])
      setPagination(res?.data)
    } catch (err) {
      console.error('Failed to fetch reports:', err)
      setError(err?.response?.data?.message || 'Không thể tải danh sách báo cáo')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReports()
  }, [statusFilter])

  const handleView = (report) => {
    setSelectedReport(report)
    setShowDetail(true)
  }

  const handleProcess = (report) => {
    setSelectedReport(report)
    setShowProcess(true)
  }

  const handleProcessConfirm = async (action, note) => {
    if (!selectedReport) return

    setProcessLoading(true)
    try {
      const { adminApi: api } = await import('@/api/adminApi')
      await api.reviewReport(selectedReport.id, action, note)

      toast.success('Đã xử lý báo cáo thành công')
      setShowProcess(false)
      setSelectedReport(null)
      fetchReports()
    } catch (err) {
      console.error('Failed to process report:', err)
      toast.error(err?.response?.data?.message || 'Không thể xử lý báo cáo')
      throw err
    } finally {
      setProcessLoading(false)
    }
  }

  const handlePageChange = (newPage) => {
    fetchReports(newPage)
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-[var(--color-text)]">
          Quản lý báo cáo
        </h1>
        <p className="text-[var(--color-text-secondary)] text-sm mt-1">
          Xem và xử lý các báo cáo từ người dùng
        </p>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
        {STATUS_FILTERS.map(filter => (
          <button
            key={filter.value}
            onClick={() => setStatusFilter(filter.value)}
            className={cn(
              'px-4 py-2 rounded-[var(--radius-md)] text-sm font-medium whitespace-nowrap transition-all',
              statusFilter === filter.value
                ? 'bg-[var(--color-primary)] text-white'
                : 'bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:bg-[var(--color-background-alt)]'
            )}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <LoadingSkeleton />
      ) : error ? (
        <ErrorState message={error} onRetry={() => fetchReports()} />
      ) : reports.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          <div className="space-y-4">
            {reports.map(report => (
              <ReportCard
                key={report.id}
                report={report}
                onView={handleView}
                onProcess={handleProcess}
              />
            ))}
          </div>

          {/* Pagination */}
          {pagination && pagination.total_pages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(pagination.current_page - 1)}
                disabled={pagination.current_page <= 1}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-sm text-[var(--color-text-secondary)] px-4">
                Trang {pagination.current_page} / {pagination.total_pages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(pagination.current_page + 1)}
                disabled={pagination.current_page >= pagination.total_pages}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </>
      )}

      {/* Dialogs */}
      <DetailDialog
        isOpen={showDetail}
        report={selectedReport}
        onClose={() => {
          setShowDetail(false)
          setSelectedReport(null)
        }}
      />

      <ProcessDialog
        isOpen={showProcess}
        report={selectedReport}
        onConfirm={handleProcessConfirm}
        onCancel={() => {
          setShowProcess(false)
          setSelectedReport(null)
        }}
        loading={processLoading}
      />
    </div>
  )
}

export default ReportManagementPage
