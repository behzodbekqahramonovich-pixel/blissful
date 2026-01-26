import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import useSearchStore from '../store/searchStore'
import RouteVariantCard from '../components/RouteVariantCard'
import TravelNews from '../components/TravelNews'

function SearchResultsPage() {
  const navigate = useNavigate()
  const { searchResults, selectVariant, selectedVariant, saveTrip } = useSearchStore()
  const [activeVariant, setActiveVariant] = useState(null)

  useEffect(() => {
    if (!searchResults) {
      navigate('/')
      return
    }
    // Tavsiya qilingan variantni tanlash
    if (searchResults.recommended) {
      setActiveVariant(searchResults.recommended)
    } else if (searchResults.variants?.length > 0) {
      setActiveVariant(searchResults.variants[0])
    }
  }, [searchResults, navigate])

  if (!searchResults) {
    return null
  }

  const { search, variants } = searchResults

  const handleSelectVariant = (variant) => {
    setActiveVariant(variant)
    selectVariant(variant)
  }

  const handleViewDetails = (variant) => {
    selectVariant(variant)
    navigate(`/search/${search.id}/variant/${variant.id}`)
  }

  const handleSaveTrip = () => {
    if (activeVariant) {
      saveTrip({
        id: Date.now(),
        search,
        variant: activeVariant,
      })
      alert('Sayohat saqlandi!')
    }
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated Gradient Background */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        {/* Background image - Dubai Creek Harbour */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1512632578888-169bbbc64f33?w=1920&q=80')`,
          }}
        />
        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/70 via-indigo-900/60 to-purple-900/70" />

        {/* Animated wave layers */}
        <div className="absolute -top-1/2 -left-1/4 w-[200%] h-[200%] wave-bg-1">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-200/30 via-transparent to-indigo-200/30 rounded-full blur-3xl" />
        </div>
        <div className="absolute -bottom-1/2 -right-1/4 w-[200%] h-[200%] wave-bg-2">
          <div className="absolute inset-0 bg-gradient-to-l from-purple-200/30 via-transparent to-pink-200/30 rounded-full blur-3xl" />
        </div>
        <div className="absolute top-1/4 left-1/4 w-[150%] h-[150%] wave-bg-3">
          <div className="absolute inset-0 bg-gradient-to-tr from-cyan-200/20 via-transparent to-blue-200/20 rounded-full blur-3xl" />
        </div>

        {/* Floating orbs */}
        <div className="absolute top-20 left-20 w-64 h-64 bg-gradient-to-br from-blue-400/20 to-indigo-500/20 rounded-full blur-3xl animate-orb" />
        <div className="absolute bottom-40 right-20 w-80 h-80 bg-gradient-to-br from-purple-400/20 to-pink-500/20 rounded-full blur-3xl animate-orb-delay-1" />
        <div className="absolute top-1/2 left-1/3 w-48 h-48 bg-gradient-to-br from-cyan-400/15 to-blue-500/15 rounded-full blur-3xl animate-orb-delay-2" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Sarlavha */}
      <div className="mb-8">
        <button
          onClick={() => navigate('/')}
          className="text-white/80 hover:text-white mb-4 flex items-center"
        >
          ← Yangi qidiruv
        </button>
        <h1 className="text-3xl font-bold text-white drop-shadow-lg">
          {search.origin_details?.name_uz} → {search.destination_details?.name_uz}
        </h1>
        <p className="text-white/80 mt-2">
          {search.departure_date} - {search.return_date} | {search.travelers} kishi | {search.nights} kecha
        </p>

        {/* Aviasales.uz havola */}
        <div className="mt-4 flex items-center space-x-4">
          <a
            href={`https://www.aviasales.uz/search/${search.origin_details?.iata_code}${search.departure_date?.replace(/-/g, '').slice(4, 8)}${search.destination_details?.iata_code}1`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center text-sm text-cyan-300 hover:text-cyan-100"
          >
            Aviasales.uz da ko'rish →
          </a>
          <span className="text-xs text-white/50">
            Narxlar Aviasales.uz dan olinadi
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Variantlar ro'yxati */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-xl font-semibold text-white drop-shadow">
            {variants.length} ta variant topildi
          </h2>

          <div className="space-y-4">
            {variants.map((variant, index) => (
              <RouteVariantCard
                key={variant.id}
                variant={variant}
                index={index}
                onSelect={handleSelectVariant}
                isSelected={activeVariant?.id === variant.id}
                onViewDetails={handleViewDetails}
              />
            ))}
          </div>
        </div>

        {/* Sayohat yangiliklari */}
        <div className="lg:col-span-1">
          <div className="sticky top-8">
            <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Sayohat yangiliklari</h3>
              <TravelNews />
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  )
}

export default SearchResultsPage
