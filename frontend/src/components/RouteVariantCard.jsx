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

  // Aviakompaniya logolari
  const getAirlineLogo = (name) => {
    const airlines = {
      'Turkish Airlines': { code: 'TK', color: '#E30A17', icon: '🇹🇷' },
      'Emirates': { code: 'EK', color: '#D71921', icon: '🇦🇪' },
      'Qatar Airways': { code: 'QR', color: '#5C0632', icon: '🇶🇦' },
      'Uzbekistan Airways': { code: 'HY', color: '#0033A0', icon: '🇺🇿' },
      'Aeroflot': { code: 'SU', color: '#E31E24', icon: '🇷🇺' },
      'Lufthansa': { code: 'LH', color: '#05164D', icon: '🇩🇪' },
      'British Airways': { code: 'BA', color: '#075AAA', icon: '🇬🇧' },
      'Air France': { code: 'AF', color: '#002157', icon: '🇫🇷' },
      'KLM': { code: 'KL', color: '#00A1E4', icon: '🇳🇱' },
      'Singapore Airlines': { code: 'SQ', color: '#F7B500', icon: '🇸🇬' },
      'Thai Airways': { code: 'TG', color: '#4E2A84', icon: '🇹🇭' },
      'Malaysia Airlines': { code: 'MH', color: '#E31837', icon: '🇲🇾' },
      'Cathay Pacific': { code: 'CX', color: '#006564', icon: '🇭🇰' },
      'ANA': { code: 'NH', color: '#13448F', icon: '🇯🇵' },
      'Korean Air': { code: 'KE', color: '#0064D2', icon: '🇰🇷' },
      'China Eastern': { code: 'MU', color: '#E31937', icon: '🇨🇳' },
      'American Airlines': { code: 'AA', color: '#0078D2', icon: '🇺🇸' },
      'United Airlines': { code: 'UA', color: '#002244', icon: '🇺🇸' },
      'Delta': { code: 'DL', color: '#003366', icon: '🇺🇸' },
      'Flydubai': { code: 'FZ', color: '#F26522', icon: '🇦🇪' },
      'AirAsia': { code: 'AK', color: '#E31837', icon: '🇲🇾' },
      'Etihad Airways': { code: 'EY', color: '#BD8B13', icon: '🇦🇪' },
      'Pegasus': { code: 'PC', color: '#FFD100', icon: '🇹🇷' },
      'Saudia': { code: 'SV', color: '#006747', icon: '🇸🇦' },
      'EgyptAir': { code: 'MS', color: '#1C4587', icon: '🇪🇬' },
      // Booking platformalari
      'Aviakassa': { code: 'AV', color: '#FF6B00', icon: '🎫' },
      'Farera': { code: 'FR', color: '#00BCD4', icon: '🎫' },
      'Wingie': { code: 'WG', color: '#FF5722', icon: '🎫' },
      'Kupi.com': { code: 'KP', color: '#4CAF50', icon: '🎫' },
      'City.Travel': { code: 'CT', color: '#9C27B0', icon: '🎫' },
      'Kiwi.com': { code: 'KW', color: '#00BFA5', icon: '🎫' },
      'Flightnetwork': { code: 'FN', color: '#3F51B5', icon: '🎫' },
      'Turna.com': { code: 'TR', color: '#E91E63', icon: '🎫' },
      'Авиасейлс': { code: 'AS', color: '#FF9800', icon: '🎫' },
    }
    return airlines[name] || { code: 'XX', color: '#6B7280', icon: '✈️' }
  }

  const getRouteTypeIcon = () => {
    switch (route_type) {
      case 'direct':
        return { icon: '✈️', iconClass: 'icon-3d-primary' }
      case 'transit':
        return { icon: '🔄', iconClass: 'icon-3d-success' }
      case 'multi':
        return { icon: '🌍', iconClass: 'icon-3d-purple' }
      default:
        return { icon: '✈️', iconClass: 'icon-3d' }
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
          <span className={`text-2xl ${getRouteTypeIcon().iconClass}`}>{getRouteTypeIcon().icon}</span>
          <div>
            <h3 className="font-semibold text-lg">VARIANT {index + 1}</h3>
            <span className={clsx('inline-block px-2 py-1 rounded-full text-xs font-medium', getRouteTypeColor())}>
              {route_type_display}
            </span>
          </div>
        </div>

        {is_recommended && (
          <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center">
            <span className="icon-3d-sm mr-1">⭐</span> TAVSIYA ETILADI
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
        {details?.segments?.map((segment, idx) => {
          const airlineInfo = getAirlineLogo(segment.airline)
          return (
            <div key={idx} className="flex items-center justify-between text-sm bg-gray-50 rounded-lg p-2">
              <div className="flex items-center gap-2">
                {/* Mini aviakompaniya logosi */}
                <div
                  className="w-7 h-7 rounded-md flex items-center justify-center text-white text-xs font-bold shadow-sm"
                  style={{ backgroundColor: airlineInfo.color }}
                  title={segment.airline}
                >
                  {airlineInfo.code}
                </div>
                <div>
                  <span className="text-gray-700 font-medium">
                    {segment.from} → {segment.to}
                  </span>
                  <span className="text-gray-400 text-xs ml-2">{segment.airline}</span>
                </div>
              </div>
              <span className="font-bold text-primary-600">${segment.price}</span>
            </div>
          )
        })}
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
        {/* Ma'lumot manbasi - faqat real narxlar */}
        {details?.segments?.[0]?.data_source && (
          <div className="flex justify-end mt-2">
            <span className={clsx(
              'text-xs px-2 py-0.5 rounded',
              details.segments[0].data_source === 'travelpayouts_api' ? 'bg-green-100 text-green-700' :
              details.segments[0].data_source === 'live_api' ? 'bg-green-100 text-green-700' :
              details.segments[0].data_source === 'travelpayouts_free' ? 'bg-blue-100 text-blue-700' :
              details.segments[0].data_source === 'database' ? 'bg-blue-100 text-blue-700' :
              details.segments[0].data_source === 'database_avg' ? 'bg-blue-100 text-blue-700' :
              'bg-green-100 text-green-700'
            )}>
              {details.segments[0].data_source === 'travelpayouts_api' ? <><span className="icon-3d-sm">🟢</span> Real vaqt (Aviasales)</> :
               details.segments[0].data_source === 'live_api' ? <><span className="icon-3d-sm">🟢</span> Real vaqt (Aviasales)</> :
               details.segments[0].data_source === 'travelpayouts_free' ? <><span className="icon-3d-sm">🟢</span> Aviasales</> :
               details.segments[0].data_source === 'database' ? <><span className="icon-3d-sm">🟢</span> Real narx</> :
               details.segments[0].data_source === 'database_avg' ? <><span className="icon-3d-sm">🟢</span> Real narx</> :
               <><span className="icon-3d-sm">🟢</span> Real narx</>}
            </span>
          </div>
        )}
      </div>

      {/* Savings */}
      {savingsPercent > 0 && (
        <div className="mt-4 bg-green-50 rounded-lg p-3 text-center">
          <span className="text-green-700 font-medium">
            <span className="icon-3d-success">💰</span> TEJAMKORLIK: ${savingsAmt.toFixed(0)} ({savingsPercent.toFixed(0)}% arzon)
          </span>
        </div>
      )}

      {/* Multi-city bonus */}
      {details?.bonus && (
        <div className="mt-4 bg-purple-50 rounded-lg p-3 text-center">
          <span className="text-purple-700 font-medium">
            <span className="icon-3d-purple">🎁</span> BONUS: {details.bonus}
          </span>
        </div>
      )}
    </div>
  )
}

export default RouteVariantCard
