// KitchenMate_Frontend/kitchenmate-frontend/src/api/shoppingListApi.js
import axiosInstance from './axiosInstance';

export const shoppingListApi = {
  getShoppingList: async () => {
    const response = await axiosInstance.get('/kitchen/shopping-list/');
    return response.data;
  },

  addShoppingListItem: async (data) => {
    // data: { ingredient: int, quantity: float, unit: string }
    const response = await axiosInstance.post('/kitchen/shopping-list/', data);
    return response.data;
  },

  deleteShoppingListItem: async (id) => {
    const response = await axiosInstance.delete(`/kitchen/shopping-list/${id}/`);
    return response.data;
  },

  markPurchased: async (id) => {
    // POST /api/kitchen/shopping-list/{id}/mark-purchased/
    const response = await axiosInstance.post(`/kitchen/shopping-list/${id}/mark-purchased/`);
    return response.data;
  },

  markUnpurchased: async (id) => {
    // POST /api/kitchen/shopping-list/{id}/mark-unpurchased/
    const response = await axiosInstance.post(`/kitchen/shopping-list/${id}/mark-unpurchased/`);
    return response.data;
  },
};
