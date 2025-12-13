import axios from 'axios'
import useAuthStore from '../store/authStore'

const API_BASE_URL = '/api/v1'

// Create axios instance for admin API
const adminApi = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor - add auth token to requests
adminApi.interceptors.request.use(
  (config) => {
    const { accessToken } = useAuthStore.getState()
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor - handle token refresh on 401
adminApi.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    // If 401 and not already retrying
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      const { refreshToken, setTokens, logout } = useAuthStore.getState()

      if (refreshToken) {
        try {
          // Try to refresh the token
          const response = await axios.post(`${API_BASE_URL}/auth/refresh/`, {
            refresh: refreshToken
          })
          const { access } = response.data

          // Update tokens in store
          setTokens(access, refreshToken)

          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${access}`
          return adminApi(originalRequest)
        } catch (refreshError) {
          // Refresh failed - logout user
          logout()
          window.location.href = '/admin/login'
          return Promise.reject(refreshError)
        }
      } else {
        // No refresh token - logout
        logout()
        window.location.href = '/admin/login'
      }
    }

    return Promise.reject(error)
  }
)

// Auth API
export const authApi = {
  login: async (username, password) => {
    const response = await adminApi.post('/auth/login/', { username, password })
    return response.data
  },

  refresh: async (refreshToken) => {
    const response = await adminApi.post('/auth/refresh/', { refresh: refreshToken })
    return response.data
  },

  logout: async () => {
    const response = await adminApi.post('/auth/logout/')
    return response.data
  },

  getMe: async () => {
    const response = await adminApi.get('/auth/me/')
    return response.data
  },
}

// Countries Admin API
export const countriesAdminApi = {
  getAll: async (params = {}) => {
    const response = await adminApi.get('/admin/countries/', { params })
    return response.data
  },

  getById: async (id) => {
    const response = await adminApi.get(`/admin/countries/${id}/`)
    return response.data
  },

  create: async (data) => {
    const response = await adminApi.post('/admin/countries/', data)
    return response.data
  },

  update: async (id, data) => {
    const response = await adminApi.put(`/admin/countries/${id}/`, data)
    return response.data
  },

  delete: async (id) => {
    await adminApi.delete(`/admin/countries/${id}/`)
  },
}

// Cities Admin API
export const citiesAdminApi = {
  getAll: async (params = {}) => {
    const response = await adminApi.get('/admin/cities/', { params })
    return response.data
  },

  getById: async (id) => {
    const response = await adminApi.get(`/admin/cities/${id}/`)
    return response.data
  },

  create: async (data) => {
    const response = await adminApi.post('/admin/cities/', data)
    return response.data
  },

  update: async (id, data) => {
    const response = await adminApi.put(`/admin/cities/${id}/`, data)
    return response.data
  },

  delete: async (id) => {
    await adminApi.delete(`/admin/cities/${id}/`)
  },
}

// Flights Admin API
export const flightsAdminApi = {
  getAll: async (params = {}) => {
    const response = await adminApi.get('/admin/flights/', { params })
    return response.data
  },

  getById: async (id) => {
    const response = await adminApi.get(`/admin/flights/${id}/`)
    return response.data
  },

  create: async (data) => {
    const response = await adminApi.post('/admin/flights/', data)
    return response.data
  },

  update: async (id, data) => {
    const response = await adminApi.put(`/admin/flights/${id}/`, data)
    return response.data
  },

  delete: async (id) => {
    await adminApi.delete(`/admin/flights/${id}/`)
  },
}

// Hotels Admin API
export const hotelsAdminApi = {
  getAll: async (params = {}) => {
    const response = await adminApi.get('/admin/hotels/', { params })
    return response.data
  },

  getById: async (id) => {
    const response = await adminApi.get(`/admin/hotels/${id}/`)
    return response.data
  },

  create: async (data) => {
    const response = await adminApi.post('/admin/hotels/', data)
    return response.data
  },

  update: async (id, data) => {
    const response = await adminApi.put(`/admin/hotels/${id}/`, data)
    return response.data
  },

  delete: async (id) => {
    await adminApi.delete(`/admin/hotels/${id}/`)
  },

  getStats: async () => {
    const response = await adminApi.get('/admin/hotels/stats/')
    return response.data
  },
}

export default adminApi
