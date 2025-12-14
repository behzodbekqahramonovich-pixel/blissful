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
  { id: 'balanced', label: 'Muvozanatli', icon: '⚖️', description: 'Narx va vaqt muvozanati' },
  { id: 'cheapest', label: 'Eng arzon', icon: '💰', description: 'Eng past narx' },
  { id: 'fastest', label: 'Eng tez', icon: '⚡', description: 'Eng qisqa vaqt' },
  { id: 'comfort', label: 'Qulay', icon: '✨', description: 'Kam almashinuv' },
]

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
  const [isSearching, setIsSearching] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!origin || !destination || !departureDate || !returnDate) {
      alert("Iltimos, barcha maydonlarni to'ldiring")
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
      <div className={`grid ${compact ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'} gap-4`}>
        {/* Qayerdan */}
        <div>
          <label className="label">Qayerdan</label>
          <CityAutocomplete
            value={origin}
            onChange={setOrigin}
            placeholder="Shahar tanlang"
          />
        </div>

        {/* Qayerga */}
        <div>
          <label className="label">Qayerga</label>
          <CityAutocomplete
            value={destination}
            onChange={setDestination}
            placeholder="Manzil tanlang"
          />
        </div>

        {/* Ketish sanasi */}
        <div>
          <label className="label">Ketish sanasi</label>
          <DatePicker
            selected={departureDate}
            onChange={setDepartureDate}
            minDate={new Date()}
            dateFormat="dd/MM/yyyy"
            placeholderText="Sanani tanlang"
            className="input"
          />
        </div>

        {/* Qaytish sanasi */}
        <div>
          <label className="label">Qaytish sanasi</label>
          <DatePicker
            selected={returnDate}
            onChange={setReturnDate}
            minDate={departureDate || new Date()}
            dateFormat="dd/MM/yyyy"
            placeholderText="Sanani tanlang"
            className="input"
          />
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
                  <div className="text-2xl mb-1">{mode.icon}</div>
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
                <option value={1}>🏠 Hostel</option>
                <option value={2}>⭐⭐ 2 yulduz</option>
                <option value={3}>⭐⭐⭐ 3 yulduz</option>
                <option value={4}>⭐⭐⭐⭐ 4 yulduz</option>
                <option value={5}>⭐⭐⭐⭐⭐ 5 yulduz</option>
              </select>
            </div>

            {/* Maksimal byudjet */}
            <div>
              <label className="label">Maksimal byudjet (USD)</label>
              <input
                type="number"
                value={budgetMax}
                onChange={(e) => setBudgetMax(e.target.value)}
                placeholder="Ixtiyoriy"
                className="input"
                min="0"
              />
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
              <span>🔍</span>
              <span>Yo'nalishlarni topish</span>
            </>
          )}
        </button>
      </div>
    </form>
  )
}

export default SearchForm
