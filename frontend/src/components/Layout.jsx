import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import clsx from 'clsx'
import RegisterModal from './RegisterModal'
import LoginModal from './LoginModal'
import useAuthStore from '../store/authStore'

function Layout({ children }) {
  const location = useLocation()
  const [isRegisterOpen, setIsRegisterOpen] = useState(false)
  const [isLoginOpen, setIsLoginOpen] = useState(false)
  const { isAuthenticated, user, logout } = useAuthStore()

  const handleSwitchToLogin = () => {
    setIsRegisterOpen(false)
    setIsLoginOpen(true)
  }

  const handleSwitchToRegister = () => {
    setIsLoginOpen(false)
    setIsRegisterOpen(true)
  }

  const navLinks = [
    { path: '/', label: 'Bosh sahifa' },
    { path: '/my-trips', label: 'Sayohatlarim' },
  ]

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2">
              <span className="text-2xl">✈️</span>
              <span className="text-xl font-bold text-primary-600">
                Blissful Tour
              </span>
            </Link>

            {/* Navigation */}
            <nav className="flex items-center space-x-1">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={clsx(
                    'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                    location.pathname === link.path
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  )}
                >
                  {link.label}
                </Link>
              ))}

              {/* Auth Section */}
              {isAuthenticated ? (
                <div className="flex items-center space-x-3 ml-4 pl-4 border-l border-gray-200">
                  <span className="text-sm text-gray-700">
                    {user?.first_name || user?.username || 'Foydalanuvchi'}
                  </span>
                  <button
                    onClick={logout}
                    className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    Chiqish
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-2 ml-4 pl-4 border-l border-gray-200">
                  <button
                    onClick={() => setIsLoginOpen(true)}
                    className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    Kirish
                  </button>
                  <button
                    onClick={() => setIsRegisterOpen(true)}
                    className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors"
                  >
                    Ro'yxatdan o'tish
                  </button>
                </div>
              )}
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-white font-semibold mb-3">Blissful Tour</h3>
              <p className="text-sm">
                Aqlli sayohat optimallashtirish platformasi.
                Eng arzon va qulay yo'nalishlarni toping.
              </p>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-3">Aloqa</h3>
              <p className="text-sm">info@blissfultour.uz</p>
              <p className="text-sm">+998 90 123 45 67</p>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-3">Ijtimoiy tarmoqlar</h3>
              <div className="flex space-x-4">
                <a href="#" className="hover:text-white transition-colors">Telegram</a>
                <a href="#" className="hover:text-white transition-colors">Instagram</a>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm">
            © 2024 Blissful Tour. Barcha huquqlar himoyalangan.
          </div>
        </div>
      </footer>

      {/* Login Modal */}
      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onSwitchToRegister={handleSwitchToRegister}
      />

      {/* Register Modal */}
      <RegisterModal
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
        onSwitchToLogin={handleSwitchToLogin}
      />
    </div>
  )
}

export default Layout
