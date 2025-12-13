import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { authApi } from '../services/adminApi'
import useAuthStore from '../store/authStore'

function LoginModal({ isOpen, onClose, onSwitchToRegister }) {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  })
  const [error, setError] = useState('')
  const { setTokens, setUser } = useAuthStore()

  const loginMutation = useMutation({
    mutationFn: ({ username, password }) => authApi.userLogin(username, password),
    onSuccess: (data) => {
      if (data.access && data.refresh) {
        setTokens(data.access, data.refresh)
        if (data.user) {
          setUser(data.user)
        }
      }
      onClose()
      setFormData({ username: '', password: '' })
      setError('')
    },
    onError: (error) => {
      if (error.response?.data?.detail) {
        setError(error.response.data.detail)
      } else if (error.response?.data?.message) {
        setError(error.response.data.message)
      } else {
        setError('Login yoki parol noto\'g\'ri')
      }
    },
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (error) setError('')
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!formData.username.trim() || !formData.password) {
      setError('Login va parolni kiriting')
      return
    }
    loginMutation.mutate(formData)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 modal-gradient-bg flex items-center justify-center z-50 p-4 overflow-hidden">
      {/* Floating shapes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-10 w-20 h-20 bg-white/10 rounded-full animate-float" />
        <div className="absolute top-1/4 right-10 w-16 h-16 bg-white/10 rounded-lg animate-float-reverse" />
        <div className="absolute bottom-20 left-1/4 w-24 h-24 bg-white/5 rounded-full animate-float-slow" />
        <div className="absolute top-1/2 right-1/4 w-12 h-12 bg-white/10 rounded-lg rotate-45 animate-float" />
        <div className="absolute bottom-10 right-20 w-14 h-14 bg-white/5 rounded-full animate-float-reverse" />
      </div>

      <div className="glass-card rounded-2xl w-full max-w-md shadow-2xl animate-bounce-in border border-white/20 relative">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-blue-600 rounded-xl flex items-center justify-center relative icon-hover-spin cursor-pointer group">
              <div className="absolute inset-0 bg-gradient-to-br from-primary-500 to-blue-600 rounded-xl animate-pulse-slow opacity-50 group-hover:opacity-100 transition-opacity" />
              <svg className="w-5 h-5 text-white relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900">Kirish</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 stagger-children">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm animate-shake">
              {error}
            </div>
          )}

          {/* Username/Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Login yoki Email
            </label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
              placeholder="username yoki email"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Parol
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
              placeholder="Parolni kiriting"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loginMutation.isPending}
            className="w-full py-3 bg-gradient-to-r from-primary-600 via-blue-600 to-cyan-600 text-white font-semibold rounded-xl hover:from-primary-700 hover:via-blue-700 hover:to-cyan-700 focus:ring-4 focus:ring-blue-200 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 btn-ripple"
          >
            {loginMutation.isPending ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Kirilmoqda...
              </>
            ) : (
              'Kirish'
            )}
          </button>

          {/* Register Link */}
          <div className="text-center pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              Hisobingiz yo'qmi?{' '}
              <button
                type="button"
                onClick={onSwitchToRegister}
                className="text-primary-600 hover:text-primary-700 font-medium"
              >
                Ro'yxatdan o'ting
              </button>
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}

export default LoginModal
