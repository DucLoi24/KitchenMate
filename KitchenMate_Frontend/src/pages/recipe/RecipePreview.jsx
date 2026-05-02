import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Eye, EyeOff, Globe, Lock, AlertTriangle } from 'lucide-react'
import { cn } from '@/utils'
import { DIFFICULTY_CONFIG, VISIBILITY } from '@/hooks/useRecipeDraft'

export function RecipePreview({ recipeData, onVisibilityChange }) {
  const [showPreview, setShowPreview] = useState(true)
  const [visibility, setVisibility] = useState(recipeData.visibility || VISIBILITY.PRIVATE)

  const handleVisibilityChange = (value) => {
    setVisibility(value)
    onVisibilityChange?.(value)
  }

  const difficulty = DIFFICULTY_CONFIG[recipeData.difficulty] || DIFFICULTY_CONFIG.EASY

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-display text-xl font-semibold text-[var(--color-text)]">
          Xem trước & Xuất bản
        </h3>
        <p className="text-sm text-[var(--color-text-secondary)] mt-0.5">
          Kiểm tra thông tin và chọn chế độ hiển thị
        </p>
      </div>

      <div className="flex items-center gap-3 p-3 bg-[var(--color-background-alt)] rounded-[var(--radius-lg)]">
        <button
          type="button"
          onClick={() => setShowPreview(!showPreview)}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-[var(--radius-md)] text-sm font-medium transition-all',
            showPreview
              ? 'bg-[var(--color-primary)] text-white'
              : 'bg-[var(--color-surface)] text-[var(--color-text)] border border-[var(--color-border)] hover:border-[var(--color-border-strong)]'
          )}
        >
          {showPreview ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          {showPreview ? 'Ẩn xem trước' : 'Xem trước'}
        </button>
      </div>

      <AnimatePresence>
        {showPreview && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-lg)] overflow-hidden"
          >
            {recipeData.thumbnail_url && (
              <div className="aspect-video bg-[var(--color-background-alt)]">
                <img
                  src={recipeData.thumbnail_url}
                  alt={recipeData.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.style.display = 'none'
                  }}
                />
              </div>
            )}

            <div className="p-6 space-y-4">
              <div>
                <h2 className="font-display text-2xl font-semibold text-[var(--color-text)]">
                  {recipeData.title || 'Tiêu đề công thức'}
                </h2>
                {recipeData.description && (
                  <p className="text-sm text-[var(--color-text-secondary)] mt-1">
                    {recipeData.description}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                {difficulty && (
                  <span
                    className="px-3 py-1 rounded-full text-sm font-medium"
                    style={{ backgroundColor: difficulty.bg, color: difficulty.color }}
                  >
                    {difficulty.label}
                  </span>
                )}
                {recipeData.prep_time && (
                  <span className="px-3 py-1 bg-[var(--color-background-alt)] text-[var(--color-text-secondary)] rounded-full text-sm">
                    {recipeData.prep_time} phút
                  </span>
                )}
              </div>

              {recipeData.ingredients?.length > 0 && (
                <div className="pt-4 border-t border-[var(--color-border)]">
                  <h4 className="text-sm font-medium text-[var(--color-text)] mb-2">
                    Nguyên liệu ({recipeData.ingredients.length})
                  </h4>
                  <ul className="space-y-1">
                    {recipeData.ingredients.slice(0, 5).map((ing, i) => (
                      <li key={i} className="text-sm text-[var(--color-text-secondary)] flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-primary)]" />
                        {ing.quantity} {ing.unit} {ing.ingredient_name}
                      </li>
                    ))}
                    {recipeData.ingredients.length > 5 && (
                      <li className="text-sm text-[var(--color-text-muted)]">
                        + {recipeData.ingredients.length - 5} nguyên liệu khác
                      </li>
                    )}
                  </ul>
                </div>
              )}

              {recipeData.steps?.length > 0 && (
                <div className="pt-4 border-t border-[var(--color-border)]">
                  <h4 className="text-sm font-medium text-[var(--color-text)] mb-2">
                    Các bước ({recipeData.steps.length})
                  </h4>
                  <div className="space-y-2">
                    {recipeData.steps.slice(0, 3).map((step, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <span className="w-5 h-5 rounded-full bg-[var(--color-primary)] text-white flex items-center justify-center text-xs font-semibold flex-shrink-0">
                          {step.step_number}
                        </span>
                        <p className="text-sm text-[var(--color-text-secondary)] line-clamp-2">
                          {step.instruction}
                        </p>
                      </div>
                    ))}
                    {recipeData.steps.length > 3 && (
                      <p className="text-sm text-[var(--color-text-muted)]">
                        + {recipeData.steps.length - 3} bước khác
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-3">
        <h4 className="text-sm font-medium text-[var(--color-text)]">
          Chế độ hiển thị
        </h4>

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => handleVisibilityChange(VISIBILITY.PRIVATE)}
            className={cn(
              'relative p-4 rounded-[var(--radius-lg)] border-2 text-left transition-all',
              visibility === VISIBILITY.PRIVATE
                ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5'
                : 'border-[var(--color-border)] hover:border-[var(--color-border-strong)]'
            )}
          >
            <div className="flex items-center gap-2 mb-1">
              <Lock className="w-4 h-4" />
              <span className="text-sm font-medium">Riêng tư</span>
            </div>
            <p className="text-xs text-[var(--color-text-secondary)]">
              Chỉ mình tôi có thể xem
            </p>
            {visibility === VISIBILITY.PRIVATE && (
              <motion.div
                layoutId="visibility-indicator"
                className="absolute inset-0 rounded-[var(--radius-lg)] border-2 border-[var(--color-primary)]"
                transition={{ type: 'spring', stiffness: 200, damping: 20 }}
              />
            )}
          </button>

          <button
            type="button"
            onClick={() => handleVisibilityChange(VISIBILITY.PUBLIC)}
            className={cn(
              'relative p-4 rounded-[var(--radius-lg)] border-2 text-left transition-all',
              visibility === VISIBILITY.PUBLIC
                ? 'border-[var(--color-secondary)] bg-[var(--color-secondary)]/5'
                : 'border-[var(--color-border)] hover:border-[var(--color-border-strong)]'
            )}
          >
            <div className="flex items-center gap-2 mb-1">
              <Globe className="w-4 h-4" />
              <span className="text-sm font-medium">Công khai</span>
            </div>
            <p className="text-xs text-[var(--color-text-secondary)]">
              Mọi người đều có thể xem
            </p>
            {visibility === VISIBILITY.PUBLIC && (
              <motion.div
                layoutId="visibility-indicator"
                className="absolute inset-0 rounded-[var(--radius-lg)] border-2 border-[var(--color-secondary)]"
                transition={{ type: 'spring', stiffness: 200, damping: 20 }}
              />
            )}
          </button>
        </div>
      </div>

      {visibility === VISIBILITY.PUBLIC && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-[var(--radius-lg)]"
        >
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-800">
              Công thức sẽ được kiểm duyệt bởi AI
            </p>
            <p className="text-xs text-amber-700 mt-0.5">
              Khi chọn công khai, nội dung công thức sẽ được phân tích bởi AI trước khi hiển thị công khai.
              Công thức có thể bị từ chối nếu không phù hợp.
            </p>
          </div>
        </motion.div>
      )}
    </div>
  )
}

export default RecipePreview