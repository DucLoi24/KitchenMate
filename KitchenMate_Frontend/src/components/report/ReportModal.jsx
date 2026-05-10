import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, AlertTriangle } from 'lucide-react'
import { cn } from '@/utils'
import { Button } from '@/components/ui/Button'
import { reportsApi } from '@/api/reportsApi'
import toast from 'react-hot-toast'

const REPORT_REASONS = [
  { value: 'SPAM', label: 'Spam' },
  { value: 'WRONG_CONTENT', label: 'Nội dung sai' },
  { value: 'HARASSMENT', label: 'Quấy rối' },
  { value: 'COPYRIGHT', label: 'Vi phạm bản quyền' },
  { value: 'INAPPROPRIATE', label: 'Không phù hợp' },
]

/**
 * Modal báo cáo nội dung vi phạm
 * @param {Object} props
 * @param {boolean} props.isOpen - Modal visibility
 * @param {Function} props.onClose - Callback khi đóng modal
 * @param {'recipe'|'review'|'user'} props.targetType - Loại đối tượng bị report
 * @param {string} props.targetId - ID của đối tượng bị report
 * @param {string} props.targetLabel - Tên hiển thị của đối tượng (VD: "Công thức phô mai")
 */
export function ReportModal({
  isOpen,
  onClose,
  targetType,
  targetId,
  targetLabel,
}) {
  const [reason, setReason] = useState('')
  const [additionalInfo, setAdditionalInfo] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    if (!reason) {
      setError('Vui lòng chọn lý do báo cáo')
      return
    }

    setSubmitting(true)
    setError('')

    try {
      await reportsApi.createReport({
        target_type: targetType,
        target_id: targetId,
        reason,
        additional_info: additionalInfo,
      })

      toast.success('Đã gửi báo cáo. Cảm ơn bạn đã phản hồi!')
      handleClose()
    } catch (err) {
      const message = err?.response?.data?.message || err?.message || 'Không thể gửi báo cáo'
      setError(message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleClose = () => {
    setReason('')
    setAdditionalInfo('')
    setError('')
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
            onWheel={(e) => e.stopPropagation()}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={cn(
              'fixed bottom-0 left-0 right-0 bg-[var(--color-surface)]',
              'rounded-t-[2rem] z-50 p-6 pb-10 max-h-[85vh] overflow-y-auto'
            )}
          >
            {/* Drag handle */}
            <div className="w-12 h-1 bg-[var(--color-border)] rounded-full mx-auto mb-6" />

            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                </div>
                <h2 className="font-display text-xl font-semibold text-[var(--color-text)]">
                  Báo cáo nội dung
                </h2>
              </div>
              <button
                onClick={handleClose}
                className="p-2 rounded-full hover:bg-[var(--color-background-alt)] transition-colors"
              >
                <X className="w-5 h-5 text-[var(--color-text-secondary)]" />
              </button>
            </div>

            {/* Target info */}
            <div className="bg-[var(--color-background-alt)] rounded-[var(--radius-lg)] p-4 mb-4">
              <p className="text-sm text-[var(--color-text-secondary)] mb-1">Nội dung báo cáo:</p>
              <p className="font-medium text-[var(--color-text)]">{targetLabel || 'Không xác định'}</p>
            </div>

            {/* Error */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mb-4 px-4 py-2 bg-red-50 border border-red-200 rounded-[var(--radius-md)] text-sm text-red-700"
              >
                {error}
              </motion.div>
            )}

            {/* Reason selection */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-[var(--color-text)] mb-2">
                Lý do báo cáo <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                {REPORT_REASONS.map(r => (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => setReason(r.value)}
                    className={cn(
                      'px-4 py-3 rounded-[var(--radius-md)] border text-sm font-medium transition-all',
                      reason === r.value
                        ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-primary)]'
                        : 'border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] hover:border-[var(--color-primary)]/50'
                    )}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Additional info */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-[var(--color-text)] mb-2">
                Thông tin bổ sung (tùy chọn)
              </label>
              <textarea
                value={additionalInfo}
                onChange={e => setAdditionalInfo(e.target.value)}
                placeholder="Mô tả chi tiết hơn về vấn đề..."
                rows={3}
                maxLength={500}
                className={cn(
                  'w-full px-4 py-3 rounded-[var(--radius-md)]',
                  'border border-[var(--color-border)]',
                  'bg-[var(--color-surface)]',
                  'text-[var(--color-text)]',
                  'placeholder:text-[var(--color-text-muted)]',
                  'focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent',
                  'transition-all duration-[var(--transition-fast)]',
                  'resize-none'
                )}
              />
              <p className="text-xs text-[var(--color-text-muted)] mt-1 text-right">
                {additionalInfo.length}/500
              </p>
            </div>

            {/* Submit */}
            <Button
              variant="primary"
              className="w-full h-12"
              onClick={handleSubmit}
              disabled={!reason || submitting}
              isLoading={submitting}
            >
              Gửi báo cáo
            </Button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

export default ReportModal
