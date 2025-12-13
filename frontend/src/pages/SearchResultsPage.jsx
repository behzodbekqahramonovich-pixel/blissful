import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import useSearchStore from '../store/searchStore'
import RouteVariantCard from '../components/RouteVariantCard'
import TravelMap from '../components/TravelMap'

function SearchResultsPage() {
  const navigate = useNavigate()
  const { searchResults, selectVariant, selectedVariant, saveTrip } = useSearchStore()
  const [activeVariant, setActiveVariant] = useState(null)

  useEffect(() => {
    if (!searchResults) {
      navigate('/')
      return
    }
    // Tavsiya qilingan variantni tanlash
    if (searchResults.recommended) {
      setActiveVariant(searchResults.recommended)
    } else if (searchResults.variants?.length > 0) {
      setActiveVariant(searchResults.variants[0])
    }
  }, [searchResults, navigate])

  if (!searchResults) {
    return null
  }

  const { search, variants } = searchResults

  const handleSelectVariant = (variant) => {
    setActiveVariant(variant)
    selectVariant(variant)
  }

  const handleSaveTrip = () => {
    if (activeVariant) {
      saveTrip({
        id: Date.now(),
        search,
        variant: activeVariant,
      })
      alert('Sayohat saqlandi!')
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Sarlavha */}
      <div className="mb-8">
        <button
          onClick={() => navigate('/')}
          className="text-primary-600 hover:text-primary-800 mb-4 flex items-center"
        >
          ← Yangi qidiruv
        </button>
        <h1 className="text-3xl font-bold">
          {search.origin_details?.name_uz} → {search.destination_details?.name_uz}
        </h1>
        <p className="text-gray-600 mt-2">
          {search.departure_date} - {search.return_date} | {search.travelers} kishi | {search.nights} kecha
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Variantlar ro'yxati */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-xl font-semibold">
            {variants.length} ta variant topildi
          </h2>

          <div className="space-y-4">
            {variants.map((variant, index) => (
              <RouteVariantCard
                key={variant.id}
                variant={variant}
                index={index}
                onSelect={handleSelectVariant}
                isSelected={activeVariant?.id === variant.id}
              />
            ))}
          </div>
        </div>

        {/* Xarita va tanlangan variant */}
        <div className="lg:col-span-1 space-y-6">
          {/* Xarita */}
          <div className="card">
            <h3 className="text-lg font-semibold mb-4">Yo'nalish xaritasi</h3>
            <TravelMap variant={activeVariant} height="300px" />
          </div>

          {/* Tanlangan variant */}
          {activeVariant && (
            <div className="card bg-primary-50">
              <h3 className="text-lg font-semibold mb-4">Tanlangan variant</h3>

              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Yo'nalish turi:</span>
                  <span className="font-medium">{activeVariant.route_type_display}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Parvozlar:</span>
                  <span className="font-medium">${activeVariant.total_flight_cost.toFixed(0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Mehmonxonalar:</span>
                  <span className="font-medium">${activeVariant.total_hotel_cost.toFixed(0)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t pt-3">
                  <span>JAMI:</span>
                  <span className="text-primary-600">${activeVariant.total_cost.toFixed(0)}</span>
                </div>

                {activeVariant.savings_percent > 0 && (
                  <div className="bg-green-100 rounded-lg p-3 text-center text-green-700">
                    💰 ${activeVariant.savings_amount.toFixed(0)} tejaysiz!
                  </div>
                )}
              </div>

              <div className="mt-6 space-y-3">
                <button
                  onClick={() => navigate(`/search/${search.id}/variant/${activeVariant.id}`)}
                  className="btn btn-primary w-full"
                >
                  Tafsilotlarni ko'rish
                </button>
                <button
                  onClick={handleSaveTrip}
                  className="btn btn-secondary w-full"
                >
                  💾 Sayohatni saqlash
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default SearchResultsPage
