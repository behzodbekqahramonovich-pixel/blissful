import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import clsx from 'clsx'
import RegisterModal from './RegisterModal'
import LoginModal from './LoginModal'
import AIAssistant from './AIAssistant'
import useAuthStore from '../store/authStore'

function Layout({ children }) {
  const location = useLocation()
  const [isRegisterOpen, setIsRegisterOpen] = useState(false)
  const [isLoginOpen, setIsLoginOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
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
    { path: '/', label: 'Bosh sahifa', icon: '🏠' },
    { path: '/my-trips', label: 'Sayohatlarim', icon: '🧳' },
    // Agentlik uchun dashboard
    ...(user?.role === 'agency' ? [{ path: '/agency', label: 'Dashboard', icon: '🏢' }] : []),
  ]

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2 sm:space-x-3 group">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-primary-400 to-primary-600 rounded-xl blur-lg opacity-40 group-hover:opacity-60 transition-opacity"></div>
                <img src="/logo.svg" alt="Blissful Tour" className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300" />
              </div>
              <div className="flex flex-col">
                <span className="text-lg sm:text-xl font-bold bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent">
                  Blissful Tour
                </span>
                <span className="text-xs text-gray-400 -mt-1 hidden sm:block">Smart Travel</span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-1">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={clsx(
                    'relative px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300',
                    location.pathname === link.path
                      ? 'text-primary-700'
                      : 'text-gray-600 hover:text-primary-600'
                  )}
                >
                  {location.pathname === link.path && (
                    <span className="absolute inset-0 bg-gradient-to-r from-primary-50 to-primary-100 rounded-xl -z-10"></span>
                  )}
                  <span className="flex items-center space-x-2">
                    <span>{link.icon}</span>
                    <span>{link.label}</span>
                  </span>
                </Link>
              ))}
            </nav>

            {/* Desktop Auth Section */}
            <div className="hidden md:flex items-center">
              {isAuthenticated ? (
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2 px-3 py-1.5 bg-gray-50 rounded-full">
                    <div className="w-8 h-8 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                      {(user?.first_name?.[0] || user?.username?.[0] || 'U').toUpperCase()}
                    </div>
                    <span className="text-sm font-medium text-gray-700">
                      {user?.first_name || user?.username || 'Foydalanuvchi'}
                    </span>
                  </div>
                  <button
                    onClick={logout}
                    className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all duration-300"
                  >
                    Chiqish
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setIsLoginOpen(true)}
                    className="px-5 py-2.5 text-sm font-medium text-gray-600 hover:text-primary-600 hover:bg-gray-50 rounded-xl transition-all duration-300"
                  >
                    Kirish
                  </button>
                  <button
                    onClick={() => setIsRegisterOpen(true)}
                    className="relative px-5 py-2.5 text-sm font-medium text-white rounded-xl overflow-hidden group"
                  >
                    <span className="absolute inset-0 bg-gradient-to-r from-primary-500 to-primary-700 group-hover:from-primary-600 group-hover:to-primary-800 transition-all duration-300"></span>
                    <span className="absolute inset-0 opacity-0 group-hover:opacity-20 bg-white transition-opacity duration-300"></span>
                    <span className="relative flex items-center space-x-1">
                      <span>Ro'yxatdan o'tish</span>
                      <span className="group-hover:translate-x-1 transition-transform duration-300">→</span>
                    </span>
                  </button>
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-xl text-gray-600 hover:bg-gray-100 transition-colors"
            >
              {isMobileMenuOpen ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-100 bg-white/95 backdrop-blur-lg">
            <div className="px-4 py-4 space-y-3">
              {/* Mobile Navigation */}
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={clsx(
                    'flex items-center space-x-3 px-4 py-3 rounded-xl transition-all',
                    location.pathname === link.path
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-gray-600 hover:bg-gray-50'
                  )}
                >
                  <span className="text-xl">{link.icon}</span>
                  <span className="font-medium">{link.label}</span>
                </Link>
              ))}

              {/* Mobile Auth */}
              <div className="border-t border-gray-100 pt-3 mt-3">
                {isAuthenticated ? (
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3 px-4 py-2">
                      <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center text-white font-medium">
                        {(user?.first_name?.[0] || user?.username?.[0] || 'U').toUpperCase()}
                      </div>
                      <span className="font-medium text-gray-700">
                        {user?.first_name || user?.username || 'Foydalanuvchi'}
                      </span>
                    </div>
                    <button
                      onClick={() => { logout(); setIsMobileMenuOpen(false); }}
                      className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-red-50 text-red-600 rounded-xl font-medium"
                    >
                      <span>Chiqish</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <button
                      onClick={() => { setIsLoginOpen(true); setIsMobileMenuOpen(false); }}
                      className="w-full px-4 py-3 text-gray-600 bg-gray-50 rounded-xl font-medium"
                    >
                      Kirish
                    </button>
                    <button
                      onClick={() => { setIsRegisterOpen(true); setIsMobileMenuOpen(false); }}
                      className="w-full px-4 py-3 bg-gradient-to-r from-primary-500 to-primary-700 text-white rounded-xl font-medium"
                    >
                      Ro'yxatdan o'tish
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer className="relative overflow-hidden">
        {/* Background with gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-primary-900 to-gray-900"></div>

        {/* Animated background elements - hidden on mobile */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none hidden sm:block">
          <div className="absolute top-10 left-10 text-4xl md:text-6xl opacity-5 animate-float-slow">✈️</div>
          <div className="absolute top-20 right-20 text-3xl md:text-5xl opacity-5 animate-float-medium">🌍</div>
          <div className="absolute bottom-20 left-1/4 text-3xl md:text-4xl opacity-5 animate-float-fast">🏝️</div>
          <div className="absolute bottom-10 right-1/3 text-3xl md:text-5xl opacity-5 animate-float-slow">🗺️</div>
        </div>

        <div className="relative">
          {/* Main footer content */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-12">
              {/* Brand */}
              <div className="sm:col-span-2 lg:col-span-1 text-center sm:text-left">
                <div className="flex items-center justify-center sm:justify-start space-x-2 mb-4">
                  <img src="/logo.svg" alt="Blissful Tour" className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl" />
                  <span className="text-xl sm:text-2xl font-bold text-white">Blissful Tour</span>
                </div>
                <p className="text-gray-400 text-sm leading-relaxed mb-6">
                  Aqlli sayohat optimallashtirish platformasi. Eng arzon va qulay yo'nalishlarni toping,
                  tranzit variantlarni taqqoslang.
                </p>
                {/* Social icons */}
                <div className="flex justify-center sm:justify-start space-x-4">
                  <a
                    href="https://t.me/behzodqahramonovich"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-white hover:bg-primary-500 transition-all duration-300 hover:scale-110"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"/>
                    </svg>
                  </a>
                  <a
                    href="https://instagram.com/behzodqahramonovich"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-white hover:bg-gradient-to-br hover:from-purple-500 hover:to-pink-500 transition-all duration-300 hover:scale-110"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                    </svg>
                  </a>
                  <a
                    href="https://youtube.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-white hover:bg-red-600 transition-all duration-300 hover:scale-110"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                    </svg>
                  </a>
                  <a
                    href="https://facebook.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-white hover:bg-blue-600 transition-all duration-300 hover:scale-110"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                  </a>
                </div>
              </div>

              {/* Quick Links */}
              <div>
                <h3 className="text-white font-semibold text-lg mb-6">Tezkor havolalar</h3>
                <ul className="space-y-3">
                  <li>
                    <Link to="/" className="text-gray-400 hover:text-white transition-colors flex items-center group">
                      <span className="w-2 h-2 bg-primary-500 rounded-full mr-3 group-hover:scale-150 transition-transform"></span>
                      Bosh sahifa
                    </Link>
                  </li>
                  <li>
                    <Link to="/my-trips" className="text-gray-400 hover:text-white transition-colors flex items-center group">
                      <span className="w-2 h-2 bg-primary-500 rounded-full mr-3 group-hover:scale-150 transition-transform"></span>
                      Sayohatlarim
                    </Link>
                  </li>
                  <li>
                    <a href="#" className="text-gray-400 hover:text-white transition-colors flex items-center group">
                      <span className="w-2 h-2 bg-primary-500 rounded-full mr-3 group-hover:scale-150 transition-transform"></span>
                      Biz haqimizda
                    </a>
                  </li>
                  <li>
                    <a href="#" className="text-gray-400 hover:text-white transition-colors flex items-center group">
                      <span className="w-2 h-2 bg-primary-500 rounded-full mr-3 group-hover:scale-150 transition-transform"></span>
                      Yordam
                    </a>
                  </li>
                </ul>
              </div>

              {/* Contact */}
              <div>
                <h3 className="text-white font-semibold text-lg mb-6">Bog'lanish</h3>
                <ul className="space-y-4">
                  <li className="flex items-start space-x-3">
                    <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-lg">📍</span>
                    </div>
                    <div>
                      <p className="text-white text-sm font-medium">Manzil</p>
                      <p className="text-gray-400 text-sm">Toshkent, O'zbekiston</p>
                    </div>
                  </li>
                  <li className="flex items-start space-x-3">
                    <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-lg">📧</span>
                    </div>
                    <div>
                      <p className="text-white text-sm font-medium">Email</p>
                      <a href="mailto:behzodbekqahramonovich@gmail.com" className="text-gray-400 text-sm hover:text-primary-400 transition-colors">
                        behzodbekqahramonovich@gmail.com
                      </a>
                    </div>
                  </li>
                  <li className="flex items-start space-x-3">
                    <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-lg">📱</span>
                    </div>
                    <div>
                      <p className="text-white text-sm font-medium">Telefon</p>
                      <a href="tel:+998905268738" className="text-gray-400 text-sm hover:text-primary-400 transition-colors">
                        +998 90 526 87 38
                      </a>
                    </div>
                  </li>
                </ul>
              </div>

              {/* Newsletter */}
              <div className="sm:col-span-2 lg:col-span-1">
                <h3 className="text-white font-semibold text-base sm:text-lg mb-4 sm:mb-6 text-center sm:text-left">Yangiliklardan xabardor bo'ling</h3>
                <p className="text-gray-400 text-sm mb-4 text-center sm:text-left">
                  Eng so'nggi aksiyalar va arzon chiptalar haqida birinchi bo'lib biling!
                </p>
                <form className="space-y-3">
                  <div className="relative">
                    <input
                      type="email"
                      placeholder="Email manzilingiz"
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all text-sm sm:text-base"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full px-4 py-2.5 sm:py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white font-medium rounded-lg hover:from-primary-600 hover:to-primary-700 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] text-sm sm:text-base"
                  >
                    Obuna bo'lish
                  </button>
                </form>
              </div>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="border-t border-white/10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
              <div className="flex flex-col md:flex-row items-center justify-between gap-3 sm:gap-4">
                <p className="text-gray-500 text-xs sm:text-sm text-center md:text-left">
                  © 2025 Blissful Tour. Barcha huquqlar himoyalangan.
                </p>
                <div className="flex flex-wrap justify-center items-center gap-3 sm:gap-6">
                  <a href="#" className="text-gray-500 hover:text-white text-xs sm:text-sm transition-colors">
                    Maxfiylik siyosati
                  </a>
                  <a href="#" className="text-gray-500 hover:text-white text-xs sm:text-sm transition-colors">
                    Foydalanish shartlari
                  </a>
                  <a href="#" className="text-gray-500 hover:text-white text-xs sm:text-sm transition-colors">
                    Cookie siyosati
                  </a>
                </div>
              </div>
            </div>
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

      {/* AI Assistant */}
      <AIAssistant />
    </div>
  )
}

export default Layout
