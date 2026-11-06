import { useState, useEffect } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { transportAdminApi, citiesAdminApi } from '../../../services/adminApi'

export const TRANSPORT_MODES = [
  { value: 'train', label: 'Poyezd', icon: '🚆' },
  { value: 'bus', label: 'Avtobus', icon: '🚌' },
  { value: 'car', label: 'Avtomobil/Taksi', icon: '🚕' },
  { value: 'plane', label: 'Samolyot (taxminiy)', icon: '✈️' },
]

const EMPTY = {
  from_city: '',
  to_city: '',
  mode: 'car',
  duration_min: '',
  price_usd: '',
  headway_min: 0,
  first_departure: '',
  last_departure: '',
  is_bidirectional: true,
  link: '',
  is_active: true,
}

const inputClass =
  'w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500'

function TransportForm({ item, onClose, onSuccess }) {
  const [formData, setFormData] = useState(EMPTY)

  const { data: citiesData } = useQuery({
    queryKey: ['adminCitiesAll'],
    queryFn: () => citiesAdminApi.getAll({ page_size: 500 }),
  })
  const cities = citiesData?.results || []

  useEffect(() => {
    if (item) {
      setFormData({
        ...EMPTY,
        ...Object.fromEntries(Object.keys(EMPTY).map((k) => [k, item[k] ?? EMPTY[k]])),
      })
    }
  }, [item])

  const mutation = useMutation({
    mutationFn: (data) =>
      item ? transportAdminApi.update(item.id, data) : transportAdminApi.create(data),
    onSuccess,
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    mutation.mutate({
      ...formData,
      from_city: parseInt(formData.from_city),
      to_city: parseInt(formData.to_city),
      duration_min: parseInt(formData.duration_min),
      price_usd: parseFloat(formData.price_usd),
      headway_min: parseInt(formData.headway_min) || 0,
      first_departure: formData.first_departure || null,
      last_departure: formData.last_departure || null,
    })
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
  }

  // Backend validatsiya xabari: {"to_city": ["..."]} yoki {"non_field_errors": [...]}
  const errors = mutation.error?.response?.data
  const errorText =
    errors && typeof errors === 'object'
      ? Object.values(errors).flat().join(' ')
      : mutation.error && "Xatolik yuz berdi. Iltimos qayta urinib ko'ring."

  const cityOptions = cities.map((c) => (
    <option key={c.id} value={c.id}>
      {c.name_uz} ({c.iata_code || 'aeroportsiz'})
    </option>
  ))

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto shadow-xl">
        <h3 className="text-xl font-bold mb-6">
          {item ? 'Transportni tahrirlash' : 'Yangi transport yo\'nalishi'}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Qayerdan *</label>
              <select name="from_city" className={inputClass} value={formData.from_city} onChange={handleChange} required>
                <option value="">Tanlang...</option>
                {cityOptions}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Qayerga *</label>
              <select name="to_city" className={inputClass} value={formData.to_city} onChange={handleChange} required>
                <option value="">Tanlang...</option>
                {cityOptions}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Transport turi *</label>
            <div className="grid grid-cols-2 gap-2">
              {TRANSPORT_MODES.map((m) => (
                <label
                  key={m.value}
                  className={`flex items-center gap-2 px-3 py-2 border rounded-lg cursor-pointer text-sm ${
                    formData.mode === m.value ? 'border-primary-500 bg-primary-50' : 'border-gray-300'
                  }`}
                >
                  <input type="radio" name="mode" value={m.value} checked={formData.mode === m.value} onChange={handleChange} className="sr-only" />
                  <span>{m.icon}</span>
                  <span>{m.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Davomiylik (daqiqa) *</label>
              <input type="number" name="duration_min" min="1" className={inputClass} value={formData.duration_min} onChange={handleChange} placeholder="270" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Narx, 1 kishi (USD) *</label>
              <input type="number" name="price_usd" min="0" step="0.01" className={inputClass} value={formData.price_usd} onChange={handleChange} placeholder="8.00" required />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Reyslar oralig'i (daqiqa)</label>
            <input type="number" name="headway_min" min="0" className={inputClass} value={formData.headway_min} onChange={handleChange} />
            <p className="text-xs text-gray-500 mt-1">0 — istalgan vaqtda (taksi). Masalan, poyezd kuniga 4 marta bo'lsa — 360.</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Birinchi reys</label>
              <input type="time" name="first_departure" className={inputClass} value={formData.first_departure || ''} onChange={handleChange} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Oxirgi reys</label>
              <input type="time" name="last_departure" className={inputClass} value={formData.last_departure || ''} onChange={handleChange} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Havola (chipta sotiladigan sayt)</label>
            <input type="url" name="link" className={inputClass} value={formData.link} onChange={handleChange} placeholder="https://" />
          </div>

          <div className="flex flex-col gap-2">
            <label className="flex items-center gap-3 text-sm text-gray-700">
              <input type="checkbox" name="is_bidirectional" checked={formData.is_bidirectional} onChange={handleChange} className="w-4 h-4 text-primary-600 border-gray-300 rounded" />
              Ikki tomonga (qaytish ham shu narx va vaqtda)
            </label>
            <label className="flex items-center gap-3 text-sm text-gray-700">
              <input type="checkbox" name="is_active" checked={formData.is_active} onChange={handleChange} className="w-4 h-4 text-primary-600 border-gray-300 rounded" />
              Faol (qidiruvda ishlatiladi)
            </label>
          </div>

          {errorText && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg">{errorText}</div>}

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

export default TransportForm
