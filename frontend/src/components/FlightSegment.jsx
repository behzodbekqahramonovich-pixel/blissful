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
    aircraft,
    link,
  } = segment

  // Davomiylikni formatlash
  const formatDuration = (minutes) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours}s ${mins}d`
  }

  // Segment turini aniqlash
  const getTypeLabel = () => {
    switch (type) {
      case 'outbound':
        return { label: 'Ketish', color: 'bg-blue-100 text-blue-800', icon: '🛫', iconClass: 'icon-3d-primary' }
      case 'inbound':
        return { label: 'Qaytish', color: 'bg-green-100 text-green-800', icon: '🛬', iconClass: 'icon-3d-success' }
      case 'transit':
        return { label: 'Tranzit', color: 'bg-purple-100 text-purple-800', icon: '🔄', iconClass: 'icon-3d-purple' }
      default:
        return { label: 'Parvoz', color: 'bg-gray-100 text-gray-800', icon: '✈️', iconClass: 'icon-3d' }
    }
  }

  const typeInfo = getTypeLabel()

  // Aviakompaniya logolari (IATA kodlari bilan)
  const getAirlineLogo = (name) => {
    const airlines = {
      // Asosiy aviakompaniyalar
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
      'Japan Airlines': { code: 'JL', color: '#E31837', icon: '🇯🇵' },
      'China Southern': { code: 'CZ', color: '#008FD3', icon: '🇨🇳' },
      'Air China': { code: 'CA', color: '#E31837', icon: '🇨🇳' },
      'Pegasus': { code: 'PC', color: '#FFD100', icon: '🇹🇷' },
      'SunExpress': { code: 'XQ', color: '#FFD100', icon: '🇹🇷' },
      'Saudia': { code: 'SV', color: '#006747', icon: '🇸🇦' },
      'IndiGo': { code: '6E', color: '#3F51B5', icon: '🇮🇳' },
      'Air India': { code: 'AI', color: '#E31837', icon: '🇮🇳' },
      'Vietnam Airlines': { code: 'VN', color: '#00467F', icon: '🇻🇳' },
      'Philippine Airlines': { code: 'PR', color: '#0033A0', icon: '🇵🇭' },
      'Garuda Indonesia': { code: 'GA', color: '#00A551', icon: '🇮🇩' },
      'EVA Air': { code: 'BR', color: '#00A651', icon: '🇹🇼' },
      'Swiss': { code: 'LX', color: '#E31837', icon: '🇨🇭' },
      'Austrian': { code: 'OS', color: '#E31837', icon: '🇦🇹' },
      'LOT Polish': { code: 'LO', color: '#003A70', icon: '🇵🇱' },
      'Finnair': { code: 'AY', color: '#0B1560', icon: '🇫🇮' },
      'SAS': { code: 'SK', color: '#000080', icon: '🇸🇪' },
      'Norwegian': { code: 'DY', color: '#D81939', icon: '🇳🇴' },
      'Iberia': { code: 'IB', color: '#D7192D', icon: '🇪🇸' },
      'TAP Portugal': { code: 'TP', color: '#E31837', icon: '🇵🇹' },
      'Alitalia': { code: 'AZ', color: '#006643', icon: '🇮🇹' },
      'EgyptAir': { code: 'MS', color: '#1C4587', icon: '🇪🇬' },
      'Royal Jordanian': { code: 'RJ', color: '#7D1935', icon: '🇯🇴' },
      'Oman Air': { code: 'WY', color: '#006747', icon: '🇴🇲' },
      'Gulf Air': { code: 'GF', color: '#C41230', icon: '🇧🇭' },
      'Kuwait Airways': { code: 'KU', color: '#0071BC', icon: '🇰🇼' },
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

  const airlineInfo = getAirlineLogo(airline)

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-lg transition-all">
      {/* Aviakompaniya banner */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
        <div className="flex items-center space-x-3">
          {/* Aviakompaniya logosi */}
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-lg relative overflow-hidden"
            style={{ backgroundColor: airlineInfo.color }}
          >
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"></div>
            {/* IATA kodi */}
            <span className="relative z-10 text-lg font-black tracking-tight">{airlineInfo.code}</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">{airlineInfo.icon}</span>
              <div className="font-bold text-lg text-gray-800">{airline || 'Aviakompaniya'}</div>
            </div>
            {flight_number && (
              <div className="text-sm text-gray-500 flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                </svg>
                Reys: <span className="font-medium text-gray-700">{flight_number}</span>
              </div>
            )}
          </div>
        </div>
        <div className="text-right">
          <span className="text-2xl font-bold text-primary-600">${price}</span>
          <p className="text-xs text-gray-400">1 kishi</p>
        </div>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <span className={`text-2xl ${typeInfo.iconClass}`}>{typeInfo.icon}</span>
          <div>
            <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${typeInfo.color}`}>
              {typeInfo.label}
            </span>
            <p className="text-sm text-gray-500 mt-1">{date}</p>
          </div>
        </div>
      </div>

      {/* Asosiy parvoz ma'lumotlari */}
      <div className="flex items-center justify-between py-4">
        {/* Qayerdan */}
        <div className="text-center">
          <div className="text-3xl font-bold text-gray-800">{from}</div>
          <div className="text-sm text-gray-600 mt-1">{from_name}</div>
          <div className="text-lg font-semibold text-primary-600 mt-2">
            {departure_time || '08:00'}
          </div>
          <div className="text-xs text-gray-400">Uchish</div>
        </div>

        {/* Yo'nalish va davomiylik */}
        <div className="flex-1 px-6">
          <div className="relative">
            <div className="border-t-2 border-gray-300"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <div className="bg-white px-3 py-1 rounded-full border border-gray-200 shadow-sm">
                <span className="text-sm font-medium text-gray-600">{formatDuration(duration)}</span>
              </div>
            </div>
            {/* Samolyot ikonkasi */}
            <div className="absolute top-1/2 right-4 transform -translate-y-1/2">
              <span className="text-xl icon-3d-float">✈️</span>
            </div>
          </div>
          <div className="text-center mt-3">
            <span className="text-xs text-gray-400">To'g'ridan-to'g'ri parvoz</span>
          </div>
        </div>

        {/* Qayerga */}
        <div className="text-center">
          <div className="text-3xl font-bold text-gray-800">{to}</div>
          <div className="text-sm text-gray-600 mt-1">{to_name}</div>
          <div className="text-lg font-semibold text-primary-600 mt-2">
            {arrival_time || calculateArrivalTime(departure_time || '08:00', duration)}
          </div>
          <div className="text-xs text-gray-400">Qo'nish</div>
        </div>
      </div>

      {/* Chipta olish */}
      {link && (
        <div className="mt-4 pt-4 border-t border-gray-100 text-center">
          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <span className="icon-3d-sm mr-1">✈️</span> Chipta olish →
          </a>
        </div>
      )}
    </div>
  )
}

// Qo'nish vaqtini hisoblash
function calculateArrivalTime(departureTime, durationMinutes) {
  const [hours, minutes] = departureTime.split(':').map(Number)
  const totalMinutes = hours * 60 + minutes + durationMinutes
  const arrivalHours = Math.floor(totalMinutes / 60) % 24
  const arrivalMinutes = totalMinutes % 60
  return `${String(arrivalHours).padStart(2, '0')}:${String(arrivalMinutes).padStart(2, '0')}`
}

export default FlightSegment
