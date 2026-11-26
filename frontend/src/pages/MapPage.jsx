import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapContainer, TileLayer, CircleMarker, Polyline, Tooltip, ZoomControl, useMap } from 'react-leaflet'
import { useQuery } from '@tanstack/react-query'
import { format, addDays } from 'date-fns'
import clsx from 'clsx'
import { searchApi } from '../services/api'
import { fetchPlaces, fetchRoute, searchAddress } from '../services/geo'
import { TILES } from '../services/tiles'
import CityGuide from '../components/CityGuide'
import useCities, { position } from '../hooks/useCities'
import useSearchStore from '../store/searchStore'
import CityAutocomplete from '../components/CityAutocomplete'
import RouteVariantCard from '../components/RouteVariantCard'

const MODES = {
  plane: { color: '#3b82f6', dashArray: '8 8', label: '✈️ Samolyot' },
  train: { color: '#16a34a', label: '🚆 Poyezd' },
  bus: { color: '#f97316', label: '🚌 Avtobus' },
  car: { color: '#f59e0b', label: '🚕 Taksi' },
}

const FIELDS = [
  ['from', 'Qayerdan', 'bg-green-500'],
  ['to', 'Qayerga', 'bg-red-500'],
]

function FitBounds({ points }) {
  const map = useMap()
  useEffect(() => {
    if (points.length < 2) return
    // Marshrut panel ostida qolmasin: kompyuterda panel chapda (~400px), telefonda pastda
    const wide = window.innerWidth >= 640
    map.fitBounds(points, {
      paddingTopLeft: wide ? [440, 60] : [40, 40],
      paddingBottomRight: wide ? [60, 60] : [40, map.getSize().y * 0.6],
    })
  }, [points, map])
  return null
}

const day = (offset) => format(addDays(new Date(), offset), 'yyyy-MM-dd')

const CITY_ZOOM = 11        // shu masshtabdan boshlab shahar ichi rejimi
const CITY_RADIUS_M = 40000 // xarita markazi shahardan shuncha uzoq bo'lsa, shahar ichi emas
const NEAR_ME_M = 50000     // foydalanuvchi joydan shuncha yaqin bo'lsa, yo'l undan boshlanadi
const NONE = []

function MapPage() {
  const navigate = useNavigate()
  const { cities, byCode } = useCities()
  const { setSearchResults, selectVariant } = useSearchStore()

  const [ends, setEnds] = useState({ from: null, to: null })
  const [pick, setPick] = useState('from') // xaritadagi keyingi bosish qaysi maydonni to'ldiradi
  const [departure, setDeparture] = useState(day(14))
  const [back, setBack] = useState(day(21))
  const [results, setResults] = useState(null)
  const [active, setActive] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Shahar ichi rejimi: shaharga yaqinlashtirilganda joylar va ko'chalar bo'ylab yo'l
  const [map, setMap] = useState(null)
  const [view, setView] = useState(null)
  const [place, setPlace] = useState(null)
  const [profile, setProfile] = useState('foot')
  const [me, setMe] = useState(null)
  const [geoDenied, setGeoDenied] = useState(false)

  useEffect(() => {
    if (!map) return
    const update = () => setView({ zoom: map.getZoom(), center: map.getCenter() })
    map.on('moveend', update)
    return () => map.off('moveend', update)
  }, [map])

  const nearCity = useMemo(() => {
    if (!view || view.zoom < CITY_ZOOM) return null
    return cities.reduce((best, c) => {
      const d = map.distance(view.center, position(c))
      return d < best.d ? { c, d } : best
    }, { c: null, d: CITY_RADIUS_M }).c
  }, [map, view, cities])

  // Shahar almashganda tanlov tozalanadi; qidiruvdan tanlangan joy o'z shahriga yetib kelganda saqlanadi
  useEffect(() => {
    setPlace((p) => (p && nearCity && map.distance([p.lat, p.lon], position(nearCity)) < CITY_RADIUS_M ? p : null))
  }, [nearCity?.id])

  // Ko'cha/manzil qidiruvi - faqat tugma bosilganda (asked), yozish paytida emas
  const [query, setQuery] = useState('')
  const [asked, setAsked] = useState(null)
  const found = useQuery({
    queryKey: ['address', asked],
    queryFn: () => searchAddress(asked.q, asked.viewbox),
    enabled: !!asked,
    staleTime: Infinity,
    retry: false,
  })
  const submitSearch = (e) => {
    e.preventDefault()
    if (query.trim()) setAsked({ q: query.trim(), viewbox: map.getBounds().toBBoxString() })
  }
  const goTo = (result) => {
    setPlace(result)
    setAsked(null)
    map.flyTo([result.lat, result.lon], Math.max(map.getZoom(), 15))
  }

  const places = useQuery({
    queryKey: ['places', nearCity?.id],
    queryFn: () => fetchPlaces(nearCity),
    enabled: !!nearCity,
    staleTime: Infinity,
  })

  const target = place && [place.lat, place.lon]
  const fromMe = !!(me && target && map.distance(me, target) < NEAR_ME_M)
  const start = fromMe ? me : nearCity && position(nearCity)
  const route = useQuery({
    queryKey: ['route', start, target, profile],
    queryFn: () => fetchRoute(start, target, profile),
    enabled: !!(start && target),
    staleTime: Infinity,
    retry: false,
  })

  const locate = () => navigator.geolocation.getCurrentPosition(
    (p) => { setMe([p.coords.latitude, p.coords.longitude]); setGeoDenied(false) },
    () => setGeoDenied(true)
  )

  const navUrl = start && target &&
    `https://yandex.com/maps/?rtext=${start.join(',')}~${target.join(',')}&rtt=${profile === 'foot' ? 'pd' : 'auto'}`

  const choose = (field, city) => {
    // Autocomplete koordinatasiz qaytaradi - to'liq shaharni ro'yxatdan olamiz
    setEnds((e) => ({ ...e, [field]: city && (cities.find((c) => c.id === city.id) || city) }))
    setResults(null)
    setActive(null)
    setError(null)
    if (city && field === 'from') setPick('to')
  }

  const search = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await searchApi.createSearch({
        origin: ends.from.iata_code || String(ends.from.id),
        destination: ends.to.iata_code || String(ends.to.id),
        departure_date: departure,
        return_date: back,
      })
      setResults(data)
      setSearchResults(data) // tafsilot sahifasi shu yerdan o'qiydi
      setActive(data.recommended || data.variants[0] || null)
    } catch (e) {
      const d = e.response?.data
      setError(
        (d && typeof d === 'object' && (d.error || Object.values(d).flat()[0])) ||
        "Yo'l topilmadi. Boshqa shahar yoki sanani sinab ko'ring."
      )
    } finally {
      setLoading(false)
    }
  }

  const viewDetails = (variant) => {
    selectVariant(variant)
    navigate(`/search/${results.search.id}/variant/${variant.id}`)
  }

  // Tanlangan variantning segmentlari - transport turi bo'yicha rangli chiziqlar
  const lines = useMemo(
    () => (active?.details?.segments || [])
      .filter((s) => byCode[s.from] && byCode[s.to])
      .map((s) => ({ mode: s.mode, points: [position(byCode[s.from]), position(byCode[s.to])] })),
    [active, byCode]
  )
  const bounds = useMemo(() => {
    if (lines.length) return lines.flatMap((l) => l.points)
    return ends.from && ends.to ? [position(ends.from), position(ends.to)] : []
  }, [lines, ends])

  const ready = ends.from && ends.to && ends.from.id !== ends.to.id && departure < back

  return (
    // isolate: Leaflet qatlamlari (z-index 400+) sticky header ustiga chiqmasin
    <div className="relative isolate h-[calc(100vh-4rem)]">
      <MapContainer ref={setMap} center={[41.3, 64.5]} zoom={5} zoomControl={false} className="h-full w-full">
        <TileLayer {...TILES} />
        <ZoomControl position="topright" />

        {lines.map((l, i) => (
          <Polyline key={`${active.id}-${i}`} positions={l.points} weight={4}
            color={MODES[l.mode]?.color || '#6b7280'} dashArray={MODES[l.mode]?.dashArray} />
        ))}

        {cities.map((c) => {
          const end = c.id === ends.from?.id ? 'from' : c.id === ends.to?.id ? 'to' : null
          const color = end === 'from' ? '#22c55e' : end === 'to' ? '#ef4444' : c.iata_code ? '#2563eb' : '#d97706'
          return (
            <CircleMarker key={c.id} center={position(c)} radius={end ? 9 : 5}
              pathOptions={{ color: '#fff', weight: 2, fillColor: color, fillOpacity: 1 }}
              eventHandlers={{ click: () => choose(pick, c) }}>
              <Tooltip>{c.country_flag} {c.name_uz} {c.iata_code ? `(${c.iata_code})` : '· aeroportsiz'}</Tooltip>
            </CircleMarker>
          )
        })}

        {/* Shahar ichi: joylar, tanlangan joygacha yo'l, foydalanuvchi joylashuvi */}
        {nearCity && places.data?.map((p) => (
          <CircleMarker key={p.id} center={[p.lat, p.lon]} radius={7}
            pathOptions={{ color: '#fff', weight: 2, fillColor: '#7c3aed', fillOpacity: 1 }}
            eventHandlers={{ click: () => setPlace(p) }}>
            <Tooltip>{p.title}</Tooltip>
          </CircleMarker>
        ))}
        {place && (
          <CircleMarker center={[place.lat, place.lon]} radius={11}
            pathOptions={{ color: '#fff', weight: 3, fillColor: '#db2777', fillOpacity: 1 }}>
            <Tooltip>{place.title}</Tooltip>
          </CircleMarker>
        )}
        {route.data && <Polyline positions={route.data.points} weight={5} color="#7c3aed" />}
        {route.isError && start && target && (
          <Polyline positions={[start, target]} weight={3} color="#7c3aed" dashArray="6 8" />
        )}
        {me && (
          <CircleMarker center={me} radius={8}
            pathOptions={{ color: '#fff', weight: 3, fillColor: '#0ea5e9', fillOpacity: 1 }}>
            <Tooltip>Siz shu yerdasiz</Tooltip>
          </CircleMarker>
        )}

        <FitBounds points={bounds} />
        <FitBounds points={route.data?.points || NONE} />
      </MapContainer>

      {/* Panel: telefonda pastda, kompyuterda chapda */}
      <div className="absolute z-[1000] left-4 right-4 bottom-20 max-h-[55%] sm:right-auto sm:bottom-auto sm:top-4 sm:w-96 sm:max-h-[calc(100%-2rem)] overflow-y-auto bg-white rounded-2xl shadow-2xl p-4 space-y-3">
        <form onSubmit={submitSearch} role="search" className="flex gap-2">
          <input type="search" className="input flex-1" value={query} onChange={(e) => setQuery(e.target.value)}
            placeholder="Ko'cha, manzil yoki joy nomi" aria-label="Ko'cha, manzil yoki joy qidirish" />
          <button type="submit" className="btn btn-secondary px-3" aria-label="Qidirish">🔍</button>
        </form>
        {found.isFetching && <p className="text-sm text-gray-500">Qidirilmoqda...</p>}
        {found.isError && <p className="text-sm text-red-600" role="alert">Qidiruv ishlamadi. Birozdan keyin urinib ko'ring.</p>}
        {asked && found.data?.length === 0 && (
          <p className="text-sm text-gray-600">"{asked.q}" topilmadi. Boshqacha yozib ko'ring (masalan ruscha).</p>
        )}
        {asked && found.data?.map((r) => (
          <button key={r.id} type="button" onClick={() => goTo(r)}
            className="w-full p-2 rounded-xl text-left hover:bg-gray-50">
            <span className="block font-medium text-gray-900 truncate">📍 {r.title}</span>
            <span className="block text-xs text-gray-500 truncate">{r.description}</span>
          </button>
        ))}

        {nearCity ? (
          <CityGuide city={nearCity} places={places} place={place} onSelect={setPlace} route={route}
            profile={profile} onProfile={setProfile} fromMe={fromMe} geoDenied={geoDenied} onLocate={locate}
            navUrl={navUrl} onBack={() => map.setZoom(6)} />
        ) : (<>
        <h1 className="text-lg font-bold text-gray-900">Xaritadan yo'l tanlang</h1>

        {FIELDS.map(([field, label, dot]) => (
          <div key={field} onFocus={() => setPick(field)}
            className={clsx('flex items-center gap-2 rounded-xl p-1', pick === field && 'ring-2 ring-primary-400')}>
            <span className={clsx('w-3 h-3 rounded-full flex-shrink-0', dot)} />
            <div className="flex-1">
              <CityAutocomplete value={ends[field]} onChange={(city) => choose(field, city)} placeholder={label} />
            </div>
            {ends[field]?.latitude && (
              <button type="button" title={`${ends[field].name_uz} ichini ko'rish`}
                aria-label={`${ends[field].name_uz} ichini ko'rish`}
                onClick={() => map.flyTo(position(ends[field]), 13)}
                className="px-2 py-2 rounded-lg text-lg hover:bg-gray-100">🏙</button>
            )}
          </div>
        ))}
        <p className="text-xs text-gray-500">
          Shahar nomini yozing yoki xaritadagi nuqtani bosing. Sariq nuqtalar — aeroportsiz shaharlar.
          🏙 — shahar ichidagi joylar va ko'chalar.
        </p>

        <div className="grid grid-cols-2 gap-2">
          <label className="text-xs text-gray-600">Ketish
            <input type="date" className="input mt-1" value={departure} min={day(0)}
              onChange={(e) => setDeparture(e.target.value)} />
          </label>
          <label className="text-xs text-gray-600">Qaytish
            <input type="date" className="input mt-1" value={back} min={departure}
              onChange={(e) => setBack(e.target.value)} />
          </label>
        </div>

        <button type="button" className="btn btn-primary w-full disabled:opacity-50"
          disabled={!ready || loading} onClick={search}>
          {loading ? 'Qidirilmoqda...' : "Yo'l topish"}
        </button>

        {error && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg" role="alert">{error}</div>}

        {results && (
          <>
            <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs">
              {Object.values(MODES).map((m) => (
                <span key={m.label} style={{ color: m.color }} className="font-medium">{m.label}</span>
              ))}
            </div>
            {results.variants.length === 0 && (
              <p className="text-sm text-gray-600">Bu sanalar uchun yo'l topilmadi.</p>
            )}
            <div className="space-y-3">
              {results.variants.map((v, i) => (
                <RouteVariantCard key={v.id} variant={v} index={i} onSelect={setActive}
                  isSelected={active?.id === v.id} onViewDetails={viewDetails} />
              ))}
            </div>
          </>
        )}
        </>)}
      </div>
    </div>
  )
}

export default MapPage
