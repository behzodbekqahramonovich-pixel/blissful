import { useState } from 'react'
import useAuthStore from '../store/authStore'
import LoginModal from './LoginModal'
import RegisterModal from './RegisterModal'

function AuthRequired({ children }) {
  const { isAuthenticated } = useAuthStore()
  const [isLoginOpen, setIsLoginOpen] = useState(false)
  const [isRegisterOpen, setIsRegisterOpen] = useState(false)

  const handleSwitchToLogin = () => {
    setIsRegisterOpen(false)
    setIsLoginOpen(true)
  }

  const handleSwitchToRegister = () => {
    setIsLoginOpen(false)
    setIsRegisterOpen(true)
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen relative overflow-hidden">
        {/* Animated Background */}
        <div className="fixed inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900" />

          {/* Animated gradient orbs */}
          <div className="absolute top-0 -left-40 w-80 h-80 bg-purple-600 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob" />
          <div className="absolute top-0 -right-40 w-80 h-80 bg-yellow-600 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000" />
          <div className="absolute -bottom-40 left-20 w-80 h-80 bg-pink-600 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000" />
          <div className="absolute bottom-20 right-40 w-80 h-80 bg-blue-600 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-6000" />

          {/* Grid pattern */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px]" />
        </div>

        {/* Content */}
        <div className="relative min-h-screen flex">
          {/* Left Side - Branding & Features */}
          <div className="hidden lg:flex lg:w-1/2 flex-col justify-center px-12 xl:px-20">
            {/* Logo */}
            <div className="flex items-center gap-3 mb-12">
              <img src="/logo.svg" alt="Blissful Tour" className="w-14 h-14 rounded-2xl shadow-lg shadow-purple-500/30" />
              <div>
                <h1 className="text-3xl font-bold text-white">Blissful Tour</h1>
                <p className="text-purple-300 text-sm">Smart Travel Platform</p>
              </div>
            </div>

            {/* Main Heading */}
            <h2 className="text-4xl xl:text-5xl font-bold text-white mb-6 leading-tight">
              Dunyoni kashf eting,
              <br />
              <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-yellow-400 bg-clip-text text-transparent">
                eng yaxshi narxlarda
              </span>
            </h2>

            <p className="text-lg text-gray-400 mb-12 max-w-md">
              Millionlab parvozlar va mehmonxonalarni solishtiring.
              Aqlli algoritm sizga eng tejamkor variantni topib beradi.
            </p>

            {/* Features */}
            <div className="space-y-6">
              <div className="flex items-center gap-4 group">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500/20 to-purple-500/10 rounded-xl flex items-center justify-center border border-purple-500/20 group-hover:border-purple-500/40 transition-colors">
                  <span className="text-2xl">🎯</span>
                </div>
                <div>
                  <h3 className="text-white font-semibold">Aqlli qidiruv</h3>
                  <p className="text-gray-500 text-sm">AI yordamida eng optimal marshrutlarni toping</p>
                </div>
              </div>

              <div className="flex items-center gap-4 group">
                <div className="w-12 h-12 bg-gradient-to-br from-pink-500/20 to-pink-500/10 rounded-xl flex items-center justify-center border border-pink-500/20 group-hover:border-pink-500/40 transition-colors">
                  <span className="text-2xl">💎</span>
                </div>
                <div>
                  <h3 className="text-white font-semibold">Premium tajriba</h3>
                  <p className="text-gray-500 text-sm">Eng yaxshi mehmonxonalar va aviakompaniyalar</p>
                </div>
              </div>

              <div className="flex items-center gap-4 group">
                <div className="w-12 h-12 bg-gradient-to-br from-yellow-500/20 to-yellow-500/10 rounded-xl flex items-center justify-center border border-yellow-500/20 group-hover:border-yellow-500/40 transition-colors">
                  <span className="text-2xl">🔒</span>
                </div>
                <div>
                  <h3 className="text-white font-semibold">Xavfsiz to'lov</h3>
                  <p className="text-gray-500 text-sm">128-bit shifrlash bilan himoyalangan</p>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="flex gap-8 mt-12 pt-12 border-t border-white/10">
              <div>
                <div className="text-3xl font-bold text-white">50K+</div>
                <div className="text-gray-500 text-sm">Foydalanuvchilar</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-white">100+</div>
                <div className="text-gray-500 text-sm">Mamlakatlar</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-white">4.9</div>
                <div className="text-gray-500 text-sm">Reyting</div>
              </div>
            </div>
          </div>

          {/* Right Side - Login Card */}
          <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-12">
            <div className="w-full max-w-md">
              {/* Mobile Logo */}
              <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
                <img src="/logo.svg" alt="Blissful Tour" className="w-12 h-12 rounded-xl" />
                <span className="text-2xl font-bold text-white">Blissful Tour</span>
              </div>

              {/* Card */}
              <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/10 shadow-2xl">
                {/* Welcome Icon */}
                <div className="text-center mb-8">
                  <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-purple-500/30 rotate-3 hover:rotate-0 transition-transform duration-300">
                    <span className="text-4xl">👋</span>
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-2">Xush kelibsiz!</h2>
                  <p className="text-gray-400">
                    Sayohatni boshlash uchun tizimga kiring
                  </p>
                </div>

                {/* Buttons */}
                <div className="space-y-4">
                  <button
                    onClick={() => setIsLoginOpen(true)}
                    className="w-full py-4 px-6 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-xl hover:from-purple-500 hover:to-pink-500 transition-all duration-300 shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                    </svg>
                    Tizimga kirish
                  </button>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-white/10"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-4 bg-transparent text-gray-500">yoki</span>
                    </div>
                  </div>

                  <button
                    onClick={() => setIsRegisterOpen(true)}
                    className="w-full py-4 px-6 bg-white/10 text-white font-semibold rounded-xl hover:bg-white/20 transition-all duration-300 border border-white/10 hover:border-white/20 flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                    Ro'yxatdan o'tish
                  </button>
                </div>

                {/* Benefits */}
                <div className="mt-8 pt-6 border-t border-white/10">
                  <p className="text-gray-400 text-sm text-center mb-4">Ro'yxatdan o'tish orqali:</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center gap-2 text-sm text-gray-300">
                      <span className="text-green-400">✓</span>
                      Shaxsiy takliflar
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-300">
                      <span className="text-green-400">✓</span>
                      Narx kuzatuvi
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-300">
                      <span className="text-green-400">✓</span>
                      Bron tarixi
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-300">
                      <span className="text-green-400">✓</span>
                      Maxsus chegirmalar
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <p className="text-center text-gray-500 text-sm mt-6">
                Davom etish orqali siz bizning{' '}
                <a href="#" className="text-purple-400 hover:text-purple-300">Foydalanish shartlari</a>
                {' '}va{' '}
                <a href="#" className="text-purple-400 hover:text-purple-300">Maxfiylik siyosati</a>
                ga rozilik bildirasiz.
              </p>
            </div>
          </div>
        </div>

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

  return children
}

export default AuthRequired
