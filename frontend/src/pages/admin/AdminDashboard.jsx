import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { hotelsAdminApi } from '../../services/adminApi'
import AdminLayout from '../../components/admin/AdminLayout'

function AdminDashboard() {
  const { data: stats = {}, isLoading } = useQuery({
    queryKey: ['adminStats'],
    queryFn: hotelsAdminApi.getStats,
  })

  const statCards = [
    {
      label: 'Mamlakatlar',
      value: stats.countries_count,
      icon: '🌍',
      color: 'bg-blue-500',
      link: '/admin/countries',
    },
    {
      label: 'Shaharlar',
      value: stats.cities_count,
      icon: '🏙️',
      color: 'bg-green-500',
      link: '/admin/cities',
    },
    {
      label: 'Parvozlar',
      value: stats.flights_count,
      icon: '✈️',
      color: 'bg-purple-500',
      link: '/admin/flights',
    },
    {
      label: 'Mehmonxonalar',
      value: stats.hotels_count,
      icon: '🏨',
      color: 'bg-orange-500',
      link: '/admin/hotels',
    },
  ]

  return (
    <AdminLayout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Admin paneliga xush kelibsiz</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat) => (
          <Link
            key={stat.label}
            to={stat.link}
            className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-4">
              <div
                className={`w-14 h-14 ${stat.color} rounded-xl flex items-center justify-center text-2xl`}
              >
                {stat.icon}
              </div>
              <div>
                <p className="text-gray-500 text-sm">{stat.label}</p>
                <p className="text-3xl font-bold text-gray-900">
                  {isLoading ? (
                    <span className="inline-block w-8 h-8 bg-gray-200 rounded animate-pulse"></span>
                  ) : (
                    stat.value || 0
                  )}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Hub Cities Stat */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Tranzit Hub Shaharlar</h2>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-primary-500 rounded-xl flex items-center justify-center text-2xl">
            🔄
          </div>
          <div>
            <p className="text-gray-500 text-sm">Hub shaharlar soni</p>
            <p className="text-3xl font-bold text-gray-900">
              {isLoading ? (
                <span className="inline-block w-8 h-8 bg-gray-200 rounded animate-pulse"></span>
              ) : (
                stats.hub_cities_count || 0
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Tezkor harakatlar</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            to="/admin/countries"
            className="p-4 border border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors text-center"
          >
            <span className="text-2xl mb-2 block">🌍</span>
            <span className="text-sm font-medium text-gray-700">Mamlakat qo'shish</span>
          </Link>
          <Link
            to="/admin/cities"
            className="p-4 border border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors text-center"
          >
            <span className="text-2xl mb-2 block">🏙️</span>
            <span className="text-sm font-medium text-gray-700">Shahar qo'shish</span>
          </Link>
          <Link
            to="/admin/flights"
            className="p-4 border border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors text-center"
          >
            <span className="text-2xl mb-2 block">✈️</span>
            <span className="text-sm font-medium text-gray-700">Parvoz qo'shish</span>
          </Link>
          <Link
            to="/admin/hotels"
            className="p-4 border border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors text-center"
          >
            <span className="text-2xl mb-2 block">🏨</span>
            <span className="text-sm font-medium text-gray-700">Mehmonxona qo'shish</span>
          </Link>
        </div>
      </div>
    </AdminLayout>
  )
}

export default AdminDashboard
