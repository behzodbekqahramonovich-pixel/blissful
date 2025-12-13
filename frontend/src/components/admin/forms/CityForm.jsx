import { useState, useEffect } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { citiesAdminApi, countriesAdminApi } from '../../../services/adminApi'

function CityForm({ item, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    country: '',
    name: '',
    name_uz: '',
    iata_code: '',
    latitude: '',
    longitude: '',
    is_hub: false,
    avg_hotel_price_usd: '50.00',
  })

  // Fetch countries for dropdown
  const { data: countriesData } = useQuery({
    queryKey: ['adminCountriesAll'],
    queryFn: () => countriesAdminApi.getAll({ page_size: 100 }),
  })

  useEffect(() => {
    if (item) {
      setFormData({
        country: item.country || '',
        name: item.name || '',
        name_uz: item.name_uz || '',
        iata_code: item.iata_code || '',
        latitude: item.latitude || '',
        longitude: item.longitude || '',
        is_hub: item.is_hub || false,
        avg_hotel_price_usd: item.avg_hotel_price_usd || '50.00',
      })
    }
  }, [item])

  const mutation = useMutation({
    mutationFn: (data) =>
      item ? citiesAdminApi.update(item.id, data) : citiesAdminApi.create(data),
    onSuccess,
    onError: (error) => {
      console.error('Form error:', error)
    },
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    mutation.mutate({
      ...formData,
      country: parseInt(formData.country),
      latitude: parseFloat(formData.latitude),
      longitude: parseFloat(formData.longitude),
      avg_hotel_price_usd: parseFloat(formData.avg_hotel_price_usd),
    })
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const countries = countriesData?.results || []

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto shadow-xl">
        <h3 className="text-xl font-bold mb-6">
          {item ? 'Shaharni tahrirlash' : 'Yangi shahar'}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mamlakat *
            </label>
            <select
              name="country"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              value={formData.country}
              onChange={handleChange}
              required
            >
              <option value="">Tanlang...</option>
              {countries.map((country) => (
                <option key={country.id} value={country.id}>
                  {country.flag_emoji} {country.name_uz}
                </option>
              ))}
            </select>
          </div>

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
              IATA kodi (3 harf) *
            </label>
            <input
              type="text"
              name="iata_code"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 uppercase"
              value={formData.iata_code}
              onChange={handleChange}
              maxLength={3}
              placeholder="TAS"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Kenglik *
              </label>
              <input
                type="number"
                name="latitude"
                step="0.0000001"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                value={formData.latitude}
                onChange={handleChange}
                placeholder="41.2995"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Uzunlik *
              </label>
              <input
                type="number"
                name="longitude"
                step="0.0000001"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                value={formData.longitude}
                onChange={handleChange}
                placeholder="69.2401"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              O'rtacha mehmonxona narxi (USD)
            </label>
            <input
              type="number"
              name="avg_hotel_price_usd"
              step="0.01"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              value={formData.avg_hotel_price_usd}
              onChange={handleChange}
            />
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              name="is_hub"
              id="is_hub"
              className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
              checked={formData.is_hub}
              onChange={handleChange}
            />
            <label htmlFor="is_hub" className="text-sm text-gray-700">
              Tranzit hub shahar
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

export default CityForm
