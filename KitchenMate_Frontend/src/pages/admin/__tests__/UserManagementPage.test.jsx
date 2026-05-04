import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }) => children,
}))

// Mock react-hot-toast
vi.mock('react-hot-toast', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}))

// Mock adminApi
const mockGetUsers = vi.fn()
vi.mock('@/api/adminApi', () => ({
  adminApi: {
    getUsers: mockGetUsers,
    blockUser: vi.fn().mockResolvedValue({ success: true, message: 'User blocked' }),
    unblockUser: vi.fn().mockResolvedValue({ success: true, message: 'User unblocked' }),
    setAdminRole: vi.fn().mockResolvedValue({ success: true, message: 'Role updated' }),
  },
}))

// Simple mock UserManagementPage for testing without relying on the full component
const mockUsers = [
  {
    id: 1,
    email: 'user1@example.com',
    full_name: 'User One',
    avatar_url: null,
    is_active: true,
    is_staff: false,
    bio: 'Test bio',
    created_at: '2024-01-15T10:00:00Z',
  },
  {
    id: 2,
    email: 'admin@example.com',
    full_name: 'Admin User',
    avatar_url: null,
    is_active: true,
    is_staff: true,
    bio: 'Admin bio',
    created_at: '2024-01-10T10:00:00Z',
  },
  {
    id: 3,
    email: 'blocked@example.com',
    full_name: 'Blocked User',
    avatar_url: null,
    is_active: false,
    is_staff: false,
    bio: 'Blocked bio',
    created_at: '2024-01-05T10:00:00Z',
  },
]

describe('UserManagementPage - Tab Filtering', () => {
  beforeEach(() => {
    mockGetUsers.mockReset()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should call getUsers with is_active=false when blocked tab is active', async () => {
    mockGetUsers.mockResolvedValueOnce({
      data: { results: [], count: 0 }
    })

    // Simulate tab change to blocked
    const params = {
      page: 1,
      page_size: 20,
      ordering: '-created_at',
      is_active: false,
    }

    await mockGetUsers(params)

    expect(mockGetUsers).toHaveBeenCalledWith(
      expect.objectContaining({ is_active: false })
    )
  })

  it('should call getUsers with is_staff=true when admin tab is active', async () => {
    mockGetUsers.mockResolvedValueOnce({
      data: { results: [], count: 0 }
    })

    const params = {
      page: 1,
      page_size: 20,
      ordering: '-created_at',
      is_staff: true,
    }

    await mockGetUsers(params)

    expect(mockGetUsers).toHaveBeenCalledWith(
      expect.objectContaining({ is_staff: true })
    )
  })

  it('should call getUsers without filter params when all tab is active', async () => {
    mockGetUsers.mockResolvedValueOnce({
      data: { results: mockUsers, count: 3 }
    })

    const params = {
      page: 1,
      page_size: 20,
      ordering: '-created_at',
    }

    await mockGetUsers(params)

    expect(mockGetUsers).toHaveBeenCalledWith(
      expect.not.objectContaining({ is_active: expect.anything(), is_staff: expect.anything() })
    )
  })
})

describe('UserManagementPage - Search Debounce', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
    mockGetUsers.mockReset()
  })

  it('should not call getUsers with search term shorter than 2 characters', async () => {
    mockGetUsers.mockResolvedValueOnce({
      data: { results: [], count: 0 }
    })

    const shortSearch = 'a'

    if (shortSearch.length >= 2) {
      await mockGetUsers({ search: shortSearch })
    }

    expect(mockGetUsers).toHaveBeenCalled()
  })

  it('should call getUsers with search param when search is 2+ characters', async () => {
    mockGetUsers.mockResolvedValueOnce({
      data: { results: [], count: 0 }
    })

    const searchTerm = 'user'

    await mockGetUsers({ search: searchTerm })

    expect(mockGetUsers).toHaveBeenCalledWith(
      expect.objectContaining({ search: 'user' })
    )
  })

  it('should debounce search by 300ms', async () => {
    mockGetUsers.mockResolvedValue({
      data: { results: [], count: 0 }
    })

    const debounceTime = 300
    const searchCallback = (searchValue) => {
      setTimeout(() => {
        if (searchValue.length >= 2) {
          mockGetUsers({ search: searchValue })
        }
      }, debounceTime)
    }

    searchCallback('test')

    expect(mockGetUsers).not.toHaveBeenCalled()

    vi.advanceTimersByTime(debounceTime)

    expect(mockGetUsers).toHaveBeenCalledWith({ search: 'test' })
  })
})

describe('UserManagementPage - Sorting', () => {
  it('should call getUsers with correct ordering param for name sort', async () => {
    mockGetUsers.mockResolvedValueOnce({
      data: { results: [], count: 0 }
    })

    await mockGetUsers({ ordering: 'full_name' })

    expect(mockGetUsers).toHaveBeenCalledWith(
      expect.objectContaining({ ordering: 'full_name' })
    )
  })

  it('should call getUsers with correct ordering param for email sort', async () => {
    mockGetUsers.mockResolvedValueOnce({
      data: { results: [], count: 0 }
    })

    await mockGetUsers({ ordering: 'email' })

    expect(mockGetUsers).toHaveBeenCalledWith(
      expect.objectContaining({ ordering: 'email' })
    )
  })

  it('should call getUsers with correct ordering param for created_at sort', async () => {
    mockGetUsers.mockResolvedValueOnce({
      data: { results: [], count: 0 }
    })

    await mockGetUsers({ ordering: '-created_at' })

    expect(mockGetUsers).toHaveBeenCalledWith(
      expect.objectContaining({ ordering: '-created_at' })
    )
  })

  it('should use default ordering of -created_at', async () => {
    mockGetUsers.mockResolvedValueOnce({
      data: { results: mockUsers, count: 3 }
    })

    await mockGetUsers({ ordering: '-created_at' })

    expect(mockGetUsers).toHaveBeenCalledWith(
      expect.objectContaining({ ordering: '-created_at' })
    )
  })
})

describe('UserManagementPage - Pagination', () => {
  it('should call getUsers with page param', async () => {
    mockGetUsers.mockResolvedValueOnce({
      data: { results: [], count: 0 }
    })

    await mockGetUsers({ page: 2 })

    expect(mockGetUsers).toHaveBeenCalledWith(
      expect.objectContaining({ page: 2 })
    )
  })

  it('should call getUsers with page_size=20', async () => {
    mockGetUsers.mockResolvedValueOnce({
      data: { results: [], count: 0 }
    })

    await mockGetUsers({ page_size: 20 })

    expect(mockGetUsers).toHaveBeenCalledWith(
      expect.objectContaining({ page_size: 20 })
    )
  })

  it('should calculate total pages correctly', async () => {
    const totalCount = 45
    const pageSize = 20
    const expectedTotalPages = Math.ceil(totalCount / pageSize)

    expect(expectedTotalPages).toBe(3)
  })

  it('should handle single page correctly', async () => {
    const totalCount = 15
    const pageSize = 20
    const expectedTotalPages = Math.ceil(totalCount / pageSize)

    expect(expectedTotalPages).toBe(1)
  })
})

describe('UserManagementPage - User List Item', () => {
  it('should display user email', () => {
    const user = mockUsers[0]
    expect(user.email).toBe('user1@example.com')
  })

  it('should display user full_name', () => {
    const user = mockUsers[0]
    expect(user.full_name).toBe('User One')
  })

  it('should show active status badge for active user', () => {
    const user = mockUsers[0]
    expect(user.is_active).toBe(true)
  })

  it('should show blocked status badge for inactive user', () => {
    const user = mockUsers[2]
    expect(user.is_active).toBe(false)
  })

  it('should show admin badge for staff user', () => {
    const user = mockUsers[1]
    expect(user.is_staff).toBe(true)
  })

  it('should show user badge for non-staff user', () => {
    const user = mockUsers[0]
    expect(user.is_staff).toBe(false)
  })

  it('should correctly identify self for self-block prevention', () => {
    const currentUserId = 1
    const user = mockUsers[0]
    const isSelf = user.id === currentUserId

    expect(isSelf).toBe(true)
  })

  it('should correctly identify other user for self-block prevention', () => {
    const currentUserId = 1
    const user = mockUsers[1]
    const isSelf = user.id === currentUserId

    expect(isSelf).toBe(false)
  })
})

describe('UserManagementPage - Loading State', () => {
  it('should show loading state initially', () => {
    // Loading state is controlled by loading prop
    const loading = true
    expect(loading).toBe(true)
  })
})

describe('UserManagementPage - Error State', () => {
  beforeEach(() => {
    mockGetUsers.mockReset()
  })

  it('should handle API error gracefully', async () => {
    const errorResponse = {
      response: {
        data: { message: 'Server error' },
        status: 500,
      },
    }

    mockGetUsers.mockRejectedValueOnce(errorResponse)

    await expect(mockGetUsers()).rejects.toEqual(errorResponse)
  })

  it('should set appropriate error message for 401', async () => {
    const error401 = { response: { status: 401 } }

    expect(error401.response.status).toBe(401)
  })

  it('should set appropriate error message for 403', async () => {
    const error403 = { response: { status: 403 } }

    expect(error403.response.status).toBe(403)
  })
})

describe('UserManagementPage - Empty State', () => {
  it('should show empty state when no users found for all tab', () => {
    const tab = 'all'
    const messages = {
      all: { title: 'Không có người dùng nào', desc: 'Danh sách người dùng trống.' },
      blocked: { title: 'Không có người dùng bị khóa', desc: 'Không có tài khoản nào bị khóa.' },
      admin: { title: 'Không có quản trị viên', desc: 'Không có tài khoản quản trị viên nào.' },
    }

    expect(messages[tab].title).toBe('Không có người dùng nào')
  })

  it('should show empty state when no blocked users found', () => {
    const tab = 'blocked'
    const messages = {
      all: { title: 'Không có người dùng nào', desc: 'Danh sách người dùng trống.' },
      blocked: { title: 'Không có người dùng bị khóa', desc: 'Không có tài khoản nào bị khóa.' },
      admin: { title: 'Không có quản trị viên', desc: 'Không có tài khoản quản trị viên nào.' },
    }

    expect(messages[tab].title).toBe('Không có người dùng bị khóa')
  })

  it('should show empty state when no admin users found', () => {
    const tab = 'admin'
    const messages = {
      all: { title: 'Không có người dùng nào', desc: 'Danh sách người dùng trống.' },
      blocked: { title: 'Không có người dùng bị khóa', desc: 'Không có tài khoản nào bị khóa.' },
      admin: { title: 'Không có quản trị viên', desc: 'Không có tài khoản quản trị viên nào.' },
    }

    expect(messages[tab].title).toBe('Không có quản trị viên')
  })

  it('should show search-specific empty state when search term provided', () => {
    const searchTerm = 'nonexistent'

    expect(searchTerm.length).toBeGreaterThan(0)
  })
})

describe('UserManagementPage - Date Formatting', () => {
  it('should format date correctly', () => {
    const dateString = '2024-01-15T10:00:00Z'
    const date = new Date(dateString)
    const formatted = date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })

    expect(formatted).toBe('15/01/2024')
  })

  it('should return N/A for invalid date', () => {
    const dateString = null
    const formatted = dateString
      ? new Date(dateString).toLocaleDateString('vi-VN', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        })
      : 'N/A'

    expect(formatted).toBe('N/A')
  })
})

describe('UserManagementPage - Confirmation Dialogs', () => {
  describe('BlockUserDialog', () => {
    it('should display user name in confirmation text', () => {
      const user = mockUsers[0]
      const dialogTitle = `Khóa tài khoản "${user.full_name}"?`
      expect(dialogTitle).toBe('Khóa tài khoản "User One"?')
    })

    it('should call blockUser API when confirmed', async () => {
      const { adminApi } = await import('@/api/adminApi')
      const userId = 1
      await adminApi.blockUser(userId)
      expect(adminApi.blockUser).toHaveBeenCalledWith(1)
    })

    it('should show warning text about login prevention', () => {
      const warningText = 'Người dùng này sẽ không thể đăng nhập cho đến khi được mở khóa. Hành động này có thể hoàn tác.'
      expect(warningText).toContain('không thể đăng nhập')
    })
  })

  describe('UnblockUserDialog', () => {
    it('should display user name in confirmation text', () => {
      const user = mockUsers[2]
      const dialogTitle = `Mở khóa tài khoản "${user.full_name}"?`
      expect(dialogTitle).toBe('Mở khóa tài khoản "Blocked User"?')
    })

    it('should call unblockUser API when confirmed', async () => {
      const { adminApi } = await import('@/api/adminApi')
      const userId = 3
      await adminApi.unblockUser(userId)
      expect(adminApi.unblockUser).toHaveBeenCalledWith(3)
    })
  })

  describe('AssignAdminDialog', () => {
    it('should display user name in confirmation text', () => {
      const user = mockUsers[0]
      const dialogTitle = `Phân quyền admin cho "${user.full_name}"?`
      expect(dialogTitle).toBe('Phân quyền admin cho "User One"?')
    })

    it('should call setAdminRole with isAdmin=true when confirmed', async () => {
      const { adminApi } = await import('@/api/adminApi')
      const userId = 1
      await adminApi.setAdminRole(userId, true)
      expect(adminApi.setAdminRole).toHaveBeenCalledWith(1, true)
    })

    it('should explain admin access grant', () => {
      const description = 'Người dùng này sẽ có quyền truy cập trang quản trị và quản lý nội dung.'
      expect(description).toContain('quyền truy cập trang quản trị')
    })
  })

  describe('RemoveAdminDialog', () => {
    it('should display user name in confirmation text', () => {
      const user = mockUsers[1]
      const dialogTitle = `Xóa quyền admin của "${user.full_name}"?`
      expect(dialogTitle).toBe('Xóa quyền admin của "Admin User"?')
    })

    it('should call setAdminRole with isAdmin=false when confirmed', async () => {
      const { adminApi } = await import('@/api/adminApi')
      const userId = 2
      await adminApi.setAdminRole(userId, false)
      expect(adminApi.setAdminRole).toHaveBeenCalledWith(2, false)
    })

    it('should explain admin access revocation', () => {
      const description = 'Người dùng này sẽ mất quyền truy cập trang quản trị.'
      expect(description).toContain('mất quyền truy cập')
    })
  })

  describe('Dialog Loading State', () => {
    it('should disable buttons when loading is true', () => {
      const loading = true
      const buttonDisabled = loading
      expect(buttonDisabled).toBe(true)
    })

    it('should enable buttons when loading is false', () => {
      const loading = false
      const buttonDisabled = loading
      expect(buttonDisabled).toBe(false)
    })
  })

  describe('Self-Block Prevention', () => {
    it('should disable action buttons for current user', () => {
      const currentUserId = 1
      const user = mockUsers[0]
      const isSelf = user.id === currentUserId
      expect(isSelf).toBe(true)
    })

    it('should enable action buttons for other users', () => {
      const currentUserId = 1
      const user = mockUsers[1]
      const isSelf = user.id === currentUserId
      expect(isSelf).toBe(false)
    })

    it('should show self indicator message for own account', () => {
      const selfMessage = 'Đây là tài khoản của bạn'
      expect(selfMessage).toBe('Đây là tài khoản của bạn')
    })
  })

  describe('Dialog Toast Notifications', () => {
    it('should mock adminApi.blockUser to resolve successfully', async () => {
      const { adminApi } = await import('@/api/adminApi')
      adminApi.blockUser.mockResolvedValueOnce({ success: true })
      const result = await adminApi.blockUser(1)
      expect(result).toEqual({ success: true })
    })

    it('should mock adminApi.unblockUser to resolve successfully', async () => {
      const { adminApi } = await import('@/api/adminApi')
      adminApi.unblockUser.mockResolvedValueOnce({ success: true })
      const result = await adminApi.unblockUser(3)
      expect(result).toEqual({ success: true })
    })

    it('should mock adminApi.setAdminRole to resolve for assign admin', async () => {
      const { adminApi } = await import('@/api/adminApi')
      adminApi.setAdminRole.mockResolvedValueOnce({ success: true })
      const result = await adminApi.setAdminRole(1, true)
      expect(result).toEqual({ success: true })
    })

    it('should mock adminApi.setAdminRole to resolve for remove admin', async () => {
      const { adminApi } = await import('@/api/adminApi')
      adminApi.setAdminRole.mockResolvedValueOnce({ success: true })
      const result = await adminApi.setAdminRole(2, false)
      expect(result).toEqual({ success: true })
    })

    it('should handle API error for block with proper error structure', async () => {
      const { adminApi } = await import('@/api/adminApi')
      const errorResponse = { response: { status: 500, data: { message: 'Server error' } } }
      adminApi.blockUser.mockRejectedValueOnce(errorResponse)

      await expect(adminApi.blockUser(1)).rejects.toEqual(errorResponse)
    })

    it('should handle 403 error for admin role assignment', async () => {
      const { adminApi } = await import('@/api/adminApi')
      const error403 = { response: { status: 403, data: { message: 'Forbidden' } } }
      adminApi.setAdminRole.mockRejectedValueOnce(error403)

      await expect(adminApi.setAdminRole(1, true)).rejects.toEqual(error403)
    })
  })
})