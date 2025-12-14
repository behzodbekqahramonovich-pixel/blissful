import clsx from 'clsx'

function RouteVariantCard({ variant, index, onSelect, isSelected }) {
  const {
    route_type,
    route_type_display,
    cities_sequence,
    total_flight_cost,
    total_hotel_cost,
    total_cost,
    savings_percent,
    savings_amount,
    is_recommended,
    details,
  } = variant

  // Convert string values to numbers
  const flightCost = parseFloat(total_flight_cost) || 0
  const hotelCost = parseFloat(total_hotel_cost) || 0
  const totalCost = parseFloat(total_cost) || 0
  const savingsPercent = parseFloat(savings_percent) || 0
  const savingsAmt = parseFloat(savings_amount) || 0

  const getRouteTypeIcon = () => {
    switch (route_type) {
      case 'direct':
        return '✈️'
      case 'transit':
        return '🔄'
      case 'multi':
        return '🌍'
      default:
        return '✈️'
    }
  }

  const getRouteTypeColor = () => {
    switch (route_type) {
      case 'direct':
        return 'bg-blue-100 text-blue-800'
      case 'transit':
        return 'bg-green-100 text-green-800'
      case 'multi':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div
      className={clsx(
        'card cursor-pointer transition-all hover:shadow-lg border-2',
        isSelected ? 'border-primary-500 ring-2 ring-primary-200' : 'border-transparent',
        is_recommended && 'ring-2 ring-green-200'
      )}
      onClick={() => onSelect(variant)}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <span className="text-2xl">{getRouteTypeIcon()}</span>
          <div>
            <h3 className="font-semibold text-lg">VARIANT {index + 1}</h3>
            <span className={clsx('inline-block px-2 py-1 rounded-full text-xs font-medium', getRouteTypeColor())}>
              {route_type_display}
            </span>
          </div>
        </div>

        {is_recommended && (
          <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center">
            ⭐ TAVSIYA ETILADI
          </span>
        )}
      </div>

      {/* Route visualization */}
      <div className="flex items-center justify-center space-x-2 py-4 bg-gray-50 rounded-lg mb-4">
        {cities_sequence.map((city, idx) => (
          <div key={idx} className="flex items-center">
            <div className="text-center">
              <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center mb-1">
                <span className="font-bold text-primary-600">{city}</span>
              </div>
            </div>
            {idx < cities_sequence.length - 1 && (
              <div className="mx-2 text-gray-400">→</div>
            )}
          </div>
        ))}
      </div>

      {/* Details */}
      <div className="space-y-2 mb-4">
        {details?.segments?.map((segment, idx) => (
          <div key={idx} className="flex items-center justify-between text-sm">
            <span className="text-gray-600">
              {segment.from_name} → {segment.to_name}
            </span>
            <span className="font-medium">${segment.price}</span>
          </div>
        ))}
      </div>

      {/* Prices */}
      <div className="border-t pt-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Parvozlar:</span>
          <span className="font-medium">${flightCost.toFixed(0)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Mehmonxonalar:</span>
          <span className="font-medium">${hotelCost.toFixed(0)}</span>
        </div>
        <div className="flex justify-between text-lg font-bold border-t pt-2">
          <span>JAMI:</span>
          <span className="text-primary-600">${totalCost.toFixed(0)}</span>
        </div>
        {/* Ma'lumot manbasi */}
        {details?.segments?.[0]?.data_source && (
          <div className="flex justify-end mt-2">
            <span className={clsx(
              'text-xs px-2 py-0.5 rounded',
              details.segments[0].data_source === 'travelpayouts_api' ? 'bg-green-100 text-green-700' :
              details.segments[0].data_source === 'travelpayouts_free' ? 'bg-blue-100 text-blue-700' :
              'bg-gray-100 text-gray-600'
            )}>
              {details.segments[0].data_source === 'travelpayouts_api' ? '🔴 Real vaqt (Aviasales)' :
               details.segments[0].data_source === 'travelpayouts_free' ? '🟡 Aviasales (cache)' :
               '⚪ Taxminiy narx'}
            </span>
          </div>
        )}
      </div>

      {/* Savings */}
      {savingsPercent > 0 && (
        <div className="mt-4 bg-green-50 rounded-lg p-3 text-center">
          <span className="text-green-700 font-medium">
            💰 TEJAMKORLIK: ${savingsAmt.toFixed(0)} ({savingsPercent.toFixed(0)}% arzon)
          </span>
        </div>
      )}

      {/* Multi-city bonus */}
      {details?.bonus && (
        <div className="mt-4 bg-purple-50 rounded-lg p-3 text-center">
          <span className="text-purple-700 font-medium">
            🎁 BONUS: {details.bonus}
          </span>
        </div>
      )}
    </div>
  )
}

export default RouteVariantCard
