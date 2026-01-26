import axios from 'axios'

// Production da Railway URL, development da proxy
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Destinations API
export const destinationsApi = {
  // Barcha shaharlar
  getCities: async () => {
    const response = await api.get('/destinations/cities/')
    return response.data
  },

  // Autocomplete uchun shaharlar
  searchCities: async (query) => {
    const response = await api.get('/destinations/cities/autocomplete/', {
      params: { q: query }
    })
    return response.data
  },

  // Tranzit hub shaharlar
  getHubs: async () => {
    const response = await api.get('/destinations/cities/hubs/')
    return response.data
  },

  // Mamlakatlar
  getCountries: async () => {
    const response = await api.get('/destinations/countries/')
    return response.data
  },
}

// Search API
export const searchApi = {
  // Yangi qidiruv
  createSearch: async (searchData) => {
    const response = await api.post('/search/', searchData)
    return response.data
  },

  // Qidiruv ma'lumotlari
  getSearch: async (id) => {
    const response = await api.get(`/search/${id}/`)
    return response.data
  },

  // Qidiruv variantlari
  getVariants: async (searchId) => {
    const response = await api.get(`/search/${searchId}/variants/`)
    return response.data
  },

  // Mashhur yo'nalishlar
  getPopular: async () => {
    const response = await api.get('/search/popular/')
    return response.data
  },
}

// Prices API
export const pricesApi = {
  // Parvoz narxlarini qidirish
  searchFlights: async (params) => {
    const response = await api.get('/prices/flights/search/', { params })
    return response.data
  },

  // Mehmonxona narxlarini qidirish
  searchHotels: async (params) => {
    const response = await api.get('/prices/hotels/search/', { params })
    return response.data
  },

  // Narxlar matritsasi
  getPriceMatrix: async () => {
    const response = await api.get('/prices/matrix/')
    return response.data
  },
}

// News API
export const newsApi = {
  // Sayohat yangiliklari
  getNews: async (limit) => {
    const params = limit ? { limit } : {}
    const response = await api.get('/search/news/', { params })
    return response.data
  },
}

// Auth API
export const authApi = {
  // Kirish
  login: async (credentials) => {
    const response = await api.post('/auth/user-login/', credentials)
    return response.data
  },

  // Ro'yxatdan o'tish
  register: async (userData) => {
    const response = await api.post('/auth/register/', userData)
    return response.data
  },

  // Tokenni yangilash
  refresh: async (refreshToken) => {
    const response = await api.post('/auth/refresh/', { refresh: refreshToken })
    return response.data
  },

  // Foydalanuvchi ma'lumotlari
  getMe: async (token) => {
    const response = await api.get('/auth/me/', {
      headers: { Authorization: `Bearer ${token}` }
    })
    return response.data
  },
}

// Agency API
export const agencyApi = {
  // Mijozlar ro'yxati
  getClients: async (token) => {
    const response = await api.get('/auth/agency/clients/', {
      headers: { Authorization: `Bearer ${token}` }
    })
    return response.data
  },

  // Yangi mijoz qo'shish
  addClient: async (token, clientData) => {
    const response = await api.post('/auth/agency/clients/', clientData, {
      headers: { Authorization: `Bearer ${token}` }
    })
    return response.data
  },

  // Mijozni yangilash
  updateClient: async (token, clientId, clientData) => {
    const response = await api.put(`/auth/agency/clients/${clientId}/`, clientData, {
      headers: { Authorization: `Bearer ${token}` }
    })
    return response.data
  },

  // Mijozni o'chirish
  deleteClient: async (token, clientId) => {
    const response = await api.delete(`/auth/agency/clients/${clientId}/`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    return response.data
  },

  // Bronlar ro'yxati
  getBookings: async (token) => {
    const response = await api.get('/auth/agency/bookings/', {
      headers: { Authorization: `Bearer ${token}` }
    })
    return response.data
  },

  // Yangi bron qo'shish
  addBooking: async (token, bookingData) => {
    const response = await api.post('/auth/agency/bookings/', bookingData, {
      headers: { Authorization: `Bearer ${token}` }
    })
    return response.data
  },

  // Statistika
  getStats: async (token) => {
    const response = await api.get('/auth/agency/stats/', {
      headers: { Authorization: `Bearer ${token}` }
    })
    return response.data
  },
}

export default api
