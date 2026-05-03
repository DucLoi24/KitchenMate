import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { Button } from './Button'

export function RejectDialog({ isOpen, title, itemName, onConfirm, onCancel, loading }) {
  const [reason, setReason] = useState('')

  const handleConfirm = async () => {
    try {
      await onConfirm(reason)
    } finally {
      setReason('')
    }
  }

  const handleCancel = () => {
    setReason('')
    onCancel()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleCancel}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="bg-[var(--color-surface)] rounded-[var(--radius-xl)] border border-[var(--color-border)] shadow-[var(--shadow-xl)] p-6 max-w-md w-full">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display text-lg font-semibold text-[var(--color-text)]">
                  {title || 'Từ chối'}
                </h3>
                <button
                  onClick={handleCancel}
                  className="p-1 rounded-[var(--radius-md)] hover:bg-[var(--color-background-alt)] transition-colors"
                >
                  <X className="w-5 h-5 text-[var(--color-text-muted)]" />
                </button>
              </div>
              <p className="text-sm text-[var(--color-text-secondary)] mb-4">
                Bạn đang từ chối <span className="font-medium text-[var(--color-text)]">"{itemName}"</span>.
              </p>
              <div className="mb-6">
                <label className="block text-sm font-medium text-[var(--color-text)] mb-2">
                  Lý do từ chối <span className="text-[var(--color-text-muted)]">(không bắt buộc)</span>
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Nhập lý do từ chối..."
                  rows={3}
                  className="w-full px-3 py-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] resize-none focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-all"
                />
              </div>
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={handleCancel} disabled={loading}>
                  Hủy
                </Button>
                <Button variant="danger" className="flex-1" onClick={handleConfirm} loading={loading}>
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

export default RejectDialog