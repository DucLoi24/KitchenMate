export const ingredientApi = {
  getIngredients: async (params = {}) => {
    const { default: axiosInstance } = await import('@/lib/axiosInstance')
    const { data } = await axiosInstance.get('/ingredients/', { params })
    return data
  },

  getIngredient: async (id) => {
    const { default: axiosInstance } = await import('@/lib/axiosInstance')
    const { data } = await axiosInstance.get(`/ingredients/${id}/`)
    return data
  },

  createIngredient: async (ingredientData) => {
    const { default: axiosInstance } = await import('@/lib/axiosInstance')
    const { data } = await axiosInstance.post('/ingredients/', ingredientData)
    return data
  },

  updateIngredient: async (id, ingredientData) => {
    const { default: axiosInstance } = await import('@/lib/axiosInstance')
    const { data } = await axiosInstance.patch(`/ingredients/${id}/`, ingredientData)
    return data
  },

  deleteIngredient: async (id) => {
    const { default: axiosInstance } = await import('@/lib/axiosInstance')
    await axiosInstance.delete(`/ingredients/${id}/`)
  },

  getCategories: async () => {
    const { default: axiosInstance } = await import('@/lib/axiosInstance')
    const { data } = await axiosInstance.get('/ingredients/categories/')
    return data
  },
}

export default ingredientApi