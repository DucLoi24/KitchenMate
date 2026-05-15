/**
 * Suggestion API - calls backend recommendation engine
 * POST /api/recommendations/suggest/
 */

export const suggestionApi = {
  /**
   * Get recipe suggestions based on user's pantry
   * @param {object|string} options - suggestion filters, or legacy mode string
   * @param {string[]} legacyExcludeIngredients - legacy ingredient IDs to exclude
   */
  getSuggestions: async (options = {}, legacyExcludeIngredients = []) => {
    const filters = typeof options === 'string'
      ? { mode: options, excludeIngredients: legacyExcludeIngredients }
      : options
    const {
      mode = 'COOK_NOW',
      excludeIngredients = [],
      cookingTime = [],
      categories = [],
      page,
      pageSize,
    } = filters || {}

    const { default: axiosInstance } = await import('@/lib/axiosInstance')
    const { data } = await axiosInstance.post('/recommendations/suggest/', {
      mode,
      exclude_ingredients: excludeIngredients,
      cooking_time: cookingTime,
      categories,
      ...(page ? { page } : {}),
      ...(pageSize ? { page_size: pageSize } : {}),
    })
    return data
  },
}

export default suggestionApi
