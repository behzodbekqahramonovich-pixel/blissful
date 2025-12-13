import { Link, useLocation, useNavigate } from 'react-router-dom'
import useAuthStore from '../../store/authStore'

function AdminLayout({ children }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()

  const navItems = [
    { path: '/admin', label: 'Dashboard', icon: '📊' },
    { path: '/admin/countries', label: 'Mamlakatlar', icon: '🌍' },
    { path: '/admin/cities', label: 'Shaharlar', icon: '🏙️' },
    { path: '/admin/flights', label: 'Parvozlar', icon: '✈️' },
    { path: '/admin/hotels', label: 'Mehmonxonalar', icon: '🏨' },
  ]

  const handleLogout = () => {
    logout()
    navigate('/admin/login')
  }

  const isActive = (path) => {
    if (path === '/admin') {
      return location.pathname === '/admin'
    }
    return location.pathname.startsWith(path)
  }

  return (
    <div className="min-h-screen flex bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 text-white flex flex-col fixed h-full">
        <div className="p-4 border-b border-gray-700">
          <Link to="/admin" className="text-xl font-bold text-white hover:text-primary-400">
            Blissful Tour
          </Link>
          <p className="text-gray-400 text-sm mt-1">Admin Panel</p>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive(item.path)
                  ? 'bg-primary-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-700">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center text-white font-bold">
              {user?.username?.charAt(0).toUpperCase() || 'A'}
            </div>
            <div>
              <p className="text-white font-medium">{user?.username || 'Admin'}</p>
              <p className="text-gray-400 text-sm">Administrator</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
          >
            Chiqish
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 ml-64">
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  )
}

export default AdminLayout
