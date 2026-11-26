// Xarita asosi: kalit bo'lsa Yandex Xaritalar (rasmiy Tiles API), bo'lmasa OpenStreetMap.
// Kalit: https://developer.tech.yandex.ru → "Tiles API"; frontend/.env ga VITE_YANDEX_MAPS_KEY=...
// Kalit brauzerda ko'rinadi - kabinetda uni sayt domeniga cheklab qo'ying.
const key = import.meta.env.VITE_YANDEX_MAPS_KEY

export const TILES = key
  ? {
      // projection=web_mercator: Leaflet'ning standart proyeksiyasi (Yandex standarti elliptik)
      url: `https://tiles.api-maps.yandex.ru/v1/tiles/?x={x}&y={y}&z={z}&lang=ru_RU&l=map&projection=web_mercator&apikey=${key}`,
      attribution: '&copy; <a href="https://yandex.com/legal/maps_api/">Yandex</a>',
    }
  : {
      url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }
