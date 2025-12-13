import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import HomePage from './pages/HomePage'
import SearchResultsPage from './pages/SearchResultsPage'
import VariantDetailsPage from './pages/VariantDetailsPage'
import MyTripsPage from './pages/MyTripsPage'

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
      {/* Public routes */}
      <Route path="/" element={<Layout><HomePage /></Layout>} />
      <Route path="/search" element={<Layout><SearchResultsPage /></Layout>} />
      <Route path="/search/:id/variant/:num" element={<Layout><VariantDetailsPage /></Layout>} />
      <Route path="/my-trips" element={<Layout><MyTripsPage /></Layout>} />

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
