import { useState, useEffect } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { hotelsAdminApi, citiesAdminApi } from '../../../services/adminApi'

function HotelForm({ item, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    city: '',
    hotel_name: '',
    stars: '3',
    price_per_night_usd: '',
    rating: '8.0',
    checkin_date: '',
    image_url: '',
  })

  // Fetch cities for dropdown
  const { data: citiesData } = useQuery({
    queryKey: ['adminCitiesAll'],
    queryFn: () => citiesAdminApi.getAll({ page_size: 100 }),
  })

  useEffect(() => {
    if (item) {
      setFormData({
        city: item.city || '',
        hotel_name: item.hotel_name || '',
        stars: item.stars?.toString() || '3',
        price_per_night_usd: item.price_per_night_usd || '',
        rating: item.rating || '8.0',
        checkin_date: item.checkin_date || '',
        image_url: item.image_url || '',
      })
    }
  }, [item])

  const mutation = useMutation({
    mutationFn: (data) =>
      item ? hotelsAdminApi.update(item.id, data) : hotelsAdminApi.create(data),
    onSuccess,
    onError: (error) => {
      console.error('Form error:', error)
    },
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    mutation.mutate({
      ...formData,
      city: parseInt(formData.city),
      stars: parseInt(formData.stars),
      price_per_night_usd: parseFloat(formData.price_per_night_usd),
      rating: parseFloat(formData.rating),
      image_url: formData.image_url || null,
    })
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const cities = citiesData?.results || []

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto shadow-xl">
        <h3 className="text-xl font-bold mb-6">
          {item ? 'Mehmonxonani tahrirlash' : 'Yangi mehmonxona'}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Shahar *
            </label>
            <select
              name="city"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              value={formData.city}
              onChange={handleChange}
              required
            >
              <option value="">Tanlang...</option>
              {cities.map((city) => (
                <option key={city.id} value={city.id}>
                  {city.name_uz} ({city.iata_code})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mehmonxona nomi *
            </label>
            <input
              type="text"
              name="hotel_name"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              value={formData.hotel_name}
              onChange={handleChange}
              placeholder="Hilton Hotel"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Yulduzlar *
              </label>
              <select
                name="stars"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                value={formData.stars}
                onChange={handleChange}
                required
              >
                <option value="1">1 yulduz</option>
                <option value="2">2 yulduz</option>
                <option value="3">3 yulduz</option>
                <option value="4">4 yulduz</option>
                <option value="5">5 yulduz</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reyting
              </label>
              <input
                type="number"
                name="rating"
                step="0.1"
                min="0"
                max="10"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                value={formData.rating}
                onChange={handleChange}
                placeholder="8.5"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Kechalik narx (USD) *
              </label>
              <input
                type="number"
                name="price_per_night_usd"
                step="0.01"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                value={formData.price_per_night_usd}
                onChange={handleChange}
                placeholder="75.00"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Kirish sanasi *
              </label>
              <input
                type="date"
                name="checkin_date"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                value={formData.checkin_date}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Rasm URL
            </label>
            <input
              type="url"
              name="image_url"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              value={formData.image_url}
              onChange={handleChange}
              placeholder="https://example.com/hotel.jpg"
            />
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

export default HotelForm
