/**
 * Admin Panel API - KitchenMate
 *
 * Backend endpoints verified: 2026-05-28
 * Source: .claude/skills/admin-panel-implementation/SKILL.md
 *
 * Endpoints:
 * - Recipe Pending List: GET /api/admin/recipes/pending/
 * - Recipe Approve: POST /api/admin/recipes/{id}/approve/
 * - Recipe Reject: POST /api/admin/recipes/{id}/reject/
 * - Recipe All List: GET /api/admin/recipes/
 * - Ingredient Pending List: GET /api/admin/ingredients/pending/
 * - Ingredient Approve: POST /api/admin/ingredients/{id}/approve/
 * - Ingredient Reject: POST /api/admin/ingredients/{id}/reject/
 * - Ingredient All List: GET /api/admin/ingredients/
 * - User List: GET /api/admin/users/list/
 * - User Block: POST /api/admin/users/{id}/block/
 * - User Unblock: POST /api/admin/users/{id}/unblock/
 * - User Set Admin: POST /api/admin/users/{id}/set-admin/
 *
 * MISSING endpoints (documented, not implemented):
 * - Dashboard Stats: GET /api/admin/dashboard/stats/
 * - Dashboard Charts: GET /api/admin/dashboard/charts/
 * - Recipe Unpublish: POST /api/admin/recipes/{id}/unpublish/
 * - Ingredient Create: POST /api/admin/ingredients/
 * - Ingredient Update: PATCH /api/admin/ingredients/{id}/
 * - Ingredient Delete: DELETE /api/admin/ingredients/{id}/
 */

export const adminApi = {
  // ===== Recipe Management =====

  /**
   * Get pending recipes awaiting approval
   * GET /api/admin/recipes/pending/
   * Response: { success, data: { count, next, previous, results[] } }
   */
  getRecipePending: async (params = {}) => {
    const { default: axiosInstance } = await import('@/lib/axiosInstance')
    const { data } = await axiosInstance.get('/admin/recipes/pending/', { params })
    return data
  },

  /**
   * Approve a pending recipe (makes it PUBLIC)
   * POST /api/admin/recipes/{id}/approve/
   * Response: { success, message }
   */
  approveRecipe: async (id) => {
    const { default: axiosInstance } = await import('@/lib/axiosInstance')
    const { data } = await axiosInstance.post(`/admin/recipes/${id}/approve/`)
    return data
  },

  /**
   * Reject a pending recipe
   * POST /api/admin/recipes/{id}/reject/
   * Body: { reason }
   * Response: { success, message }
   */
  rejectRecipe: async (id, reason) => {
    const { default: axiosInstance } = await import('@/lib/axiosInstance')
    const { data } = await axiosInstance.post(`/admin/recipes/${id}/reject/`, { reason })
    return data
  },

  /**
   * Get all recipes (all visibility statuses)
   * GET /api/admin/recipes/
   * Response: { success, data: { count, next, previous, results[] } }
   */
  getRecipeAll: async (params = {}) => {
    const { default: axiosInstance } = await import('@/lib/axiosInstance')
    const { data } = await axiosInstance.get('/admin/recipes/', { params })
    return data
  },

  /**
   * Unpublish a recipe (set back to PRIVATE)
   * POST /api/admin/recipes/{id}/unpublish/
   * Body: { reason } (optional)
   * Response: { success, message }
   */
  unpublishRecipe: async (id, reason) => {
    const { default: axiosInstance } = await import('@/lib/axiosInstance')
    const { data } = await axiosInstance.post(`/admin/recipes/${id}/unpublish/`, { reason })
    return data
  },

  // ===== Ingredient Management =====

  /**
   * Get pending ingredients awaiting approval
   * GET /api/admin/ingredients/pending/
   * Response: { success, data: { count, next, previous, results[] } }
   */
  getIngredientPending: async (params = {}) => {
    const { default: axiosInstance } = await import('@/lib/axiosInstance')
    const { data } = await axiosInstance.get('/admin/ingredients/pending/', { params })
    return data
  },

  /**
   * Approve a pending ingredient
   * POST /api/admin/ingredients/{id}/approve/
   * Response: { success, message }
   */
  approveIngredient: async (id) => {
    const { default: axiosInstance } = await import('@/lib/axiosInstance')
    const { data } = await axiosInstance.post(`/admin/ingredients/${id}/approve/`)
    return data
  },

  /**
   * Reject a pending ingredient
   * POST /api/admin/ingredients/{id}/reject/
   * Body: { reason }
   * Response: { success, message }
   */
  rejectIngredient: async (id, reason) => {
    const { default: axiosInstance } = await import('@/lib/axiosInstance')
    const { data } = await axiosInstance.post(`/admin/ingredients/${id}/reject/`, { reason })
    return data
  },

  /**
   * Get all ingredients (all statuses)
   * GET /api/admin/ingredients/
   * Response: { success, data: { count, next, previous, results[] } }
   */
  getIngredientAll: async (params = {}) => {
    const { default: axiosInstance } = await import('@/lib/axiosInstance')
    const { data } = await axiosInstance.get('/admin/ingredients/', { params })
    return data
  },

  // ===== User Management =====

  /**
   * Get all users
   * GET /api/admin/users/list/
   * Response: { success, data: { count, next, previous, results[] } }
   */
  getUsers: async (params = {}) => {
    const { default: axiosInstance } = await import('@/lib/axiosInstance')
    const { data } = await axiosInstance.get('/admin/users/list/', { params })
    return data
  },

  /**
   * Block a user account
   * POST /api/admin/users/{id}/block/
   * Response: { success, message }
   */
  blockUser: async (id) => {
    const { default: axiosInstance } = await import('@/lib/axiosInstance')
    const { data } = await axiosInstance.post(`/admin/users/${id}/block/`)
    return data
  },

  /**
   * Unblock a user account
   * POST /api/admin/users/{id}/unblock/
   * Response: { success, message }
   */
  unblockUser: async (id) => {
    const { default: axiosInstance } = await import('@/lib/axiosInstance')
    const { data } = await axiosInstance.post(`/admin/users/${id}/unblock/`)
    return data
  },

  /**
   * Set admin role for a user (assign or remove admin privileges)
   * POST /api/admin/users/{id}/set-admin/
   * Body: { is_admin: boolean }
   * Response: { success, message }
   */
  setAdminRole: async (id, isAdmin) => {
    const { default: axiosInstance } = await import('@/lib/axiosInstance')
    const { data } = await axiosInstance.post(`/admin/users/${id}/set-admin/`, { is_admin: isAdmin })
    return data
  },

  /**
   * Get dashboard charts data
   * GET /api/admin/dashboard/charts/?days=7
   * Response: {
   *   user_growth: [{date, new_users}, ...],
   *   recipe_submissions: [{date, new_recipes, public_recipes}, ...],
   *   total_views: [{date, views}, ...]
   * }
   */
  getCharts: async (days = 7) => {
    const { default: axiosInstance } = await import('@/lib/axiosInstance')
    const { data } = await axiosInstance.get('/admin/dashboard/charts/', { params: { days } })
    return data
  },

  // ===== Report Management =====

  /**
   * Get all reports
   * GET /api/admin/reports/
   * Query params: page, page_size, status
   * Response: { success, data: { count, next, previous, results[] } }
   */
  getReports: async (params = {}) => {
    const { default: axiosInstance } = await import('@/lib/axiosInstance')
    const { data } = await axiosInstance.get('/admin/reports/', { params })
    return data
  },

  /**
   * Review/process a report
   * POST /api/admin/reports/{id}/review/
   * Body: { action: 'dismiss'|'remove_content'|'warn_user', note: string }
   * Response: { success, message, data: Report }
   */
  reviewReport: async (id, action, note = '') => {
    const { default: axiosInstance } = await import('@/lib/axiosInstance')
    const { data } = await axiosInstance.post(`/admin/reports/${id}/review/`, { action, note })
    return data
  },

  // ===== Unit Management =====

  /**
   * Get all units
   * GET /api/admin/units/
   * Query params: include_inactive (optional)
   * Response: { success, data: Unit[] }
   */
  getUnits: async (params = {}) => {
    const { default: axiosInstance } = await import('@/lib/axiosInstance')
    const { data } = await axiosInstance.get('/admin/units/', { params })
    return data
  },

  /**
   * Get a single unit
   * GET /api/admin/units/{id}/
   * Response: { success, data: Unit }
   */
  getUnit: async (id) => {
    const { default: axiosInstance } = await import('@/lib/axiosInstance')
    const { data } = await axiosInstance.get(`/admin/units/${id}/`)
    return data
  },

  /**
   * Create a new unit
   * POST /api/admin/units/
   * Body: { name, slug }
   * Response: { success, data: Unit }
   */
  createUnit: async (data) => {
    const { default: axiosInstance } = await import('@/lib/axiosInstance')
    const { data: response } = await axiosInstance.post('/admin/units/', data)
    return response
  },

  /**
   * Update a unit
   * PATCH /api/admin/units/{id}/
   * Body: { name, slug, is_active }
   * Response: { success, data: Unit }
   */
  updateUnit: async (id, data) => {
    const { default: axiosInstance } = await import('@/lib/axiosInstance')
    const { data: response } = await axiosInstance.patch(`/admin/units/${id}/`, data)
    return response
  },

  /**
   * Delete (soft) a unit
   * DELETE /api/admin/units/{id}/
   * Response: 204 No Content
   */
  deleteUnit: async (id) => {
    const { default: axiosInstance } = await import('@/lib/axiosInstance')
    const { data } = await axiosInstance.delete(`/admin/units/${id}/`)
    return data
  },

  /**
   * Get units for an ingredient
   * GET /api/ingredients/{id}/units/
   * Response: { success, data: { default_unit, allowed_units[] } }
   */
  getIngredientUnits: async (ingredientId) => {
    const { default: axiosInstance } = await import('@/lib/axiosInstance')
    const { data } = await axiosInstance.get(`/ingredients/${ingredientId}/units/`)
    return data
  },

  /**
   * Update units for an ingredient
   * PATCH /api/ingredients/{id}/units/
   * Body: { default_unit_id, allowed_unit_ids[] }
   * Response: { success, data: { default_unit, allowed_units[] } }
   */
  updateIngredientUnits: async (ingredientId, data) => {
    const { default: axiosInstance } = await import('@/lib/axiosInstance')
    const { data: response } = await axiosInstance.patch(`/ingredients/${ingredientId}/units/`, data)
    return response
  },

  // ===== MISSING endpoints - Backend not implemented yet =====

  /**
   * [MISSING] Get dashboard statistics
   * GET /api/admin/dashboard/stats/
   * NOTE: Backend endpoint does not exist yet
   */
  // getStats: async () => {
  //   const { default: axiosInstance } = await import('@/lib/axiosInstance')
  //   const { data } = await axiosInstance.get('/admin/dashboard/stats/')
  //   return data
  // },

  /**
   * [MISSING] Get dashboard charts data
   * GET /api/admin/dashboard/charts/?days=7
   * NOTE: Backend endpoint does not exist yet
   */
  // getCharts: async (days = 7) => {
  //   const { default: axiosInstance } = await import('@/lib/axiosInstance')
  //   const { data } = await axiosInstance.get('/admin/dashboard/charts/', { params: { days } })
  //   return data
  // },

  /**
   * [MISSING] Unpublish a recipe (remove from public view)
   * POST /api/admin/recipes/{id}/unpublish/
   * NOTE: Backend endpoint does not exist yet
   */
  // unpublishRecipe: async (id) => {
  //   const { default: axiosInstance } = await import('@/lib/axiosInstance')
  //   const { data } = await axiosInstance.post(`/admin/recipes/${id}/unpublish/`)
  //   return data
  // },

  /**
   * [MISSING] Create a new ingredient via admin
   * POST /api/admin/ingredients/
   * NOTE: Backend endpoint does not exist yet
   */
  // createIngredient: async (data) => {
  //   const { default: axiosInstance } = await import('@/lib/axiosInstance')
  //   const { data: response } = await axiosInstance.post('/admin/ingredients/', data)
  //   return response
  // },

  /**
   * [MISSING] Update an existing ingredient
   * PATCH /api/admin/ingredients/{id}/
   * NOTE: Backend endpoint does not exist yet
   */
  // updateIngredient: async (id, data) => {
  //   const { default: axiosInstance } = await import('@/lib/axiosInstance')
  //   const { data: response } = await axiosInstance.patch(`/admin/ingredients/${id}/`, data)
  //   return response
  // },

  /**
   * [MISSING] Delete an ingredient
   * DELETE /api/admin/ingredients/{id}/
   * NOTE: Backend endpoint does not exist yet
   */
  // deleteIngredient: async (id) => {
  //   const { default: axiosInstance } = await import('@/lib/axiosInstance')
  //   const { data } = await axiosInstance.delete(`/admin/ingredients/${id}/`)
  //   return data
  // },
}

export default adminApi
