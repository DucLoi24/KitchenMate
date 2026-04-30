export const socialApi = {
  getFeed: async (params = {}) => {
    const { default: axiosInstance } = await import('@/lib/axiosInstance')
    const { data } = await axiosInstance.get('/social/feed/', { params })
    return data
  },

  likeRecipe: async (recipeId) => {
    const { default: axiosInstance } = await import('@/lib/axiosInstance')
    const { data } = await axiosInstance.post(`/social/recipes/${recipeId}/like/`)
    return data
  },

  unlikeRecipe: async (recipeId) => {
    const { default: axiosInstance } = await import('@/lib/axiosInstance')
    const { data } = await axiosInstance.post(`/social/recipes/${recipeId}/unlike/`)
    return data
  },

  getCollections: async () => {
    const { default: axiosInstance } = await import('@/lib/axiosInstance')
    const { data } = await axiosInstance.get('/social/collections/')
    return data
  },

  createCollection: async (collectionData) => {
    const { default: axiosInstance } = await import('@/lib/axiosInstance')
    const { data } = await axiosInstance.post('/social/collections/', collectionData)
    return data
  },

  addToCollection: async (collectionId, recipeId) => {
    const { default: axiosInstance } = await import('@/lib/axiosInstance')
    const { data } = await axiosInstance.post(`/social/collections/${collectionId}/add/`, {
      recipe_id: recipeId,
    })
    return data
  },

  postReview: async (recipeId, reviewData) => {
    const { default: axiosInstance } = await import('@/lib/axiosInstance')
    const { data } = await axiosInstance.post(`/social/recipes/${recipeId}/review/`, reviewData)
    return data
  },

  uploadCooksnap: async (recipeId, imageFile) => {
    const { default: axiosInstance } = await import('@/lib/axiosInstance')
    const formData = new FormData()
    formData.append('image', imageFile)
    const { data } = await axiosInstance.post(`/social/recipes/${recipeId}/cooksnap/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return data
  },
}

export default socialApi