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

  uploadStepMedia: async (recipeId, stepId, file) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await axiosInstance.post(
      `/recipes/${recipeId}/steps/${stepId}/media/`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return response.data;
  },

  contributeIngredient: async (name, category) => {
    const response = await axiosInstance.post('/ingredients/', { name, category });
    return response.data;
  },

  searchRecipes: async (params) => {
    const { search, difficulty, cooking_time_max, ingredients, page } = params;
    const requestParams = {
      ...(search && { search }),
      ...(difficulty && { difficulty }),
      ...(cooking_time_max && { cooking_time_max }),
      ...(ingredients?.length && { ingredients: ingredients.join(',') }),
      page: page || 1,
    };
    const response = await axiosInstance.get('/recipes/', { params: requestParams });
    return response.data;
  },
};
