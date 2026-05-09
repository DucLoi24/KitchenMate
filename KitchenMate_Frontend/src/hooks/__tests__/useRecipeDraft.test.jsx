import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useRecipeDraft } from '../useRecipeDraft'

// Mock localStorage
const localStorageMock = {
  store: {},
  getItem: vi.fn((key) => localStorageMock.store[key] || null),
  setItem: vi.fn((key, value) => { localStorageMock.store[key] = value }),
  removeItem: vi.fn((key) => { delete localStorageMock.store[key] }),
  clear: vi.fn(() => { localStorageMock.store = {} }),
}

Object.defineProperty(global, 'localStorage', { value: localStorageMock })

describe('useRecipeDraft - RecipeEditorPage integration bug', () => {
  beforeEach(() => {
    localStorageMock.store = {}
    vi.clearAllMocks()
  })

  it('should handle the RecipeEditorPage auto-save pattern without infinite loop', () => {
    const { result } = renderHook(() => useRecipeDraft('user-123', 'recipe-789'))

    act(() => {
      result.current.initializeForm({
        title: 'Loaded Recipe',
        description: 'From API',
        ingredients: [{ id: '1', ingredient_name: 'Test', quantity: 100, unit: 'g' }],
        steps: [{ id: '1', step_number: 1, instruction: 'Do something' }],
        categories: [],
      })
    })

    expect(result.current.formData.title).toBe('Loaded Recipe')

    const emptyFormData = {
      title: '',
      description: '',
      difficulty: 'EASY',
      prep_time: '',
      thumbnail_url: '',
      ingredients: [],
      steps: [],
      visibility: 'PRIVATE',
    }

    act(() => {
      result.current.updateFormData(emptyFormData)
    })

    expect(result.current.formData.title).toBe('')
  })

  it('should preserve data when updateFormData is called with correct data', () => {
    const { result } = renderHook(() => useRecipeDraft('user-123', 'recipe-abc'))

    act(() => {
      result.current.initializeForm({
        title: 'Correct Recipe',
        description: 'Using draftData',
        ingredients: [],
        steps: [],
        categories: [],
      })
    })

    const currentData = result.current.formData
    act(() => {
      result.current.updateFormData(currentData)
    })

    expect(result.current.formData.title).toBe('Correct Recipe')
  })

  it('should not cause infinite loop when formData is updated in useEffect', () => {
    const { result } = renderHook(() => useRecipeDraft('user-123', 'recipe-loop'))

    act(() => {
      result.current.initializeForm({
        title: 'Test',
        description: '',
        ingredients: [],
        steps: [],
        categories: [],
      })
    })

    for (let i = 0; i < 5; i++) {
      act(() => {
        result.current.updateFormData({ title: `Update ${i}` })
      })
    }

    expect(result.current.formData.title).toBe('Update 4')
  })

  it('should return valid object (not null) for formData even before initializeForm', () => {
    const { result } = renderHook(() => useRecipeDraft('user-123', 'recipe-new'))

    // formData should NOT be null - it should be at least an empty object
    // This prevents crashes in StepBasicInfo where data.categories is accessed
    expect(result.current.formData).toBeDefined()
    expect(typeof result.current.formData).toBe('object')
    // The useEffect adds categories to empty object immediately after first render
    expect(result.current.formData.categories).toEqual([])
  })

  it('should properly initialize formData with real data', () => {
    const { result } = renderHook(() => useRecipeDraft('user-123', 'recipe-init'))

    // Initially empty object (no title property)
    expect(result.current.formData.title).toBeUndefined()

    act(() => {
      result.current.initializeForm({
        title: 'My Recipe',
        description: 'Test description',
        ingredients: [],
        steps: [],
        categories: [],
      })
    })

    expect(result.current.formData.title).toBe('My Recipe')
    expect(result.current.formData.description).toBe('Test description')
  })
})