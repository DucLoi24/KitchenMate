/**
 * Suggestion API - calls backend recommendation engine
 * POST /api/recommendations/suggest/
 */

export const suggestionApi = {
  /**
   * Get recipe suggestions based on user's pantry
   * @param {string} mode - "COOK_NOW" | "ADD_MORE"
   * @param {string[]} excludeIngredients - ingredient IDs to exclude
   */
  getSuggestions: async (mode = 'COOK_NOW', excludeIngredients = []) => {
    const { default: axiosInstance } = await import('@/lib/axiosInstance')
    const { data } = await axiosInstance.post('/recommendations/suggest/', {
      mode,
      exclude_ingredients: excludeIngredients,
    })
    return data
  },
}

export default suggestionApi