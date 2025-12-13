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
        return { label: 'Ketish', color: 'bg-blue-100 text-blue-800' }
      case 'inbound':
        return { label: 'Qaytish', color: 'bg-green-100 text-green-800' }
      case 'transit':
        return { label: 'Tranzit', color: 'bg-purple-100 text-purple-800' }
      default:
        return { label: 'Parvoz', color: 'bg-gray-100 text-gray-800' }
    }
  }

  const typeInfo = getTypeLabel()

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-2">
          <span className="text-2xl">✈️</span>
          <div>
            <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${typeInfo.color}`}>
              {typeInfo.label}
            </span>
            <p className="text-sm text-gray-500 mt-1">{date}</p>
          </div>
        </div>
        <div className="text-right">
          <span className="text-xl font-bold text-primary-600">${price}</span>
        </div>
      </div>

      <div className="flex items-center justify-between">
        {/* Qayerdan */}
        <div className="text-center">
          <div className="text-2xl font-bold">{from}</div>
          <div className="text-sm text-gray-600">{from_name}</div>
        </div>

        {/* Yo'nalish */}
        <div className="flex-1 px-4">
          <div className="relative">
            <div className="border-t-2 border-dashed border-gray-300"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white px-2">
              <span className="text-xs text-gray-500">{formatDuration(duration)}</span>
            </div>
          </div>
        </div>

        {/* Qayerga */}
        <div className="text-center">
          <div className="text-2xl font-bold">{to}</div>
          <div className="text-sm text-gray-600">{to_name}</div>
        </div>
      </div>

      {/* Aviakompaniya */}
      <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-sm">
        <span className="text-gray-600">Aviakompaniya:</span>
        <span className="font-medium">{airline}</span>
      </div>
    </div>
  )
}

export default FlightSegment
