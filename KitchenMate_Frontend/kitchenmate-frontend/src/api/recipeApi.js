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
    const { search, difficulty, prep_time_max, prep_time_min, ingredient, page } = params;
    const requestParams = {
      ...(search && { title: search }),  // Backend expects 'title'
      ...(difficulty && { difficulty }),
      // Backend expects 'prep_time_max' (<=). "Trên 60 phút" (value=120) means >60, so use prep_time_min=61 instead
      ...(prep_time_max === 120 && { prep_time_min: 61 }),  // "Trên 60 phút" → prep_time > 60
      ...(prep_time_max && prep_time_max !== 120 && { prep_time_max }),
      ...(prep_time_min && { prep_time_min }),
      ...(ingredient?.length && { ingredient: ingredient.map(i => i.id || i).join(',') }),  // Handle both {id} and plain id
      page: page || 1,
    };
    const response = await axiosInstance.get('/recipes/', { params: requestParams });
    return response.data;
  },
};
