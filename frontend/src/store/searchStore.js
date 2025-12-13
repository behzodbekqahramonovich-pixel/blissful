import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const useSearchStore = create(
  persist(
    (set, get) => ({
      // Qidiruv parametrlari
      searchParams: {
        origin: '',
        destination: '',
        departureDate: null,
        returnDate: null,
        travelers: 1,
        includeTransit: true,
        hotelStars: 3,
        budgetMax: null,
      },

      // Qidiruv natijalari
      searchResults: null,

      // Tanlangan variant
      selectedVariant: null,

      // Saqlangan sayohatlar
      savedTrips: [],

      // Loading holati
      isLoading: false,
      error: null,

      // Qidiruv parametrlarini o'zgartirish
      setSearchParams: (params) => set((state) => ({
        searchParams: { ...state.searchParams, ...params }
      })),

      // Qidiruv natijalarini saqlash
      setSearchResults: (results) => set({ searchResults: results }),

      // Variantni tanlash
      selectVariant: (variant) => set({ selectedVariant: variant }),

      // Sayohatni saqlash
      saveTrip: (trip) => set((state) => ({
        savedTrips: [...state.savedTrips, { ...trip, savedAt: new Date().toISOString() }]
      })),

      // Sayohatni o'chirish
      removeTrip: (tripId) => set((state) => ({
        savedTrips: state.savedTrips.filter(t => t.id !== tripId)
      })),

      // Loading
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),

      // Reset
      resetSearch: () => set({
        searchResults: null,
        selectedVariant: null,
        error: null,
      }),
    }),
    {
      name: 'blissful-tour-storage',
      partialize: (state) => ({
        savedTrips: state.savedTrips,
        searchParams: state.searchParams,
      }),
    }
  )
)

export default useSearchStore
