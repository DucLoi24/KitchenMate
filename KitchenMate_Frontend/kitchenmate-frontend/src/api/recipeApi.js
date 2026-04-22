// KitchenMate_Frontend/kitchenmate-frontend/src/api/recipeApi.js
import axiosInstance from './axiosInstance';

export const recipeApi = {
  createRecipe: async (data) => {
    const response = await axiosInstance.post('/recipes/', data);
    return response.data;
  },

  searchIngredients: async (query) => {
    const response = await axiosInstance.get('/ingredients/search/', {
      params: { q: query },
    });
    return response.data.data || response.data;
  },

  uploadThumbnail: async (recipeId, file) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await axiosInstance.post(
      `/recipes/${recipeId}/thumbnail/`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return response.data;
  },
};
