function HotelCard({ hotel }) {
  const {
    city,
    city_name,
    nights,
    price_per_night,
    total_price,
    stars,
  } = hotel

  // Yulduzlar
  const renderStars = () => {
    return '⭐'.repeat(stars || 3)
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-2">
          <span className="text-2xl">🏨</span>
          <div>
            <h4 className="font-semibold">{city_name}</h4>
            <span className="text-sm text-gray-500">{city}</span>
          </div>
        </div>
        <div className="text-right">
          <span className="text-xl font-bold text-primary-600">${total_price?.toFixed(0)}</span>
          <p className="text-xs text-gray-500">jami</p>
        </div>
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600">Kechalar soni:</span>
          <span className="font-medium">{nights} kecha</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Kechalik narx:</span>
          <span className="font-medium">${price_per_night?.toFixed(0)}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Daraja:</span>
          <span>{renderStars()}</span>
        </div>
      </div>
    </div>
  )
}

export default HotelCard
