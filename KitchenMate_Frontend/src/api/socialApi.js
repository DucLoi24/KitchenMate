export const socialApi = {
  // Reviews for a recipe
  getReviews: async (recipeId, page = 1) => {
    const { default: axiosInstance } = await import('@/lib/axiosInstance')
    const { data } = await axiosInstance.get(`/social/recipes/${recipeId}/reviews/`, {
      params: { page },
    })
    return data
  },

  getMyReviewForRecipe: async (recipeId) => {
    const { default: axiosInstance } = await import('@/lib/axiosInstance')
    const { data } = await axiosInstance.get(`/social/recipes/${recipeId}/reviews/`)
    return data
  },

  postReview: async (recipeId, reviewData) => {
    const { default: axiosInstance } = await import('@/lib/axiosInstance')
    const { data } = await axiosInstance.post(`/social/recipes/${recipeId}/reviews/`, reviewData)
    return data
  },

  updateReview: async (reviewId, reviewData) => {
    const { default: axiosInstance } = await import('@/lib/axiosInstance')
    const { data } = await axiosInstance.patch(`/social/reviews/${reviewId}/update/`, reviewData)
    return data
  },

  deleteReview: async (reviewId) => {
    const { default: axiosInstance } = await import('@/lib/axiosInstance')
    const { data } = await axiosInstance.delete(`/social/reviews/${reviewId}/delete/`)
    return data
  },

  // Favorites toggle (POST /api/social/collections/toggle-favorite/)
  toggleFavorite: async (recipeId) => {
    const { default: axiosInstance } = await import('@/lib/axiosInstance')
    const { data } = await axiosInstance.post('/social/collections/toggle-favorite/', {
      recipe_id: recipeId,
    })
    return data
  },

  // Collections
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

  deleteCollection: async (collectionId) => {
    const { default: axiosInstance } = await import('@/lib/axiosInstance')
    const { data } = await axiosInstance.delete(`/social/collections/${collectionId}/`)
    return data
  },

  // Collection detail (GET /api/social/collections/{id}/)
  getCollectionDetail: async (collectionId) => {
    const { default: axiosInstance } = await import('@/lib/axiosInstance')
    const { data } = await axiosInstance.get(`/social/collections/${collectionId}/`)
    return data
  },

  addToCollection: async (collectionId, recipeId) => {
    const { default: axiosInstance } = await import('@/lib/axiosInstance')
    const { data } = await axiosInstance.post(`/social/collections/${collectionId}/add-recipe/`, {
      recipe_id: recipeId,
    })
    return data
  },

  removeFromCollection: async (collectionId, recipeId) => {
    const { default: axiosInstance } = await import('@/lib/axiosInstance')
    const { data } = await axiosInstance.delete(`/social/collections/${collectionId}/remove-recipe/`, {
      data: { recipe_id: recipeId },
    })
    return data
  },

  uploadCooksnap: async (reviewId, imageFile) => {
    const { default: axiosInstance } = await import('@/lib/axiosInstance')
    const formData = new FormData()
    formData.append('file', imageFile)
    const { data } = await axiosInstance.post(`/social/reviews/${reviewId}/cooksnap/`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return data
  },
}

export default socialApi