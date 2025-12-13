import { useState, useEffect } from 'react'
import { useMutation } from '@tanstack/react-query'
import { countriesAdminApi } from '../../../services/adminApi'

function CountryForm({ item, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    name: '',
    name_uz: '',
    code: '',
    flag_emoji: '',
    currency: '',
    visa_required_for_uz: false,
  })

  useEffect(() => {
    if (item) {
      setFormData({
        name: item.name || '',
        name_uz: item.name_uz || '',
        code: item.code || '',
        flag_emoji: item.flag_emoji || '',
        currency: item.currency || '',
        visa_required_for_uz: item.visa_required_for_uz || false,
      })
    }
  }, [item])

  const mutation = useMutation({
    mutationFn: (data) =>
      item ? countriesAdminApi.update(item.id, data) : countriesAdminApi.create(data),
    onSuccess,
    onError: (error) => {
      console.error('Form error:', error)
    },
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    mutation.mutate(formData)
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto shadow-xl">
        <h3 className="text-xl font-bold mb-6">
          {item ? 'Mamlakatni tahrirlash' : 'Yangi mamlakat'}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nomi (O'zbekcha) *
            </label>
            <input
              type="text"
              name="name_uz"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              value={formData.name_uz}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nomi (English) *
            </label>
            <input
              type="text"
              name="name"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ISO kod (3 harf) *
            </label>
            <input
              type="text"
              name="code"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 uppercase"
              value={formData.code}
              onChange={handleChange}
              maxLength={3}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Bayroq emoji *
            </label>
            <input
              type="text"
              name="flag_emoji"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              value={formData.flag_emoji}
              onChange={handleChange}
              placeholder="🇺🇿"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Valyuta *
            </label>
            <input
              type="text"
              name="currency"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              value={formData.currency}
              onChange={handleChange}
              placeholder="USD"
              required
            />
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              name="visa_required_for_uz"
              id="visa_required"
              className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
              checked={formData.visa_required_for_uz}
              onChange={handleChange}
            />
            <label htmlFor="visa_required" className="text-sm text-gray-700">
              O'zbekiston fuqarolari uchun viza kerak
            </label>
          </div>

          {mutation.error && (
            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg">
              Xatolik yuz berdi. Iltimos qayta urinib ko'ring.
            </div>
          )}

          <div className="flex gap-3 justify-end pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              disabled={mutation.isPending}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
            >
              Bekor qilish
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {mutation.isPending && (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              )}
              {mutation.isPending ? 'Saqlanmoqda...' : 'Saqlash'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CountryForm
