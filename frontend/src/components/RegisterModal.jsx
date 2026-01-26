import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import confetti from 'canvas-confetti'
import { authApi } from '../services/adminApi'
import useAuthStore from '../store/authStore'

const fireConfetti = () => {
  confetti({
    particleCount: 100,
    spread: 70,
    origin: { y: 0.6 }
  })
  setTimeout(() => {
    confetti({
      particleCount: 50,
      angle: 60,
      spread: 55,
      origin: { x: 0 }
    })
  }, 200)
  setTimeout(() => {
    confetti({
      particleCount: 50,
      angle: 120,
      spread: 55,
      origin: { x: 1 }
    })
  }, 400)
}

function RegisterModal({ isOpen, onClose, onSwitchToLogin }) {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    first_name: '',
    last_name: '',
    phone: '',
    role: 'traveler',
    agency_name: '',
  })
  const [errors, setErrors] = useState({})
  const [isSuccess, setIsSuccess] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const { setTokens, setUser } = useAuthStore()

  const registerMutation = useMutation({
    mutationFn: (data) => authApi.register(data),
    onSuccess: (data) => {
      fireConfetti()
      setIsSuccess(true)

      if (data.access && data.refresh) {
        setTokens(data.access, data.refresh)
        if (data.user) {
          setUser(data.user)
        }
      }

      setTimeout(() => {
        onClose()
        setFormData({
          username: '',
          email: '',
          password: '',
          confirmPassword: '',
          first_name: '',
          last_name: '',
          phone: '',
          role: 'traveler',
          agency_name: '',
        })
        setErrors({})
        setIsSuccess(false)
      }, 2500)
    },
    onError: (error) => {
      if (error.response?.data) {
        setErrors(error.response.data)
      } else {
        setErrors({ general: 'Ro\'yxatdan o\'tishda xatolik yuz berdi' })
      }
    },
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }))
    }
  }

  const validateForm = () => {
    const newErrors = {}
    if (!formData.username.trim()) newErrors.username = 'Foydalanuvchi nomi kiritilishi shart'
    if (!formData.email.trim()) {
      newErrors.email = 'Email kiritilishi shart'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email formati noto\'g\'ri'
    }
    if (!formData.password) {
      newErrors.password = 'Parol kiritilishi shart'
    } else if (formData.password.length < 8) {
      newErrors.password = 'Parol kamida 8 ta belgidan iborat bo\'lishi kerak'
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Parollar mos kelmaydi'
    }
    if (!formData.first_name.trim()) newErrors.first_name = 'Ism kiritilishi shart'
    if (!formData.last_name.trim()) newErrors.last_name = 'Familiya kiritilishi shart'
    if (formData.role === 'agency' && !formData.agency_name.trim()) {
      newErrors.agency_name = 'Agentlik nomi kiritilishi shart'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (validateForm()) {
      const { confirmPassword, ...dataToSend } = formData
      registerMutation.mutate(dataToSend)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-lg animate-modal-open">
        {/* Glow effect */}
        <div className={`absolute -inset-1 rounded-3xl blur-lg opacity-30 animate-pulse ${
          formData.role === 'agency'
            ? 'bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600'
            : 'bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600'
        }`} />

        <div className="relative bg-slate-900/95 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
          {/* Header decoration */}
          <div className={`absolute top-0 left-0 right-0 h-1 ${
            formData.role === 'agency'
              ? 'bg-gradient-to-r from-purple-500 via-indigo-500 to-blue-500'
              : 'bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500'
          }`} />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-all z-10"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Success Screen */}
          {isSuccess ? (
            <div className="p-8 text-center">
              <div className={`w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 animate-bounce-in shadow-lg ${
                formData.role === 'agency'
                  ? 'bg-gradient-to-br from-purple-500 to-indigo-600 shadow-purple-500/30'
                  : 'bg-gradient-to-br from-green-500 to-emerald-600 shadow-green-500/30'
              }`}>
                {formData.role === 'agency' ? (
                  <span className="text-4xl">🏢</span>
                ) : (
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Tabriklaymiz! 🎉</h2>
              <p className="text-gray-400 mb-4">
                {formData.role === 'agency'
                  ? `${formData.agency_name} agentligi muvaffaqiyatli ro'yxatdan o'tdi!`
                  : "Siz muvaffaqiyatli ro'yxatdan o'tdingiz!"}
              </p>
              <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Yo'naltirilmoqda...</span>
              </div>
            </div>
          ) : (
            <div className="p-8">
              {/* Logo */}
              <div className="flex justify-center mb-6">
                <img src="/logo.svg" alt="Blissful Tour" className="w-16 h-16 rounded-2xl shadow-lg shadow-purple-500/30 rotate-3 hover:rotate-0 transition-transform duration-300" />
              </div>

              {/* Title */}
              <h2 className="text-2xl font-bold text-white text-center mb-2">Ro'yxatdan o'tish</h2>
              <p className="text-gray-400 text-center mb-6">Yangi hisob yarating</p>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {errors.general && (
                  <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm flex items-center gap-3 animate-shake">
                    <span className="text-lg">⚠️</span>
                    {errors.general}
                  </div>
                )}

                {/* Role Selection */}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, role: 'traveler', agency_name: '' }))}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      formData.role === 'traveler'
                        ? 'border-purple-500 bg-purple-500/10'
                        : 'border-white/10 bg-white/5 hover:border-white/20'
                    }`}
                  >
                    <div className="text-2xl mb-1">🧳</div>
                    <div className={`font-semibold text-sm ${formData.role === 'traveler' ? 'text-purple-400' : 'text-gray-400'}`}>
                      Sayohatchi
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, role: 'agency' }))}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      formData.role === 'agency'
                        ? 'border-indigo-500 bg-indigo-500/10'
                        : 'border-white/10 bg-white/5 hover:border-white/20'
                    }`}
                  >
                    <div className="text-2xl mb-1">🏢</div>
                    <div className={`font-semibold text-sm ${formData.role === 'agency' ? 'text-indigo-400' : 'text-gray-400'}`}>
                      Agentlik
                    </div>
                  </button>
                </div>

                {/* Agency Name */}
                {formData.role === 'agency' && (
                  <div className="animate-fadeIn">
                    <label className="block text-sm font-medium text-gray-300 mb-2">Agentlik nomi *</label>
                    <input
                      type="text"
                      name="agency_name"
                      value={formData.agency_name}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 bg-white/5 border rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all ${
                        errors.agency_name ? 'border-red-500' : 'border-white/10'
                      }`}
                      placeholder="Masalan: Silk Road Travel"
                    />
                    {errors.agency_name && <p className="mt-1 text-xs text-red-400">{errors.agency_name}</p>}
                  </div>
                )}

                {/* Name fields */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Ism *</label>
                    <input
                      type="text"
                      name="first_name"
                      value={formData.first_name}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 bg-white/5 border rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all ${
                        errors.first_name ? 'border-red-500' : 'border-white/10'
                      }`}
                      placeholder="Ism"
                    />
                    {errors.first_name && <p className="mt-1 text-xs text-red-400">{errors.first_name}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Familiya *</label>
                    <input
                      type="text"
                      name="last_name"
                      value={formData.last_name}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 bg-white/5 border rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all ${
                        errors.last_name ? 'border-red-500' : 'border-white/10'
                      }`}
                      placeholder="Familiya"
                    />
                    {errors.last_name && <p className="mt-1 text-xs text-red-400">{errors.last_name}</p>}
                  </div>
                </div>

                {/* Username */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Foydalanuvchi nomi *</label>
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 bg-white/5 border rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all ${
                      errors.username ? 'border-red-500' : 'border-white/10'
                    }`}
                    placeholder="username"
                  />
                  {errors.username && <p className="mt-1 text-xs text-red-400">{errors.username}</p>}
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Email *</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 bg-white/5 border rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all ${
                      errors.email ? 'border-red-500' : 'border-white/10'
                    }`}
                    placeholder="email@example.com"
                  />
                  {errors.email && <p className="mt-1 text-xs text-red-400">{errors.email}</p>}
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Telefon</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    placeholder="+998 90 123 45 67"
                  />
                </div>

                {/* Password fields */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Parol *</label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        className={`w-full px-4 py-3 pr-10 bg-white/5 border rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all ${
                          errors.password ? 'border-red-500' : 'border-white/10'
                        }`}
                        placeholder="8+ belgi"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-300"
                      >
                        {showPassword ? '🙈' : '👁️'}
                      </button>
                    </div>
                    {errors.password && <p className="mt-1 text-xs text-red-400">{errors.password}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Tasdiqlash *</label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        className={`w-full px-4 py-3 pr-10 bg-white/5 border rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all ${
                          errors.confirmPassword ? 'border-red-500' : 'border-white/10'
                        }`}
                        placeholder="Qayta kiriting"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-300"
                      >
                        {showConfirmPassword ? '🙈' : '👁️'}
                      </button>
                    </div>
                    {errors.confirmPassword && <p className="mt-1 text-xs text-red-400">{errors.confirmPassword}</p>}
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={registerMutation.isPending}
                  className={`w-full py-4 text-white font-semibold rounded-xl focus:outline-none focus:ring-4 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg hover:scale-[1.02] active:scale-[0.98] ${
                    formData.role === 'agency'
                      ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 focus:ring-purple-500/30 shadow-purple-500/25 hover:shadow-purple-500/40'
                      : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 focus:ring-purple-500/30 shadow-purple-500/25 hover:shadow-purple-500/40'
                  }`}
                >
                  {registerMutation.isPending ? (
                    <>
                      <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Ro'yxatdan o'tilmoqda...
                    </>
                  ) : (
                    <>
                      {formData.role === 'agency' ? '🏢' : '🧳'} Ro'yxatdan o'tish
                    </>
                  )}
                </button>

                {/* Login Link */}
                <div className="text-center pt-4 border-t border-white/10">
                  <p className="text-gray-400">
                    Hisobingiz bormi?{' '}
                    <button
                      type="button"
                      onClick={onSwitchToLogin}
                      className="text-purple-400 hover:text-purple-300 font-medium transition-colors"
                    >
                      Kirish
                    </button>
                  </p>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default RegisterModal
