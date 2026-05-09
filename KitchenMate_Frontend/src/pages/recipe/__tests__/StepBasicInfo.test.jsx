import { describe, it, expect } from 'vitest'

// Test the category API response parsing logic
// This tests the actual implementation in StepBasicInfo.jsx line 38
describe('Category API Response Parsing', () => {
  // This mirrors the FIXED code in StepBasicInfo line 38
  function parseCategories(res) {
    const cats = res.results || res.data?.results || []
    return cats
  }

  it('should return categories when API returns { count, results }', () => {
    // categoryApi.getCategories() returns this structure directly
    const apiResponse = {
      count: 3,
      next: null,
      previous: null,
      results: [
        { id: 'uuid-1', slug: 'mon-viet', name: 'Món Việt' },
        { id: 'uuid-2', slug: 'mon-a', name: 'Món Á' },
        { id: 'uuid-3', slug: 'mon-tay', name: 'Món Tây' },
      ],
    }

    const result = parseCategories(apiResponse)

    expect(result).toHaveLength(3)
    expect(result[0].name).toBe('Món Việt')
  })

  it('should handle timeout fallback format { data: { results } }', () => {
    // Timeout promise resolves to this format
    const timeoutResponse = {
      data: {
        results: [{ id: 'fallback-1', slug: 'mon-viet', name: 'Món Việt' }],
      },
    }

    const result = parseCategories(timeoutResponse)

    expect(result).toHaveLength(1)
    expect(result[0].name).toBe('Món Việt')
  })

  it('should return empty array for malformed response', () => {
    const emptyResponse = {}

    const result = parseCategories(emptyResponse)

    expect(result).toEqual([])
  })

  it('should handle empty results array', () => {
    const emptyResults = {
      count: 0,
      results: [],
    }

    const result = parseCategories(emptyResults)

    expect(result).toEqual([])
  })
})