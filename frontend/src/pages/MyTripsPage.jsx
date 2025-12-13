import { useNavigate } from 'react-router-dom'
import useSearchStore from '../store/searchStore'

function MyTripsPage() {
  const navigate = useNavigate()
  const { savedTrips, removeTrip, setSearchResults, selectVariant } = useSearchStore()

  const handleViewTrip = (trip) => {
    setSearchResults({
      search: trip.search,
      variants: [trip.variant],
      recommended: trip.variant,
    })
    selectVariant(trip.variant)
    navigate('/search')
  }

  const handleRemoveTrip = (tripId) => {
    if (confirm("Sayohatni o'chirishni xohlaysizmi?")) {
      removeTrip(tripId)
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold mb-8">Saqlangan sayohatlarim</h1>

      {savedTrips.length === 0 ? (
        <div className="card text-center py-12">
          <div className="text-6xl mb-4">✈️</div>
          <h2 className="text-xl font-semibold mb-2">Hali sayohat saqlanmagan</h2>
          <p className="text-gray-600 mb-6">
            Yo'nalish qidirib, yoqqan variantni saqlang
          </p>
          <button
            onClick={() => navigate('/')}
            className="btn btn-primary"
          >
            Sayohat qidirish
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {savedTrips.map((trip) => (
            <div key={trip.id} className="card hover:shadow-lg transition-shadow">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-lg">
                    {trip.search.origin_details?.name_uz || trip.search.origin} →{' '}
                    {trip.search.destination_details?.name_uz || trip.search.destination}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {trip.search.departure_date} - {trip.search.return_date}
                  </p>
                </div>
                <button
                  onClick={() => handleRemoveTrip(trip.id)}
                  className="text-gray-400 hover:text-red-500 transition-colors"
                  title="O'chirish"
                >
                  ✕
                </button>
              </div>

              {/* Variant info */}
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Yo'nalish:</span>
                  <span className="font-medium">{trip.variant.route_type_display}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Jami narx:</span>
                  <span className="text-xl font-bold text-primary-600">
                    ${trip.variant.total_cost.toFixed(0)}
                  </span>
                </div>
              </div>

              {/* Route visualization */}
              <div className="flex items-center justify-center space-x-2 mb-4">
                {trip.variant.cities_sequence?.map((city, idx) => (
                  <div key={idx} className="flex items-center">
                    <span className="text-sm font-medium">{city}</span>
                    {idx < trip.variant.cities_sequence.length - 1 && (
                      <span className="mx-1 text-gray-400">→</span>
                    )}
                  </div>
                ))}
              </div>

              {/* Tejamkorlik */}
              {trip.variant.savings_percent > 0 && (
                <div className="bg-green-50 rounded-lg p-2 text-center mb-4">
                  <span className="text-green-700 text-sm font-medium">
                    💰 ${trip.variant.savings_amount.toFixed(0)} tejamkorlik
                  </span>
                </div>
              )}

              {/* Saqlangan vaqt */}
              <div className="text-xs text-gray-400 mb-4">
                Saqlangan: {new Date(trip.savedAt).toLocaleDateString('uz-UZ')}
              </div>

              {/* Amallar */}
              <button
                onClick={() => handleViewTrip(trip)}
                className="btn btn-primary w-full"
              >
                Ko'rish
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default MyTripsPage
