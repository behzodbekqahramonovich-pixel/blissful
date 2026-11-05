import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import HomePage from './pages/HomePage'
import AuthRequired from './components/AuthRequired'
import ProtectedRoute from './components/admin/ProtectedRoute'

// Qolgan sahifalar alohida chunk - bosh sahifa tezroq ochiladi
const SearchResultsPage = lazy(() => import('./pages/SearchResultsPage'))
const VariantDetailsPage = lazy(() => import('./pages/VariantDetailsPage'))
const MyTripsPage = lazy(() => import('./pages/MyTripsPage'))
const AgencyDashboard = lazy(() => import('./pages/AgencyDashboard'))
const AdminLoginPage = lazy(() => import('./pages/admin/AdminLoginPage'))
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'))
const CountriesPage = lazy(() => import('./pages/admin/CountriesPage'))
const CitiesPage = lazy(() => import('./pages/admin/CitiesPage'))
const FlightsPage = lazy(() => import('./pages/admin/FlightsPage'))
const HotelsPage = lazy(() => import('./pages/admin/HotelsPage'))

function App() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-gray-500">Yuklanmoqda...</div>}>
    <Routes>
      {/* Protected user routes */}
      <Route path="/" element={<AuthRequired><Layout><HomePage /></Layout></AuthRequired>} />
      <Route path="/search" element={<AuthRequired><Layout><SearchResultsPage /></Layout></AuthRequired>} />
      <Route path="/search/:id/variant/:num" element={<AuthRequired><Layout><VariantDetailsPage /></Layout></AuthRequired>} />
      <Route path="/my-trips" element={<AuthRequired><Layout><MyTripsPage /></Layout></AuthRequired>} />
      <Route path="/agency" element={<AuthRequired><AgencyDashboard /></AuthRequired>} />

      {/* Admin routes */}
      <Route path="/admin/login" element={<AdminLoginPage />} />
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/countries"
        element={
          <ProtectedRoute>
            <CountriesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/cities"
        element={
          <ProtectedRoute>
            <CitiesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/flights"
        element={
          <ProtectedRoute>
            <FlightsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/hotels"
        element={
          <ProtectedRoute>
            <HotelsPage />
          </ProtectedRoute>
        }
      />
    </Routes>
    </Suspense>
  )
}

export default App
