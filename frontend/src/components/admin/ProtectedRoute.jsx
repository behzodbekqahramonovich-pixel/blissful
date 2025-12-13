import { Navigate, useLocation } from 'react-router-dom'
import useAuthStore from '../../store/authStore'

function ProtectedRoute({ children }) {
  const { isAuthenticated, isTokenExpired } = useAuthStore()
  const location = useLocation()

  // Redirect to login if not authenticated or token expired
  if (!isAuthenticated || isTokenExpired()) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />
  }

  return children
}

export default ProtectedRoute
