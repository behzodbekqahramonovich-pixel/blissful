import clsx from 'clsx'

const PROFILES = [['foot', '🚶 Piyoda'], ['car', '🚕 Mashinada']]

const distance = (m) => (m < 1000 ? `${Math.round(m)} m` : `${(m / 1000).toFixed(1)} km`)

// Shahar ichi paneli: joylar ro'yxati, tanlangan joygacha yo'l va navigator havolasi
function CityGuide({ city, places, place, onSelect, route, profile, onProfile, fromMe, geoDenied, onLocate, navUrl, onBack }) {
  return (
    <>
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-lg font-bold text-gray-900">🏙 {city.name_uz}: nima bor?</h1>
        <button type="button" onClick={onBack} className="text-sm text-primary-600 hover:underline flex-shrink-0">
          ← Shaharlar
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {PROFILES.map(([key, label]) => (
          <button key={key} type="button" onClick={() => onProfile(key)} aria-pressed={profile === key}
            className={clsx('px-3 py-1.5 rounded-full text-sm border',
              profile === key ? 'bg-purple-600 text-white border-purple-600' : 'bg-white text-gray-700 border-gray-300')}>
            {label}
          </button>
        ))}
        <button type="button" onClick={onLocate}
          className="px-3 py-1.5 rounded-full text-sm border border-gray-300 text-gray-700">
          📍 Mening joylashuvim
        </button>
      </div>
      <p className="text-xs text-gray-500">
        Yo'l {fromMe ? 'sizning joylashuvingizdan' : 'shahar markazidan'} hisoblanadi.
        {geoDenied && ' Joylashuvni aniqlab bo\'lmadi.'}
      </p>

      {place && (
        <div className="p-3 rounded-xl bg-purple-50 border border-purple-200 space-y-2">
          <div className="font-semibold text-gray-900">{place.title}</div>
          {place.description && <div className="text-sm text-gray-600">{place.description}</div>}
          <div className="text-sm text-purple-800" role="status">
            {route.isLoading && "Yo'l hisoblanmoqda..."}
            {route.isError && "Ko'chalar bo'ylab yo'l hisoblanmadi — navigatorda oching."}
            {route.data && `${distance(route.data.meters)} · ${route.data.minutes} daqiqa`}
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
            <a href={navUrl} target="_blank" rel="noopener noreferrer" className="font-medium text-primary-600 hover:underline">
              🧭 Navigatorda ochish
            </a>
            {place.url && (
              <a href={place.url} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">
                Vikipediyada o'qish
              </a>
            )}
          </div>
        </div>
      )}

      {places.isLoading && <p className="text-sm text-gray-500">Joylar yuklanmoqda...</p>}
      {places.isError && <p className="text-sm text-red-600" role="alert">Joylar ro'yxatini yuklab bo'lmadi.</p>}
      {places.data?.length === 0 && <p className="text-sm text-gray-600">Bu shahar uchun joylar topilmadi.</p>}

      <div className="space-y-1">
        {places.data?.map((p) => (
          <button key={p.id} type="button" onClick={() => onSelect(p)}
            className={clsx('w-full flex items-center gap-3 p-2 rounded-xl text-left hover:bg-gray-50',
              place?.id === p.id && 'bg-purple-50 ring-1 ring-purple-300')}>
            {p.thumb
              ? <img src={p.thumb} alt="" className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
              : <span className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">📍</span>}
            <span className="min-w-0">
              <span className="block font-medium text-gray-900 truncate">{p.title}</span>
              {p.description && <span className="block text-xs text-gray-500 truncate">{p.description}</span>}
            </span>
          </button>
        ))}
      </div>
    </>
  )
}

export default CityGuide
