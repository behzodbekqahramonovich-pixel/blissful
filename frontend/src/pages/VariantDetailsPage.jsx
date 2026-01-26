import { useNavigate, useParams } from 'react-router-dom'
import useSearchStore from '../store/searchStore'
import TravelMap from '../components/TravelMap'
import FlightSegment from '../components/FlightSegment'
import HotelCard from '../components/HotelCard'

function VariantDetailsPage() {
  const navigate = useNavigate()
  const { id, num } = useParams()
  const { searchResults, selectedVariant, saveTrip } = useSearchStore()

  const variant = selectedVariant || searchResults?.variants?.find(v => v.id === parseInt(num))
  const search = searchResults?.search

  if (!variant || !search) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-6xl mb-4">🔍</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Variant topilmadi</h1>
          <p className="text-gray-500 mb-4">Ushbu variant mavjud emas yoki o'chirilgan</p>
          <button onClick={() => navigate('/')} className="btn btn-primary">
            Bosh sahifaga qaytish
          </button>
        </div>
      </div>
    )
  }

  const { details } = variant
  const flightCost = parseFloat(variant.total_flight_cost || 0)
  const hotelCost = parseFloat(variant.total_hotel_cost || 0)
  const totalCost = parseFloat(variant.total_cost || 0)
  const savingsPercent = parseFloat(variant.savings_percent || 0)
  const savingsAmount = parseFloat(variant.savings_amount || 0)

  const handleSaveTrip = () => {
    saveTrip({ id: Date.now(), search, variant })
    alert('Sayohat saqlandi!')
  }

  return (
    <div className="min-h-screen relative">
      {/* Background */}
      <div className="fixed inset-0 -z-10">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url('https://images.unsplash.com/photo-1512632578888-169bbbc64f33?w=1920&q=80')` }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/80 via-blue-900/70 to-purple-900/80" />
        <div className="absolute top-20 left-20 w-72 h-72 bg-blue-500/20 rounded-full blur-3xl animate-orb" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-orb-delay-1" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate(-1)}
            className="text-white/70 hover:text-white mb-3 flex items-center gap-2 text-sm"
          >
            <span>←</span> Orqaga
          </button>

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl md:text-3xl font-bold text-white">
                  {search.origin_details?.name_uz} → {search.destination_details?.name_uz}
                </h1>
                {variant.is_recommended && (
                  <span className="bg-gradient-to-r from-green-400 to-emerald-500 text-white px-3 py-1 rounded-full text-xs font-medium">
                    ⭐ Tavsiya
                  </span>
                )}
              </div>
              <p className="text-white/60 text-sm">
                {search.departure_date} - {search.return_date} • {search.travelers} kishi • {search.nights} kecha
              </p>
            </div>

            {/* Price card */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20">
              <div className="text-center">
                <div className="text-3xl font-bold text-white">${totalCost.toFixed(0)}</div>
                <div className="text-white/60 text-xs">Jami narx</div>
                {savingsPercent > 0 && (
                  <div className="mt-1 text-green-400 text-xs font-medium">
                    💰 ${savingsAmount.toFixed(0)} tejaysiz
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Route summary */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20">
              <div className="flex items-center justify-center gap-2 flex-wrap">
                {variant.cities_sequence?.map((city, idx) => (
                  <div key={idx} className="flex items-center">
                    <div className="bg-white/20 px-4 py-2 rounded-xl">
                      <span className="text-white font-bold">{city}</span>
                    </div>
                    {idx < variant.cities_sequence.length - 1 && (
                      <span className="mx-2 text-white/50">✈️</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Map */}
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl overflow-hidden">
              <div className="p-4 border-b border-gray-100">
                <h2 className="font-semibold text-gray-800 flex items-center gap-2">
                  <span>🗺️</span> Yo'nalish xaritasi
                </h2>
              </div>
              <div className="h-[300px]">
                <TravelMap variant={variant} height="300px" />
              </div>
            </div>

            {/* Flights */}
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl p-4">
              <h2 className="font-semibold text-gray-800 flex items-center gap-2 mb-4">
                <span>✈️</span> Parvozlar
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full ml-auto">
                  ${flightCost.toFixed(0)}
                </span>
              </h2>
              <div className="space-y-3">
                {details?.segments?.map((segment, index) => (
                  <FlightSegment key={index} segment={segment} />
                ))}
              </div>
            </div>

            {/* Hotels */}
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl p-4">
              <h2 className="font-semibold text-gray-800 flex items-center gap-2 mb-4">
                <span>🏨</span> Mehmonxonalar
                <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full ml-auto">
                  ${hotelCost.toFixed(0)}
                </span>
              </h2>
              <div className="grid grid-cols-1 gap-4">
                {details?.hotels?.map((hotel, index) => (
                  <HotelCard key={index} hotel={hotel} />
                ))}
              </div>
            </div>
          </div>

          {/* Right sidebar */}
          <div className="space-y-4">
            {/* Price breakdown */}
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl p-5 sticky top-4">
              <h3 className="font-semibold text-gray-800 mb-4">Narxlar</h3>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 flex items-center gap-2">
                    <span>✈️</span> Parvozlar
                  </span>
                  <span className="font-medium">${flightCost.toFixed(0)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 flex items-center gap-2">
                    <span>🏨</span> Mehmonxonalar
                  </span>
                  <span className="font-medium">${hotelCost.toFixed(0)}</span>
                </div>
                <div className="border-t pt-3">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-gray-800">JAMI</span>
                    <span className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-purple-600 bg-clip-text text-transparent">
                      ${totalCost.toFixed(0)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{search.travelers} kishi uchun</p>
                </div>
              </div>

              {/* Savings */}
              {savingsPercent > 0 && (
                <div className="mt-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-3 border border-green-200">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">${savingsAmount.toFixed(0)}</div>
                    <div className="text-green-700 text-sm">tejaysiz ({savingsPercent.toFixed(0)}%)</div>
                  </div>
                </div>
              )}

              {/* Bonus */}
              {details?.bonus && (
                <div className="mt-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-3 border border-purple-200 text-center">
                  <span className="text-purple-700 text-sm font-medium">
                    🎁 {details.bonus}
                  </span>
                </div>
              )}

              {/* Actions */}
              <div className="mt-5 space-y-2">
                <button
                  onClick={handleSaveTrip}
                  className="w-full bg-gradient-to-r from-primary-500 to-purple-600 text-white py-3 rounded-xl font-medium hover:from-primary-600 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl"
                >
                  💾 Sayohatni saqlash
                </button>
                <button className="w-full bg-gray-100 text-gray-700 py-3 rounded-xl font-medium hover:bg-gray-200 transition-all">
                  📤 Ulashish
                </button>
              </div>
            </div>

            {/* Transit hub */}
            {details?.hub_city && (
              <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl p-4">
                <h3 className="font-semibold text-gray-800 mb-3">Tranzit shahar</h3>
                <div className="flex items-center gap-3">
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
    </div>
  )
}

export default VariantDetailsPage
