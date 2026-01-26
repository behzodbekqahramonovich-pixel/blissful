import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import useAuthStore from '../store/authStore'
import { agencyApi } from '../services/api'

function AgencyDashboard() {
  const navigate = useNavigate()
  const { user, isAuthenticated, accessToken } = useAuthStore()
  const [clients, setClients] = useState([])
  const [bookings, setBookings] = useState([])
  const [stats, setStats] = useState({
    totalClients: 0,
    totalBookings: 0,
    confirmedBookings: 0,
    totalRevenue: 0,
  })
  const [showAddClient, setShowAddClient] = useState(false)
  const [loading, setLoading] = useState(true)
  const [newClient, setNewClient] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    email: '',
    passport_number: '',
  })

  // Foydalanuvchi agentlik emasmi tekshirish
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/')
      return
    }
    if (user?.role !== 'agency') {
      navigate('/')
    }
  }, [isAuthenticated, user, navigate])

  // API dan ma'lumotlarni olish
  useEffect(() => {
    const fetchData = async () => {
      if (!accessToken || user?.role !== 'agency') return

      setLoading(true)
      try {
        const [clientsData, bookingsData, statsData] = await Promise.all([
          agencyApi.getClients(accessToken),
          agencyApi.getBookings(accessToken),
          agencyApi.getStats(accessToken),
        ])
        setClients(clientsData)
        setBookings(bookingsData)
        setStats({
          totalClients: statsData.total_clients,
          totalBookings: statsData.total_bookings,
          confirmedBookings: statsData.confirmed_bookings,
          totalRevenue: statsData.total_revenue,
        })
      } catch (error) {
        console.error('Ma\'lumotlarni yuklashda xatolik:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [accessToken, user])

  const handleAddClient = async () => {
    if (!newClient.first_name || !newClient.last_name || !newClient.phone) {
      alert('Ism, familiya va telefon raqamini kiriting')
      return
    }

    try {
      const addedClient = await agencyApi.addClient(accessToken, newClient)
      setClients([addedClient, ...clients])
      setStats(prev => ({ ...prev, totalClients: prev.totalClients + 1 }))
      setNewClient({ first_name: '', last_name: '', phone: '', email: '', passport_number: '' })
      setShowAddClient(false)
    } catch (error) {
      console.error('Mijoz qo\'shishda xatolik:', error)
      alert('Mijoz qo\'shishda xatolik yuz berdi')
    }
  }

  const handleDeleteClient = async (clientId) => {
    if (!window.confirm('Haqiqatan ham bu mijozni o\'chirmoqchimisiz?')) return

    try {
      await agencyApi.deleteClient(accessToken, clientId)
      setClients(clients.filter(c => c.id !== clientId))
      setStats(prev => ({ ...prev, totalClients: prev.totalClients - 1 }))
    } catch (error) {
      console.error('Mijozni o\'chirishda xatolik:', error)
      alert('Mijozni o\'chirishda xatolik yuz berdi')
    }
  }

  if (!user || user.role !== 'agency') {
    return null
  }

  if (loading) {
    return (
      <div className="min-h-screen relative">
        <div className="fixed inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900" />
        </div>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-white/60">Yuklanmoqda...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen relative">
      {/* Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900" />
        <div className="absolute top-20 left-20 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl animate-orb" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-orb-delay-1" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-4xl">🏢</span>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white">
                {user.agency_name || 'Agentlik'} Dashboard
              </h1>
              <p className="text-white/60 text-sm">
                Xush kelibsiz, {user.first_name}!
              </p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20">
            <div className="text-3xl mb-2">👥</div>
            <div className="text-2xl font-bold text-white">{stats.totalClients}</div>
            <div className="text-white/60 text-sm">Jami mijozlar</div>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20">
            <div className="text-3xl mb-2">📋</div>
            <div className="text-2xl font-bold text-white">{stats.totalBookings}</div>
            <div className="text-white/60 text-sm">Jami bronlar</div>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20">
            <div className="text-3xl mb-2">✅</div>
            <div className="text-2xl font-bold text-green-400">{stats.confirmedBookings}</div>
            <div className="text-white/60 text-sm">Tasdiqlangan</div>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20">
            <div className="text-3xl mb-2">💰</div>
            <div className="text-2xl font-bold text-yellow-400">${stats.totalRevenue}</div>
            <div className="text-white/60 text-sm">Jami daromad</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Clients List */}
          <div className="lg:col-span-2">
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <span>👥</span> Mijozlar
                </h2>
                <button
                  onClick={() => setShowAddClient(true)}
                  className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors"
                >
                  + Yangi mijoz
                </button>
              </div>

              {/* Add Client Modal */}
              {showAddClient && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                  <div className="bg-white rounded-2xl p-6 w-full max-w-md">
                    <h3 className="text-lg font-semibold mb-4">Yangi mijoz qo'shish</h3>
                    <div className="space-y-3">
                      <input
                        type="text"
                        placeholder="Ism *"
                        value={newClient.first_name}
                        onChange={(e) => setNewClient({ ...newClient, first_name: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg"
                      />
                      <input
                        type="text"
                        placeholder="Familiya *"
                        value={newClient.last_name}
                        onChange={(e) => setNewClient({ ...newClient, last_name: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg"
                      />
                      <input
                        type="tel"
                        placeholder="Telefon *"
                        value={newClient.phone}
                        onChange={(e) => setNewClient({ ...newClient, phone: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg"
                      />
                      <input
                        type="email"
                        placeholder="Email"
                        value={newClient.email}
                        onChange={(e) => setNewClient({ ...newClient, email: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg"
                      />
                      <input
                        type="text"
                        placeholder="Pasport raqami"
                        value={newClient.passport_number}
                        onChange={(e) => setNewClient({ ...newClient, passport_number: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg"
                      />
                    </div>
                    <div className="flex gap-3 mt-4">
                      <button
                        onClick={() => setShowAddClient(false)}
                        className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
                      >
                        Bekor
                      </button>
                      <button
                        onClick={handleAddClient}
                        className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                      >
                        Qo'shish
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Clients Table */}
              <div className="overflow-x-auto">
                {clients.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">👥</div>
                    <h3 className="text-lg font-medium text-gray-800 mb-2">Hali mijozlar yo'q</h3>
                    <p className="text-gray-500 mb-4">Yangi mijoz qo'shish uchun tugmani bosing</p>
                    <button
                      onClick={() => setShowAddClient(true)}
                      className="bg-purple-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-purple-700 transition-colors"
                    >
                      + Birinchi mijozni qo'shing
                    </button>
                  </div>
                ) : (
                  <table className="w-full">
                    <thead>
                      <tr className="text-left text-sm text-gray-500 border-b">
                        <th className="pb-3">Mijoz</th>
                        <th className="pb-3">Telefon</th>
                        <th className="pb-3">Amallar</th>
                      </tr>
                    </thead>
                    <tbody>
                      {clients.map((client) => (
                        <tr key={client.id} className="border-b last:border-0 hover:bg-gray-50">
                          <td className="py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-medium">
                                {client.first_name?.[0]}{client.last_name?.[0]}
                              </div>
                              <div>
                                <div className="font-medium">{client.first_name} {client.last_name}</div>
                                <div className="text-sm text-gray-500">{client.email || '-'}</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 text-gray-600">{client.phone}</td>
                          <td className="py-3">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => navigate(`/?client=${client.id}`)}
                                className="text-purple-600 hover:text-purple-800 text-sm font-medium"
                              >
                                Bron qilish
                              </button>
                              <button
                                onClick={() => handleDeleteClient(client.id)}
                                className="text-red-500 hover:text-red-700 text-sm"
                                title="O'chirish"
                              >
                                🗑️
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>

          {/* Recent Bookings */}
          <div>
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl p-6">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2 mb-4">
                <span>📋</span> So'nggi bronlar
              </h2>
              {bookings.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-2">📋</div>
                  <p className="text-gray-500 text-sm">Hali bronlar yo'q</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {bookings.slice(0, 5).map((booking) => (
                    <div key={booking.id} className="p-3 bg-gray-50 rounded-xl">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-800">{booking.client_name || 'Mijoz'}</span>
                        <span className={`text-xs px-2 py-1 rounded ${
                          booking.status === 'confirmed'
                            ? 'bg-green-100 text-green-700'
                            : booking.status === 'completed'
                            ? 'bg-blue-100 text-blue-700'
                            : booking.status === 'cancelled'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {booking.status_display || booking.status}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">
                          ✈️ {booking.origin} → {booking.destination} • {booking.departure_date}
                        </span>
                        <span className="font-semibold text-purple-600">${booking.total_cost}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {bookings.length > 5 && (
                <button className="w-full mt-4 text-center text-purple-600 hover:text-purple-800 text-sm font-medium">
                  Barcha bronlar ({bookings.length}) →
                </button>
              )}
            </div>

            {/* Quick Actions */}
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl p-6 mt-6">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2 mb-4">
                <span>⚡</span> Tezkor amallar
              </h2>
              <div className="space-y-2">
                <button
                  onClick={() => navigate('/')}
                  className="w-full p-3 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-xl font-medium hover:from-purple-600 hover:to-indigo-700 transition-all flex items-center justify-center gap-2"
                >
                  <span>✈️</span> Yangi qidiruv
                </button>
                <button
                  onClick={() => setShowAddClient(true)}
                  className="w-full p-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-all flex items-center justify-center gap-2"
                >
                  <span>👤</span> Mijoz qo'shish
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AgencyDashboard
