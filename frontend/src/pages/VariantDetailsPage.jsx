import { useNavigate, useParams } from 'react-router-dom'
import useSearchStore from '../store/searchStore'
import TravelMap from '../components/TravelMap'
import FlightSegment from '../components/FlightSegment'
import HotelCard from '../components/HotelCard'

function VariantDetailsPage() {
  const navigate = useNavigate()
  const { id, num } = useParams()
  const { searchResults, selectedVariant, saveTrip } = useSearchStore()

  // Variantni topish
  const variant = selectedVariant || searchResults?.variants?.find(v => v.id === parseInt(num))
  const search = searchResults?.search

  if (!variant || !search) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Variant topilmadi</h1>
        <button
          onClick={() => navigate('/')}
          className="btn btn-primary"
        >
          Bosh sahifaga qaytish
        </button>
      </div>
    )
  }

  const { details } = variant

  const handleSaveTrip = () => {
    saveTrip({
      id: Date.now(),
      search,
      variant,
    })
    alert('Sayohat saqlandi!')
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Sarlavha */}
      <div className="mb-8">
        <button
          onClick={() => navigate(-1)}
          className="text-primary-600 hover:text-primary-800 mb-4 flex items-center"
        >
          ← Orqaga
        </button>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold">
              {variant.route_type_display} variant
            </h1>
            <p className="text-gray-600 mt-2">
              {search.origin_details?.name_uz} → {search.destination_details?.name_uz}
            </p>
          </div>
          {variant.is_recommended && (
            <span className="bg-green-500 text-white px-4 py-2 rounded-full font-medium">
              ⭐ TAVSIYA ETILADI
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Asosiy kontent */}
        <div className="lg:col-span-2 space-y-8">
          {/* Xarita */}
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">Yo'nalish xaritasi</h2>
            <TravelMap variant={variant} height="400px" />
          </div>

          {/* Parvozlar */}
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">✈️ Parvozlar</h2>
            <div className="space-y-4">
              {details?.segments?.map((segment, index) => (
                <FlightSegment key={index} segment={segment} />
              ))}
            </div>
          </div>

          {/* Mehmonxonalar */}
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">🏨 Mehmonxonalar</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {details?.hotels?.map((hotel, index) => (
                <HotelCard key={index} hotel={hotel} />
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          {/* Narxlar */}
          <div className="card sticky top-24">
            <h3 className="text-xl font-semibold mb-4">Narxlar xulosasi</h3>

            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Parvozlar:</span>
                <span className="font-medium">${variant.total_flight_cost.toFixed(0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Mehmonxonalar:</span>
                <span className="font-medium">${variant.total_hotel_cost.toFixed(0)}</span>
              </div>
              <div className="border-t pt-3">
                <div className="flex justify-between text-xl font-bold">
                  <span>JAMI:</span>
                  <span className="text-primary-600">${variant.total_cost.toFixed(0)}</span>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  {search.travelers} kishi uchun
                </p>
              </div>
            </div>

            {/* Tejamkorlik */}
            {variant.savings_percent > 0 && (
              <div className="mt-6 bg-green-50 rounded-lg p-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">
                    ${variant.savings_amount.toFixed(0)}
                  </div>
                  <div className="text-green-700">
                    tejaysiz ({variant.savings_percent.toFixed(0)}%)
                  </div>
                </div>
              </div>
            )}

            {/* Bonus */}
            {details?.bonus && (
              <div className="mt-4 bg-purple-50 rounded-lg p-4 text-center">
                <span className="text-purple-700 font-medium">
                  🎁 {details.bonus}
                </span>
              </div>
            )}

            {/* Amallar */}
            <div className="mt-6 space-y-3">
              <button
                onClick={handleSaveTrip}
                className="btn btn-primary w-full"
              >
                💾 Sayohatni saqlash
              </button>
              <button className="btn btn-secondary w-full">
                📤 Ulashish
              </button>
            </div>
          </div>

          {/* Tranzit hub ma'lumoti */}
          {details?.hub_city && (
            <div className="card">
              <h3 className="font-semibold mb-3">Tranzit shahar</h3>
              <div className="flex items-center space-x-3">
                <span className="text-3xl">{details.hub_city.flag}</span>
                <div>
                  <div className="font-medium">{details.hub_city.name}</div>
                  <div className="text-sm text-gray-500">{details.hub_city.country}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default VariantDetailsPage
