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
      <section className="relative min-h-[500px] sm:min-h-[600px] text-white py-12 sm:py-20 overflow-hidden">
        {/* Animated background image */}
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=1920&q=80"
            alt="Travel background"
            className="w-full h-full object-cover animate-slow-zoom"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-primary-900/80 via-primary-800/70 to-primary-600/60"></div>
        </div>

        {/* Animated floating elements - hidden on mobile */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none hidden sm:block">
          <div className="absolute top-20 left-10 text-4xl md:text-6xl animate-float-slow opacity-30">✈️</div>
          <div className="absolute top-40 right-20 text-3xl md:text-5xl animate-float-medium opacity-25">🌍</div>
          <div className="absolute bottom-32 left-1/4 text-3xl md:text-4xl animate-float-fast opacity-20">🏝️</div>
          <div className="absolute top-1/3 right-1/4 text-3xl md:text-5xl animate-float-slow opacity-25">🗺️</div>
          <div className="absolute bottom-20 right-10 text-3xl md:text-4xl animate-float-medium opacity-20">🧳</div>
          <div className="absolute top-1/2 left-20 text-2xl md:text-3xl animate-float-fast opacity-15">🌴</div>
        </div>

        {/* Animated particles - fewer on mobile */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none hidden sm:block">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-white/20 rounded-full animate-particle"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${3 + Math.random() * 4}s`
              }}
            />
          ))}
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 drop-shadow-lg animate-fade-in-up">
              Aqlli Sayohat Optimallashtirish
            </h1>
            <p className="text-xl md:text-2xl text-white/90 max-w-2xl mx-auto drop-shadow animate-fade-in-up animation-delay-200">
              Eng arzon va qulay sayohat yo'nalishlarini toping.
              To'g'ridan-to'g'ri va tranzit variantlarni taqqoslang.
            </p>
          </div>

          {/* Qidiruv formasi */}
          <div className="bg-white/95 backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-2xl p-4 sm:p-6 md:p-8 max-w-4xl mx-auto animate-fade-in-up animation-delay-400">
            <SearchForm />
          </div>
        </div>
      </section>

      {/* Afzalliklar */}
      <section className="py-16 relative overflow-hidden">
        {/* Animated gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 animate-gradient-shift"></div>

        {/* Floating shapes */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-10 left-10 w-32 h-32 bg-primary-200/30 rounded-full blur-2xl animate-blob"></div>
          <div className="absolute top-20 right-20 w-40 h-40 bg-purple-200/30 rounded-full blur-2xl animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-10 left-1/3 w-36 h-36 bg-pink-200/30 rounded-full blur-2xl animate-blob animation-delay-4000"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">
            Nima uchun Blissful Tour?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="card text-center hover:scale-105 transition-transform duration-300 bg-white/80 backdrop-blur-sm">
              <div className="text-4xl mb-4 icon-3d-lg icon-3d-float">💰</div>
              <h3 className="text-xl font-semibold mb-2">Tejamkor</h3>
              <p className="text-gray-600">
                Tranzit variantlar orqali 15-30% gacha tejang
              </p>
            </div>
            <div className="card text-center hover:scale-105 transition-transform duration-300 bg-white/80 backdrop-blur-sm">
              <div className="text-4xl mb-4 icon-3d-lg icon-3d-float">🌍</div>
              <h3 className="text-xl font-semibold mb-2">Ko'p mamlakat</h3>
              <p className="text-gray-600">
                Bitta sayohatda bir nechta mamlakatni ziyorat qiling
              </p>
            </div>
            <div className="card text-center hover:scale-105 transition-transform duration-300 bg-white/80 backdrop-blur-sm">
              <div className="text-4xl mb-4 icon-3d-lg icon-3d-float">🤖</div>
              <h3 className="text-xl font-semibold mb-2">Aqlli algoritm</h3>
              <p className="text-gray-600">
                AI yordamida eng optimal yo'nalishlarni topamiz
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Mashhur yo'nalishlar */}
      <section className="py-16 relative overflow-hidden">
        {/* Background image with overlay */}
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1920&q=80"
            alt="Beach background"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-white/90 backdrop-blur-sm"></div>
        </div>

        {/* Animated waves */}
        <div className="absolute bottom-0 left-0 right-0 h-20 overflow-hidden pointer-events-none">
          <div className="absolute bottom-0 left-0 right-0 h-20 bg-wave animate-wave opacity-10"></div>
        </div>

        {/* Floating travel icons */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-10 right-10 text-4xl animate-float-slow opacity-20">🏖️</div>
          <div className="absolute bottom-20 left-10 text-3xl animate-float-medium opacity-15">🌊</div>
          <div className="absolute top-1/2 right-1/4 text-3xl animate-float-fast opacity-15">⛱️</div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">
            Mashhur yo'nalishlar
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {popularRoutes.map((route, index) => (
              <div
                key={index}
                className="card overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer group hover:-translate-y-2"
              >
                <div className="relative h-40 -mx-6 -mt-6 mb-4 overflow-hidden">
                  <img
                    src={route.image}
                    alt={route.destination_name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
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
      <section className="py-16 relative overflow-hidden">
        {/* Animated gradient background */}
        <div className="absolute inset-0 bg-gradient-to-r from-primary-100 via-purple-100 to-pink-100 animate-gradient-x"></div>

        {/* Animated path/road */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <svg className="absolute w-full h-full opacity-10" viewBox="0 0 1200 400" preserveAspectRatio="none">
            <path
              d="M0,200 Q300,100 600,200 T1200,200"
              fill="none"
              stroke="currentColor"
              strokeWidth="4"
              className="text-primary-600 animate-dash"
            />
          </svg>
        </div>

        {/* Floating elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-10 left-20 text-3xl animate-float-medium opacity-20">📍</div>
          <div className="absolute bottom-10 right-20 text-3xl animate-float-slow opacity-20">🎯</div>
          <div className="absolute top-1/2 left-10 text-2xl animate-float-fast opacity-15">✨</div>
          <div className="absolute top-20 right-1/3 text-2xl animate-float-medium opacity-15">🚀</div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">
            Qanday ishlaydi?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center group">
              <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-700 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300 group-hover:shadow-xl">
                1
              </div>
              <h3 className="font-semibold mb-2">Yo'nalishni tanlang</h3>
              <p className="text-gray-600 text-sm">
                Qayerdan va qayerga sayohat qilmoqchisiz
              </p>
            </div>
            <div className="text-center group">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-700 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300 group-hover:shadow-xl">
                2
              </div>
              <h3 className="font-semibold mb-2">Sanalarni belgilang</h3>
              <p className="text-gray-600 text-sm">
                Ketish va qaytish sanalarini tanlang
              </p>
            </div>
            <div className="text-center group">
              <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-pink-700 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300 group-hover:shadow-xl">
                3
              </div>
              <h3 className="font-semibold mb-2">Variantlarni ko'ring</h3>
              <p className="text-gray-600 text-sm">
                Turli xil yo'nalish variantlarini taqqoslang
              </p>
            </div>
            <div className="text-center group">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-700 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300 group-hover:shadow-xl">
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
