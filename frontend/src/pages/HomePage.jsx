import { useQuery } from '@tanstack/react-query'
import { searchApi } from '../services/api'
import SearchForm from '../components/SearchForm'

function HomePage() {
  // Mashhur yo'nalishlar
  const { data: popularRoutes = [] } = useQuery({
    queryKey: ['popularRoutes'],
    queryFn: searchApi.getPopular,
  })

  return (
    <div>
      {/* Hero section */}
      <section className="relative bg-gradient-to-br from-primary-600 to-primary-800 text-white py-20">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Aqlli Sayohat Optimallashtirish
            </h1>
            <p className="text-xl text-primary-100 max-w-2xl mx-auto">
              Eng arzon va qulay sayohat yo'nalishlarini toping.
              To'g'ridan-to'g'ri va tranzit variantlarni taqqoslang.
            </p>
          </div>

          {/* Qidiruv formasi */}
          <div className="bg-white rounded-2xl shadow-2xl p-6 md:p-8 max-w-4xl mx-auto">
            <SearchForm />
          </div>
        </div>
      </section>

      {/* Afzalliklar */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">
            Nima uchun Blissful Tour?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="card text-center">
              <div className="text-4xl mb-4">💰</div>
              <h3 className="text-xl font-semibold mb-2">Tejamkor</h3>
              <p className="text-gray-600">
                Tranzit variantlar orqali 15-30% gacha tejang
              </p>
            </div>
            <div className="card text-center">
              <div className="text-4xl mb-4">🌍</div>
              <h3 className="text-xl font-semibold mb-2">Ko'p mamlakat</h3>
              <p className="text-gray-600">
                Bitta sayohatda bir nechta mamlakatni ziyorat qiling
              </p>
            </div>
            <div className="card text-center">
              <div className="text-4xl mb-4">🤖</div>
              <h3 className="text-xl font-semibold mb-2">Aqlli algoritm</h3>
              <p className="text-gray-600">
                AI yordamida eng optimal yo'nalishlarni topamiz
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Mashhur yo'nalishlar */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">
            Mashhur yo'nalishlar
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {popularRoutes.map((route, index) => (
              <div
                key={index}
                className="card overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group"
              >
                <div className="relative h-40 -mx-6 -mt-6 mb-4 overflow-hidden">
                  <img
                    src={route.image}
                    alt={route.destination_name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                  <div className="absolute bottom-3 left-4 text-white">
                    <h3 className="font-bold text-lg">{route.destination_name}</h3>
                    <p className="text-sm text-gray-200">
                      {route.origin_name} dan
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">dan boshlab</span>
                  <span className="text-2xl font-bold text-primary-600">
                    ${route.avg_price}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Qanday ishlaydi */}
      <section className="py-16 bg-primary-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">
            Qanday ishlaydi?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                1
              </div>
              <h3 className="font-semibold mb-2">Yo'nalishni tanlang</h3>
              <p className="text-gray-600 text-sm">
                Qayerdan va qayerga sayohat qilmoqchisiz
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                2
              </div>
              <h3 className="font-semibold mb-2">Sanalarni belgilang</h3>
              <p className="text-gray-600 text-sm">
                Ketish va qaytish sanalarini tanlang
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                3
              </div>
              <h3 className="font-semibold mb-2">Variantlarni ko'ring</h3>
              <p className="text-gray-600 text-sm">
                Turli xil yo'nalish variantlarini taqqoslang
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                4
              </div>
              <h3 className="font-semibold mb-2">Tanlang va band qiling</h3>
              <p className="text-gray-600 text-sm">
                Eng yaxshi variantni tanlab, sayohatga tayyorlaning
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default HomePage
