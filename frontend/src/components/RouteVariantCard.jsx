import clsx from 'clsx'

function RouteVariantCard({ variant, index, onSelect, isSelected, onViewDetails }) {
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

  // Aviakompaniya logolari
  const getAirlineLogo = (name) => {
    const airlines = {
      'Turkish Airlines': { code: 'TK', color: '#E30A17' },
      'Emirates': { code: 'EK', color: '#D71921' },
      'Qatar Airways': { code: 'QR', color: '#5C0632' },
      'Uzbekistan Airways': { code: 'HY', color: '#0033A0' },
      'Aeroflot': { code: 'SU', color: '#E31E24' },
      'Lufthansa': { code: 'LH', color: '#05164D' },
      'Flydubai': { code: 'FZ', color: '#F26522' },
      'Pegasus': { code: 'PC', color: '#FFD100' },
    }
    return airlines[name] || { code: 'XX', color: '#6B7280' }
  }

  const getRouteTypeStyle = () => {
    switch (route_type) {
      case 'direct':
        return { icon: '✈️', bg: 'bg-blue-50/95 backdrop-blur-sm', border: 'border-blue-200', text: 'text-blue-700' }
      case 'transit':
        return { icon: '🔄', bg: 'bg-green-50/95 backdrop-blur-sm', border: 'border-green-200', text: 'text-green-700' }
      case 'multi':
        return { icon: '🌍', bg: 'bg-purple-50/95 backdrop-blur-sm', border: 'border-purple-200', text: 'text-purple-700' }
      default:
        return { icon: '✈️', bg: 'bg-gray-50/95 backdrop-blur-sm', border: 'border-gray-200', text: 'text-gray-700' }
    }
  }

  const style = getRouteTypeStyle()

  return (
    <div
      className={clsx(
        'p-3 rounded-xl cursor-pointer transition-all hover:shadow-md border',
        style.bg, style.border,
        isSelected && 'ring-2 ring-primary-400 shadow-md',
        is_recommended && 'ring-2 ring-green-400'
      )}
      onClick={() => onSelect(variant)}
    >
      {/* Kompakt header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-lg">{style.icon}</span>
          <span className={clsx('font-semibold text-sm', style.text)}>
            #{index + 1} {route_type_display}
          </span>
          {is_recommended && (
            <span className="bg-green-500 text-white px-2 py-0.5 rounded text-xs">⭐ Tavsiya</span>
          )}
        </div>
        <span className="text-lg font-bold text-primary-600">${totalCost.toFixed(0)}</span>
      </div>

      {/* Kompakt marshrut */}
      <div className="flex items-center gap-1 text-sm mb-2 flex-wrap">
        {cities_sequence.map((city, idx) => (
          <span key={idx} className="flex items-center">
            <span className="font-medium">{city}</span>
            {idx < cities_sequence.length - 1 && <span className="mx-1 text-gray-400">→</span>}
          </span>
        ))}
      </div>

      {/* Segmentlar - kompakt */}
      <div className="flex flex-wrap gap-1 mb-2">
        {details?.segments?.map((segment, idx) => {
          const airlineInfo = getAirlineLogo(segment.airline)
          return (
            <div key={idx} className="flex items-center gap-1 bg-white/70 rounded px-2 py-1 text-xs">
              <div
                className="w-5 h-5 rounded flex items-center justify-center text-white text-[10px] font-bold"
                style={{ backgroundColor: airlineInfo.color }}
              >
                {airlineInfo.code}
              </div>
              <span className="text-gray-600">{segment.from}→{segment.to}</span>
              <span className="font-semibold">${segment.price}</span>
            </div>
          )
        })}
      </div>

      {/* Narxlar qatori */}
      <div className="flex items-center justify-between text-xs text-gray-500 border-t border-gray-200/50 pt-2">
        <div className="flex gap-3">
          <span>✈️ ${flightCost.toFixed(0)}</span>
          <span>🏨 ${hotelCost.toFixed(0)}</span>
        </div>
        {savingsPercent > 0 && (
          <span className="text-green-600 font-medium">💰 -{savingsPercent.toFixed(0)}%</span>
        )}
      </div>

      {/* Bonus - kompakt */}
      {details?.bonus && (
        <div className="mt-2 text-xs text-purple-600 bg-purple-100/50 rounded px-2 py-1">
          🎁 {details.bonus}
        </div>
      )}

      {/* Tafsilotlar tugmasi */}
      {onViewDetails && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onViewDetails(variant)
          }}
          className="mt-2 w-full py-1.5 text-sm font-medium text-primary-600 bg-white/80 hover:bg-white rounded border border-primary-200 transition-colors"
        >
          Tafsilotlar →
        </button>
      )}
    </div>
  )
}

export default RouteVariantCard
