export const pantryApi = {
  getPantry: async () => {
    const { default: axiosInstance } = await import('@/lib/axiosInstance')
    const { data } = await axiosInstance.get('/kitchen/pantry/')
    return data
  },

  addToPantry: async (itemData) => {
    const { default: axiosInstance } = await import('@/lib/axiosInstance')
    const { data } = await axiosInstance.post('/kitchen/pantry/add/', itemData)
    return data
  },

  updatePantryItem: async (id, itemData) => {
    const { default: axiosInstance } = await import('@/lib/axiosInstance')
    const { data } = await axiosInstance.patch(`/kitchen/pantry/${id}/`, itemData)
    return data
  },

  removeFromPantry: async (id) => {
    const { default: axiosInstance } = await import('@/lib/axiosInstance')
    await axiosInstance.delete(`/kitchen/pantry/${id}/`)
  },

  checkExpiry: async () => {
    const { default: axiosInstance } = await import('@/lib/axiosInstance')
    const { data } = await axiosInstance.get('/kitchen/pantry/expiring/')
    return data
  },
}

export const shoppingListApi = {
  getShoppingList: async () => {
    const { default: axiosInstance } = await import('@/lib/axiosInstance')
    const { data } = await axiosInstance.get('/kitchen/shopping/')
    return data
  },

  addToShoppingList: async (itemData) => {
    const { default: axiosInstance } = await import('@/lib/axiosInstance')
    const { data } = await axiosInstance.post('/kitchen/shopping/add/', itemData)
    return data
  },

  updateShoppingItem: async (id, itemData) => {
    const { default: axiosInstance } = await import('@/lib/axiosInstance')
    const { data } = await axiosInstance.patch(`/kitchen/shopping/${id}/`, itemData)
    return data
  },

  removeFromShoppingList: async (id) => {
    const { default: axiosInstance } = await import('@/lib/axiosInstance')
    await axiosInstance.delete(`/kitchen/shopping/${id}/`)
  },

  markAsPurchased: async (id) => {
    const { default: axiosInstance } = await import('@/lib/axiosInstance')
    const { data } = await axiosInstance.post(`/kitchen/shopping/${id}/purchase/`)
    return data
  },
}

export default { pantryApi, shoppingListApi }