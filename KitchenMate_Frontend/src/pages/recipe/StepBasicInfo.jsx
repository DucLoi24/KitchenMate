import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Input } from '@/components/ui/Input'
import { ChefHat, Clock, BookOpen, Upload, X, ChevronDown, Check } from 'lucide-react'
import { DIFFICULTY_CONFIG } from '@/hooks/useRecipeDraft'
import { categoryApi, FALLBACK_CATEGORIES } from '@/api/categoryApi'
import toast from 'react-hot-toast'
import { cn } from '@/utils'

const CATEGORY_TIMEOUT = 3000

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] } }
}

export function StepBasicInfo({ data, onChange, errors = {} }) {
  const [dragActive, setDragActive] = useState(false)
  const inputRef = useRef(null)
  const [categories, setCategories] = useState([])
  const [selectedCategories, setSelectedCategories] = useState([])
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const dropdownRef = useRef(null)

  // Fetch categories on mount with timeout fallback
  useEffect(() => {
    const timeoutPromise = new Promise((resolve) => {
      setTimeout(() => resolve({ data: { results: FALLBACK_CATEGORIES } }), CATEGORY_TIMEOUT)
    })

    Promise.race([categoryApi.getCategories(), timeoutPromise])
      .then((res) => {
        const cats = res.results || res.data?.results || []
        setCategories(cats)
      })
      .catch((err) => {
        console.warn('Category fetch failed, using fallback:', err)
        setCategories(FALLBACK_CATEGORIES)
      })
  }, [])

  // Restore selected categories from formData when categories are loaded
  useEffect(() => {
    if (categories.length > 0 && data.categories && data.categories.length > 0) {
      const restored = categories.filter((cat) => data.categories.includes(cat.id))
      setSelectedCategories(restored)
    }
  }, [categories, data.categories])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleCategorySelect = (category) => {
    const currentIds = data.categories || []
    const exists = currentIds.includes(category.id)
    const newCategories = exists
      ? currentIds.filter((id) => id !== category.id)
      : [...currentIds, category.id]
    onChange((prev) => ({ ...prev, categories: newCategories }))
  }

  const handleWheel = (e) => e.stopPropagation()

  const selectedLabel = () => {
    if (!data.categories || data.categories.length === 0) return 'Chọn danh mục'
    if (data.categories.length === 1) {
      const cat = categories.find((c) => c.id === data.categories[0])
      return cat?.name || '1 danh mục'
    }
    return `${data.categories.length} danh mục đã chọn`
  }

  const handleChange = (field) => (e) => {
    onChange((prev) => ({ ...prev, [field]: e.target.value }))
  }

  const handleFileSelect = async (file) => {
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Vui lòng chọn file ảnh')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File ảnh không được vượt quá 5MB')
      return
    }

    const localPreview = URL.createObjectURL(file)
    onChange((prev) => ({ ...prev, thumbnail_url: localPreview, thumbnail_file: file }))
    toast.success('Đã chọn ảnh. Ảnh sẽ được upload khi lưu công thức.')
  }

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    const file = e.dataTransfer?.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleInputChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleRemoveThumbnail = () => {
    onChange((prev) => ({ ...prev, thumbnail_url: '', thumbnail_file: null }))
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      <motion.div variants={itemVariants} className="text-center mb-8">
        <h2 className="font-display text-3xl font-semibold text-[var(--color-text)] mb-2">
          Tạo công thức mới
        </h2>
        <p className="text-[var(--color-text-secondary)]">
          Bắt đầu với thông tin cơ bản về món ăn của bạn
        </p>
      </motion.div>

      <motion.div variants={itemVariants}>
        <Input
          label="Tên công thức"
          placeholder="VD: Phở bò Hà Nội"
          value={data.title || ''}
          onChange={handleChange('title')}
          error={errors.title}
          required
          leftIcon={<ChefHat className="w-4 h-4" />}
        />
      </motion.div>

      <motion.div variants={itemVariants}>
        <label className="text-sm font-medium text-[var(--color-text)] flex items-center gap-1 mb-1.5">
          Mô tả ngắn
        </label>
        <div className="relative">
          <textarea
            placeholder="Mô tả ngắn về công thức, hương vị đặc trưng..."
            value={data.description || ''}
            onChange={handleChange('description')}
            rows={3}
            className="w-full bg-[var(--color-surface)] text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] border border-[var(--color-border)] rounded-[var(--radius-md)] p-4 text-base resize-none transition-all duration-[var(--transition-base)] focus:outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-0"
          />
          <BookOpen className="absolute top-3 right-3 w-4 h-4 text-[var(--color-text-muted)] pointer-events-none" />
        </div>
        {errors.description && (
          <p className="text-sm text-red-500 mt-1">{errors.description}</p>
        )}
      </motion.div>

      <motion.div variants={itemVariants}>
        <label className="text-sm font-medium text-[var(--color-text)] flex items-center gap-1 mb-3">
          Độ khó
        </label>
        <div className="grid grid-cols-3 gap-3">
          {Object.entries(DIFFICULTY_CONFIG).map(([value, config]) => {
            const isSelected = data.difficulty === value
            return (
              <button
                key={value}
                type="button"
                onClick={() => onChange((prev) => ({ ...prev, difficulty: value }))}
                className={`relative px-4 py-3 rounded-[var(--radius-md)] border-2 transition-all duration-[var(--transition-base)] ${
                  isSelected
                    ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5'
                    : 'border-[var(--color-border)] hover:border-[var(--color-border-strong)] bg-[var(--color-surface)]'
                }`}
              >
                <span
                  className={`text-sm font-medium ${
                    isSelected ? 'text-[var(--color-primary)]' : 'text-[var(--color-text)]'
                  }`}
                >
                  {config.label}
                </span>
                {isSelected && (
                  <motion.div
                    layoutId="difficulty-indicator"
                    className="absolute inset-0 rounded-[var(--radius-md)] border-2 border-[var(--color-primary)]"
                    transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                  />
                )}
              </button>
            )
          })}
        </div>
      </motion.div>

      <motion.div variants={itemVariants} ref={dropdownRef}>
        <label className="text-sm font-medium text-[var(--color-text)] flex items-center gap-1 mb-3">
          Danh mục
        </label>
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className={cn(
              'w-full flex items-center justify-between px-4 py-3 rounded-[var(--radius-md)] border transition-all duration-[var(--transition-base)]',
              'bg-[var(--color-surface)] text-[var(--color-text)]',
              isDropdownOpen
                ? 'border-[var(--color-primary)] ring-2 ring-[var(--color-primary)] ring-offset-0'
                : 'border-[var(--color-border)] hover:border-[var(--color-border-strong)]'
            )}
          >
            <span className={data.categories?.length ? 'text-[var(--color-text)]' : 'text-[var(--color-text-muted)]'}>
              {selectedLabel()}
            </span>
            <motion.div
              animate={{ rotate: isDropdownOpen ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown className="w-4 h-4 text-[var(--color-text-muted)]" />
            </motion.div>
          </button>

          <AnimatePresence>
            {isDropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.15 }}
                onWheel={handleWheel}
                className="absolute z-50 w-full mt-2 py-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-md)] shadow-lg max-h-64 overflow-y-auto"
              >
                {categories.map((cat) => {
                  const isSelected = (data.categories || []).includes(cat.id)
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => handleCategorySelect(cat)}
                      className={cn(
                        'w-full flex items-center justify-between px-4 py-2.5 text-left transition-colors',
                        'hover:bg-[var(--color-background-alt)]',
                        isSelected ? 'text-[var(--color-primary)]' : 'text-[var(--color-text)]'
                      )}
                    >
                      <span className="text-sm">{cat.name}</span>
                      <AnimatePresence>
                        {isSelected && (
                          <motion.span
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0 }}
                          >
                            <Check className="w-4 h-4 text-[var(--color-primary)]" />
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </button>
                  )
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        {errors.categories && (
          <p className="text-sm text-red-500 mt-1">{errors.categories}</p>
        )}
      </motion.div>

      <motion.div variants={itemVariants}>
        <Input
          label="Thời gian chuẩn bị (phút)"
          type="number"
          placeholder="30"
          value={data.prep_time || ''}
          onChange={handleChange('prep_time')}
          error={errors.prep_time}
          min={1}
          leftIcon={<Clock className="w-4 h-4" />}
        />
      </motion.div>

      <motion.div variants={itemVariants}>
        <label className="text-sm font-medium text-[var(--color-text)] flex items-center gap-1 mb-3">
          Ảnh minh họa
        </label>

        {!data.thumbnail_url ? (
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
            className={`
              relative border-2 border-dashed rounded-[var(--radius-lg)] p-8 text-center cursor-pointer transition-all
              ${dragActive
                ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5'
                : 'border-[var(--color-border)] hover:border-[var(--color-border-strong)] hover:bg-[var(--color-background-alt)]'
              }
            `}
          >
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              onChange={handleInputChange}
              className="hidden"
            />
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-[var(--color-background-alt)] flex items-center justify-center">
                <Upload className="w-6 h-6 text-[var(--color-text-muted)]" />
              </div>
              <div>
                <p className="text-sm font-medium text-[var(--color-text)]">
                  Kéo thả ảnh hoặc click để chọn
                </p>
                <p className="text-xs text-[var(--color-text-muted)] mt-1">
                  PNG, JPG, WEBP (tối đa 5MB)
                </p>
              </div>
            </div>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative rounded-[var(--radius-lg)] overflow-hidden border border-[var(--color-border)] group"
          >
            <img
              src={data.thumbnail_url}
              alt="Preview"
              className="w-full h-48 object-cover"
              onError={(e) => {
                e.target.src = 'https://via.placeholder.com/400x200?text=Không+load+được+ảnh'
              }}
            />
            <button
              type="button"
              onClick={handleRemoveThumbnail}
              className="absolute top-2 right-2 p-1.5 bg-[var(--color-surface)]/90 hover:bg-[var(--color-surface)] rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="w-4 h-4 text-[var(--color-text)]" />
            </button>
          </motion.div>
        )}

        {errors.thumbnail_url && (
          <p className="text-sm text-red-500 mt-1">{errors.thumbnail_url}</p>
        )}
      </motion.div>
    </motion.div>
  )
}

export default StepBasicInfo