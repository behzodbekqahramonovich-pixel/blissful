import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { useQuery } from '@tanstack/react-query'
import { destinationsApi, searchApi } from '../services/api'
import useSearchStore from '../store/searchStore'
import CityAutocomplete from './CityAutocomplete'

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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              <option value={3}>3 yulduz</option>
              <option value={4}>4 yulduz</option>
              <option value={5}>5 yulduz</option>
            </select>
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
