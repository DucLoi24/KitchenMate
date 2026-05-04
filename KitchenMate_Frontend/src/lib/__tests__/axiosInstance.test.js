import { describe, it, expect, beforeEach, afterEach } from 'vitest'

/**
 * Helper tạo auth-storage theo đúng format Zustand persist.
 */
function setAuthStorage({ accessToken = null, refreshToken = null, user = null } = {}) {
  localStorage.setItem(
    'auth-storage',
    JSON.stringify({ state: { accessToken, refreshToken, user, isLoading: false }, version: 0 })
  )
}

describe('auth-storage Token Storage (Zustand persist format)', () => {
  beforeEach(() => {
    setAuthStorage({ accessToken: 'test-access-token', refreshToken: 'test-refresh-token' })
  })

  afterEach(() => {
    localStorage.clear()
  })

  it('retrieves accessToken từ auth-storage', () => {
    const raw = localStorage.getItem('auth-storage')
    const parsed = JSON.parse(raw)
    expect(parsed.state.accessToken).toBe('test-access-token')
  })

  it('retrieves refreshToken từ auth-storage', () => {
    const raw = localStorage.getItem('auth-storage')
    const parsed = JSON.parse(raw)
    expect(parsed.state.refreshToken).toBe('test-refresh-token')
  })

  it('xóa auth-storage khi logout', () => {
    localStorage.removeItem('auth-storage')
    expect(localStorage.getItem('auth-storage')).toBeNull()
  })
})

describe('axiosInstance Configuration', () => {
  it('has correct default export structure', async () => {
    const axiosInstance = (await import('../axiosInstance')).default
    expect(axiosInstance).toBeDefined()
    expect(typeof axiosInstance.get).toBe('function')
    expect(typeof axiosInstance.post).toBe('function')
    expect(typeof axiosInstance.patch).toBe('function')
    expect(typeof axiosInstance.delete).toBe('function')
  })

  it('has interceptors configured', async () => {
    const axiosInstance = (await import('../axiosInstance')).default
    expect(axiosInstance.interceptors).toBeDefined()
    expect(axiosInstance.interceptors.request).toBeDefined()
    expect(axiosInstance.interceptors.response).toBeDefined()
  })
})

describe('Token Refresh Logic (auth-storage)', () => {
  beforeEach(() => {
    setAuthStorage({ refreshToken: 'valid-refresh-token' })
  })

  afterEach(() => {
    localStorage.clear()
  })

  it('detects when refresh token is available', () => {
    const raw = localStorage.getItem('auth-storage')
    const parsed = JSON.parse(raw)
    expect(parsed.state.refreshToken).toBeTruthy()
    expect(parsed.state.refreshToken).toBe('valid-refresh-token')
  })

  it('detects when refresh token is missing', () => {
    localStorage.removeItem('auth-storage')
    expect(localStorage.getItem('auth-storage')).toBeNull()
  })
})

describe('Auth Token Logic (auth-storage)', () => {
  afterEach(() => {
    localStorage.clear()
  })

  it('detects when access token is available', () => {
    setAuthStorage({ accessToken: 'valid-access-token' })
    const raw = localStorage.getItem('auth-storage')
    const parsed = JSON.parse(raw)
    expect(parsed.state.accessToken).toBeTruthy()
  })

  it('detects when access token is missing', () => {
    setAuthStorage({ accessToken: null })
    const raw = localStorage.getItem('auth-storage')
    const parsed = JSON.parse(raw)
    expect(parsed.state.accessToken).toBeNull()
  })
})
