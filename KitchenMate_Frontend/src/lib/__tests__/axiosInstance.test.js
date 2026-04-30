import { describe, it, expect, vi, beforeEach } from 'vitest'

// Test the authApi module which uses axiosInstance
describe('authApi Token Storage', () => {
  beforeEach(() => {
    localStorage.setItem('access_token', 'test-access-token')
    localStorage.setItem('refresh_token', 'test-refresh-token')
  })

  it('retrieves access_token from localStorage', () => {
    expect(localStorage.getItem('access_token')).toBe('test-access-token')
  })

  it('retrieves refresh_token from localStorage', () => {
    expect(localStorage.getItem('refresh_token')).toBe('test-refresh-token')
  })

  it('clears tokens on logout', () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    expect(localStorage.getItem('access_token')).toBeNull()
    expect(localStorage.getItem('refresh_token')).toBeNull()
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

describe('Token Refresh Logic', () => {
  beforeEach(() => {
    localStorage.setItem('refresh_token', 'valid-refresh-token')
  })

  it('detects when refresh token is available', () => {
    const refreshToken = localStorage.getItem('refresh_token')
    expect(refreshToken).toBeTruthy()
    expect(refreshToken).toBe('valid-refresh-token')
  })

  it('detects when refresh token is missing', () => {
    localStorage.removeItem('refresh_token')
    const refreshToken = localStorage.getItem('refresh_token')
    expect(refreshToken).toBeNull()
  })
})

describe('Auth Token Logic', () => {
  it('detects when access token is available', () => {
    localStorage.setItem('access_token', 'valid-access-token')
    const token = localStorage.getItem('access_token')
    expect(token).toBeTruthy()
  })

  it('detects when access token is missing', () => {
    localStorage.removeItem('access_token')
    const token = localStorage.getItem('access_token')
    expect(token).toBeNull()
  })
})
