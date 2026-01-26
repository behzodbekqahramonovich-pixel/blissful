function FlightSegment({ segment }) {
  const {
    from,
    from_name,
    to,
    to_name,
    price,
    airline,
    duration,
    date,
    type,
    departure_time,
    arrival_time,
    flight_number,
    link,
  } = segment

  const formatDuration = (minutes) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours}s ${mins}d`
  }

  const getTypeStyle = () => {
    switch (type) {
      case 'outbound':
        return { label: 'Ketish', bg: 'bg-blue-500', icon: '🛫' }
      case 'inbound':
        return { label: 'Qaytish', bg: 'bg-green-500', icon: '🛬' }
      case 'transit':
        return { label: 'Tranzit', bg: 'bg-purple-500', icon: '🔄' }
      default:
        return { label: 'Parvoz', bg: 'bg-gray-500', icon: '✈️' }
    }
  }

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

  const typeStyle = getTypeStyle()
  const airlineInfo = getAirlineLogo(airline)

  return (
    <div className="bg-gradient-to-r from-white to-gray-50 rounded-2xl border border-gray-100 p-4 hover:shadow-lg transition-all group">
      {/* Top row - Type badge & Price */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className={`${typeStyle.bg} text-white px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1`}>
            <span>{typeStyle.icon}</span>
            {typeStyle.label}
          </span>
          <span className="text-xs text-gray-400">{date}</span>
        </div>
        <div className="text-right">
          <span className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-purple-600 bg-clip-text text-transparent">
            ${price}
          </span>
        </div>
      </div>

      {/* Flight info */}
      <div className="flex items-center gap-4">
        {/* Airline logo */}
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold shadow-lg flex-shrink-0"
          style={{ backgroundColor: airlineInfo.color }}
        >
          {airlineInfo.code}
        </div>

        {/* Route */}
        <div className="flex-1">
          <div className="flex items-center justify-between">
            {/* Departure */}
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-800">{from}</div>
              <div className="text-xs text-gray-500 truncate max-w-[80px]">{from_name}</div>
              <div className="text-sm font-semibold text-primary-600 mt-1">{departure_time || '08:00'}</div>
            </div>

            {/* Flight line */}
            <div className="flex-1 px-3">
              <div className="relative">
                <div className="border-t-2 border-dashed border-gray-300"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-2">
                  <div className="text-xs text-gray-500 whitespace-nowrap">{formatDuration(duration)}</div>
                </div>
                <div className="absolute top-1/2 right-0 -translate-y-1/2 text-lg group-hover:translate-x-1 transition-transform">
                  ✈️
                </div>
              </div>
            </div>

            {/* Arrival */}
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-800">{to}</div>
              <div className="text-xs text-gray-500 truncate max-w-[80px]">{to_name}</div>
              <div className="text-sm font-semibold text-primary-600 mt-1">
                {arrival_time || calculateArrival(departure_time || '08:00', duration)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom info */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span>{airline}</span>
          {flight_number && <span className="text-gray-300">|</span>}
          {flight_number && <span>{flight_number}</span>}
        </div>
        {link && (
          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs bg-primary-100 text-primary-700 px-3 py-1 rounded-full hover:bg-primary-200 transition-colors"
          >
            Chipta olish →
          </a>
        )}
      </div>
    </div>
  )
}

function calculateArrival(departure, durationMinutes) {
  const [hours, minutes] = departure.split(':').map(Number)
  const totalMinutes = hours * 60 + minutes + durationMinutes
  const arrivalHours = Math.floor(totalMinutes / 60) % 24
  const arrivalMins = totalMinutes % 60
  return `${String(arrivalHours).padStart(2, '0')}:${String(arrivalMins).padStart(2, '0')}`
}

export default FlightSegment
