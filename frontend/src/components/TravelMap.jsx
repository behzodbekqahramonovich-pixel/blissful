import { useEffect, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet'
import L from 'leaflet'

// Custom marker ikonkasi
const createIcon = (color) => {
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="
      background-color: ${color};
      width: 24px;
      height: 24px;
      border-radius: 50%;
      border: 3px solid white;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
    "></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  })
}

// Xaritani markazlashtirish
function MapBounds({ cities }) {
  const map = useMap()

  useEffect(() => {
    if (cities.length > 0) {
      const bounds = L.latLngBounds(cities.map(c => [c.lat, c.lng]))
      map.fitBounds(bounds, { padding: [50, 50] })
    }
  }, [cities, map])

  return null
}

function TravelMap({ variant, height = '400px' }) {
  // Shahar koordinatalari (demo uchun)
  const cityCoordinates = {
    TAS: { lat: 41.311, lng: 69.279, name: 'Toshkent' },
    IST: { lat: 41.008, lng: 28.978, name: 'Istanbul' },
    DXB: { lat: 25.204, lng: 55.270, name: 'Dubai' },
    DOH: { lat: 25.286, lng: 51.533, name: 'Doha' },
    AUH: { lat: 24.453, lng: 54.377, name: 'Abu Dhabi' },
    BKK: { lat: 13.756, lng: 100.501, name: 'Bangkok' },
    KUL: { lat: 3.139, lng: 101.686, name: 'Kuala Lumpur' },
    SIN: { lat: 1.352, lng: 103.819, name: 'Singapur' },
    CAI: { lat: 30.044, lng: 31.235, name: 'Qohira' },
    AYT: { lat: 36.896, lng: 30.713, name: 'Antalya' },
  }

  // Yo'nalish shaharlari
  const cities = variant?.cities_sequence?.map((code, index) => {
    const coord = cityCoordinates[code] || { lat: 0, lng: 0, name: code }
    return {
      ...coord,
      code,
      isOrigin: index === 0,
      isDestination: index === variant.cities_sequence.length - 1,
    }
  }) || []

  // Yo'nalish chizig'i
  const routeLine = cities.map(c => [c.lat, c.lng])

  // Marker ranglari
  const getMarkerColor = (city) => {
    if (city.isOrigin) return '#22c55e' // yashil
    if (city.isDestination) return '#ef4444' // qizil
    return '#3b82f6' // ko'k
  }

  if (!variant || cities.length === 0) {
    return (
      <div
        style={{ height }}
        className="bg-gray-100 rounded-xl flex items-center justify-center"
      >
        <span className="text-gray-500">Xarita mavjud emas</span>
      </div>
    )
  }

  return (
    <MapContainer
      center={[41.311, 69.279]}
      zoom={4}
      style={{ height, width: '100%' }}
      className="rounded-xl"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* Yo'nalish chizig'i */}
      <Polyline
        positions={routeLine}
        color="#3b82f6"
        weight={3}
        dashArray="10, 10"
      />

      {/* Markerlar */}
      {cities.map((city, index) => (
        <Marker
          key={index}
          position={[city.lat, city.lng]}
          icon={createIcon(getMarkerColor(city))}
        >
          <Popup>
            <div className="text-center">
              <strong>{city.name}</strong>
              <br />
              <span className="text-gray-500">{city.code}</span>
            </div>
          </Popup>
        </Marker>
      ))}

      <MapBounds cities={cities} />
    </MapContainer>
  )
}

export default TravelMap
