import { useState, useRef } from 'react'
import { Camera, X, Loader2 } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { StarRatingInput } from '@/components/ui/StarRatingInput'
import { cn } from '@/components/ui/Button'

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

function ImageUpload({ onImageSelect, existingImage }) {
  const [preview, setPreview] = useState(existingImage || null)
  const fileInputRef = useRef(null)

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error('Chỉ chấp nhận file ảnh (JPG, PNG, WebP)')
      return
    }

    if (file.size > MAX_FILE_SIZE) {
      toast.error('Kích thước ảnh không được vượt quá 5MB')
      return
    }

    const reader = new FileReader()
    reader.onloadend = () => {
      setPreview(reader.result)
    }
    reader.readAsDataURL(file)

    await onImageSelect(file)
  }

  const handleRemove = () => {
    setPreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    onImageSelect(null)
  }

  if (preview) {
    return (
      <div className="relative">
        <img
          src={preview}
          alt="Cooksnap preview"
          className="w-24 h-24 object-cover rounded-[var(--radius-md)]"
        />
        <button
          type="button"
          onClick={handleRemove}
          className="absolute -top-2 -right-2 w-6 h-6 bg-[var(--color-primary)] text-white rounded-full flex items-center justify-center shadow-[var(--shadow-sm)] hover:bg-[var(--color-primary-light)] transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    )
  }

  return (
    <label className="flex flex-col items-center justify-center w-24 h-24 border-2 border-dashed border-[var(--color-border)] rounded-[var(--radius-md)] cursor-pointer hover:border-[var(--color-primary)] hover:bg-[var(--color-background-alt)] transition-colors">
      <Camera className="w-6 h-6 text-[var(--color-text-muted)] mb-1" />
      <span className="text-xs text-[var(--color-text-muted)]">Upload</span>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleFileChange}
      />
    </label>
  )
}

export function ReviewForm({
  initialData = null,
  onSubmit,
  onCancel,
  isSubmitting = false,
}) {
  const [rating, setRating] = useState(initialData?.rating || 0)
  const [comment, setComment] = useState(initialData?.comment || '')
  const [errors, setErrors] = useState({})
  const [imageFile, setImageFile] = useState(null)

  const isEditing = !!initialData

  const handleImageSelect = async (file) => {
    setImageFile(file)
  }

  const validate = () => {
    const newErrors = {}
    if (rating < 1) {
      newErrors.rating = 'Vui lòng chọn số sao đánh giá'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return

    const reviewData = {
      rating,
      comment: comment.trim() || null,
    }

    if (imageFile) {
      reviewData.cooksnap = imageFile
    }

    await onSubmit(reviewData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-[var(--color-background-alt)] rounded-[var(--radius-lg)] p-5">
        <h3 className="font-display text-lg font-semibold text-[var(--color-text)] mb-4">
          {isEditing ? 'Chỉnh sửa đánh giá' : 'Viết đánh giá'}
        </h3>

        <div className="mb-4">
          <label className="block text-sm font-medium text-[var(--color-text)] mb-2">
            Đánh giá của bạn
          </label>
          <StarRatingInput
            value={rating}
            onChange={setRating}
            size="lg"
            showError={!!errors.rating}
          />
          {errors.rating && (
            <p className="text-sm text-[var(--color-primary)] mt-1">{errors.rating}</p>
          )}
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-[var(--color-text)] mb-2">
            Bình luận <span className="text-[var(--color-text-muted)]">(tùy chọn)</span>
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Chia sẻ cảm nghĩ của bạn về công thức nấu ăn..."
            rows={3}
            className="w-full px-4 py-3 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent resize-none transition-all duration-[var(--transition-fast)]"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--color-text)] mb-2">
            Ảnh món đã nấu <span className="text-[var(--color-text-muted)]">(tùy chọn)</span>
          </label>
          <ImageUpload
            onImageSelect={handleImageSelect}
            existingImage={initialData?.cooksnap_url}
          />
        </div>
      </div>

      <div className="flex gap-3">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 rounded-[var(--radius-md)] border border-[var(--color-border)] text-[var(--color-text)] font-medium hover:bg-[var(--color-background-alt)] transition-colors"
          >
            Hủy
          </button>
        )}
        <button
          type="submit"
          disabled={isSubmitting}
          className={cn(
            'flex-1 px-4 py-2.5 rounded-[var(--radius-md)] bg-[var(--color-primary)] text-white font-medium transition-all duration-[var(--transition-fast)]',
            isSubmitting
              ? 'opacity-50 cursor-not-allowed'
              : 'hover:bg-[var(--color-primary-light)] hover:shadow-[var(--shadow-md)] active:bg-[var(--color-primary-dark)]'
          )}
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Đang xử lý...
            </span>
          ) : isEditing ? (
            'Cập nhật'
          ) : (
            'Gửi đánh giá'
          )}
        </button>
      </div>
    </form>
  )
}

export default ReviewForm