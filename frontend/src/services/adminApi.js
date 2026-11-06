import api from './api'

// Bitta umumiy klient: token va 401 da yangilash api.js da
const adminApi = api

// Auth API
export const authApi = {
  login: async (username, password) => {
    const response = await adminApi.post('/auth/login/', { username, password })
    return response.data
  },

  userLogin: async (username, password) => {
    const response = await adminApi.post('/auth/user-login/', { username, password })
    return response.data
  },

  register: async (data) => {
    const response = await adminApi.post('/auth/register/', data)
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

// Transport (TransportLeg) Admin API
export const transportAdminApi = {
  getAll: async (params = {}) => {
    const response = await adminApi.get('/admin/transport/', { params })
    return response.data
  },

  create: async (data) => {
    const response = await adminApi.post('/admin/transport/', data)
    return response.data
  },

  update: async (id, data) => {
    const response = await adminApi.put(`/admin/transport/${id}/`, data)
    return response.data
  },

  delete: async (id) => {
    await adminApi.delete(`/admin/transport/${id}/`)
  },
}

export default adminApi
