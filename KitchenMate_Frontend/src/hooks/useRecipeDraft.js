import { useState, useEffect, useCallback, useRef } from 'react'

const DRAFT_KEY_PREFIX = 'recipe-draft-'
const AUTO_SAVE_DELAY = 5000 // 5 seconds

export const VISIBILITY = {
  PRIVATE: 'PRIVATE',
  PUBLIC: 'PUBLIC',
}

export const DIFFICULTY = {
  EASY: 'EASY',
  MEDIUM: 'MEDIUM',
  HARD: 'HARD',
}

export const DIFFICULTY_CONFIG = {
  EASY: { label: 'Dễ', color: '#3D5A45', bg: 'rgba(61, 90, 69, 0.1)' },
  MEDIUM: { label: 'Trung bình', color: '#D4A03B', bg: 'rgba(212, 160, 59, 0.1)' },
  HARD: { label: 'Khó', color: '#B85C38', bg: 'rgba(184, 92, 56, 0.1)' },
}

export const CATEGORY_COLORS = {
  PROTEIN: 'bg-rose-100 text-rose-700',
  CARB: 'bg-amber-100 text-amber-700',
  VEG: 'bg-emerald-100 text-emerald-700',
  SPICE: 'bg-orange-100 text-orange-700',
  STAPLE: 'bg-stone-100 text-stone-600',
  OTHER: 'bg-slate-100 text-slate-600',
}

export const UNITS = ['g', 'kg', 'ml', 'l', 'cups', 'tbsp', 'tsp', 'piece', 'bun', 'clove', 'slice']

export function useDebounceCallback(callback, delay) {
  const timeoutRef = useRef(null)
  return useCallback((...args) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(() => callback(...args), delay)
  }, [callback, delay])
}

function getDraftKey(userId, recipeId) {
  if (recipeId) {
    return `${DRAFT_KEY_PREFIX}edit-${recipeId}`
  }
  return `${DRAFT_KEY_PREFIX}new`
}

function loadDraft(key) {
  try {
    const saved = localStorage.getItem(key)
    if (saved) {
      return JSON.parse(saved)
    }
  } catch (e) {
    console.warn('Failed to load recipe draft:', e)
  }
  return null
}

function saveDraft(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data))
  } catch (e) {
    console.warn('Failed to save recipe draft:', e)
  }
}

function clearDraft(key) {
  try {
    localStorage.removeItem(key)
  } catch (e) {
    console.warn('Failed to clear recipe draft:', e)
  }
}

function normalizeFormData(data = {}) {
  return {
    categories: [],  // UUID array for backend PrimaryKeyRelatedField
    ...(data || {}),
  }
}

function createDraftState(draftKey) {
  const saved = loadDraft(draftKey)
  return {
    formData: normalizeFormData(saved || {}),
    lastSaved: saved?._savedAt ? new Date(saved._savedAt) : null,
    hasDraft: Boolean(saved),
  }
}

export function useRecipeDraft(userId, recipeId = null) {
  const draftKey = getDraftKey(userId, recipeId)
  const draftKeyRef = useRef(draftKey)
  const [draftState, setDraftState] = useState(() => createDraftState(draftKey))
  const { formData, lastSaved, hasDraft } = draftState

  // Reload draft when the editor switches between recipes without remounting.
  useEffect(() => {
    if (draftKeyRef.current === draftKey) return
    draftKeyRef.current = draftKey

    let isActive = true
    queueMicrotask(() => {
      if (isActive) {
        setDraftState(createDraftState(draftKey))
      }
    })

    return () => {
      isActive = false
    }
  }, [draftKey])

  // Auto-save effect with debounce
  useEffect(() => {
    // Only auto-save if there's actual content to save
    const hasContent = formData && (
      formData.title || formData.description ||
      (formData.ingredients?.length > 0) ||
      (formData.steps?.length > 0)
    )
    if (!hasContent) return

    const timer = setTimeout(() => {
      const dataToSave = {
        ...formData,
        _savedAt: new Date().toISOString(),
      }
      saveDraft(draftKey, dataToSave)
      setDraftState((prev) => ({ ...prev, lastSaved: new Date() }))
    }, AUTO_SAVE_DELAY)

    return () => clearTimeout(timer)
  }, [formData, draftKey])

  const updateFormData = useCallback((updates) => {
    setDraftState((prev) => {
      const nextFormData = typeof updates === 'function'
        ? updates(prev.formData)
        : { ...prev.formData, ...updates }

      return {
        ...prev,
        formData: normalizeFormData(nextFormData),
      }
    })
  }, [])

  const clearAllDraft = useCallback(() => {
    clearDraft(draftKey)
    setDraftState({
      formData: normalizeFormData(),
      lastSaved: null,
      hasDraft: false,
    })
  }, [draftKey])

  const initializeForm = useCallback((initialData) => {
    setDraftState({
      formData: normalizeFormData(initialData),
      lastSaved: null,
      hasDraft: false,
    })
  }, [])

  return {
    formData,
    lastSaved,
    hasDraft,
    updateFormData,
    clearAllDraft,
    initializeForm,
  }
}

export function useIngredients(searchQuery = '') {
  const [results, setResults] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const shouldSearch = Boolean(searchQuery && searchQuery.length >= 2)

  useEffect(() => {
    if (!shouldSearch) return

    const controller = new AbortController()

    const search = async () => {
      setIsLoading(true)
      try {
        const { default: axiosInstance } = await import('@/lib/axiosInstance')
        const { data } = await axiosInstance.get('/ingredients/', {
          params: { search: searchQuery },
          signal: controller.signal,
        })
        setResults(data.data?.results || data.data || [])
      } catch (e) {
        if (!controller.signal.aborted) {
          console.error('Ingredient search failed:', e)
          setResults([])
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false)
        }
      }
    }

    const debounceTimer = setTimeout(search, 300)

    return () => {
      controller.abort()
      clearTimeout(debounceTimer)
    }
  }, [searchQuery, shouldSearch])

  return {
    results: shouldSearch ? results : [],
    isLoading: shouldSearch ? isLoading : false,
  }
}

export default { useRecipeDraft, useIngredients, useDebounceCallback, VISIBILITY, DIFFICULTY, DIFFICULTY_CONFIG, CATEGORY_COLORS, UNITS }
