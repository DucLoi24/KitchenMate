import { useState } from 'react'
import { motion, AnimatePresence, Reorder } from 'framer-motion'
import { Plus, Trash2, GripVertical, ChevronUp, ChevronDown, Image as ImageIcon } from 'lucide-react'
import { cn } from '@/utils'

export function StepList({ steps = [], onChange, errors = {} }) {
  const [newInstruction, setNewInstruction] = useState('')
  const [newMediaUrl, setNewMediaUrl] = useState('')

  const handleAddStep = () => {
    if (!newInstruction.trim()) return

    const newStep = {
      id: `temp-step-${Date.now()}`,
      step_number: steps.length + 1,
      instruction: newInstruction.trim(),
      media_url: newMediaUrl.trim() || null,
    }
    onChange([...steps, newStep])
    setNewInstruction('')
    setNewMediaUrl('')
  }

  const handleUpdateStep = (index, field, value) => {
    const updated = [...steps]
    updated[index] = { ...updated[index], [field]: value }
    onChange(updated)
  }

  const handleRemoveStep = (index) => {
    const updated = steps.filter((_, i) => i !== index)
      .map((step, i) => ({ ...step, step_number: i + 1 }))
    onChange(updated)
  }

  const handleMoveStep = (index, direction) => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === steps.length - 1)
    ) return

    const newSteps = [...steps]
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    ;[newSteps[index], newSteps[targetIndex]] = [newSteps[targetIndex], newSteps[index]]
    const reordered = newSteps.map((step, i) => ({ ...step, step_number: i + 1 }))
    onChange(reordered)
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-display text-xl font-semibold text-[var(--color-text)]">
          Các bước thực hiện
        </h3>
        <p className="text-sm text-[var(--color-text-secondary)] mt-0.5">
          Thêm các bước nấu và sắp xếp theo thứ tự
        </p>
      </div>

      {steps.length > 0 && (
        <Reorder.Group
          axis="y"
          values={steps}
          onReorder={(newOrder) => {
            const reordered = newOrder.map((step, i) => ({ ...step, step_number: i + 1 }))
            onChange(reordered)
          }}
          className="space-y-3"
        >
          <AnimatePresence>
            {steps.map((step, index) => (
              <Reorder.Item
                key={step.id}
                value={step}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="flex items-start gap-3 p-4 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-lg)] group"
              >
                <div className="flex flex-col items-center gap-1">
                  <div className="w-8 h-8 rounded-full bg-[var(--color-primary)] text-white flex items-center justify-center text-sm font-semibold flex-shrink-0">
                    {step.step_number}
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <button
                      type="button"
                      onClick={() => handleMoveStep(index, 'up')}
                      disabled={index === 0}
                      className={cn(
                        'p-1 rounded transition-colors',
                        index === 0
                          ? 'text-[var(--color-text-muted)] cursor-not-allowed'
                          : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-background-alt)]'
                      )}
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMoveStep(index, 'down')}
                      disabled={index === steps.length - 1}
                      className={cn(
                        'p-1 rounded transition-colors',
                        index === steps.length - 1
                          ? 'text-[var(--color-text-muted)] cursor-not-allowed'
                          : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-background-alt)]'
                      )}
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <textarea
                    value={step.instruction}
                    onChange={(e) => handleUpdateStep(index, 'instruction', e.target.value)}
                    placeholder={`Mô tả bước ${step.step_number}...`}
                    rows={2}
                    className="w-full px-3 py-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded-[var(--radius-md)] text-sm resize-none focus:outline-none focus:border-[var(--color-primary)] transition-colors"
                  />
                  <div className="mt-2 flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-[var(--color-text-muted)]" />
                    <input
                      type="url"
                      value={step.media_url || ''}
                      onChange={(e) => handleUpdateStep(index, 'media_url', e.target.value)}
                      placeholder="URL hình ảnh minh họa (tùy chọn)"
                      className="flex-1 h-8 px-2 text-sm bg-[var(--color-background)] border border-[var(--color-border)] rounded-[var(--radius-sm)] focus:outline-none focus:border-[var(--color-primary)] transition-colors"
                    />
                  </div>
                  {step.media_url && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="mt-2 rounded-[var(--radius-sm)] overflow-hidden"
                    >
                      <img
                        src={step.media_url}
                        alt={`Step ${step.step_number}`}
                        className="w-full h-24 object-cover"
                        onError={(e) => {
                          e.target.style.display = 'none'
                        }}
                      />
                    </motion.div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => handleRemoveStep(index)}
                  className="p-2 text-[var(--color-text-muted)] hover:text-red-500 hover:bg-red-50 rounded-[var(--radius-md)] transition-colors flex-shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </Reorder.Item>
            ))}
          </AnimatePresence>
        </Reorder.Group>
      )}

      {steps.length === 0 && (
        <div className="py-10 text-center border-2 border-dashed border-[var(--color-border)] rounded-[var(--radius-lg)]">
          <p className="text-[var(--color-text-secondary)]">Chưa có bước nào</p>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">
            Thêm bước đầu tiên để bắt đầu
          </p>
        </div>
      )}

      <div className="p-4 bg-[var(--color-background-alt)] rounded-[var(--radius-lg)] border border-[var(--color-border)]">
        <h4 className="text-sm font-medium text-[var(--color-text)] mb-3">
          Thêm bước mới
        </h4>
        <textarea
          value={newInstruction}
          onChange={(e) => setNewInstruction(e.target.value)}
          placeholder="Nhập mô tả bước mới..."
          rows={2}
          className="w-full px-3 py-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-md)] text-sm resize-none focus:outline-none focus:border-[var(--color-primary)] transition-colors mb-2"
        />
        <div className="flex items-center gap-2 mb-3">
          <ImageIcon className="w-4 h-4 text-[var(--color-text-muted)]" />
          <input
            type="url"
            value={newMediaUrl}
            onChange={(e) => setNewMediaUrl(e.target.value)}
            placeholder="URL hình ảnh minh họa (tùy chọn)"
            className="flex-1 h-8 px-2 text-sm bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-sm)] focus:outline-none focus:border-[var(--color-primary)] transition-colors"
          />
        </div>
        <button
          type="button"
          onClick={handleAddStep}
          disabled={!newInstruction.trim()}
          className={cn(
            'w-full flex items-center justify-center gap-2 px-4 py-2 rounded-[var(--radius-md)] text-sm font-medium transition-all',
            newInstruction.trim()
              ? 'bg-[var(--color-secondary)] text-white hover:bg-[var(--color-secondary-dark)]'
              : 'bg-[var(--color-border)] text-[var(--color-text-muted)] cursor-not-allowed'
          )}
        >
          <Plus className="w-4 h-4" />
          Thêm bước
        </button>
      </div>

      {errors.steps && (
        <p className="text-sm text-red-500">{errors.steps}</p>
      )}
    </div>
  )
}

export default StepList
