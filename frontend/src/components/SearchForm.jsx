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

  // Qaytish sanasini hisoblash (ketishdan 7 kun keyin)
  const getDefaultReturnDate = (depDate) => {
    if (!depDate) return null
    const date = new Date(depDate)
    date.setDate(date.getDate() + 7)
    return date
  }

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
    <>
      {/* Flying airplane animation overlay */}
      {isSearching && (
        <div className="fixed inset-0 z-[9999] bg-gradient-to-br from-primary-900/95 via-primary-800/95 to-primary-900/95 flex items-center justify-center px-4">
          {/* Background pattern - hidden on mobile for performance */}
          <div className="absolute inset-0 opacity-10 hidden sm:block">
            <div className="absolute inset-0" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M54.627 0l.83.828-1.415 1.415L51.8 0h2.827zM5.373 0l-.83.828L5.96 2.243 8.2 0H5.374zM48.97 0l3.657 3.657-1.414 1.414L46.143 0h2.828zM11.03 0L7.372 3.657 8.787 5.07 13.857 0H11.03zm32.284 0L49.8 6.485 48.384 7.9l-7.9-7.9h2.83zM16.686 0L10.2 6.485 11.616 7.9l7.9-7.9h-2.83zM22.344 0L13.858 8.485 15.272 9.9l9.9-9.9h-2.828zM32 0l-3.486 3.485-1.414-1.414L30.172 0H32zM0 5.373l.828-.83 1.415 1.415L0 8.2V5.374zm0 5.656l.828-.829 5.657 5.657-1.414 1.414L0 11.03v-.001zm0 5.656l.828-.828 8.485 8.485-1.414 1.414L0 16.686v-.001zm0 5.657l.828-.828 11.314 11.314-1.414 1.414L0 22.343v-.001zM60 5.373V8.2l-2.243-2.243L59.172 4.543 60 5.373zM60 11.03v2.828l-5.657-5.657 1.414-1.414L60 11.03zm0 5.656v2.83l-8.485-8.486 1.414-1.414L60 16.686zm0 5.657v2.828l-11.314-11.314 1.414-1.414L60 22.343z' fill='%23ffffff' fill-opacity='1' fill-rule='evenodd'/%3E%3C/svg%3E")`,
            }} />
          </div>

          {/* Clouds - fewer on mobile */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-1/4 left-0 w-20 sm:w-32 h-10 sm:h-16 bg-white/10 rounded-full blur-2xl animate-cloud-1"></div>
            <div className="absolute top-1/3 right-0 w-24 sm:w-40 h-12 sm:h-20 bg-white/10 rounded-full blur-2xl animate-cloud-2"></div>
            <div className="absolute bottom-1/4 left-1/4 w-16 sm:w-24 h-8 sm:h-12 bg-white/10 rounded-full blur-2xl animate-cloud-3 hidden sm:block"></div>
            <div className="absolute top-1/2 right-1/4 w-20 sm:w-36 h-10 sm:h-18 bg-white/10 rounded-full blur-2xl animate-cloud-1 hidden sm:block"></div>
          </div>

          {/* Flying airplane */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="animate-fly-across">
              <span className="text-5xl sm:text-6xl md:text-8xl drop-shadow-2xl" style={{ filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.3))' }}>✈️</span>
            </div>
          </div>

          {/* Trail effect - hidden on mobile */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden hidden sm:block">
            <div className="animate-trail-1 absolute w-2 h-2 bg-white/40 rounded-full"></div>
            <div className="animate-trail-2 absolute w-1.5 h-1.5 bg-white/30 rounded-full"></div>
            <div className="animate-trail-3 absolute w-1 h-1 bg-white/20 rounded-full"></div>
          </div>

          {/* Content */}
          <div className="relative text-center text-white z-10 w-full max-w-md">
            <div className="mb-6 sm:mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-white/10 rounded-full mb-4 animate-pulse-slow">
                <span className="text-3xl sm:text-4xl">🌍</span>
              </div>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4 animate-fade-in">
              Yo'nalishlar qidirilmoqda...
            </h2>
            <p className="text-base sm:text-lg text-white/80 mb-4 sm:mb-6 animate-fade-in animation-delay-200 truncate px-4">
              {origin?.name_uz || origin?.name} → {destination?.name_uz || destination?.name}
            </p>

            {/* Progress bar */}
            <div className="w-full max-w-xs sm:max-w-sm mx-auto bg-white/20 rounded-full h-2 overflow-hidden">
              <div className="h-full bg-gradient-to-r from-white to-primary-300 rounded-full animate-progress"></div>
            </div>

            <p className="text-xs sm:text-sm text-white/60 mt-4 animate-fade-in animation-delay-400">
              Aviasales.uz dan real narxlar olinmoqda
            </p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className={compact ? 'space-y-4' : 'space-y-6'}>

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
              // Qaytish sanasini avtomatik yangilash (ketishdan 7 kun keyin)
              if (date && (!returnDate || returnDate <= date)) {
                setReturnDate(getDefaultReturnDate(date))
              }
              setValidationErrors(prev => ({ ...prev, departureDate: null, returnDate: null }))
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

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
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
          <div className="flex items-center justify-center p-3 sm:p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
            <div className="flex flex-col sm:flex-row items-center text-center sm:text-left">
              <span className="text-xl sm:text-2xl mb-1 sm:mb-0 sm:mr-3 icon-3d-pulse">🟢</span>
              <span className="text-gray-700 font-medium text-sm sm:text-base">
                <span className="text-green-600">Real vaqtdagi narxlar</span>
                <span className="text-gray-500 text-xs sm:text-sm block sm:inline sm:ml-2">(Aviasales.uz dan)</span>
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
    </>
  )
}

export default SearchForm
