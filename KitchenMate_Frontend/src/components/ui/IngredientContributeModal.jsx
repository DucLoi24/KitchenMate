import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Plus, AlertCircle } from 'lucide-react'
import { cn } from '@/utils'
import { Button } from '@/components/ui/Button'
import { ingredientApi } from '@/api/ingredientApi'

const CATEGORIES = [
  { value: 'PROTEIN', label: 'Đạm (Thịt, cá, trứng...)' },
  { value: 'CARB', label: 'Tinh bột (Gạo, mì, bún...)' },
  { value: 'VEG', label: 'Rau củ' },
  { value: 'SPICE', label: 'Gia vị đặc trưng (Sả, ớt, hồi...)' },
  { value: 'STAPLE', label: 'Gia vị cơ bản (Muối, đường, dầu...)' },
  { value: 'OTHER', label: 'Khác' },
]

export function IngredientContributeModal({
  isOpen,
  onClose,
  initialName = '',
  onSuccess,
}) {
  const [name, setName] = useState(initialName)
  const [category, setCategory] = useState('OTHER')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!name.trim()) {
      setError('Vui lòng nhập tên nguyên liệu')
      return
    }

    setIsSubmitting(true)
    setError('')
    setSuccess('')

    try {
      await ingredientApi.createIngredient({
        name: name.trim(),
        category,
      })
      setSuccess('Nguyên liệu đã được gửi và đang chờ duyệt. Cảm ơn bạn!')
      setTimeout(() => {
        onSuccess?.()
        onClose()
      }, 1500)
    } catch (err) {
      const message = err?.response?.data?.error?.message || 'Không thể gửi nguyên liệu. Vui lòng thử lại.'
      setError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setName('')
    setCategory('OTHER')
    setError('')
    setSuccess('')
    onClose()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={cn(
              'fixed inset-0 z-50 flex items-center justify-center p-4',
              'pointer-events-none'
            )}
          >
            <div
              className={cn(
                'w-full max-w-md bg-[var(--color-surface)] rounded-[var(--radius-lg)]',
                'shadow-[var(--shadow-xl)] pointer-events-auto'
              )}
            >
              <div className="flex items-center justify-between p-5 border-b border-[var(--color-border)]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[var(--color-primary)]/10 flex items-center justify-center">
                    <Plus className="w-5 h-5 text-[var(--color-primary)]" />
                  </div>
                  <h2 className="font-display text-lg font-semibold text-[var(--color-text)]">
                    Đóng góp nguyên liệu
                  </h2>
                </div>
                <button
                  onClick={handleClose}
                  className="p-2 rounded-full hover:bg-[var(--color-background-alt)] transition-colors"
                >
                  <X className="w-5 h-5 text-[var(--color-text-secondary)]" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-5 space-y-4">
                {success ? (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 p-3 bg-green-50 text-green-700 rounded-[var(--radius-md)] text-sm"
                  >
                    <span>{success}</span>
                  </motion.div>
                ) : (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-[var(--color-text)] mb-2">
                        Tên nguyên liệu
                      </label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => {
                          setName(e.target.value)
                          setError('')
                        }}
                        placeholder="VD: Thịt bò Mỹ"
                        className={cn(
                          'w-full h-11 px-4 rounded-[var(--radius-md)]',
                          'border border-[var(--color-border)]',
                          'bg-[var(--color-surface)] text-[var(--color-text)]',
                          'placeholder:text-[var(--color-text-muted)]',
                          'focus:outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-0',
                          'transition-all duration-[var(--transition-base)]'
                        )}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[var(--color-text)] mb-2">
                        Danh mục
                      </label>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className={cn(
                          'w-full h-11 px-4 rounded-[var(--radius-md)]',
                          'border border-[var(--color-border)]',
                          'bg-[var(--color-surface)] text-[var(--color-text)]',
                          'focus:outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-0',
                          'transition-all duration-[var(--transition-base)]',
                          'cursor-pointer'
                        )}
                      >
                        {CATEGORIES.map((cat) => (
                          <option key={cat.value} value={cat.value}>
                            {cat.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {error && (
                      <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-[var(--radius-md)] text-sm"
                      >
                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                        <span>{error}</span>
                      </motion.div>
                    )}

                    <Button
                      type="submit"
                      variant="primary"
                      className="w-full"
                      disabled={!name.trim() || isSubmitting}
                      isLoading={isSubmitting}
                    >
                      Gửi đóng góp
                    </Button>

                    <p className="text-xs text-center text-[var(--color-text-muted)]">
                      Nguyên liệu sẽ được AI kiểm duyệt và duyệt bởi Admin trước khi hiển thị.
                    </p>
                  </>
                )}
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

export default IngredientContributeModal