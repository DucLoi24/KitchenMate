/**
 * API cho chức năng báo cáo nội dung (Report)
 */
export const reportsApi = {
  /**
   * Tạo báo cáo mới
   * @param {Object} reportData - { target_type, target_id, reason, additional_info }
   */
  createReport: async (reportData) => {
    const { default: axiosInstance } = await import('@/lib/axiosInstance')
    const { data } = await axiosInstance.post('/reports/', reportData)
    return data
  },

  /**
   * Lấy danh sách báo cáo của user hiện tại
   * @param {Object} params - { status, reason, page }
   */
  getMyReports: async (params = {}) => {
    const { default: axiosInstance } = await import('@/lib/axiosInstance')
    const { data } = await axiosInstance.get('/reports/my-reports/', { params })
    return data
  },
}

/**
 * API cho chức năng thông báo (Notification)
 */
export const notificationApi = {
  /**
   * Lấy danh sách thông báo của user hiện tại
   * @param {Object} params - { is_read, page }
   */
  getNotifications: async (params = {}) => {
    const { default: axiosInstance } = await import('@/lib/axiosInstance')
    const { data } = await axiosInstance.get('/notifications/', { params })
    return data
  },

  /**
   * Đánh dấu một thông báo đã đọc
   * @param {string} notificationId - UUID của notification
   */
  markAsRead: async (notificationId) => {
    const { default: axiosInstance } = await import('@/lib/axiosInstance')
    const { data } = await axiosInstance.patch(`/notifications/${notificationId}/read/`)
    return data
  },

  /**
   * Đánh dấu tất cả thông báo đã đọc
   */
  markAllAsRead: async () => {
    const { default: axiosInstance } = await import('@/lib/axiosInstance')
    const { data } = await axiosInstance.post('/notifications/mark-all-read/')
    return data
  },

  /**
   * Lấy số thông báo chưa đọc
   */
  getUnreadCount: async () => {
    const { default: axiosInstance } = await import('@/lib/axiosInstance')
    const { data } = await axiosInstance.get('/notifications/unread-count/')
    return data
  },
}
