// Shahar ichi: joylar (Wikipedia) va ko'chalar bo'ylab yo'l (OpenStreetMap).
// Tashqi bepul xizmatlar - bizning api klienti emas, oddiy fetch (JWT tashqariga ketmasin).

// shortcut: markazdan 10 km va 50 ta maqola bilan cheklangan, ro'yxatda sayyohlik bo'lmagan
// maqolalar ham uchraydi; sifat yetmasa o'z joylar bazasiga (admin kiritadigan) o'tiladi
export async function fetchPlaces(city, lang = 'uz') {
  const params = new URLSearchParams({
    action: 'query', generator: 'geosearch',
    ggscoord: `${city.latitude}|${city.longitude}`, ggsradius: 10000, ggslimit: 50,
    prop: 'coordinates|pageimages|description', piprop: 'thumbnail', pithumbsize: 200,
    colimit: 50, pilimit: 50, format: 'json', origin: '*',
  })
  const res = await fetch(`https://${lang}.wikipedia.org/w/api.php?${params}`)
  if (!res.ok) throw new Error(`Wikipedia ${res.status}`)
  const pages = Object.values((await res.json()).query?.pages || {})
  const places = pages
    .filter((p) => p.coordinates?.[0] && p.title !== city.name_uz && p.title !== city.name)
    // Rasmlilari, keyin markazga yaqinlari birinchi (rasmsizlari ko'pincha sayyohlik joyi emas)
    .sort((a, b) => !a.thumbnail - !b.thumbnail || a.index - b.index)
    .map((p) => ({
      id: p.pageid,
      title: p.title,
      description: p.description,
      thumb: p.thumbnail?.source,
      lat: p.coordinates[0].lat,
      lon: p.coordinates[0].lon,
      url: `https://${lang}.wikipedia.org/?curid=${p.pageid}`,
    }))
  // O'zbekcha Vikipediyada kam yoritilgan shaharlar uchun inglizchasi
  return lang === 'uz' && places.length < 5 ? fetchPlaces(city, 'en') : places
}

// from, to: [lat, lon]; profile: 'foot' | 'car'
// shortcut: FOSSGIS jamoat serveri (kafolatsiz, adolatli foydalanish); trafik oshsa
// o'z OSRM serveri yoki pullik yo'l xizmatiga almashtiriladi
export async function fetchRoute(from, to, profile) {
  const res = await fetch(
    `https://routing.openstreetmap.de/routed-${profile}/route/v1/driving/` +
    `${from[1]},${from[0]};${to[1]},${to[0]}?overview=full&geometries=geojson`
  )
  if (!res.ok) throw new Error(`Routing ${res.status}`)
  const route = (await res.json()).routes?.[0]
  if (!route) throw new Error("Yo'l topilmadi")
  return {
    points: route.geometry.coordinates.map(([lon, lat]) => [lat, lon]),
    meters: route.distance,
    minutes: Math.round(route.duration / 60),
  }
}

// Ko'cha, manzil yoki joy nomi bo'yicha qidiruv. viewbox ("g'arb,janub,sharq,shimol") -
// xaritaning hozirgi ko'rinishi: shu hududdagi natijalar birinchi chiqadi.
// shortcut: Nominatim jamoat serveri - sekundiga 1 so'rov va yozish paytida avto-qidiruv
// taqiqlangan (shuning uchun faqat tugma bosilganda); ko'p foydalanuvchiga pullik geokoder kerak
export async function searchAddress(query, viewbox) {
  const params = new URLSearchParams({
    format: 'jsonv2', q: query, limit: 8, viewbox, 'accept-language': 'uz,ru,en',
  })
  const res = await fetch(`https://nominatim.openstreetmap.org/search?${params}`)
  if (!res.ok) throw new Error(`Nominatim ${res.status}`)
  return (await res.json()).map((r) => ({
    id: `osm-${r.place_id}`,
    title: r.name || r.display_name.split(',')[0],
    description: r.display_name,
    lat: Number(r.lat),
    lon: Number(r.lon),
  }))
}
