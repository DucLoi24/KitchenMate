export const ingredientApi = {
  getIngredients: async (params = {}) => {
    const { default: axiosInstance } = await import('@/lib/axiosInstance')
    const { data } = await axiosInstance.get('/ingredients/', { params })
    return data
  },

  createIngredient: async (ingredientData) => {
    const { default: axiosInstance } = await import('@/lib/axiosInstance')
    const { data } = await axiosInstance.post('/ingredients/', ingredientData)
    return data
  },

  getCategories: async () => {
    const { default: axiosInstance } = await import('@/lib/axiosInstance')
    const { data } = await axiosInstance.get('/recipes/categories/')
    return data
  },
}

export default ingredientApi