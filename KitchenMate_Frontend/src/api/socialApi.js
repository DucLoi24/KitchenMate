export const socialApi = {
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
    const { data } = await axiosInstance.post(`/social/collections/${collectionId}/add-recipe/`, {
      recipe_id: recipeId,
    })
    return data
  },

  postReview: async (recipeId, reviewData) => {
    const { default: axiosInstance } = await import('@/lib/axiosInstance')
    const { data } = await axiosInstance.post(`/social/recipes/${recipeId}/reviews/`, reviewData)
    return data
  },

  uploadCooksnap: async (reviewId, imageFile) => {
    const { default: axiosInstance } = await import('@/lib/axiosInstance')
    const formData = new FormData()
    formData.append('image', imageFile)
    const { data } = await axiosInstance.post(`/social/reviews/${reviewId}/cooksnap/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return data
  },
}

export default socialApi