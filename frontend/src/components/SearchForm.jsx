import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { useQuery } from '@tanstack/react-query'
import { destinationsApi, searchApi } from '../services/api'
import useSearchStore from '../store/searchStore'
import CityAutocomplete from './CityAutocomplete'

// Optimallashtirish rejimlari
const OPTIMIZATION_MODES = [
  { id: 'balanced', label: 'Muvozanatli', icon: '⚖️', description: 'Narx va vaqt muvozanati', iconClass: 'icon-3d' },
  { id: 'cheapest', label: 'Eng arzon', icon: '💰', description: 'Eng past narx', iconClass: 'icon-3d-success' },
  { id: 'fastest', label: 'Eng tez', icon: '⚡', description: 'Eng qisqa vaqt', iconClass: 'icon-3d-warning' },
  { id: 'comfort', label: 'Qulay', icon: '✨', description: 'Kam almashinuv', iconClass: 'icon-3d-purple' },
]

// Validatsiya konstantalari
const MAX_TRIP_DAYS = 60

function SearchForm({ compact = false }) {
  const navigate = useNavigate()
  const { searchParams, setSearchParams, setSearchResults, setLoading, setError } = useSearchStore()

  const [origin, setOrigin] = useState(null)
  const [destination, setDestination] = useState(null)
  const [departureDate, setDepartureDate] = useState(null)
  const [returnDate, setReturnDate] = useState(null)
  const [travelers, setTravelers] = useState(1)
  const [includeTransit, setIncludeTransit] = useState(true)
  const [hotelStars, setHotelStars] = useState(3)
  const [optimizationMode, setOptimizationMode] = useState('balanced')
  const [budgetMax, setBudgetMax] = useState('')
  const [useLivePrices, setUseLivePrices] = useState(true)
  const [isSearching, setIsSearching] = useState(false)
  const [validationErrors, setValidationErrors] = useState({})

  // Validatsiya funksiyasi
  const validateForm = () => {
    const errors = {}
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Majburiy maydonlar
    if (!origin) errors.origin = "Ketish shahrini tanlang"
    if (!destination) errors.destination = "Manzil shahrini tanlang"
    if (!departureDate) errors.departureDate = "Ketish sanasini tanlang"
    if (!returnDate) errors.returnDate = "Qaytish sanasini tanlang"

    // Bir xil shaharlar
    if (origin && destination && origin.iata_code === destination.iata_code) {
      errors.destination = "Ketish va manzil shaharlari bir xil bo'lmasligi kerak"
    }

    // O'tgan sana
    if (departureDate && departureDate < today) {
      errors.departureDate = "Ketish sanasi bugungi kundan oldin bo'lishi mumkin emas"
    }

    // Qaytish sanasi ketish sanasidan oldin
    if (departureDate && returnDate && returnDate <= departureDate) {
      errors.returnDate = "Qaytish sanasi ketish sanasidan keyin bo'lishi kerak"
    }

    // Maksimal sayohat davomiyligi
    if (departureDate && returnDate) {
      const tripDays = Math.ceil((returnDate - departureDate) / (1000 * 60 * 60 * 24))
      if (tripDays > MAX_TRIP_DAYS) {
        errors.returnDate = `Sayohat davomiyligi ${MAX_TRIP_DAYS} kundan oshmasligi kerak (${tripDays} kun tanlandi)`
      }
    }

    // Manfiy budget
    if (budgetMax && parseFloat(budgetMax) < 0) {
      errors.budgetMax = "Byudjet manfiy bo'lishi mumkin emas"
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Validatsiya
    if (!validateForm()) {
      return
    }

    setIsSearching(true)
    setLoading(true)
    setError(null)

    try {
      const searchData = {
        origin: origin.iata_code,
        destination: destination.iata_code,
        departure_date: departureDate.toISOString().split('T')[0],
        return_date: returnDate.toISOString().split('T')[0],
        travelers,
        include_transit: includeTransit,
        hotel_stars: hotelStars,
        optimization_mode: optimizationMode,
        budget_max: budgetMax ? parseFloat(budgetMax) : null,
        use_optimizer: true,
        use_live_prices: useLivePrices,
      }

      const results = await searchApi.createSearch(searchData)
      setSearchResults(results)
      navigate('/search')
    } catch (error) {
      console.error('Qidiruv xatosi:', error)
      setError('Qidiruv amalga oshmadi. Qaytadan urinib ko\'ring.')
    } finally {
      setIsSearching(false)
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className={compact ? 'space-y-4' : 'space-y-6'}>
      {/* Umumiy xato xabari */}
      {Object.keys(validationErrors).length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start space-x-3">
          <span className="text-2xl">⚠️</span>
          <div>
            <h4 className="font-semibold text-red-800">Xatoliklar topildi</h4>
            <p className="text-red-600 text-sm mt-1">Iltimos, quyidagi maydonlarni to'g'rilang:</p>
            <ul className="text-red-600 text-sm mt-2 list-disc list-inside">
              {Object.values(validationErrors).filter(Boolean).map((error, idx) => (
                <li key={idx}>{error}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <div className={`grid ${compact ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'} gap-4`}>
        {/* Qayerdan */}
        <div>
          <label className="label">Qayerdan</label>
          <CityAutocomplete
            value={origin}
            onChange={(val) => {
              setOrigin(val)
              setValidationErrors(prev => ({ ...prev, origin: null }))
            }}
            placeholder="Shahar tanlang"
            hasError={!!validationErrors.origin}
          />
          {validationErrors.origin && (
            <p className="text-red-500 text-xs mt-1 flex items-center">
              <span className="mr-1">⚠️</span> {validationErrors.origin}
            </p>
          )}
        </div>

        {/* Qayerga */}
        <div>
          <label className="label">Qayerga</label>
          <CityAutocomplete
            value={destination}
            onChange={(val) => {
              setDestination(val)
              setValidationErrors(prev => ({ ...prev, destination: null }))
            }}
            placeholder="Manzil tanlang"
            hasError={!!validationErrors.destination}
          />
          {validationErrors.destination && (
            <p className="text-red-500 text-xs mt-1 flex items-center">
              <span className="mr-1">⚠️</span> {validationErrors.destination}
            </p>
          )}
        </div>

        {/* Ketish sanasi */}
        <div>
          <label className="label">Ketish sanasi</label>
          <DatePicker
            selected={departureDate}
            onChange={(date) => {
              setDepartureDate(date)
              setValidationErrors(prev => ({ ...prev, departureDate: null }))
            }}
            minDate={new Date()}
            dateFormat="dd/MM/yyyy"
            placeholderText="Sanani tanlang"
            className={`input ${validationErrors.departureDate ? 'border-red-500 focus:ring-red-500' : ''}`}
          />
          {validationErrors.departureDate && (
            <p className="text-red-500 text-xs mt-1 flex items-center">
              <span className="mr-1">⚠️</span> {validationErrors.departureDate}
            </p>
          )}
        </div>

        {/* Qaytish sanasi */}
        <div>
          <label className="label">Qaytish sanasi</label>
          <DatePicker
            selected={returnDate}
            onChange={(date) => {
              setReturnDate(date)
              setValidationErrors(prev => ({ ...prev, returnDate: null }))
            }}
            minDate={departureDate || new Date()}
            maxDate={departureDate ? new Date(departureDate.getTime() + MAX_TRIP_DAYS * 24 * 60 * 60 * 1000) : null}
            dateFormat="dd/MM/yyyy"
            placeholderText="Sanani tanlang"
            className={`input ${validationErrors.returnDate ? 'border-red-500 focus:ring-red-500' : ''}`}
          />
          {validationErrors.returnDate && (
            <p className="text-red-500 text-xs mt-1 flex items-center">
              <span className="mr-1">⚠️</span> {validationErrors.returnDate}
            </p>
          )}
          {departureDate && returnDate && !validationErrors.returnDate && (
            <p className="text-gray-500 text-xs mt-1">
              {Math.ceil((returnDate - departureDate) / (1000 * 60 * 60 * 24))} kecha
            </p>
          )}
        </div>
      </div>

      {/* Qo'shimcha parametrlar */}
      {!compact && (
        <>
          {/* Optimallashtirish rejimi */}
          <div>
            <label className="label mb-2">Optimallashtirish rejimi</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {OPTIMIZATION_MODES.map((mode) => (
                <button
                  key={mode.id}
                  type="button"
                  onClick={() => setOptimizationMode(mode.id)}
                  className={`p-3 rounded-xl border-2 transition-all duration-200 ${
                    optimizationMode === mode.id
                      ? 'border-primary-500 bg-primary-50 text-primary-700 shadow-md'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className={`text-2xl mb-1 ${mode.iconClass}`}>{mode.icon}</div>
                  <div className="font-medium text-sm">{mode.label}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{mode.description}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Yo'lovchilar */}
            <div>
              <label className="label">Yo'lovchilar soni</label>
              <select
                value={travelers}
                onChange={(e) => setTravelers(Number(e.target.value))}
                className="input"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                  <option key={num} value={num}>
                    {num} kishi
                  </option>
                ))}
              </select>
            </div>

            {/* Mehmonxona yulduzlari */}
            <div>
              <label className="label">Mehmonxona darajasi</label>
              <select
                value={hotelStars}
                onChange={(e) => setHotelStars(Number(e.target.value))}
                className="input"
              >
                <option value={1}>Hostel</option>
                <option value={2}>2 yulduz</option>
                <option value={3}>3 yulduz</option>
                <option value={4}>4 yulduz</option>
                <option value={5}>5 yulduz</option>
              </select>
            </div>

            {/* Maksimal byudjet */}
            <div>
              <label className="label">Maksimal byudjet (USD)</label>
              <input
                type="number"
                value={budgetMax}
                onChange={(e) => {
                  setBudgetMax(e.target.value)
                  setValidationErrors(prev => ({ ...prev, budgetMax: null }))
                }}
                placeholder="Ixtiyoriy"
                className={`input ${validationErrors.budgetMax ? 'border-red-500 focus:ring-red-500' : ''}`}
                min="0"
              />
              {validationErrors.budgetMax && (
                <p className="text-red-500 text-xs mt-1 flex items-center">
                  <span className="mr-1">⚠️</span> {validationErrors.budgetMax}
                </p>
              )}
            </div>

            {/* Tranzit */}
            <div className="flex items-center pt-7">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeTransit}
                  onChange={(e) => setIncludeTransit(e.target.checked)}
                  className="w-5 h-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="ml-2 text-gray-700">Tranzit variantlarni ko'rsatish</span>
              </label>
            </div>
          </div>

          {/* Real vaqtdagi narxlar - doimo yoqilgan */}
          <div className="flex items-center justify-center p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
            <div className="flex items-center">
              <span className="text-2xl mr-3 icon-3d-pulse">🟢</span>
              <span className="text-gray-700 font-medium">
                <span className="text-green-600">Real vaqtdagi narxlar</span>
                <span className="text-gray-500 text-sm ml-2">(Aviasales.uz dan)</span>
              </span>
            </div>
          </div>
        </>
      )}

      {/* Qidirish tugmasi */}
      <div className="flex justify-center">
        <button
          type="submit"
          disabled={isSearching}
          className="btn btn-primary px-8 py-3 text-lg flex items-center space-x-2"
        >
          {isSearching ? (
            <>
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span>Qidirilmoqda...</span>
            </>
          ) : (
            <>
              <span className="icon-3d">🔍</span>
              <span>Yo'nalishlarni topish</span>
            </>
          )}
        </button>
      </div>
    </form>
  )
}

export default SearchForm
