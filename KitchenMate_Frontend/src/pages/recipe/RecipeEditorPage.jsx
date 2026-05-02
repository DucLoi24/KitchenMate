import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Loader2,
  X,
  Clock,
  Save,
  AlertCircle,
} from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useRecipe, useCreateRecipe, useUpdateRecipe } from '@/hooks/useRecipes'
import { useRecipeDraft, VISIBILITY } from '@/hooks/useRecipeDraft'
import { recipeApi } from '@/api/recipeApi'
import toast from 'react-hot-toast'
import { cn } from '@/utils'

import { StepBasicInfo } from './StepBasicInfo'
import { IngredientList } from './IngredientList'
import { StepList } from './StepList'
import { RecipePreview } from './RecipePreview'

const STEPS = [
  { id: 1, title: 'Thông tin cơ bản', subtitle: 'Tên, mô tả, độ khó' },
  { id: 2, title: 'Nguyên liệu', subtitle: 'Thành phần & định lượng' },
  { id: 3, title: 'Các bước', subtitle: 'Hướng dẫn từng bước' },
  { id: 4, title: 'Xem trước & Xuất bản', subtitle: 'Kiểm tra & công khai' },
]

const initialFormData = {
  title: '',
  description: '',
  difficulty: 'EASY',
  prep_time: '',
  thumbnail_url: '',
  ingredients: [],
  steps: [],
  visibility: VISIBILITY.PRIVATE,
}

export function RecipeEditorPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEditMode = !!id

  const { user } = useAuthStore()
  const { data: existingRecipe, isLoading: isLoadingRecipe } = useRecipe(isEditMode ? id : null)

  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState(initialFormData)
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { formData: draftData, lastSaved, hasDraft, updateFormData, clearAllDraft, initializeForm } =
    useRecipeDraft(user?.id, isEditMode ? id : null)

  const createRecipe = useCreateRecipe()
  const updateRecipe = useUpdateRecipe()

  // Load existing recipe data or draft
  useEffect(() => {
    if (isEditMode && existingRecipe?.data) {
      const recipe = existingRecipe.data
      const formattedData = {
        title: recipe.title || '',
        description: recipe.description || '',
        difficulty: recipe.difficulty || 'EASY',
        prep_time: recipe.prep_time || '',
        thumbnail_url: recipe.thumbnail_url || '',
        ingredients: recipe.recipe_ingredients?.map((ri) => ({
          id: ri.id,
          ingredient: ri.ingredient,
          ingredient_name: ri.ingredient_name,
          ingredient_category: ri.ingredient_category,
          quantity: ri.quantity,
          unit: ri.unit,
        })) || [],
        steps: recipe.steps?.map((s) => ({
          id: s.id,
          step_number: s.step_number,
          instruction: s.instruction,
          media_url: s.media_url,
        })) || [],
        visibility: recipe.visibility || 'PRIVATE',
      }
      initializeForm(formattedData)
    } else if (hasDraft && draftData) {
      setFormData(draftData)
    } else {
      initializeForm(initialFormData)
    }
  }, [isEditMode, existingRecipe, hasDraft, draftData])

  // Auto-save draft
  useEffect(() => {
    if (formData && (formData.title || formData.description || (formData.ingredients?.length > 0) || (formData.steps?.length > 0))) {
      updateFormData(formData)
    }
  }, [formData])

  const validateStep = (step) => {
    const newErrors = {}

    if (step === 1) {
      if (!formData.title?.trim()) {
        newErrors.title = 'Vui lòng nhập tên công thức'
      }
      if (formData.prep_time && formData.prep_time < 1) {
        newErrors.prep_time = 'Thời gian phải lớn hơn 0'
      }
    }

    if (step === 2) {
      if (formData.ingredients.length === 0) {
        newErrors.ingredients = 'Vui lòng thêm ít nhất một nguyên liệu'
      } else {
        const emptyIngredient = formData.ingredients.find(
          (ing) => !ing.quantity || ing.quantity <= 0
        )
        if (emptyIngredient) {
          newErrors.ingredients = 'Vui lòng nhập định lượng cho tất cả nguyên liệu'
        }
      }
    }

    if (step === 3) {
      if (formData.steps.length === 0) {
        newErrors.steps = 'Vui lòng thêm ít nhất một bước'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (!validateStep(currentStep)) {
      toast.error('Vui lòng kiểm tra lại thông tin')
      return
    }
    if (currentStep < 4) {
      setCurrentStep((prev) => prev + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1)
    }
  }

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) {
      toast.error('Vui lòng kiểm tra lại thông tin')
      return
    }

    setIsSubmitting(true)

    try {
      const payload = {
        title: formData.title,
        description: formData.description || '',
        difficulty: formData.difficulty,
        prep_time: formData.prep_time ? parseInt(formData.prep_time, 10) : null,
        thumbnail_url: formData.thumbnail_url || null,
        visibility: formData.visibility,
        ingredients: formData.ingredients.map((ing) => ({
          ingredient: ing.ingredient,
          quantity: parseFloat(ing.quantity) || 0,
          unit: ing.unit,
        })),
        steps: formData.steps.map((step, index) => ({
          step_number: index + 1,
          instruction: step.instruction,
          media_url: step.media_url || null,
        })),
      }

      let result
      let recipeId
      if (isEditMode) {
        result = await updateRecipe.mutateAsync({ id, data: payload })
        recipeId = id
      } else {
        result = await createRecipe.mutateAsync(payload)
        recipeId = result.data?.id
      }

      // Upload thumbnail file if there's a pending file
      if (formData.thumbnail_file && recipeId) {
        try {
          await recipeApi.uploadThumbnail(recipeId, formData.thumbnail_file)
        } catch (uploadError) {
          console.error('Thumbnail upload failed:', uploadError)
          toast.error('Upload ảnh minh họa thất bại, nhưng công thức đã được lưu.')
        }
      }

      clearAllDraft()
      toast.success(isEditMode ? 'Công thức đã được cập nhật!' : 'Công thức đã được tạo!')

      navigate(`/recipe/${recipeId}`)
    } catch (error) {
      console.error('Submit error:', error)
      const message =
        error.response?.data?.message ||
        error.response?.data?.error ||
        'Đã xảy ra lỗi khi lưu công thức'
      toast.error(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleVisibilityChange = (visibility) => {
    updateFormData((prev) => ({ ...prev, visibility }))
  }

  const renderStep = () => {
    const stepProps = {
      data: formData,
      onChange: setFormData,
      errors,
    }

    switch (currentStep) {
      case 1:
        return <StepBasicInfo {...stepProps} />
      case 2:
        return <IngredientList {...stepProps} />
      case 3:
        return <StepList {...stepProps} />
      case 4:
        return <RecipePreview recipeData={formData} onVisibilityChange={handleVisibilityChange} />
      default:
        return null
    }
  }

  if (isEditMode && isLoadingRecipe) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--color-primary)]" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--color-background)]">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[var(--color-surface)] border-b border-[var(--color-border)]">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              to={isEditMode ? `/recipe/${id}` : '/'}
              className="p-2 rounded-[var(--radius-md)] hover:bg-[var(--color-background-alt)] transition-colors"
            >
              <X className="w-5 h-5 text-[var(--color-text)]" />
            </Link>
            <div>
              <h1 className="font-display text-lg font-semibold text-[var(--color-text)]">
                {isEditMode ? 'Sửa công thức' : 'Tạo công thức mới'}
              </h1>
              {lastSaved && (
                <p className="text-xs text-[var(--color-text-muted)] flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Lưu lần cuối: {lastSaved.toLocaleTimeString('vi-VN')}
                </p>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={() => clearAllDraft()}
            className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors"
          >
            Xóa bản nháp
          </button>
        </div>

        {/* Step Indicator */}
        <div className="max-w-4xl mx-auto px-4 pb-3">
          <div className="flex items-center justify-between">
            {STEPS.map((step, index) => {
              const isActive = currentStep === step.id
              const isCompleted = currentStep > step.id

              return (
                <div key={step.id} className="flex items-center">
                  <button
                    type="button"
                    onClick={() => isCompleted && setCurrentStep(step.id)}
                    disabled={!isCompleted && !isActive}
                    className={cn(
                      'flex items-center gap-2 px-2 py-1 rounded-[var(--radius-sm)] transition-colors',
                      isActive && 'bg-[var(--color-primary)]/10',
                      isCompleted && 'cursor-pointer hover:bg-[var(--color-background-alt)]',
                      !isActive && !isCompleted && 'cursor-default'
                    )}
                  >
                    <div
                      className={cn(
                        'w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold transition-colors',
                        isActive && 'bg-[var(--color-primary)] text-white',
                        isCompleted && 'bg-[var(--color-secondary)] text-white',
                        !isActive && !isCompleted && 'bg-[var(--color-border)] text-[var(--color-text-muted)]'
                      )}
                    >
                      {isCompleted ? <Check className="w-3 h-3" /> : step.id}
                    </div>
                    <span
                      className={cn(
                        'text-xs font-medium hidden sm:block',
                        isActive && 'text-[var(--color-primary)]',
                        !isActive && 'text-[var(--color-text-secondary)]'
                      )}
                    >
                      {step.title}
                    </span>
                  </button>

                  {index < STEPS.length - 1 && (
                    <div
                      className={cn(
                        'flex-1 h-0.5 mx-2 min-w-[2rem]',
                        currentStep > step.id
                          ? 'bg-[var(--color-secondary)]'
                          : 'bg-[var(--color-border)]'
                      )}
                    />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 py-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {renderStep()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Footer Navigation */}
      <footer className="sticky bottom-0 z-40 bg-[var(--color-surface)] border-t border-[var(--color-border)]">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            type="button"
            onClick={handleBack}
            disabled={currentStep === 1}
            className={cn(
              'flex items-center gap-2 px-5 py-2.5 rounded-[var(--radius-md)] text-sm font-medium transition-all',
              currentStep === 1
                ? 'text-[var(--color-text-muted)] cursor-not-allowed'
                : 'text-[var(--color-text)] border border-[var(--color-border)] hover:border-[var(--color-border-strong)] hover:bg-[var(--color-background-alt)]'
            )}
          >
            <ArrowLeft className="w-4 h-4" />
            Quay lại
          </button>

          {currentStep < 4 ? (
            <button
              type="button"
              onClick={handleNext}
              className="flex items-center gap-2 px-5 py-2.5 rounded-[var(--radius-md)] text-sm font-medium bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-dark)] transition-colors"
            >
              Tiếp tục
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className={cn(
                'flex items-center gap-2 px-5 py-2.5 rounded-[var(--radius-md)] text-sm font-medium transition-all',
                isSubmitting
                  ? 'bg-[var(--color-text-muted)] text-white cursor-wait'
                  : 'bg-[var(--color-secondary)] text-white hover:bg-[var(--color-secondary-dark)]'
              )}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Đang lưu...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  {isEditMode ? 'Cập nhật công thức' : 'Xuất bản công thức'}
                </>
              )}
            </button>
          )}
        </div>
      </footer>
    </div>
  )
}

export default RecipeEditorPage
