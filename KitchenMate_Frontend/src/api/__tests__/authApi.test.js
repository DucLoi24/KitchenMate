import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

describe('authApi - user search contract', () => {
  let mockGet
  let mockAxiosInstance

  beforeEach(() => {
    mockGet = vi.fn()
    mockAxiosInstance = {
      get: mockGet,
      post: vi.fn(),
      patch: vi.fn(),
      delete: vi.fn(),
    }

    vi.doMock('@/lib/axiosInstance', () => ({
      default: mockAxiosInstance,
    }))
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.resetModules()
  })

  it('calls GET /api/accounts/search/ with q and pagination params', async () => {
    const { authApi } = await import('../authApi')
    const response = {
      success: true,
      data: {
        count: 1,
        next: null,
        previous: null,
        results: [
          {
            id: 'da8aa8b5-0086-4ed9-93ef-79293f32759c',
            full_name: 'Dau bep Bep Nha',
            avatar_url: null,
            bio: 'Thich nau mon Viet',
            followers_count: 3,
            is_following: false,
          },
        ],
      },
    }
    mockGet.mockResolvedValueOnce({ data: response })

    const result = await authApi.searchUsers({
      q: '@da8aa8b5-0086-4ed9-93ef-79293f32759c',
      page: 2,
      page_size: 10,
    })

    expect(mockGet).toHaveBeenCalledWith('/accounts/search/', {
      params: {
        q: '@da8aa8b5-0086-4ed9-93ef-79293f32759c',
        page: 2,
        page_size: 10,
      },
    })
    expect(result).toEqual(response)
  })

  it('calls POST /api/accounts/me/change-password/ with current and new password fields', async () => {
    const { authApi } = await import('../authApi')
    const response = {
      success: true,
      message: 'Đổi mật khẩu thành công.',
    }
    const payload = {
      old_password: 'OldPass123!',
      new_password: 'NewPass123!',
      new_password_confirm: 'NewPass123!',
    }
    mockAxiosInstance.post.mockResolvedValueOnce({ data: response })

    const result = await authApi.changePassword(payload)

    expect(mockAxiosInstance.post).toHaveBeenCalledWith('/accounts/me/change-password/', payload)
    expect(result).toEqual(response)
  })
})
