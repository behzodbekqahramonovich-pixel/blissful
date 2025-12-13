import axios from 'axios'

const API_BASE_URL = '/api/v1'

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

export default api
