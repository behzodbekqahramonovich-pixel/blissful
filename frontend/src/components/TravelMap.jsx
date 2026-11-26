import { useEffect, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet'
import L from 'leaflet'
import useCities from '../hooks/useCities'
import { TILES } from '../services/tiles'

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
  const { byCode } = useCities()

  // Yo'nalish shaharlari (koordinatasi noma'lum kod tashlab ketiladi)
  const sequence = variant?.cities_sequence || []
  const cities = sequence.map((code, index) => byCode[code] && {
    lat: Number(byCode[code].latitude),
    lng: Number(byCode[code].longitude),
    name: byCode[code].name_uz,
    code,
    isOrigin: index === 0,
    isDestination: index === sequence.length - 1,
  }).filter(Boolean)

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
      <TileLayer {...TILES} />

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
