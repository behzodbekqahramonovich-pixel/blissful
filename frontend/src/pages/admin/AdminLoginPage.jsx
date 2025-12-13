import { useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { authApi } from '../../services/adminApi'
import useAuthStore from '../../store/authStore'

function AdminLoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const navigate = useNavigate()
  const location = useLocation()
  const { setTokens, setUser } = useAuthStore()

  const loginMutation = useMutation({
    mutationFn: () => authApi.login(username, password),
    onSuccess: (data) => {
      setTokens(data.access, data.refresh)
      setUser(data.user)
      const from = location.state?.from?.pathname || '/admin'
      navigate(from, { replace: true })
    },
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    loginMutation.mutate()
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-600 to-primary-800">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md mx-4">
        <div className="text-center mb-8">
          <Link to="/" className="inline-block mb-4">
            <h1 className="text-3xl font-bold text-primary-600">Blissful Tour</h1>
          </Link>
          <h2 className="text-xl text-gray-600">Admin Panel</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Foydalanuvchi nomi
            </label>
            <input
              type="text"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="admin"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Parol
            </label>
            <input
              type="password"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          {loginMutation.error && (
            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg">
              Login yoki parol noto'g'ri
            </div>
          )}

          <button
            type="submit"
            disabled={loginMutation.isPending}
            className="w-full py-3 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loginMutation.isPending && (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            )}
            {loginMutation.isPending ? 'Kirish...' : 'Kirish'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link to="/" className="text-sm text-gray-500 hover:text-primary-600 transition-colors">
            Asosiy saytga qaytish
          </Link>
        </div>
      </div>
    </div>
  )
}

export default AdminLoginPage
