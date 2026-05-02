export const recipeApi = {
  getRecipes: async (params = {}) => {
    const { default: axiosInstance } = await import('@/lib/axiosInstance')
    const { data } = await axiosInstance.get('/recipes/', { params })
    return data
  },

  getRecipe: async (id) => {
    const { default: axiosInstance } = await import('@/lib/axiosInstance')
    const { data } = await axiosInstance.get(`/recipes/${id}/`)
    return data
  },

  createRecipe: async (recipeData) => {
    const { default: axiosInstance } = await import('@/lib/axiosInstance')
    const { data } = await axiosInstance.post('/recipes/', recipeData)
    return data
  },

  updateRecipe: async (id, recipeData) => {
    const { default: axiosInstance } = await import('@/lib/axiosInstance')
    const { data } = await axiosInstance.patch(`/recipes/${id}/`, recipeData)
    return data
  },

  deleteRecipe: async (id) => {
    const { default: axiosInstance } = await import('@/lib/axiosInstance')
    await axiosInstance.delete(`/recipes/${id}/`)
  },

  uploadThumbnail: async (recipeId, file) => {
    const { default: axiosInstance } = await import('@/lib/axiosInstance')
    const formData = new FormData()
    formData.append('file', file)
    const { data } = await axiosInstance.post(`/recipes/${recipeId}/thumbnail/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return data
  },

  getMyRecipes: async () => {
    const { default: axiosInstance } = await import('@/lib/axiosInstance')
    const { data } = await axiosInstance.get('/recipes/my-recipes/')
    return data
  },
}

export default recipeApi