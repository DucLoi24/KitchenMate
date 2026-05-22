import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Image as ImageIcon,
  Upload,
  X,
  Film,
} from 'lucide-react'
import { cn } from '@/utils'

function getStepKey(step) {
  return step.id || `step-${step.step_number}`
}

function SelectedMediaPreviewItem({ file, onRemove }) {
  const [previewUrl, setPreviewUrl] = useState('')
  const isVideo = file.type?.startsWith('video/')

  useEffect(() => {
    const objectUrl = URL.createObjectURL(file)
    let isActive = true

    queueMicrotask(() => {
      if (isActive) {
        setPreviewUrl(objectUrl)
      }
    })

    return () => {
      isActive = false
      URL.revokeObjectURL(objectUrl)
    }
  }, [file])

  return (
    <div className="group relative overflow-hidden rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-background-alt)]">
      {!previewUrl ? (
        <div className="flex h-28 w-full items-center justify-center bg-[var(--color-background-alt)] text-[var(--color-text-muted)]">
          {isVideo ? (
            <Film className="h-5 w-5" />
          ) : (
            <ImageIcon className="h-5 w-5" />
          )}
        </div>
      ) : isVideo ? (
        <video
          src={previewUrl}
          className="h-28 w-full object-cover"
          controls
        />
      ) : (
        <img
          src={previewUrl}
          alt={`Preview ${file.name}`}
          className="h-28 w-full object-cover"
        />
      )}
      <div className="flex items-center gap-1 px-2 py-1 text-xs text-[var(--color-text-secondary)]">
        {isVideo ? (
          <Film className="h-3.5 w-3.5 shrink-0 text-[var(--color-primary)]" />
        ) : (
          <ImageIcon className="h-3.5 w-3.5 shrink-0 text-[var(--color-primary)]" />
        )}
        <span className="min-w-0 flex-1 truncate">{file.name}</span>
      </div>
      <button
        type="button"
        onClick={() => onRemove(file)}
        className="absolute right-1 top-1 inline-flex h-7 w-7 items-center justify-center rounded-full bg-black/55 text-white opacity-100 transition-opacity hover:bg-red-600 sm:opacity-0 sm:group-hover:opacity-100"
        aria-label={`Xóa ${file.name}`}
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}

function StepMediaPicker({ label, files = [], onFilesChange }) {

  const handleFileChange = (event) => {
    const selectedFiles = Array.from(event.target.files || [])
    if (selectedFiles.length > 0) {
      onFilesChange([...files, ...selectedFiles])
    }
    event.target.value = ''
  }

  const handleRemoveFile = (fileToRemove) => {
    onFilesChange(files.filter((file) => file !== fileToRemove))
  }

  return (
    <div className="mt-3 space-y-2">
      <label className="inline-flex min-h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-[var(--radius-md)] border border-dashed border-[var(--color-border-strong)] bg-[var(--color-background-alt)] px-4 py-2 text-sm font-medium text-[var(--color-text-secondary)] transition-all duration-[var(--transition-fast)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]">
        <Upload className="h-4 w-4" />
        <span>Thêm ảnh/video</span>
        <input
          aria-label={label}
          type="file"
          accept="image/jpeg,image/png,image/webp,video/mp4,video/webm,video/quicktime"
          multiple
          className="sr-only"
          onChange={handleFileChange}
        />
      </label>

      {files.length > 0 && (
        <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-2">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {files.map((file) => (
              <SelectedMediaPreviewItem
                key={`${file.name}-${file.size}-${file.lastModified}`}
                file={file}
                onRemove={handleRemoveFile}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={() => onFilesChange([])}
            className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-[var(--color-text-muted)] transition-colors hover:text-red-500"
          >
            <X className="h-3.5 w-3.5" />
            Xóa file đã chọn
          </button>
        </div>
      )}
    </div>
  )
}

function ExistingMediaList({ mediaItems = [], fallbackUrl }) {
  const items = mediaItems.length > 0
    ? mediaItems
    : fallbackUrl
      ? [{ id: fallbackUrl, media_url: fallbackUrl, media_type: 'IMAGE', original_name: 'Media hiện có' }]
      : []

  if (items.length === 0) return null

  return (
    <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
      {items.map((item) => (
        <div key={item.id || item.media_url} className="overflow-hidden rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-background-alt)]">
          {item.media_type === 'VIDEO' ? (
            <video src={item.media_url} className="h-24 w-full object-cover" controls />
          ) : (
            <img
              src={item.media_url}
              alt={item.original_name || 'Media bước nấu'}
              className="h-24 w-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = 'none'
              }}
            />
          )}
        </div>
      ))}
    </div>
  )
}

export function StepList({ onChange, data, errors = {}, pendingMedia = {}, onPendingMediaChange = () => {} }) {
  const steps = data?.steps || []
  const [newInstruction, setNewInstruction] = useState('')
  const [newMediaFiles, setNewMediaFiles] = useState([])

  const handleAddStep = () => {
    if (!newInstruction.trim()) return

    const stepId = `temp-step-${Date.now()}`
    const newStep = {
      id: stepId,
      step_number: steps.length + 1,
      instruction: newInstruction.trim(),
      media_url: null,
      media_items: [],
    }
    onChange({ ...data, steps: [...steps, newStep] })
    onPendingMediaChange(stepId, newMediaFiles)
    setNewInstruction('')
    setNewMediaFiles([])
  }

  const handleUpdateStep = (index, field, value) => {
    const updated = [...steps]
    updated[index] = { ...updated[index], [field]: value }
    onChange({ ...data, steps: updated })
  }

  const handleRemoveStep = (index) => {
    onPendingMediaChange(getStepKey(steps[index]), [])
    const updated = steps.filter((_, i) => i !== index)
      .map((step, i) => ({ ...step, step_number: i + 1 }))
    onChange({ ...data, steps: updated })
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
    onChange({ ...data, steps: reordered })
  }

  const handleTextareaWheel = (event) => {
    event.stopPropagation()
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
        <div className="space-y-3">
          <AnimatePresence>
            {steps.map((step, index) => (
              <motion.div
                key={step.id}
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
                    rows={5}
                    onWheel={handleTextareaWheel}
                    className="w-full min-h-[10rem] max-h-[18rem] overflow-y-auto px-4 py-3 bg-[var(--color-background)] border border-[var(--color-border)] rounded-[var(--radius-md)] text-sm leading-6 resize-y focus:outline-none focus:border-[var(--color-primary)] transition-colors"
                  />
                  <ExistingMediaList mediaItems={step.media_items || []} fallbackUrl={step.media_url} />
                  <StepMediaPicker
                    label={`Media cho bước ${step.step_number}`}
                    files={pendingMedia[getStepKey(step)] || []}
                    onFilesChange={(files) => onPendingMediaChange(getStepKey(step), files)}
                  />
                </div>

                <button
                  type="button"
                  onClick={() => handleRemoveStep(index)}
                  className="p-2 text-[var(--color-text-muted)] hover:text-red-500 hover:bg-red-50 rounded-[var(--radius-md)] transition-colors flex-shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
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
          rows={5}
          onWheel={handleTextareaWheel}
          className="mb-3 w-full min-h-[10rem] max-h-[18rem] overflow-y-auto px-4 py-3 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-md)] text-sm leading-6 resize-y focus:outline-none focus:border-[var(--color-primary)] transition-colors"
        />
        <StepMediaPicker
          label="Media cho bước mới"
          files={newMediaFiles}
          onFilesChange={setNewMediaFiles}
        />
        <button
          type="button"
          onClick={handleAddStep}
          disabled={!newInstruction.trim()}
          className={cn(
            'mt-3 w-full flex items-center justify-center gap-2 px-4 py-2 rounded-[var(--radius-md)] text-sm font-medium transition-all',
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
