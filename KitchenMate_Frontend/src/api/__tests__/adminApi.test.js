import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

describe('adminApi - setAdminRole contract', () => {
  let mockPost
  let mockAxiosInstance

  beforeEach(async () => {
    mockPost = vi.fn()
    mockAxiosInstance = {
      post: mockPost,
      get: vi.fn(),
      patch: vi.fn(),
      delete: vi.fn(),
    }

    // Mock the axiosInstance module
    vi.doMock('@/lib/axiosInstance', () => ({
      default: mockAxiosInstance,
    }))
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.resetModules()
  })

  it('should call POST /api/admin/users/{id}/set-admin/ with is_admin boolean', async () => {
    const { adminApi } = await import('../adminApi')

    // Axios response structure: { data: { ... } }
    mockPost.mockResolvedValueOnce({ data: { success: true, message: 'User is now an admin' } })

    const result = await adminApi.setAdminRole(123, true)

    expect(mockPost).toHaveBeenCalledWith('/admin/users/123/set-admin/', { is_admin: true })
    expect(result).toEqual({ success: true, message: 'User is now an admin' })
  })

  it('should correctly pass false for is_admin to remove admin role', async () => {
    const { adminApi } = await import('../adminApi')

    mockPost.mockResolvedValueOnce({ data: { success: true, message: 'Admin role removed' } })

    const result = await adminApi.setAdminRole(456, false)

    expect(mockPost).toHaveBeenCalledWith('/admin/users/456/set-admin/', { is_admin: false })
    expect(result).toEqual({ success: true, message: 'Admin role removed' })
  })

  it('should return promise that resolves to response data', async () => {
    const { adminApi } = await import('../adminApi')

    const expectedResponse = { data: { success: true, message: 'Tai khoan da duoc phan quyen' } }
    mockPost.mockResolvedValueOnce(expectedResponse)

    const result = adminApi.setAdminRole(789, true)

    expect(result).toBeInstanceOf(Promise)

    const resolved = await result
    expect(resolved).toEqual({ success: true, message: 'Tai khoan da duoc phan quyen' })
  })

  it('should handle different user id types (string or number)', async () => {
    const { adminApi } = await import('../adminApi')

    mockPost.mockResolvedValue({ data: { success: true } })

    // String ID
    await adminApi.setAdminRole('999', true)
    expect(mockPost).toHaveBeenCalledWith('/admin/users/999/set-admin/', { is_admin: true })

    // Number ID
    await adminApi.setAdminRole(111, false)
    expect(mockPost).toHaveBeenCalledWith('/admin/users/111/set-admin/', { is_admin: false })
  })

  it('should propagate error when API call fails', async () => {
    const { adminApi } = await import('../adminApi')

    const errorResponse = { response: { data: { error: 'Forbidden' }, status: 403 } }
    mockPost.mockRejectedValueOnce(errorResponse)

    await expect(adminApi.setAdminRole(123, true)).rejects.toEqual(errorResponse)
  })
})