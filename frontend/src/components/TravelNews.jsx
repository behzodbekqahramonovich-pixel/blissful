import { useState, useEffect, useRef } from 'react'
import { newsApi } from '../services/api'

const REFRESH_INTERVAL = 15000 // 15 sekund

function TravelNews() {
  const [news, setNews] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState(null)
  const [lastUpdated, setLastUpdated] = useState(null)
  const intervalRef = useRef(null)

  const fetchNews = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }
      const response = await newsApi.getNews()
      setNews(response.news || [])
      setLastUpdated(new Date())
      setError(null)
    } catch (err) {
      console.error('Yangiliklar yuklanmadi:', err)
      if (!isRefresh) {
        setError('Yangiliklar yuklanmadi')
      }
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchNews()

    // Auto-refresh har 30 sekundda
    intervalRef.current = setInterval(() => {
      fetchNews(true)
    }, REFRESH_INTERVAL)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

  const getCategoryColor = (category) => {
    const colors = {
      'Yangilik': 'bg-blue-600',
      'Viza': 'bg-green-600',
      'Transport': 'bg-purple-600',
      'Reyting': 'bg-amber-500',
      'Aksiya': 'bg-red-600'
    }
    return colors[category] || 'bg-gray-600'
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse rounded-xl bg-gray-200 h-32" />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>{error}</p>
      </div>
    )
  }

  const formatTime = (date) => {
    if (!date) return ''
    return date.toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2 scrollbar-thin">
      {/* Refresh indicator */}
      <div className="flex items-center justify-between text-xs text-gray-500 pb-2 border-b border-gray-200">
        <div className="flex items-center gap-2">
          {refreshing ? (
            <>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
              <span>Yangilanmoqda...</span>
            </>
          ) : (
            <>
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              <span>Jonli yangiliklar</span>
            </>
          )}
        </div>
        {lastUpdated && (
          <span>Oxirgi: {formatTime(lastUpdated)}</span>
        )}
      </div>

      {news.map((item) => (
        <a
          key={item.id}
          href={item.url || '#'}
          target={item.url ? '_blank' : '_self'}
          rel="noopener noreferrer"
          className="relative overflow-hidden rounded-xl cursor-pointer group transition-all duration-300 hover:shadow-xl block"
        >
          {/* Background image */}
          <img
            src={item.image}
            alt={item.title}
            className="w-full h-32 object-cover transition-transform duration-300 group-hover:scale-105"
            onError={(e) => {
              e.target.src = 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=400&h=250&fit=crop'
            }}
          />

          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

          {/* Source badge */}
          {item.source && (
            <div className="absolute top-2 right-2">
              <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-black/50 text-white/90">
                {item.source}
              </span>
            </div>
          )}

          {/* Content */}
          <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
            <div className="flex items-center gap-2 mb-2">
              <span className={`text-xs font-semibold px-2 py-1 rounded ${getCategoryColor(item.category)}`}>
                {item.category}
              </span>
              <span className="text-xs text-white/70">{item.date}</span>
            </div>
            <h4 className="text-lg font-bold leading-tight mb-1 group-hover:text-blue-200 transition-colors">
              {item.title}
            </h4>
            <p className="text-sm text-white/80 line-clamp-1">
              {item.description}
            </p>
          </div>
        </a>
      ))}
    </div>
  )
}

export default TravelNews
