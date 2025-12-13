import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const useAuthStore = create(
  persist(
    (set, get) => ({
      // Auth state
      accessToken: null,
      refreshToken: null,
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // Set tokens after login
      setTokens: (accessToken, refreshToken) => set({
        accessToken,
        refreshToken,
        isAuthenticated: true,
        error: null,
      }),

      // Set user info
      setUser: (user) => set({ user }),

      // Logout - clear all auth state
      logout: () => set({
        accessToken: null,
        refreshToken: null,
        user: null,
        isAuthenticated: false,
        error: null,
      }),

      // Loading state
      setLoading: (isLoading) => set({ isLoading }),

      // Error state
      setError: (error) => set({ error }),

      // Check if access token is expired
      isTokenExpired: () => {
        const token = get().accessToken
        if (!token) return true

        try {
          const payload = JSON.parse(atob(token.split('.')[1]))
          // Add 10 second buffer
          return payload.exp * 1000 < Date.now() + 10000
        } catch {
          return true
        }
      },

      // Get token for API calls
      getAccessToken: () => get().accessToken,
      getRefreshToken: () => get().refreshToken,
    }),
    {
      name: 'blissful-tour-auth',
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)

export default useAuthStore
