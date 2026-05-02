export const pantryApi = {
  getPantry: async () => {
    const { default: axiosInstance } = await import('@/lib/axiosInstance')
    const { data } = await axiosInstance.get('/kitchen/pantry/')
    return data
  },

  addToPantry: async (itemData) => {
    const { default: axiosInstance } = await import('@/lib/axiosInstance')
    const { data } = await axiosInstance.post('/kitchen/pantry/', itemData)
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
}

export const shoppingListApi = {
  getShoppingList: async () => {
    const { default: axiosInstance } = await import('@/lib/axiosInstance')
    const { data } = await axiosInstance.get('/kitchen/shopping-list/')
    return data
  },

  addToShoppingList: async (itemData) => {
    const { default: axiosInstance } = await import('@/lib/axiosInstance')
    const { data } = await axiosInstance.post('/kitchen/shopping-list/', itemData)
    return data
  },

  updateShoppingItem: async (id, itemData) => {
    const { default: axiosInstance } = await import('@/lib/axiosInstance')
    const { data } = await axiosInstance.patch(`/kitchen/shopping-list/${id}/`, itemData)
    return data
  },

  removeFromShoppingList: async (id) => {
    const { default: axiosInstance } = await import('@/lib/axiosInstance')
    await axiosInstance.delete(`/kitchen/shopping-list/${id}/`)
  },

  markAsPurchased: async (id) => {
    const { default: axiosInstance } = await import('@/lib/axiosInstance')
    const { data } = await axiosInstance.post(`/kitchen/shopping-list/${id}/mark-purchased/`)
    return data
  },

  markAsUnpurchased: async (id) => {
    const { default: axiosInstance } = await import('@/lib/axiosInstance')
    const { data } = await axiosInstance.post(`/kitchen/shopping-list/${id}/mark-unpurchased/`)
    return data
  },
}

export default { pantryApi, shoppingListApi }