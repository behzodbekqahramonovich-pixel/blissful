import { useState } from 'react'

function HotelCard({ hotel }) {
  const {
    city,
    city_name,
    nights,
    price_per_night,
    total_price,
    stars,
    hotel_name,
    rating,
    amenities,
    image_url,
    alternatives,
    check_in,
    check_out,
  } = hotel

  const [showAlternatives, setShowAlternatives] = useState(false)
  const [selectedHotel, setSelectedHotel] = useState(null)
  const [activeImageIndex, setActiveImageIndex] = useState(0)
  const [showGallery, setShowGallery] = useState(false)

  // Yulduzlar
  const renderStars = (count) => {
    return Array(count || 3).fill('★').map((star, i) => (
      <span key={i} className="text-yellow-400">{star}</span>
    ))
  }

  // Mehmonxona turi
  const getHotelType = (starCount) => {
    if (starCount === 1) return { type: 'Hostel', icon: '🛏️', color: 'bg-gray-100 text-gray-700', gradient: 'from-gray-400 to-gray-600', iconClass: 'icon-3d' }
    if (starCount === 2) return { type: 'Budget', icon: '🏠', color: 'bg-blue-100 text-blue-700', gradient: 'from-blue-400 to-blue-600', iconClass: 'icon-3d-primary' }
    if (starCount === 3) return { type: 'Standard', icon: '🏨', color: 'bg-green-100 text-green-700', gradient: 'from-green-400 to-green-600', iconClass: 'icon-3d-success' }
    if (starCount === 4) return { type: 'Premium', icon: '🏩', color: 'bg-purple-100 text-purple-700', gradient: 'from-purple-400 to-purple-600', iconClass: 'icon-3d-purple' }
    return { type: 'Luxury', icon: '🏰', color: 'bg-yellow-100 text-yellow-700', gradient: 'from-yellow-400 to-yellow-600', iconClass: 'icon-3d-warning' }
  }

  const hotelType = getHotelType(stars)

  // Mehmonxona rasmlari - shahar va yulduzlar bo'yicha
  const getHotelImages = () => {
    // Unsplash dan real mehmonxona rasmlari
    const hotelImagesByCity = {
      'Istanbul': {
        1: [
          'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800&h=600&fit=crop',
          'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800&h=600&fit=crop',
          'https://images.unsplash.com/photo-1445019980597-93fa8acb246c?w=800&h=600&fit=crop',
          'https://images.unsplash.com/photo-1520277739336-7bf67edfa768?w=800&h=600&fit=crop',
        ],
        2: [
          'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&h=600&fit=crop',
          'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800&h=600&fit=crop',
          'https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=800&h=600&fit=crop',
          'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&h=600&fit=crop',
        ],
        3: [
          'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&h=600&fit=crop',
          'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800&h=600&fit=crop',
          'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&h=600&fit=crop',
          'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800&h=600&fit=crop',
        ],
        4: [
          'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800&h=600&fit=crop',
          'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&h=600&fit=crop',
          'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800&h=600&fit=crop',
          'https://images.unsplash.com/photo-1584132967334-10e028bd69f7?w=800&h=600&fit=crop',
        ],
        5: [
          'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800&h=600&fit=crop',
          'https://images.unsplash.com/photo-1540541338287-41700207dee6?w=800&h=600&fit=crop',
          'https://images.unsplash.com/photo-1615460549969-36fa19521a4f?w=800&h=600&fit=crop',
          'https://images.unsplash.com/photo-1568084680786-a84f91d1153c?w=800&h=600&fit=crop',
        ],
      },
      'Dubay': {
        1: [
          'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800&h=600&fit=crop',
          'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800&h=600&fit=crop',
          'https://images.unsplash.com/photo-1520277739336-7bf67edfa768?w=800&h=600&fit=crop',
          'https://images.unsplash.com/photo-1445019980597-93fa8acb246c?w=800&h=600&fit=crop',
        ],
        2: [
          'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&h=600&fit=crop',
          'https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=800&h=600&fit=crop',
          'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&h=600&fit=crop',
          'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800&h=600&fit=crop',
        ],
        3: [
          'https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?w=800&h=600&fit=crop',
          'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800&h=600&fit=crop',
          'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800&h=600&fit=crop',
          'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&h=600&fit=crop',
        ],
        4: [
          'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800&h=600&fit=crop',
          'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&h=600&fit=crop',
          'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800&h=600&fit=crop',
          'https://images.unsplash.com/photo-1584132967334-10e028bd69f7?w=800&h=600&fit=crop',
        ],
        5: [
          'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800&h=600&fit=crop',
          'https://images.unsplash.com/photo-1615460549969-36fa19521a4f?w=800&h=600&fit=crop',
          'https://images.unsplash.com/photo-1540541338287-41700207dee6?w=800&h=600&fit=crop',
          'https://images.unsplash.com/photo-1568084680786-a84f91d1153c?w=800&h=600&fit=crop',
        ],
      },
      'Bangkok': {
        1: [
          'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800&h=600&fit=crop',
          'https://images.unsplash.com/photo-1520277739336-7bf67edfa768?w=800&h=600&fit=crop',
          'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800&h=600&fit=crop',
          'https://images.unsplash.com/photo-1445019980597-93fa8acb246c?w=800&h=600&fit=crop',
        ],
        2: [
          'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&h=600&fit=crop',
          'https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=800&h=600&fit=crop',
          'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&h=600&fit=crop',
          'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800&h=600&fit=crop',
        ],
        3: [
          'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&h=600&fit=crop',
          'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&h=600&fit=crop',
          'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800&h=600&fit=crop',
          'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800&h=600&fit=crop',
        ],
        4: [
          'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800&h=600&fit=crop',
          'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&h=600&fit=crop',
          'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800&h=600&fit=crop',
          'https://images.unsplash.com/photo-1584132967334-10e028bd69f7?w=800&h=600&fit=crop',
        ],
        5: [
          'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800&h=600&fit=crop',
          'https://images.unsplash.com/photo-1540541338287-41700207dee6?w=800&h=600&fit=crop',
          'https://images.unsplash.com/photo-1615460549969-36fa19521a4f?w=800&h=600&fit=crop',
          'https://images.unsplash.com/photo-1568084680786-a84f91d1153c?w=800&h=600&fit=crop',
        ],
      },
      'Toshkent': {
        1: [
          'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800&h=600&fit=crop',
          'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800&h=600&fit=crop',
          'https://images.unsplash.com/photo-1520277739336-7bf67edfa768?w=800&h=600&fit=crop',
          'https://images.unsplash.com/photo-1445019980597-93fa8acb246c?w=800&h=600&fit=crop',
        ],
        2: [
          'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&h=600&fit=crop',
          'https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=800&h=600&fit=crop',
          'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&h=600&fit=crop',
          'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800&h=600&fit=crop',
        ],
        3: [
          'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&h=600&fit=crop',
          'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800&h=600&fit=crop',
          'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&h=600&fit=crop',
          'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800&h=600&fit=crop',
        ],
        4: [
          'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800&h=600&fit=crop',
          'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&h=600&fit=crop',
          'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800&h=600&fit=crop',
          'https://images.unsplash.com/photo-1584132967334-10e028bd69f7?w=800&h=600&fit=crop',
        ],
        5: [
          'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800&h=600&fit=crop',
          'https://images.unsplash.com/photo-1540541338287-41700207dee6?w=800&h=600&fit=crop',
          'https://images.unsplash.com/photo-1615460549969-36fa19521a4f?w=800&h=600&fit=crop',
          'https://images.unsplash.com/photo-1568084680786-a84f91d1153c?w=800&h=600&fit=crop',
        ],
      },
    }

    // Default rasmlar yulduzlar bo'yicha
    const defaultImages = {
      1: [
        'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1520277739336-7bf67edfa768?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1445019980597-93fa8acb246c?w=800&h=600&fit=crop',
      ],
      2: [
        'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800&h=600&fit=crop',
      ],
      3: [
        'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800&h=600&fit=crop',
      ],
      4: [
        'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1584132967334-10e028bd69f7?w=800&h=600&fit=crop',
      ],
      5: [
        'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1540541338287-41700207dee6?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1615460549969-36fa19521a4f?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1568084680786-a84f91d1153c?w=800&h=600&fit=crop',
      ],
    }

    // Shahar bo'yicha rasmlarni olish
    const cityImages = hotelImagesByCity[city_name]
    if (cityImages && cityImages[stars]) {
      return cityImages[stars]
    }

    // Default rasmlarni qaytarish
    return defaultImages[stars] || defaultImages[3]
  }

  const hotelImages = getHotelImages()

  // Keyingi rasmga o'tish
  const nextImage = () => {
    setActiveImageIndex((prev) => (prev + 1) % hotelImages.length)
  }

  // Oldingi rasmga o'tish
  const prevImage = () => {
    setActiveImageIndex((prev) => (prev - 1 + hotelImages.length) % hotelImages.length)
  }

  // Shahar bo'yicha real mehmonxona nomlari
  const getHotelName = () => {
    if (hotel_name) return hotel_name

    const hotelsByCity = {
      'Istanbul': {
        1: 'Sultanahmet Hostel',
        2: 'Taksim Budget Inn',
        3: 'Istanbul Comfort Hotel',
        4: 'Hilton Istanbul Bosphorus',
        5: 'Four Seasons Istanbul'
      },
      'Dubay': {
        1: 'Dubai Youth Hostel',
        2: 'Rove Downtown Dubai',
        3: 'Ibis Dubai Mall',
        4: 'JW Marriott Marquis Dubai',
        5: 'Burj Al Arab Jumeirah'
      },
      'Toshkent': {
        1: 'Tashkent Hostel',
        2: 'City Palace Tashkent',
        3: 'Ramada Tashkent',
        4: 'Hyatt Regency Tashkent',
        5: 'Intercontinental Tashkent'
      },
      'Nyu-York': {
        1: 'HI NYC Hostel',
        2: 'Pod Times Square',
        3: 'Holiday Inn Manhattan',
        4: 'The Plaza Hotel',
        5: 'The Ritz-Carlton New York'
      },
      'London': {
        1: 'Generator London',
        2: 'Premier Inn London',
        3: 'DoubleTree by Hilton London',
        4: 'The Savoy',
        5: 'Claridge\'s'
      },
      'Parij': {
        1: 'St Christopher\'s Paris',
        2: 'Ibis Paris Montmartre',
        3: 'Novotel Paris Centre',
        4: 'Le Meurice',
        5: 'Ritz Paris'
      },
      'Tokio': {
        1: 'Khaosan Tokyo',
        2: 'APA Hotel Shinjuku',
        3: 'Shinjuku Granbell Hotel',
        4: 'Park Hyatt Tokyo',
        5: 'Aman Tokyo'
      },
      'Bangkok': {
        1: 'Lub d Bangkok Silom',
        2: 'Ibis Bangkok Riverside',
        3: 'Novotel Bangkok',
        4: 'Mandarin Oriental Bangkok',
        5: 'The Peninsula Bangkok'
      },
    }

    const cityHotels = hotelsByCity[city_name]
    if (cityHotels && cityHotels[stars]) {
      return cityHotels[stars]
    }

    // Default nomi
    const defaultNames = {
      1: `${city_name} Hostel`,
      2: `${city_name} Inn`,
      3: `${city_name} Hotel`,
      4: `Grand Hotel ${city_name}`,
      5: `${city_name} Palace`
    }
    return defaultNames[stars] || `${city_name} Hotel`
  }

  // Qulayliklar ro'yxati
  const getAmenities = () => {
    if (amenities) return amenities

    const amenitiesByStars = {
      1: [
        { icon: '📶', name: 'WiFi' },
        { icon: '🚿', name: 'Umumiy hammom' },
        { icon: '🔒', name: 'Shkafcha' },
      ],
      2: [
        { icon: '📶', name: 'Bepul WiFi' },
        { icon: '❄️', name: 'Konditsioner' },
        { icon: '📺', name: 'TV' },
      ],
      3: [
        { icon: '📶', name: 'Bepul WiFi' },
        { icon: '🍳', name: 'Nonushta' },
        { icon: '❄️', name: 'Konditsioner' },
        { icon: '🅿️', name: 'Parking' },
      ],
      4: [
        { icon: '📶', name: 'Bepul WiFi' },
        { icon: '🍳', name: 'Nonushta kiradi' },
        { icon: '🏊', name: 'Basseyn' },
        { icon: '💪', name: 'Fitnes zal' },
        { icon: '🍽️', name: 'Restoran' },
      ],
      5: [
        { icon: '📶', name: 'Premium WiFi' },
        { icon: '🍳', name: 'Nonushta kiradi' },
        { icon: '🏊', name: 'Basseyn' },
        { icon: '💆', name: 'SPA' },
        { icon: '🍽️', name: 'Michelin restoran' },
        { icon: '🛎️', name: '24/7 xizmat' },
      ],
    }
    return amenitiesByStars[stars] || amenitiesByStars[3]
  }

  // Alternativ mehmonxonalar
  const getAlternatives = () => {
    if (alternatives) return alternatives

    const altNames = {
      1: ['Central Hostel', 'Backpackers Inn', 'City Dormitory'],
      2: ['Budget Stay', 'Economy Lodge', 'Value Inn'],
      3: ['Comfort Suites', 'Business Hotel', 'City Center Hotel'],
      4: ['Luxury Suites', 'Executive Hotel', 'Premium Resort'],
      5: ['Royal Palace', 'Grand Resort', 'Elite Suites'],
    }

    // Alternativ mehmonxona rasmlari
    const altImages = {
      1: [
        'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=400&h=300&fit=crop',
        'https://images.unsplash.com/photo-1520277739336-7bf67edfa768?w=400&h=300&fit=crop',
        'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=400&h=300&fit=crop',
      ],
      2: [
        'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=400&h=300&fit=crop',
        'https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=400&h=300&fit=crop',
        'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=400&h=300&fit=crop',
      ],
      3: [
        'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=300&fit=crop',
        'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=400&h=300&fit=crop',
        'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=400&h=300&fit=crop',
      ],
      4: [
        'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=400&h=300&fit=crop',
        'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=400&h=300&fit=crop',
        'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=400&h=300&fit=crop',
      ],
      5: [
        'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=400&h=300&fit=crop',
        'https://images.unsplash.com/photo-1540541338287-41700207dee6?w=400&h=300&fit=crop',
        'https://images.unsplash.com/photo-1615460549969-36fa19521a4f?w=400&h=300&fit=crop',
      ],
    }

    // Alternativ mehmonxona qulayliklari
    const altAmenities = {
      1: [
        [{ icon: '📶', name: 'WiFi' }, { icon: '🚿', name: 'Umumiy hammom' }],
        [{ icon: '📶', name: 'WiFi' }, { icon: '☕', name: 'Choy/Kofe' }],
        [{ icon: '📶', name: 'WiFi' }, { icon: '🔒', name: 'Shkafcha' }],
      ],
      2: [
        [{ icon: '📶', name: 'Bepul WiFi' }, { icon: '❄️', name: 'Konditsioner' }, { icon: '📺', name: 'TV' }],
        [{ icon: '📶', name: 'Bepul WiFi' }, { icon: '🅿️', name: 'Parking' }, { icon: '☕', name: 'Nonushta' }],
        [{ icon: '📶', name: 'Bepul WiFi' }, { icon: '🧹', name: 'Tozalash' }, { icon: '📺', name: 'TV' }],
      ],
      3: [
        [{ icon: '📶', name: 'Bepul WiFi' }, { icon: '🍳', name: 'Nonushta' }, { icon: '💪', name: 'Fitnes' }],
        [{ icon: '📶', name: 'Bepul WiFi' }, { icon: '🏊', name: 'Basseyn' }, { icon: '🅿️', name: 'Parking' }],
        [{ icon: '📶', name: 'Bepul WiFi' }, { icon: '🍽️', name: 'Restoran' }, { icon: '🛎️', name: '24/7' }],
      ],
      4: [
        [{ icon: '📶', name: 'Premium WiFi' }, { icon: '🏊', name: 'Basseyn' }, { icon: '💆', name: 'SPA' }, { icon: '🍳', name: 'Nonushta' }],
        [{ icon: '📶', name: 'Premium WiFi' }, { icon: '💪', name: 'Fitnes' }, { icon: '🍽️', name: 'Restoran' }, { icon: '🛎️', name: 'Concierge' }],
        [{ icon: '📶', name: 'Premium WiFi' }, { icon: '🏊', name: 'Basseyn' }, { icon: '🧖', name: 'Sauna' }, { icon: '🅿️', name: 'Valet' }],
      ],
      5: [
        [{ icon: '📶', name: 'Premium WiFi' }, { icon: '💆', name: 'SPA' }, { icon: '🍽️', name: 'Michelin' }, { icon: '🛎️', name: 'Butler' }, { icon: '🚁', name: 'Vertolyot' }],
        [{ icon: '📶', name: 'Premium WiFi' }, { icon: '🏊', name: 'Infinity Pool' }, { icon: '🧖', name: 'Hamam' }, { icon: '🍾', name: 'Minibar' }, { icon: '🎭', name: 'VIP' }],
        [{ icon: '📶', name: 'Premium WiFi' }, { icon: '💎', name: 'Luxury SPA' }, { icon: '🍷', name: 'Wine bar' }, { icon: '🛥️', name: 'Yacht' }, { icon: '🌟', name: 'Penthouse' }],
      ],
    }

    const names = altNames[stars] || altNames[3]
    const images = altImages[stars] || altImages[3]
    const amenities = altAmenities[stars] || altAmenities[3]
    const priceVariations = [0.85, 1.0, 1.15]

    return names.map((name, i) => ({
      name: `${name} ${city_name}`,
      price_per_night: Math.round(price_per_night * priceVariations[i]),
      rating: (7.0 + stars * 0.4 + Math.random() * 0.5).toFixed(1),
      stars: stars,
      reviews: Math.floor(100 + Math.random() * 900),
      image: images[i],
      amenities: amenities[i],
      description: getAltDescription(stars, i),
      distance: (0.5 + Math.random() * 3).toFixed(1),
    }))
  }

  // Alternativ mehmonxona tavsifi
  const getAltDescription = (starCount, index) => {
    const descriptions = {
      1: [
        'Shahar markazida joylashgan qulay hostel. Sayohatchilar uchun ideal.',
        'Arzon narxda toza va xavfsiz turar joy. Metro yaqinida.',
        'Yoshlar uchun do\'stona muhit. Umumiy oshxona mavjud.',
      ],
      2: [
        'Yaxshi joylashuv, qulay xonalar. Biznes sayohatchilar uchun.',
        'Oilaviy mehmonxona, tinch muhit. Bog\'cha yaqinida.',
        'Zamonaviy dizayn, hamyonbop narxlar.',
      ],
      3: [
        'Professional xizmat, qulay xonalar. Konferens-zal mavjud.',
        'Basseyn va fitnes zal. Oilalar uchun qulay.',
        'Markazda joylashgan, restoran va bar mavjud.',
      ],
      4: [
        'Hashamatli xonalar, yuqori sifatli xizmat. SPA markazi.',
        'Panoramali manzara, executive lounge. Biznes uchun ideal.',
        'Dizayner interer, gurme restoran. VIP xizmat.',
      ],
      5: [
        'Dunyodagi eng yaxshi mehmonxonalardan biri. Butler xizmati.',
        'Shohona hashamat, Michelin yulduzli restoran. Helikopter maydoni.',
        'Eksklyuziv penthouse, shaxsiy basseyn. Mashhurlar tanlovi.',
      ],
    }
    return descriptions[starCount]?.[index] || 'Qulay va zamonaviy mehmonxona.'
  }

  const allAmenities = getAmenities()
  const altHotels = getAlternatives()
  const displayRating = rating || (6.5 + stars * 0.7).toFixed(1)
  const reviewCount = Math.floor(200 + Math.random() * 800)

  // Min-Max narxlarni hisoblash
  const getPriceRange = () => {
    const currentPrice = parseFloat(price_per_night) || 0
    const allPrices = [currentPrice, ...altHotels.map(h => h.price_per_night)]
    const minPrice = Math.min(...allPrices)
    const maxPrice = Math.max(...allPrices)

    // Jami narxlar
    const minTotal = minPrice * nights
    const maxTotal = maxPrice * nights

    return {
      minPerNight: minPrice,
      maxPerNight: maxPrice,
      minTotal,
      maxTotal,
      hasRange: minPrice !== maxPrice
    }
  }

  const priceRange = getPriceRange()

  // Booking.com link
  const getBookingLink = () => {
    const citySlug = city_name?.toLowerCase().replace(/\s+/g, '-') || city?.toLowerCase()
    return `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(city_name || city)}`
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-300">
      {/* Rasm galereyasi */}
      <div className={`h-48 bg-gradient-to-br ${hotelType.gradient} relative group`}>
        {/* Asosiy rasm */}
        <img
          src={hotelImages[activeImageIndex]}
          alt={`${getHotelName()} - Rasm ${activeImageIndex + 1}`}
          className="w-full h-full object-cover transition-opacity duration-300"
          onError={(e) => {
            e.target.style.display = 'none'
            e.target.nextSibling.style.display = 'flex'
          }}
        />
        {/* Fallback (rasm yuklanmasa) */}
        <div className="w-full h-full items-center justify-center hidden absolute inset-0">
          <div className="text-center">
            <span className={`text-6xl opacity-60 icon-3d-lg`}>{hotelType.icon}</span>
            <p className="text-white/80 text-sm mt-2">{city_name}</p>
          </div>
        </div>

        {/* Navigatsiya tugmalari */}
        <button
          onClick={(e) => { e.stopPropagation(); prevImage(); }}
          className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white w-8 h-8 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200"
        >
          ‹
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); nextImage(); }}
          className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white w-8 h-8 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200"
        >
          ›
        </button>

        {/* Rasm indikatorlari (nuqtalar) */}
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex space-x-1.5">
          {hotelImages.map((_, idx) => (
            <button
              key={idx}
              onClick={(e) => { e.stopPropagation(); setActiveImageIndex(idx); }}
              className={`w-2 h-2 rounded-full transition-all duration-200 ${
                idx === activeImageIndex
                  ? 'bg-white w-4'
                  : 'bg-white/50 hover:bg-white/75'
              }`}
            />
          ))}
        </div>

        {/* Thumbnail rasmlar */}
        <div className="absolute bottom-2 left-2 right-2 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          {hotelImages.map((img, idx) => (
            <button
              key={idx}
              onClick={(e) => { e.stopPropagation(); setActiveImageIndex(idx); }}
              className={`flex-1 h-10 rounded overflow-hidden border-2 transition-all duration-200 ${
                idx === activeImageIndex
                  ? 'border-white shadow-lg'
                  : 'border-transparent opacity-70 hover:opacity-100'
              }`}
            >
              <img
                src={img}
                alt={`Thumbnail ${idx + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>

        {/* Rasm soni badge */}
        <div className="absolute top-3 right-16 bg-black/50 text-white rounded-full px-2 py-1 text-xs flex items-center">
          <span className="icon-3d-sm mr-1">📷</span>
          {activeImageIndex + 1}/{hotelImages.length}
        </div>

        {/* Katta ko'rish tugmasi */}
        <button
          onClick={() => setShowGallery(true)}
          className="absolute top-12 right-3 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
          title="Katta ko'rish"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
          </svg>
        </button>

        {/* Narx badge - Min-Max */}
        <div className="absolute top-3 right-3 bg-white rounded-xl px-3 py-2 shadow-lg">
          {priceRange.hasRange ? (
            <>
              <div className="text-xs text-gray-500 text-center mb-0.5">dan</div>
              <div className="text-xl font-bold text-primary-600">
                ${priceRange.minTotal.toFixed(0)}
                <span className="text-gray-400 font-normal text-sm mx-1">-</span>
                ${priceRange.maxTotal.toFixed(0)}
              </div>
              <div className="text-xs text-gray-500 text-center">{nights} kecha</div>
            </>
          ) : (
            <>
              <div className="text-2xl font-bold text-primary-600">${parseFloat(total_price || 0).toFixed(0)}</div>
              <div className="text-xs text-gray-500 text-center">{nights} kecha</div>
            </>
          )}
        </div>

        {/* Turi badge */}
        <div className={`absolute top-3 left-3 ${hotelType.color} rounded-full px-3 py-1.5 text-xs font-semibold shadow`}>
          <span className={hotelType.iconClass}>{hotelType.icon}</span> {hotelType.type}
        </div>

        {/* Reyting badge */}
        <div className="absolute bottom-14 left-3 bg-green-500 text-white rounded-lg px-2 py-1 text-sm font-bold shadow">
          {displayRating}
        </div>
      </div>

      {/* Katta galereya modal */}
      {showGallery && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setShowGallery(false)}
        >
          <button
            onClick={() => setShowGallery(false)}
            className="absolute top-3 right-3 sm:top-4 sm:right-4 text-white text-3xl sm:text-4xl hover:text-gray-300 z-10 w-10 h-10 flex items-center justify-center"
          >
            ×
          </button>

          <button
            onClick={(e) => { e.stopPropagation(); prevImage(); }}
            className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-xl sm:text-2xl"
          >
            ‹
          </button>

          <div className="max-w-4xl max-h-[80vh] px-12 sm:px-16 w-full" onClick={(e) => e.stopPropagation()}>
            <img
              src={hotelImages[activeImageIndex]}
              alt={`${getHotelName()} - Rasm ${activeImageIndex + 1}`}
              className="max-w-full max-h-[60vh] sm:max-h-[70vh] object-contain rounded-lg mx-auto"
            />
            <div className="text-center mt-3 sm:mt-4">
              <p className="text-white text-base sm:text-lg font-medium truncate">{getHotelName()}</p>
              <p className="text-gray-400 text-sm">{activeImageIndex + 1} / {hotelImages.length}</p>
            </div>

            {/* Thumbnail strip - smaller on mobile */}
            <div className="flex justify-center space-x-1.5 sm:space-x-2 mt-3 sm:mt-4 overflow-x-auto pb-2">
              {hotelImages.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImageIndex(idx)}
                  className={`w-12 h-9 sm:w-16 sm:h-12 rounded overflow-hidden border-2 transition-all flex-shrink-0 ${
                    idx === activeImageIndex
                      ? 'border-white'
                      : 'border-transparent opacity-50 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={(e) => { e.stopPropagation(); nextImage(); }}
            className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-xl sm:text-2xl"
          >
            ›
          </button>
        </div>
      )}

      {/* Ma'lumotlar */}
      <div className="p-5">
        {/* Sarlavha */}
        <div className="mb-4">
          <div className="flex items-start justify-between">
            <div>
              <h4 className="font-bold text-lg text-gray-800">{getHotelName()}</h4>
              <p className="text-sm text-gray-500 flex items-center mt-1">
                <span className="mr-1 icon-3d-sm">📍</span> {city_name}
              </p>
            </div>
            <div className="text-right">
              <div className="flex">{renderStars(stars)}</div>
              <p className="text-xs text-gray-400 mt-1">{reviewCount} sharh</p>
            </div>
          </div>
        </div>

        {/* Narx ma'lumotlari - Min-Max */}
        <div className="bg-gradient-to-r from-gray-50 to-primary-50 rounded-lg p-4 mb-4">
          {priceRange.hasRange ? (
            <>
              {/* Min-Max kechalik narx */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center">
                  <span className="icon-3d-sm text-green-500 mr-2">💰</span>
                  <span className="text-xs text-gray-500">Kechalik narx:</span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold text-green-600">${priceRange.minPerNight}</span>
                  <span className="text-gray-400 mx-1">-</span>
                  <span className="text-sm font-bold text-orange-600">${priceRange.maxPerNight}</span>
                </div>
              </div>

              {/* Progress bar ko'rinishida narx diapazoni */}
              <div className="relative h-2 bg-gray-200 rounded-full mb-3">
                <div
                  className="absolute h-full bg-gradient-to-r from-green-400 to-orange-400 rounded-full"
                  style={{ width: '100%' }}
                />
                <div className="absolute -top-1 left-0 w-4 h-4 bg-green-500 rounded-full border-2 border-white shadow" />
                <div className="absolute -top-1 right-0 w-4 h-4 bg-orange-500 rounded-full border-2 border-white shadow" />
              </div>

              {/* Min-Max jami narx */}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-green-100 rounded-lg p-2">
                  <p className="text-xs text-green-600 font-medium">Eng arzon</p>
                  <p className="text-lg font-bold text-green-700">${priceRange.minTotal.toFixed(0)}</p>
                </div>
                <div className="bg-gray-100 rounded-lg p-2">
                  <p className="text-xs text-gray-500">Kechalar</p>
                  <p className="text-lg font-bold text-gray-700">{nights}</p>
                </div>
                <div className="bg-orange-100 rounded-lg p-2">
                  <p className="text-xs text-orange-600 font-medium">Eng qimmat</p>
                  <p className="text-lg font-bold text-orange-700">${priceRange.maxTotal.toFixed(0)}</p>
                </div>
              </div>

              {/* Tejamkorlik */}
              <div className="mt-3 text-center">
                <span className="inline-flex items-center bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-medium">
                  <span className="icon-3d-sm mr-1">✨</span>
                  ${(priceRange.maxTotal - priceRange.minTotal).toFixed(0)} gacha tejash mumkin!
                </span>
              </div>
            </>
          ) : (
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs text-gray-500">Kechalik narx</p>
                <p className="text-lg font-bold text-gray-800">${parseFloat(price_per_night || 0).toFixed(0)}</p>
              </div>
              <div className="text-center px-4 border-l border-r border-gray-200">
                <p className="text-xs text-gray-500">Kechalar</p>
                <p className="text-lg font-bold text-gray-800">{nights}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500">Jami</p>
                <p className="text-lg font-bold text-primary-600">${parseFloat(total_price || 0).toFixed(0)}</p>
              </div>
            </div>
          )}
        </div>

        {/* Qulayliklar */}
        <div className="mb-4">
          <p className="text-xs text-gray-500 mb-2">Qulayliklar:</p>
          <div className="flex flex-wrap gap-2">
            {allAmenities.slice(0, 5).map((amenity, i) => (
              <span key={i} className="inline-flex items-center text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
                <span className="mr-1 icon-3d-sm">{amenity.icon}</span>
                {amenity.name}
              </span>
            ))}
          </div>
        </div>

        {/* Booking tugmasi */}
        <a
          href={getBookingLink()}
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full bg-primary-600 hover:bg-primary-700 text-white text-center py-3 rounded-lg font-medium transition-colors mb-4"
        >
          <span className="icon-3d-sm">🔍</span> Booking.com da ko'rish
        </a>

        {/* Alternativ variantlar */}
        <div className="border-t pt-4">
          <button
            onClick={() => setShowAlternatives(!showAlternatives)}
            className="w-full flex items-center justify-between text-sm text-gray-600 hover:text-primary-600 transition-colors"
          >
            <span className="flex items-center">
              <span className="mr-2 icon-3d-sm">🏨</span>
              Boshqa mehmonxonalar ({altHotels.length})
            </span>
            <span className={`transform transition-transform ${showAlternatives ? 'rotate-180' : ''}`}>
              ▼
            </span>
          </button>

          {showAlternatives && (
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
              {altHotels
                .sort((a, b) => a.price_per_night - b.price_per_night)
                .map((alt, i, sortedArr) => {
                  const isMin = alt.price_per_night === priceRange.minPerNight
                  const isMax = alt.price_per_night === priceRange.maxPerNight
                  const isSelected = selectedHotel === i

                  return (
                    <div
                      key={i}
                      className={`rounded-xl border-2 transition-all cursor-pointer overflow-hidden flex flex-col ${
                        isMin
                          ? 'border-green-400 bg-green-50'
                          : isMax
                          ? 'border-orange-300 bg-orange-50'
                          : isSelected
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-200 bg-white hover:border-primary-300 hover:shadow-md'
                      }`}
                      onClick={() => setSelectedHotel(isSelected ? null : i)}
                    >
                      {/* Compact view with image header */}
                      <div className="relative h-24 sm:h-28 overflow-hidden">
                        <img
                          src={alt.image}
                          alt={alt.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.src = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=200&fit=crop'
                          }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>

                        {/* Badges */}
                        <div className="absolute top-2 left-2 right-2 flex justify-between items-start">
                          {isMin ? (
                            <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full font-medium shadow">
                              💚 Eng arzon
                            </span>
                          ) : isMax ? (
                            <span className="bg-orange-500 text-white text-xs px-2 py-1 rounded-full font-medium shadow">
                              🧡 Premium
                            </span>
                          ) : (
                            <span></span>
                          )}
                          <span className="bg-green-500 text-white text-xs px-2 py-1 rounded font-bold shadow">
                            {alt.rating}
                          </span>
                        </div>

                        {/* Narx */}
                        <div className="absolute bottom-2 right-2 bg-white rounded-lg px-2 py-1 shadow">
                          <div className={`text-lg font-bold ${isMin ? 'text-green-600' : isMax ? 'text-orange-600' : 'text-primary-600'}`}>
                            ${alt.price_per_night}
                          </div>
                          <div className="text-xs text-gray-400 text-center">kechalik</div>
                        </div>
                      </div>

                      {/* Info */}
                      <div className="p-3 flex-1">
                        <h5 className="font-semibold text-gray-800 text-sm leading-tight mb-1 line-clamp-2">{alt.name}</h5>
                        <div className="flex items-center text-xs text-gray-500 gap-2">
                          <span className="flex">{renderStars(alt.stars)}</span>
                          <span>•</span>
                          <span>📍 {alt.distance} km</span>
                        </div>
                        <div className="mt-2 text-xs text-gray-500">
                          {nights} kecha: <span className={`font-bold ${isMin ? 'text-green-600' : isMax ? 'text-orange-600' : 'text-primary-600'}`}>${alt.price_per_night * nights}</span>
                        </div>
                      </div>

                      {/* Expanded view */}
                      {isSelected && (
                        <div className="border-t border-gray-200 bg-white">
                          {/* Katta rasm */}
                          <div className="relative h-32 sm:h-40">
                            <img
                              src={alt.image}
                              alt={alt.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.target.src = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&h=400&fit=crop'
                              }}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                            <div className="absolute bottom-3 left-3 right-3">
                              <h5 className="text-white font-bold text-lg">{alt.name}</h5>
                              <p className="text-white/80 text-sm flex items-center gap-2">
                                <span>{renderStars(alt.stars)}</span>
                                <span>•</span>
                                <span>{alt.reviews} sharh</span>
                              </p>
                            </div>
                            {/* Reyting badge */}
                            <div className="absolute top-3 right-3 bg-green-500 text-white rounded-lg px-2 py-1 font-bold">
                              {alt.rating}
                            </div>
                          </div>

                          {/* Tafsilotlar */}
                          <div className="p-4 space-y-4">
                            {/* Tavsif */}
                            <p className="text-gray-600 text-sm">{alt.description}</p>

                            {/* Joylashuv */}
                            <div className="flex items-center text-sm text-gray-500">
                              <span className="icon-3d-sm mr-2">📍</span>
                              Markazdan {alt.distance} km
                            </div>

                            {/* Qulayliklar */}
                            <div>
                              <p className="text-xs text-gray-500 mb-2">Qulayliklar:</p>
                              <div className="flex flex-wrap gap-2">
                                {alt.amenities?.map((amenity, idx) => (
                                  <span key={idx} className="inline-flex items-center text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
                                    <span className="mr-1">{amenity.icon}</span>
                                    {amenity.name}
                                  </span>
                                ))}
                              </div>
                            </div>

                            {/* Narx hisob-kitob */}
                            <div className={`rounded-lg p-3 ${isMin ? 'bg-green-100' : isMax ? 'bg-orange-100' : 'bg-gray-100'}`}>
                              <div className="flex justify-between items-center mb-2">
                                <span className="text-gray-600">${alt.price_per_night} × {nights} kecha</span>
                                <span className={`text-xl font-bold ${isMin ? 'text-green-600' : isMax ? 'text-orange-600' : 'text-primary-600'}`}>
                                  ${alt.price_per_night * nights}
                                </span>
                              </div>
                              {isMin && (
                                <div className="text-green-700 text-sm text-center bg-green-200 rounded py-1">
                                  ✨ Eng arzon variant! ${priceRange.maxTotal - (alt.price_per_night * nights)} tejaysiz
                                </div>
                              )}
                            </div>

                            {/* Bron tugmasi */}
                            <a
                              href={getBookingLink()}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className={`block w-full text-center py-3 rounded-lg font-medium transition-all duration-300 ${
                                isMin
                                  ? 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-lg hover:shadow-xl'
                                  : 'bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white shadow-lg hover:shadow-xl'
                              }`}
                            >
                              {isMin ? '🔥 Hozir bron qilish' : '📅 Booking.com da ko\'rish'}
                            </a>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default HotelCard
