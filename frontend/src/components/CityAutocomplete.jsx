import { useState, useEffect, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { destinationsApi } from '../services/api'
import clsx from 'clsx'

function CityAutocomplete({ value, onChange, placeholder }) {
  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const wrapperRef = useRef(null)

  // Shaharlarni qidirish
  const { data: cities = [], isLoading } = useQuery({
    queryKey: ['cities', query],
    queryFn: () => destinationsApi.searchCities(query),
    enabled: query.length >= 1,
    staleTime: 1000 * 60 * 5,
  })

  // Tashqariga bosilganda yopish
  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelect = (city) => {
    onChange(city)
    setQuery(city.name_uz)
    setIsOpen(false)
  }

  const handleInputChange = (e) => {
    setQuery(e.target.value)
    setIsOpen(true)
    if (!e.target.value) {
      onChange(null)
    }
  }

  return (
    <div ref={wrapperRef} className="relative">
      <input
        type="text"
        value={query}
        onChange={handleInputChange}
        onFocus={() => setIsOpen(true)}
        placeholder={placeholder}
        className="input"
      />

      {/* Dropdown */}
      {isOpen && query.length >= 1 && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto">
          {isLoading ? (
            <div className="px-4 py-3 text-gray-500 text-center">
              Qidirilmoqda...
            </div>
          ) : cities.length > 0 ? (
            cities.map((city) => (
              <button
                key={city.id}
                type="button"
                onClick={() => handleSelect(city)}
                className={clsx(
                  'w-full px-4 py-3 text-left hover:bg-primary-50 transition-colors',
                  'flex items-center justify-between',
                  value?.id === city.id && 'bg-primary-50'
                )}
              >
                <span className="font-medium">{city.label}</span>
                <span className="text-gray-400 text-sm">{city.iata_code}</span>
              </button>
            ))
          ) : (
            <div className="px-4 py-3 text-gray-500 text-center">
              Shahar topilmadi
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default CityAutocomplete
