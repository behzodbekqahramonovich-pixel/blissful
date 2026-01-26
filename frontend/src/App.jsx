import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import HomePage from './pages/HomePage'
import SearchResultsPage from './pages/SearchResultsPage'
import VariantDetailsPage from './pages/VariantDetailsPage'
import MyTripsPage from './pages/MyTripsPage'
import AgencyDashboard from './pages/AgencyDashboard'
import AuthRequired from './components/AuthRequired'

// Admin pages
import AdminLoginPage from './pages/admin/AdminLoginPage'
import AdminDashboard from './pages/admin/AdminDashboard'
import CountriesPage from './pages/admin/CountriesPage'
import CitiesPage from './pages/admin/CitiesPage'
import FlightsPage from './pages/admin/FlightsPage'
import HotelsPage from './pages/admin/HotelsPage'
import ProtectedRoute from './components/admin/ProtectedRoute'

function App() {
  return (
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
  )
}

export default App
