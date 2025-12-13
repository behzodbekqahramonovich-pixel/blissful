import { useState, useEffect } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { flightsAdminApi, citiesAdminApi } from '../../../services/adminApi'

function FlightForm({ item, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    origin: '',
    destination: '',
    price_usd: '',
    airline: '',
    flight_duration_minutes: '',
    departure_date: '',
    departure_time: '',
    arrival_time: '',
    is_roundtrip: false,
  })

  // Fetch cities for dropdown
  const { data: citiesData } = useQuery({
    queryKey: ['adminCitiesAll'],
    queryFn: () => citiesAdminApi.getAll({ page_size: 100 }),
  })

  useEffect(() => {
    if (item) {
      setFormData({
        origin: item.origin || '',
        destination: item.destination || '',
        price_usd: item.price_usd || '',
        airline: item.airline || '',
        flight_duration_minutes: item.flight_duration_minutes || '',
        departure_date: item.departure_date || '',
        departure_time: item.departure_time || '',
        arrival_time: item.arrival_time || '',
        is_roundtrip: item.is_roundtrip || false,
      })
    }
  }, [item])

  const mutation = useMutation({
    mutationFn: (data) =>
      item ? flightsAdminApi.update(item.id, data) : flightsAdminApi.create(data),
    onSuccess,
    onError: (error) => {
      console.error('Form error:', error)
    },
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    mutation.mutate({
      ...formData,
      origin: parseInt(formData.origin),
      destination: parseInt(formData.destination),
      price_usd: parseFloat(formData.price_usd),
      flight_duration_minutes: parseInt(formData.flight_duration_minutes),
      departure_time: formData.departure_time || null,
      arrival_time: formData.arrival_time || null,
    })
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const cities = citiesData?.results || []

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto shadow-xl">
        <h3 className="text-xl font-bold mb-6">
          {item ? 'Parvozni tahrirlash' : 'Yangi parvoz'}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Qayerdan *
              </label>
              <select
                name="origin"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                value={formData.origin}
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
                Qayerga *
              </label>
              <select
                name="destination"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                value={formData.destination}
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
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Narx (USD) *
              </label>
              <input
                type="number"
                name="price_usd"
                step="0.01"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                value={formData.price_usd}
                onChange={handleChange}
                placeholder="250.00"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Aviakompaniya *
              </label>
              <input
                type="text"
                name="airline"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                value={formData.airline}
                onChange={handleChange}
                placeholder="Uzbekistan Airways"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Davomiylik (daqiqa) *
              </label>
              <input
                type="number"
                name="flight_duration_minutes"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                value={formData.flight_duration_minutes}
                onChange={handleChange}
                placeholder="180"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Uchish sanasi *
              </label>
              <input
                type="date"
                name="departure_date"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                value={formData.departure_date}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Uchish vaqti
              </label>
              <input
                type="time"
                name="departure_time"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                value={formData.departure_time}
                onChange={handleChange}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Qo'nish vaqti
              </label>
              <input
                type="time"
                name="arrival_time"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                value={formData.arrival_time}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              name="is_roundtrip"
              id="is_roundtrip"
              className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
              checked={formData.is_roundtrip}
              onChange={handleChange}
            />
            <label htmlFor="is_roundtrip" className="text-sm text-gray-700">
              Borib-qaytish parvozi
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

export default FlightForm
