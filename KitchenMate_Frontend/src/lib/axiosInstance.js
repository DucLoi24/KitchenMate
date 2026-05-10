import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

const axiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
})

/**
 * Đọc access token từ Zustand persist store (auth-storage).
 * Zustand lưu dạng: { state: { accessToken, refreshToken, user }, version: 0 }
 */
function getAccessToken() {
  try {
    const raw = localStorage.getItem('auth-storage')
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return parsed?.state?.accessToken || null
  } catch {
    return null
  }
}

function getRefreshToken() {
  try {
    const raw = localStorage.getItem('auth-storage')
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return parsed?.state?.refreshToken || null
  } catch {
    return null
  }
}

function syncStoreTokens(accessToken, refreshToken) {
  try {
    const raw = localStorage.getItem('auth-storage')
    if (!raw) return
    const parsed = JSON.parse(raw)
    if (parsed?.state) {
      parsed.state.accessToken = accessToken
      if (refreshToken) {
        parsed.state.refreshToken = refreshToken
      }
      localStorage.setItem('auth-storage', JSON.stringify(parsed))
    }
  } catch {
    // ignore
  }
}

function clearAuthStorage() {
  try {
    const raw = localStorage.getItem('auth-storage')
    if (!raw) return
    const parsed = JSON.parse(raw)
    if (parsed?.state) {
      parsed.state.accessToken = null
      parsed.state.refreshToken = null
      parsed.state.user = null
      localStorage.setItem('auth-storage', JSON.stringify(parsed))
    }
  } catch {
    // ignore
  }
}

// Request interceptor - Add JWT token
axiosInstance.interceptors.request.use(
  (config) => {
    const token = getAccessToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Module-level refresh promise — ensures only ONE refresh runs at a time.
// All concurrent 401 requests share the same promise.
let refreshPromise = null

// Response interceptor - Handle 401 and token refresh
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    // Handle 401 - Try token refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      // If a refresh is already in-flight, wait for it instead of spawning another
      if (refreshPromise) {
        try {
          await refreshPromise
          // Refresh succeeded — retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${getAccessToken()}`
          return axiosInstance(originalRequest)
        } catch (refreshError) {
          // Refresh also failed — clear tokens and redirect
          clearAuthStorage()
          window.location.assign('/login')
          return Promise.reject(refreshError)
        }
      }

      // No refresh in-flight — start one
      const refreshToken = getRefreshToken()
      if (refreshToken) {
        refreshPromise = axios.post(`${BASE_URL}/auth/refresh/`, {
          refresh: refreshToken,
        })
          .then(({ data }) => {
            const newAccess = data.access
            const newRefresh = data.refresh || null
            syncStoreTokens(newAccess, newRefresh)
            return newAccess
          })
          .finally(() => {
            refreshPromise = null
          })

        try {
          await refreshPromise
          // Refresh succeeded — retry with new token
          originalRequest.headers.Authorization = `Bearer ${getAccessToken()}`
          return axiosInstance(originalRequest)
        } catch (refreshError) {
          // Refresh failed — clear tokens and redirect
          clearAuthStorage()
          window.location.assign('/login')
          return Promise.reject(refreshError)
        }
      }
    }

    return Promise.reject(error)
  }
)

export default axiosInstance
