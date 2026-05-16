// Fallback categories for timeout/error fallback (AC-6 compliance)
// Matches backend seed data: 6 default categories
// Note: Uses placeholder UUIDs for id field to match backend API response structure.
// The slug field identifies the category type for display purposes (getEmojiForCategory, etc.)
export const FALLBACK_CATEGORIES = [
  { id: '00000000-0000-0000-0000-000000000001', slug: 'mon-viet', name: 'Món Việt' },
  { id: '00000000-0000-0000-0000-000000000002', slug: 'mon-a', name: 'Món Á' },
  { id: '00000000-0000-0000-0000-000000000003', slug: 'mon-tay', name: 'Món Tây' },
  { id: '00000000-0000-0000-0000-000000000004', slug: 'trang-miem', name: 'Tráng miệng' },
  { id: '00000000-0000-0000-0000-000000000005', slug: 'do-uong', name: 'Đồ uống' },
  { id: '00000000-0000-0000-0000-000000000006', slug: 'mon-chay', name: 'Món chay' },
]

export const categoryApi = {
  // Get all active categories (public - AllowAny)
  getCategories: async (params = {}) => {
    const { default: axiosInstance } = await import('@/lib/axiosInstance')
    const { data } = await axiosInstance.get('/recipes/categories/', { params })
    return data
  },

  // Get single category by slug (public - AllowAny)
  getCategory: async (slug) => {
    const { default: axiosInstance } = await import('@/lib/axiosInstance')
    const { data } = await axiosInstance.get(`/recipes/categories/${slug}/`)
    return data
  },

  // Create category (admin only - IsAdminUser)
  createCategory: async (categoryData) => {
    const { default: axiosInstance } = await import('@/lib/axiosInstance')
    const { data } = await axiosInstance.post('/recipes/categories/', categoryData)
    return data
  },

  // Update category (admin only - IsAdminUser)
  updateCategory: async (slug, categoryData) => {
    const { default: axiosInstance } = await import('@/lib/axiosInstance')
    const { data } = await axiosInstance.patch(`/recipes/categories/${slug}/`, categoryData)
    return data
  },

  // Move category priority up/down (admin only - IsAdminUser)
  moveCategory: async (slug, direction) => {
    const { default: axiosInstance } = await import('@/lib/axiosInstance')
    const { data } = await axiosInstance.post(`/recipes/categories/${slug}/move/`, { direction })
    return data
  },

  // Delete category (admin only - IsAdminUser, soft delete)
  // Note: Fails with 400 if category has attached recipes
  deleteCategory: async (slug) => {
    const { default: axiosInstance } = await import('@/lib/axiosInstance')
    await axiosInstance.delete(`/recipes/categories/${slug}/`)
  },

  // Restore category (admin only - IsAdminUser, soft delete)
  restoreCategory: async (slug) => {
    const { default: axiosInstance } = await import('@/lib/axiosInstance')
    const { data } = await axiosInstance.post(`/recipes/categories/${slug}/restore/`)
    return data
  },
}

export default categoryApi
