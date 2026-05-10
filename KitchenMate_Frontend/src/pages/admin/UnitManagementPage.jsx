import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Scale,
  Plus,
  Pencil,
  Trash2,
  Check,
  X,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  AlertCircle,
  Search,
  CheckCircle2,
  XCircle,
  Package2,
  ArrowLeft,
} from 'lucide-react'
import toast from 'react-hot-toast'

import { cn } from '@/utils'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { adminApi } from '@/api/adminApi'

// ============ Icons ============
const ScaleIcon = Scale

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
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-[var(--radius-md)] bg-[var(--color-background-alt)] animate-pulse flex items-center justify-center">
              <ScaleIcon className="w-5 h-5 text-[var(--color-text-muted)]" />
            </div>
            <div className="flex-1 space-y-2">
              <div className="h-5 w-1/3 bg-[var(--color-background-alt)] rounded animate-pulse" />
              <div className="h-4 w-1/4 bg-[var(--color-background-alt)] rounded animate-pulse" />
            </div>
            <div className="h-8 w-20 bg-[var(--color-background-alt)] rounded animate-pulse" />
          </div>
        </motion.div>
      ))}
    </div>
  )
}

// ============ Empty State ============

function EmptyState({ type }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-16 px-6 text-center"
    >
      <div className="w-20 h-20 rounded-full bg-[var(--color-background-alt)] flex items-center justify-center mb-4">
        <ScaleIcon className="w-10 h-10 text-[var(--color-text-muted)]" />
      </div>
      <h3 className="font-display text-lg font-semibold text-[var(--color-text)] mb-2">
        {type === 'units' ? 'Chưa có đơn vị nào' : 'Không tìm thấy kết quả'}
      </h3>
      <p className="text-[var(--color-text-secondary)] text-sm">
        {type === 'units'
          ? 'Tạo đơn vị đầu tiên để bắt đầu quản lý.'
          : 'Thử thay đổi từ khóa tìm kiếm.'}
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
        <AlertCircle className="w-10 h-10 text-red-400" />
      </div>
      <h3 className="font-display text-lg font-semibold text-[var(--color-text)] mb-2">
        Đã xảy ra lỗi
      </h3>
      <p className="text-[var(--color-text-secondary)] text-sm mb-6 max-w-md">
        {message || 'Không thể tải dữ liệu. Vui lòng thử lại.'}
      </p>
      <Button variant="outline" onClick={onRetry}>
        <RefreshCw className="w-4 h-4" />
        Thử lại
      </Button>
    </motion.div>
  )
}

// ============ Unit Modal (Create/Edit) ============

function UnitModal({ isOpen, unit, onClose, onSave }) {
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [isActive, setIsActive] = useState(true)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (unit) {
      setName(unit.name || '')
      setSlug(unit.slug || '')
      setIsActive(unit.is_active !== false)
    } else {
      setName('')
      setSlug('')
      setIsActive(true)
    }
    setErrors({})
  }, [unit, isOpen])

  const handleNameChange = (value) => {
    setName(value)
    // Auto-generate slug from name
    const generatedSlug = value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
    setSlug(generatedSlug)
  }

  const validate = () => {
    const newErrors = {}
    if (!name.trim()) {
      newErrors.name = 'Tên đơn vị là bắt buộc'
    }
    if (!slug.trim()) {
      newErrors.slug = 'Slug là bắt buộc'
    } else if (!/^[a-z0-9-]+$/.test(slug)) {
      newErrors.slug = 'Slug chỉ chứa chữ thường, số và dấu gạch ngang'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) return

    setLoading(true)
    try {
      const data = { name: name.trim(), slug: slug.trim(), is_active: isActive }
      if (unit) {
        await adminApi.updateUnit(unit.id, data)
        toast.success('Đã cập nhật đơn vị')
      } else {
        await adminApi.createUnit(data)
        toast.success('Đã tạo đơn vị mới')
      }
      onSave()
      onClose()
    } catch (err) {
      const msg = err?.response?.data?.message || err?.response?.data?.slug?.[0]
      if (msg) {
        toast.error(msg)
      } else {
        toast.error('Không thể lưu đơn vị')
      }
    } finally {
      setLoading(false)
    }
  }

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
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="bg-[var(--color-surface)] rounded-[var(--radius-xl)] border border-[var(--color-border)] shadow-[var(--shadow-xl)] p-6 w-full max-w-md">
              <h3 className="font-display text-lg font-semibold text-[var(--color-text)] mb-6">
                {unit ? 'Sửa đơn vị' : 'Thêm đơn vị mới'}
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text)] mb-1.5">
                    Tên đơn vị
                  </label>
                  <Input
                    value={name}
                    onChange={e => handleNameChange(e.target.value)}
                    placeholder="Ví dụ: Kilogram"
                    error={errors.name}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--color-text)] mb-1.5">
                    Slug
                  </label>
                  <Input
                    value={slug}
                    onChange={e => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                    placeholder="Ví dụ: kg"
                    error={errors.slug}
                  />
                  <p className="text-xs text-[var(--color-text-muted)] mt-1">
                    Dùng cho hệ thống, không dấu cách (VD: kg, g, ml)
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setIsActive(!isActive)}
                    className={cn(
                      'relative w-11 h-6 rounded-full transition-colors',
                      isActive ? 'bg-[var(--color-primary)]' : 'bg-[var(--color-border-strong)]'
                    )}
                  >
                    <span
                      className={cn(
                        'absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm',
                        'transition-transform duration-[var(--transition-fast)]',
                        isActive && 'translate-x-5'
                      )}
                    />
                  </button>
                  <span className="text-sm text-[var(--color-text)]">
                    {isActive ? 'Đang hoạt động' : 'Bị vô hiệu hóa'}
                  </span>
                </div>
              </div>

              <div className="flex gap-3 mt-6 pt-4 border-t border-[var(--color-border)]">
                <Button variant="outline" className="flex-1" onClick={onClose} disabled={loading}>
                  Hủy
                </Button>
                <Button variant="primary" className="flex-1" onClick={handleSubmit} disabled={loading} isLoading={loading}>
                  <Check className="w-4 h-4" />
                  Lưu
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

// ============ Confirm Delete Dialog ============

function DeleteConfirmDialog({ isOpen, unit, onConfirm, onCancel, loading }) {
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
            <div className="bg-[var(--color-surface)] rounded-[var(--radius-xl)] border border-[var(--color-border)] shadow-[var(--shadow-xl)] p-6 max-w-md w-full">
              <h3 className="font-display text-lg font-semibold text-[var(--color-text)] mb-2">
                Xóa "{unit?.name}"?
              </h3>
              <p className="text-sm text-[var(--color-text-secondary)] mb-6">
                Đơn vị sẽ bị vô hiệu hóa thay vì xóa hoàn toàn. Có thể khôi phục sau.
              </p>
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={onCancel} disabled={loading}>
                  Hủy
                </Button>
                <Button
                  variant="danger"
                  className="flex-1"
                  onClick={onConfirm}
                  disabled={loading}
                  isLoading={loading}
                >
                  <Trash2 className="w-4 h-4" />
                  Xóa
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

// ============ Unit List Item ============

function UnitListItem({ unit, onEdit, onDelete }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[var(--color-surface)] rounded-[var(--radius-lg)] border border-[var(--color-border)] p-4"
    >
      <div className="flex items-center gap-4">
        {/* Icon */}
        <div className={cn(
          'w-10 h-10 rounded-[var(--radius-md)] flex items-center justify-center',
          unit.is_active
            ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]'
            : 'bg-[var(--color-background-alt)] text-[var(--color-text-muted)]'
        )}>
          <ScaleIcon className="w-5 h-5" />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h3 className="font-display text-base font-semibold text-[var(--color-text)]">
            {unit.name}
          </h3>
          <p className="text-sm text-[var(--color-text-muted)] font-mono">
            {unit.slug}
          </p>
        </div>

        {/* Status */}
        <Badge variant={unit.is_active ? 'success' : 'muted'} size="sm">
          {unit.is_active ? 'Hoạt động' : 'Bị vô hiệu hóa'}
        </Badge>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onEdit(unit)}
          >
            <Pencil className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(unit)}
            className="text-red-500 hover:text-red-600 hover:bg-red-50"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </motion.div>
  )
}

// ============ Units Tab ============

function UnitsTab() {
  const [units, setUnits] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showInactive, setShowInactive] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingUnit, setEditingUnit] = useState(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deletingUnit, setDeletingUnit] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const loadUnits = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = showInactive ? { include_inactive: true } : {}
      const res = await adminApi.getUnits(params)
      setUnits(res.data || [])
    } catch (err) {
      setError(err?.response?.data?.message || 'Không thể tải danh sách đơn vị')
    } finally {
      setLoading(false)
    }
  }, [showInactive])

  useEffect(() => {
    loadUnits()
  }, [loadUnits])

  const handleCreate = () => {
    setEditingUnit(null)
    setShowModal(true)
  }

  const handleEdit = (unit) => {
    setEditingUnit(unit)
    setShowModal(true)
  }

  const handleDelete = (unit) => {
    setDeletingUnit(unit)
    setShowDeleteDialog(true)
  }

  const handleConfirmDelete = async () => {
    setDeleteLoading(true)
    try {
      await adminApi.deleteUnit(deletingUnit.id)
      toast.success('Đã xóa đơn vị')
      setShowDeleteDialog(false)
      loadUnits()
    } catch (err) {
      toast.error('Không thể xóa đơn vị')
    } finally {
      setDeleteLoading(false)
    }
  }

  const filteredUnits = units.filter(unit => {
    const query = searchQuery.toLowerCase()
    return unit.name.toLowerCase().includes(query) || unit.slug.toLowerCase().includes(query)
  })

  return (
    <div className="p-4 space-y-4">
      {/* Controls */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Tìm kiếm đơn vị..."
            className={cn(
              'w-full h-10 pl-10 pr-4 rounded-[var(--radius-md)]',
              'border border-[var(--color-border)]',
              'bg-[var(--color-surface)]',
              'text-[var(--color-text)] text-sm',
              'placeholder:text-[var(--color-text-muted)]',
              'focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent'
            )}
          />
        </div>

        <Button variant="outline" size="sm" onClick={() => setShowInactive(!showInactive)}>
          {showInactive ? 'Ẩn không hoạt động' : 'Hiện tất cả'}
        </Button>

        <Button variant="primary" size="sm" onClick={handleCreate}>
          <Plus className="w-4 h-4" />
          Thêm đơn vị
        </Button>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-6 text-sm text-[var(--color-text-secondary)]">
        <span>{units.filter(u => u.is_active).length} đang hoạt động</span>
        <span>{units.filter(u => !u.is_active).length} bị vô hiệu hóa</span>
      </div>

      {/* List */}
      {loading ? (
        <LoadingSkeleton />
      ) : error ? (
        <ErrorState message={error} onRetry={loadUnits} />
      ) : filteredUnits.length === 0 ? (
        <EmptyState type={searchQuery ? 'search' : 'units'} />
      ) : (
        <div className="space-y-3">
          {filteredUnits.map(unit => (
            <UnitListItem
              key={unit.id}
              unit={unit}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      <UnitModal
        isOpen={showModal}
        unit={editingUnit}
        onClose={() => setShowModal(false)}
        onSave={loadUnits}
      />
      <DeleteConfirmDialog
        isOpen={showDeleteDialog}
        unit={deletingUnit}
        onConfirm={handleConfirmDelete}
        onCancel={() => setShowDeleteDialog(false)}
        loading={deleteLoading}
      />
    </div>
  )
}

// ============ Ingredient Units Tab ============

function IngredientUnitsTab() {
  const [ingredients, setIngredients] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [unitSearchQuery, setUnitSearchQuery] = useState('')
  const [selectedIngredient, setSelectedIngredient] = useState(null)
  const [selectedUnits, setSelectedUnits] = useState([])
  const [defaultUnitId, setDefaultUnitId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [loadingUnits, setLoadingUnits] = useState(false)

  const handleWheel = useCallback((e) => {
    e.stopPropagation()
  }, [])

  const loadIngredients = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await adminApi.getIngredientAll({ page_size: 500 })
      const results = res.data?.results || res.data?.data || []
      setIngredients(results)
    } catch (err) {
      setError(err?.response?.data?.message || 'Không thể tải danh sách nguyên liệu')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadIngredients()
  }, [loadIngredients])

  const handleSelectIngredient = async (ingredient) => {
    setSelectedIngredient(ingredient)
    setLoadingUnits(true)
    try {
      const res = await adminApi.getIngredientUnits(ingredient.id)
      const data = res.data || {}
      setSelectedUnits(data.allowed_units?.map(u => u.id) || [])
      setDefaultUnitId(data.default_unit?.id || null)
    } catch (err) {
      toast.error('Không thể tải đơn vị của nguyên liệu')
      setSelectedUnits([])
      setDefaultUnitId(null)
    } finally {
      setLoadingUnits(false)
    }
  }

  const handleToggleUnit = (unitId) => {
    setSelectedUnits(prev => {
      if (prev.includes(unitId)) {
        // If removing the default, clear default
        if (defaultUnitId === unitId) {
          setDefaultUnitId(null)
        }
        return prev.filter(id => id !== unitId)
      }
      return [...prev, unitId]
    })
  }

  const handleSetDefault = (unitId) => {
    if (!selectedUnits.includes(unitId)) {
      toast.error('Đơn vị phải nằm trong danh sách được phép trước')
      return
    }
    setDefaultUnitId(unitId)
  }

  const handleSave = async () => {
    if (!selectedIngredient) return

    setSaving(true)
    try {
      await adminApi.updateIngredientUnits(selectedIngredient.id, {
        default_unit_id: defaultUnitId,
        allowed_unit_ids: selectedUnits
      })
      toast.success('Đã lưu đơn vị cho nguyên liệu')
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Không thể lưu đơn vị')
    } finally {
      setSaving(false)
    }
  }

  const filteredIngredients = ingredients.filter(ing => {
    const query = searchQuery.toLowerCase()
    const matchesSearch = ing.name?.toLowerCase().includes(query)
    const hasUnits = ing.default_unit || (ing.allowed_units?.length > 0)
    if (unitFilter === 'assigned') return matchesSearch && hasUnits
    if (unitFilter === 'unassigned') return matchesSearch && !hasUnits
    return matchesSearch
  })
  const filteredUnits = units.filter(unit => {
    const query = unitSearchQuery.toLowerCase()
    return unit.name?.toLowerCase().includes(query) || unit.slug?.toLowerCase().includes(query)
  })

  const categoryLabels = {
    PROTEIN: { label: 'Protein', color: 'bg-red-100 text-red-700' },
    CARB: { label: 'Carbohydrate', color: 'bg-amber-100 text-amber-700' },
    VEG: { label: 'Rau củ', color: 'bg-green-100 text-green-700' },
    SPICE: { label: 'Gia vị', color: 'bg-purple-100 text-purple-700' },
    STAPLE: { label: 'Gia vị cơ bản', color: 'bg-orange-100 text-orange-700' },
    OTHER: { label: 'Khác', color: 'bg-gray-100 text-gray-700' },
  }

  return (
    <div className="p-4 space-y-4">
      {/* Search and Filter */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" />
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Tìm kiếm nguyên liệu..."
          className={cn(
            'w-full h-10 pl-10 pr-4 rounded-[var(--radius-md)]',
            'border border-[var(--color-border)]',
            'bg-[var(--color-surface)]',
            'text-[var(--color-text)] text-sm',
            'placeholder:text-[var(--color-text-muted)]',
            'focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent'
          )}
        />
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setUnitFilter('all')}
          className={cn(
            'px-3 py-1.5 rounded-[var(--radius-sm)] text-xs font-medium transition-colors',
            unitFilter === 'all'
              ? 'bg-[var(--color-primary)] text-white'
              : 'bg-[var(--color-surface)] text-[var(--color-text-secondary)] border border-[var(--color-border)] hover:border-[var(--color-border-strong)]'
          )}
        >
          Tất cả
        </button>
        <button
          type="button"
          onClick={() => setUnitFilter('assigned')}
          className={cn(
            'px-3 py-1.5 rounded-[var(--radius-sm)] text-xs font-medium transition-colors',
            unitFilter === 'assigned'
              ? 'bg-[var(--color-primary)] text-white'
              : 'bg-[var(--color-surface)] text-[var(--color-text-secondary)] border border-[var(--color-border)] hover:border-[var(--color-border-strong)]'
          )}
        >
          Đã gán
        </button>
        <button
          type="button"
          onClick={() => setUnitFilter('unassigned')}
          className={cn(
            'px-3 py-1.5 rounded-[var(--radius-sm)] text-xs font-medium transition-colors',
            unitFilter === 'unassigned'
              ? 'bg-[var(--color-primary)] text-white'
              : 'bg-[var(--color-surface)] text-[var(--color-text-secondary)] border border-[var(--color-border)] hover:border-[var(--color-border-strong)]'
          )}
        >
          Chưa gán
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Ingredient list */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-[var(--color-text-secondary)]">
            Chọn nguyên liệu ({filteredIngredients.length})
          </h3>
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-16 bg-[var(--color-background-alt)] rounded-[var(--radius-md)] animate-pulse" />
              ))}
            </div>
          ) : filteredIngredients.length === 0 ? (
            <EmptyState type="search" />
          ) : (
            <div onWheel={handleWheel} className="space-y-2 max-h-96 overflow-y-auto">
              {filteredIngredients.slice(0, 50).map(ing => {
                const cat = categoryLabels[ing.category] || categoryLabels.OTHER
                return (
                  <button
                    key={ing.id}
                    onClick={() => handleSelectIngredient(ing)}
                    className={cn(
                      'w-full p-3 rounded-[var(--radius-md)] border text-left transition-all',
                      selectedIngredient?.id === ing.id
                        ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5'
                        : 'border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-border-strong)]'
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <Package2 className="w-4 h-4 text-[var(--color-text-muted)]" />
                      <span className="font-medium text-[var(--color-text)]">{ing.name}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className={cn('px-2 py-0.5 rounded-full text-xs', cat.color)}>
                        {cat.label}
                      </span>
                      {ing.default_unit && (
                        <span className="px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-700">
                          Mặc định: {ing.default_unit.name}
                        </span>
                      )}
                      {ing.allowed_units?.length > 0 && (
                        <span className="text-xs text-[var(--color-text-muted)]">
                          {ing.allowed_units.length} đơn vị
                        </span>
                      )}
                      {!(ing.allowed_units?.length > 0) && (
                        <span className="text-xs text-orange-500">Chưa gán</span>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Unit assignment */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-[var(--color-text-secondary)]">
              {selectedIngredient ? `Đơn vị cho "${selectedIngredient.name}"` : 'Chọn nguyên liệu để gán đơn vị'}
            </h3>
            {selectedIngredient && (
              <Button
                variant="primary"
                size="sm"
                onClick={handleSave}
                disabled={saving || loadingUnits}
                isLoading={saving}
              >
                <Check className="w-4 h-4" />
                Lưu
              </Button>
            )}
          </div>

          {loadingUnits ? (
            <div className="space-y-2">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-12 bg-[var(--color-background-alt)] rounded-[var(--radius-md)] animate-pulse" />
              ))}
            </div>
          ) : selectedIngredient ? (
            <div className="space-y-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" />
                <input
                  type="text"
                  value={unitSearchQuery}
                  onChange={e => setUnitSearchQuery(e.target.value)}
                  placeholder="Tìm kiếm đơn vị..."
                  className={cn(
                    'w-full h-9 pl-10 pr-4 rounded-[var(--radius-md)] text-sm',
                    'border border-[var(--color-border)]',
                    'bg-[var(--color-surface)]',
                    'text-[var(--color-text)]',
                    'placeholder:text-[var(--color-text-muted)]',
                    'focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent'
                  )}
                />
              </div>
              <div
                onWheel={handleWheel}
                className="space-y-2 max-h-72 overflow-y-auto"
              >
                {filteredUnits.map(unit => {
                const isSelected = selectedUnits.includes(unit.id)
                const isDefault = defaultUnitId === unit.id
                return (
                  <div
                    key={unit.id}
                    className={cn(
                      'flex items-center gap-3 p-3 rounded-[var(--radius-md)] border transition-all',
                      isSelected
                        ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5'
                        : 'border-[var(--color-border)] bg-[var(--color-surface)]',
                      !unit.is_active && 'opacity-50'
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleToggleUnit(unit.id)}
                      disabled={!unit.is_active}
                      className="w-4 h-4 rounded border-[var(--color-border)] text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
                    />
                    <div className="flex-1">
                      <span className="font-medium text-[var(--color-text)]">{unit.name}</span>
                      <span className="ml-2 text-sm text-[var(--color-text-muted)] font-mono">({unit.slug})</span>
                    </div>
                    {isSelected && (
                      <button
                        onClick={() => handleSetDefault(unit.id)}
                        className={cn(
                          'px-2 py-1 rounded text-xs font-medium transition-colors',
                          isDefault
                            ? 'bg-[var(--color-primary)] text-white'
                            : 'bg-[var(--color-background-alt)] text-[var(--color-text-secondary)] hover:bg-[var(--color-primary)]/10'
                        )}
                      >
                        Mặc định
                      </button>
                    )}
                  </div>
                )
              })}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-48 rounded-[var(--radius-lg)] border border-dashed border-[var(--color-border)]">
              <p className="text-[var(--color-text-muted)] text-sm">
                Chọn một nguyên liệu từ danh sách bên trái
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ============ Main Page ============

export function UnitManagementPage() {
  const [activeTab, setActiveTab] = useState('units')
  const [units, setUnits] = useState([])

  const tabs = [
    { id: 'units', label: 'Danh sách Đơn vị', icon: Scale },
    { id: 'assignment', label: 'Gán Đơn vị', icon: Package2 },
  ]

  useEffect(() => {
    if (activeTab === 'assignment') {
      // Only fetch active units for assignment tab
      adminApi.getUnits()
        .then(res => setUnits(res.data || []))
        .catch(() => setUnits([]))
    }
  }, [activeTab])

  return (
    <div className="min-h-screen bg-[var(--color-background)]">
      {/* Header */}
      <div className="px-4 py-4">
        <a
          href="/admin/ingredients"
          className="inline-flex items-center gap-1.5 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text)] mb-3 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Quay về Quản lý Nguyên liệu
        </a>
        <h1 className="font-display text-2xl font-bold text-[var(--color-text)]">
          Quản lý Đơn vị
        </h1>
        <p className="text-sm text-[var(--color-text-secondary)] mt-1">
          Quản lý danh mục đơn vị đo lường và gán cho nguyên liệu
        </p>
      </div>

      {/* Tab navigation */}
      <div className="flex border-b border-[var(--color-border)]">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'flex items-center gap-2 px-6 py-4 font-medium transition-colors relative',
              activeTab === tab.id
                ? 'text-[var(--color-primary)]'
                : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
            )}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
            {activeTab === tab.id && (
              <motion.div
                layoutId="activeTabUnits"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--color-primary)]"
              />
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'units' ? (
            <UnitsTab />
          ) : (
            <IngredientUnitsTabWithUnits units={units} setUnits={setUnits} />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

// Wrapper component to pass units prop
function IngredientUnitsTabWithUnits({ units, setUnits }) {
  const [ingredients, setIngredients] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [unitSearchQuery, setUnitSearchQuery] = useState('')
  const [selectedIngredient, setSelectedIngredient] = useState(null)
  const [selectedUnits, setSelectedUnits] = useState([])
  const [defaultUnitId, setDefaultUnitId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [loadingUnits, setLoadingUnits] = useState(false)
  const [unitFilter, setUnitFilter] = useState('all') // 'all' | 'assigned' | 'unassigned'

  const handleWheel = useCallback((e) => {
    e.stopPropagation()
  }, [])

  const loadIngredients = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await adminApi.getIngredientAll({ page_size: 500 })
      const results = res.data?.results || res.data?.data || []
      setIngredients(results)
    } catch (err) {
      setError(err?.response?.data?.message || 'Không thể tải danh sách nguyên liệu')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadIngredients()
  }, [loadIngredients])

  const handleSelectIngredient = async (ingredient) => {
    setSelectedIngredient(ingredient)
    setLoadingUnits(true)
    try {
      const res = await adminApi.getIngredientUnits(ingredient.id)
      const data = res.data || {}
      setSelectedUnits(data.allowed_units?.map(u => u.id) || [])
      setDefaultUnitId(data.default_unit?.id || null)
    } catch (err) {
      toast.error('Không thể tải đơn vị của nguyên liệu')
      setSelectedUnits([])
      setDefaultUnitId(null)
    } finally {
      setLoadingUnits(false)
    }
  }

  const handleToggleUnit = (unitId) => {
    setSelectedUnits(prev => {
      if (prev.includes(unitId)) {
        if (defaultUnitId === unitId) {
          setDefaultUnitId(null)
        }
        return prev.filter(id => id !== unitId)
      }
      return [...prev, unitId]
    })
  }

  const handleSetDefault = (unitId) => {
    if (!selectedUnits.includes(unitId)) {
      toast.error('Đơn vị phải nằm trong danh sách được phép trước')
      return
    }
    setDefaultUnitId(unitId)
  }

  const handleSave = async () => {
    if (!selectedIngredient) return

    setSaving(true)
    try {
      await adminApi.updateIngredientUnits(selectedIngredient.id, {
        default_unit_id: defaultUnitId,
        allowed_unit_ids: selectedUnits
      })
      toast.success('Đã lưu đơn vị cho nguyên liệu')
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Không thể lưu đơn vị')
    } finally {
      setSaving(false)
    }
  }

  const filteredIngredients = ingredients.filter(ing => {
    const query = searchQuery.toLowerCase()
    const matchesSearch = ing.name?.toLowerCase().includes(query)
    const hasUnits = ing.default_unit || (ing.allowed_units?.length > 0)
    if (unitFilter === 'assigned') return matchesSearch && hasUnits
    if (unitFilter === 'unassigned') return matchesSearch && !hasUnits
    return matchesSearch
  })
  const filteredUnits = units.filter(unit => {
    const query = unitSearchQuery.toLowerCase()
    return unit.name?.toLowerCase().includes(query) || unit.slug?.toLowerCase().includes(query)
  })

  const categoryLabels = {
    PROTEIN: { label: 'Protein', color: 'bg-red-100 text-red-700' },
    CARB: { label: 'Carbohydrate', color: 'bg-amber-100 text-amber-700' },
    VEG: { label: 'Rau củ', color: 'bg-green-100 text-green-700' },
    SPICE: { label: 'Gia vị', color: 'bg-purple-100 text-purple-700' },
    STAPLE: { label: 'Gia vị cơ bản', color: 'bg-orange-100 text-orange-700' },
    OTHER: { label: 'Khác', color: 'bg-gray-100 text-gray-700' },
  }

  return (
    <div className="p-4 space-y-4">
      {/* Search and Filter */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" />
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Tìm kiếm nguyên liệu..."
          className={cn(
            'w-full h-10 pl-10 pr-4 rounded-[var(--radius-md)]',
            'border border-[var(--color-border)]',
            'bg-[var(--color-surface)]',
            'text-[var(--color-text)] text-sm',
            'placeholder:text-[var(--color-text-muted)]',
            'focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent'
          )}
        />
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setUnitFilter('all')}
          className={cn(
            'px-3 py-1.5 rounded-[var(--radius-sm)] text-xs font-medium transition-colors',
            unitFilter === 'all'
              ? 'bg-[var(--color-primary)] text-white'
              : 'bg-[var(--color-surface)] text-[var(--color-text-secondary)] border border-[var(--color-border)] hover:border-[var(--color-border-strong)]'
          )}
        >
          Tất cả
        </button>
        <button
          type="button"
          onClick={() => setUnitFilter('assigned')}
          className={cn(
            'px-3 py-1.5 rounded-[var(--radius-sm)] text-xs font-medium transition-colors',
            unitFilter === 'assigned'
              ? 'bg-[var(--color-primary)] text-white'
              : 'bg-[var(--color-surface)] text-[var(--color-text-secondary)] border border-[var(--color-border)] hover:border-[var(--color-border-strong)]'
          )}
        >
          Đã gán
        </button>
        <button
          type="button"
          onClick={() => setUnitFilter('unassigned')}
          className={cn(
            'px-3 py-1.5 rounded-[var(--radius-sm)] text-xs font-medium transition-colors',
            unitFilter === 'unassigned'
              ? 'bg-[var(--color-primary)] text-white'
              : 'bg-[var(--color-surface)] text-[var(--color-text-secondary)] border border-[var(--color-border)] hover:border-[var(--color-border-strong)]'
          )}
        >
          Chưa gán
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Ingredient list */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-[var(--color-text-secondary)]">
            Chọn nguyên liệu ({filteredIngredients.length})
          </h3>
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-16 bg-[var(--color-background-alt)] rounded-[var(--radius-md)] animate-pulse" />
              ))}
            </div>
          ) : filteredIngredients.length === 0 ? (
            <EmptyState type="search" />
          ) : (
            <div onWheel={handleWheel} className="space-y-2 max-h-96 overflow-y-auto">
              {filteredIngredients.slice(0, 50).map(ing => {
                const cat = categoryLabels[ing.category] || categoryLabels.OTHER
                return (
                  <button
                    key={ing.id}
                    onClick={() => handleSelectIngredient(ing)}
                    className={cn(
                      'w-full p-3 rounded-[var(--radius-md)] border text-left transition-all',
                      selectedIngredient?.id === ing.id
                        ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5'
                        : 'border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-border-strong)]'
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <Package2 className="w-4 h-4 text-[var(--color-text-muted)]" />
                      <span className="font-medium text-[var(--color-text)]">{ing.name}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className={cn('px-2 py-0.5 rounded-full text-xs', cat.color)}>
                        {cat.label}
                      </span>
                      {ing.default_unit && (
                        <span className="px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-700">
                          Mặc định: {ing.default_unit.name}
                        </span>
                      )}
                      {ing.allowed_units?.length > 0 && (
                        <span className="text-xs text-[var(--color-text-muted)]">
                          {ing.allowed_units.length} đơn vị
                        </span>
                      )}
                      {!(ing.allowed_units?.length > 0) && (
                        <span className="text-xs text-orange-500">Chưa gán</span>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Unit assignment */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-[var(--color-text-secondary)]">
              {selectedIngredient ? `Đơn vị cho "${selectedIngredient.name}"` : 'Chọn nguyên liệu để gán đơn vị'}
            </h3>
            {selectedIngredient && (
              <Button
                variant="primary"
                size="sm"
                onClick={handleSave}
                disabled={saving || loadingUnits}
                isLoading={saving}
              >
                <Check className="w-4 h-4" />
                Lưu
              </Button>
            )}
          </div>

          {loadingUnits ? (
            <div className="space-y-2">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-12 bg-[var(--color-background-alt)] rounded-[var(--radius-md)] animate-pulse" />
              ))}
            </div>
          ) : selectedIngredient ? (
            <div className="space-y-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" />
                <input
                  type="text"
                  value={unitSearchQuery}
                  onChange={e => setUnitSearchQuery(e.target.value)}
                  placeholder="Tìm kiếm đơn vị..."
                  className={cn(
                    'w-full h-9 pl-10 pr-4 rounded-[var(--radius-md)] text-sm',
                    'border border-[var(--color-border)]',
                    'bg-[var(--color-surface)]',
                    'text-[var(--color-text)]',
                    'placeholder:text-[var(--color-text-muted)]',
                    'focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent'
                  )}
                />
              </div>
              <div
                onWheel={handleWheel}
                className="space-y-2 max-h-72 overflow-y-auto"
              >
                {filteredUnits.map(unit => {
                const isSelected = selectedUnits.includes(unit.id)
                const isDefault = defaultUnitId === unit.id
                return (
                  <div
                    key={unit.id}
                    className={cn(
                      'flex items-center gap-3 p-3 rounded-[var(--radius-md)] border transition-all',
                      isSelected
                        ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5'
                        : 'border-[var(--color-border)] bg-[var(--color-surface)]',
                      !unit.is_active && 'opacity-50'
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleToggleUnit(unit.id)}
                      disabled={!unit.is_active}
                      className="w-4 h-4 rounded border-[var(--color-border)] text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
                    />
                    <div className="flex-1">
                      <span className="font-medium text-[var(--color-text)]">{unit.name}</span>
                      <span className="ml-2 text-sm text-[var(--color-text-muted)] font-mono">({unit.slug})</span>
                    </div>
                    {isSelected && (
                      <button
                        onClick={() => handleSetDefault(unit.id)}
                        className={cn(
                          'px-2 py-1 rounded text-xs font-medium transition-colors',
                          isDefault
                            ? 'bg-[var(--color-primary)] text-white'
                            : 'bg-[var(--color-background-alt)] text-[var(--color-text-secondary)] hover:bg-[var(--color-primary)]/10'
                        )}
                      >
                        Mặc định
                      </button>
                    )}
                  </div>
                )
              })}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-48 rounded-[var(--radius-lg)] border border-dashed border-[var(--color-border)]">
              <p className="text-[var(--color-text-muted)] text-sm">
                Chọn một nguyên liệu từ danh sách bên trái
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default UnitManagementPage