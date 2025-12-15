"""
External API Integrations - Tashqi API lar bilan integratsiya

Aviasales.uz / Travelpayouts API - Parvoz narxlari (real vaqtda)
Booking.com (RapidAPI) - Mehmonxona narxlari
"""

import os
from dotenv import load_dotenv

# .env faylini yuklash
load_dotenv()

import re
import json
import requests
import hashlib
from datetime import date, datetime, timedelta
from typing import Optional, List, Dict, Any
from decimal import Decimal
from urllib.parse import urlencode
import logging
from functools import lru_cache
from django.core.cache import cache

logger = logging.getLogger(__name__)

# Kesh vaqtlari (sekundlarda)
FLIGHT_CACHE_TTL = 300  # 5 daqiqa - real vaqt uchun
CALENDAR_CACHE_TTL = 3600  # 1 soat


class AviasalesAPI:
    """
    Aviasales.uz / Travelpayouts API integratsiyasi - Real vaqtda narxlar

    Aviasales.uz - O'zbekiston uchun eng yaxshi parvoz qidiruv tizimi
    API: Travelpayouts (Aviasales backend)

    Ro'yxatdan o'tish: https://www.travelpayouts.com/
    """

    # API endpoints
    PRICES_URL = "https://api.travelpayouts.com/aviasales/v3/prices_for_dates"
    PRICES_LATEST_URL = "https://api.travelpayouts.com/aviasales/v3/get_latest_prices"
    PRICES_CHEAP_URL = "https://api.travelpayouts.com/v1/prices/cheap"
    DIRECT_FLIGHTS_URL = "https://api.travelpayouts.com/v1/prices/direct"

    # Aviasales.uz uchun web endpoint (API ishlamasa)
    AVIASALES_WEB_URL = "https://www.aviasales.uz/search"

    def __init__(self):
        self.token = os.getenv('TRAVELPAYOUTS_TOKEN', '')
        self.marker = os.getenv('TRAVELPAYOUTS_MARKER', '')
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'application/json',
            'Accept-Language': 'uz,ru;q=0.9,en;q=0.8',
        })
        self._last_request_time = None

    def is_configured(self) -> bool:
        """API sozlanganligini tekshirish"""
        return bool(self.token and self.token != 'your_travelpayouts_token_here')

    def _get_cache_key(self, prefix: str, *args) -> str:
        """Kesh kalitini yaratish"""
        key_data = f"{prefix}:{':'.join(str(a) for a in args)}"
        return hashlib.md5(key_data.encode()).hexdigest()

    def get_api_status(self) -> Dict[str, Any]:
        """API holatini tekshirish"""
        return {
            'configured': self.is_configured(),
            'token_set': bool(self.token),
            'marker_set': bool(self.marker),
            'endpoints': {
                'prices_for_dates': self.PRICES_URL,
                'latest_prices': self.PRICES_LATEST_URL,
                'cheap_prices': self.PRICES_CHEAP_URL,
                'direct_flights': self.DIRECT_FLIGHTS_URL,
            },
            'web_fallback': self.AVIASALES_WEB_URL,
        }

    def search_flights(
        self,
        origin: str,
        destination: str,
        departure_date: date,
        return_date: Optional[date] = None,
        direct: bool = False,
        currency: str = 'usd',
        use_cache: bool = True
    ) -> List[Dict]:
        """
        Aviasales.uz dan real vaqtda parvoz narxlarini qidirish

        Args:
            origin: Ketish shahri IATA kodi (masalan, 'TAS')
            destination: Kelish shahri IATA kodi (masalan, 'IST')
            departure_date: Ketish sanasi
            return_date: Qaytish sanasi (ixtiyoriy)
            direct: Faqat to'g'ridan-to'g'ri parvozlar
            currency: Valyuta (usd, eur, rub)
            use_cache: Keshdan foydalanish (5 daqiqa)

        Returns:
            Parvozlar ro'yxati
        """
        # Keshni tekshirish
        cache_key = self._get_cache_key(
            'flights', origin, destination,
            departure_date.isoformat() if isinstance(departure_date, date) else departure_date,
            return_date.isoformat() if return_date and isinstance(return_date, date) else return_date,
            direct, currency
        )

        if use_cache:
            cached = cache.get(cache_key)
            if cached:
                logger.info(f"Keshdan: {origin}->{destination}")
                return cached

        flights = []
        data_source = 'fallback'

        # 1. API orqali qidirish (token bilan)
        if self.is_configured():
            flights = self._search_via_api(origin, destination, departure_date, return_date, direct, currency)
            if flights:
                data_source = 'travelpayouts_api'

        # 2. Agar API ishlamasa, bepul endpoint dan qidirish
        if not flights:
            flights = self._search_free_api(origin, destination, departure_date, currency)
            if flights:
                data_source = 'travelpayouts_free'

        # 3. Fallback - taxminiy narxlar
        if not flights:
            flights = self._get_fallback_flights(origin, destination, departure_date)
            data_source = 'fallback'

        # Ma'lumot manbasi qo'shish
        for flight in flights:
            flight['data_source'] = data_source
            flight['fetched_at'] = datetime.now().isoformat()

        # Keshga saqlash
        if flights and use_cache:
            cache.set(cache_key, flights, FLIGHT_CACHE_TTL)

        return flights

    def _search_via_api(
        self,
        origin: str,
        destination: str,
        departure_date: date,
        return_date: Optional[date],
        direct: bool,
        currency: str
    ) -> List[Dict]:
        """Travelpayouts API orqali qidirish"""

        # 1. Avval prices_for_dates bilan urinish
        try:
            params = {
                'origin': origin,
                'destination': destination,
                'departure_at': departure_date.strftime('%Y-%m-%d'),
                'currency': currency,
                'token': self.token,
                'sorting': 'price',
                'direct': 'true' if direct else 'false',
                'limit': 10,
                'one_way': 'true' if not return_date else 'false',
            }

            if return_date:
                params['return_at'] = return_date.strftime('%Y-%m-%d')

            response = self.session.get(self.PRICES_URL, params=params, timeout=15)
            response.raise_for_status()
            data = response.json()

            if data.get('success') and data.get('data'):
                logger.info(f"Aviasales API (prices_for_dates): {origin}->{destination} - {len(data['data'])} ta natija")
                return self._parse_api_response(data['data'], origin, destination)

        except requests.RequestException as e:
            logger.warning(f"Aviasales prices_for_dates xatosi: {e}")

        # 2. Agar natija bo'lmasa, get_latest_prices bilan urinish
        try:
            params = {
                'origin': origin,
                'destination': destination,
                'currency': currency,
                'token': self.token,
                'limit': 10,
            }

            response = self.session.get(self.PRICES_LATEST_URL, params=params, timeout=15)
            response.raise_for_status()
            data = response.json()

            if data.get('success') and data.get('data'):
                logger.info(f"Aviasales API (latest_prices): {origin}->{destination} - {len(data['data'])} ta natija")
                return self._parse_latest_prices(data['data'], origin, destination)

        except requests.RequestException as e:
            logger.warning(f"Aviasales latest_prices xatosi: {e}")

        return []

    def _parse_latest_prices(self, flights_data: List[Dict], origin: str, destination: str) -> List[Dict]:
        """get_latest_prices javobini parse qilish"""
        flights = []
        for flight in flights_data:
            flights.append({
                'origin': origin,
                'destination': destination,
                'price': float(flight.get('value', 0)),
                'airline': flight.get('gate', 'Aviakompaniya'),
                'departure_at': flight.get('depart_date', '')[:10],
                'return_at': flight.get('return_date', ''),
                'duration': flight.get('duration', 0),
                'transfers': flight.get('number_of_changes', 0),
                'link': self._build_aviasales_link(origin, destination, {'departure_at': flight.get('depart_date', '')}),
            })
        return flights

    def _search_free_api(self, origin: str, destination: str, departure_date: date, currency: str) -> List[Dict]:
        """Bepul API endpoint dan qidirish (token kerak emas)"""
        try:
            # Cheap prices endpoint
            month = departure_date.strftime('%Y-%m')
            url = f"https://api.travelpayouts.com/v1/prices/cheap"

            params = {
                'origin': origin,
                'destination': destination,
                'depart_date': month,
                'currency': currency,
            }

            # Token bo'lmasa ham ishlaydi (cheklangan)
            if self.token:
                params['token'] = self.token

            response = self.session.get(url, params=params, timeout=10)

            if response.status_code == 200:
                data = response.json()
                if data.get('success') and data.get('data'):
                    dest_data = data['data'].get(destination, {})
                    flights = []
                    for key, flight_info in dest_data.items():
                        flights.append({
                            'origin': origin,
                            'destination': destination,
                            'price': float(flight_info.get('price', 0)),
                            'airline': flight_info.get('airline', 'Unknown'),
                            'departure_at': flight_info.get('departure_at', ''),
                            'return_at': flight_info.get('return_at', ''),
                            'duration': flight_info.get('flight_duration', 0),
                            'transfers': flight_info.get('number_of_changes', 0),
                            'expires_at': flight_info.get('expires_at', ''),
                        })
                    if flights:
                        logger.info(f"Aviasales Free API: {origin}->{destination} - {len(flights)} ta natija")
                        return flights

        except Exception as e:
            logger.warning(f"Aviasales Free API xatosi: {e}")

        return []

    def _parse_api_response(self, flights_data: List[Dict], origin: str, destination: str) -> List[Dict]:
        """API javobini parse qilish"""
        flights = []
        for flight in flights_data:
            flights.append({
                'origin': origin,
                'destination': destination,
                'price': float(flight.get('price', 0)),
                'airline': flight.get('airline', 'Unknown'),
                'departure_at': flight.get('departure_at', ''),
                'return_at': flight.get('return_at', ''),
                'duration': flight.get('duration', 0) or flight.get('duration_to', 0),
                'transfers': flight.get('transfers', 0),
                'link': self._build_aviasales_link(origin, destination, flight),
            })
        return flights

    def _build_aviasales_link(self, origin: str, destination: str, flight: Dict) -> str:
        """Aviasales.uz havolasini yaratish"""
        departure = flight.get('departure_at', '')[:10].replace('-', '')
        return f"https://www.aviasales.uz/search/{origin}{departure}{destination}1"

    def _get_fallback_flights(self, origin: str, destination: str, departure_date: date) -> List[Dict]:
        """API ishlamasa, taxminiy narxlar (O'zbekiston yo'nalishlari uchun)"""
        base_prices = {
            # Toshkentdan
            ('TAS', 'IST'): (250, 'Turkish Airlines', 300),
            ('TAS', 'DXB'): (200, 'Flydubai', 270),
            ('TAS', 'DOH'): (220, 'Qatar Airways', 300),
            ('TAS', 'BKK'): (350, 'Uzbekistan Airways', 420),
            ('TAS', 'KUL'): (400, 'AirAsia', 480),
            ('TAS', 'CAI'): (300, 'Egyptair', 360),
            ('TAS', 'SVO'): (150, 'Aeroflot', 240),
            ('TAS', 'LED'): (180, 'Uzbekistan Airways', 270),
            # Dubaydan
            ('DXB', 'IST'): (120, 'Emirates', 180),
            ('DXB', 'DOH'): (60, 'Emirates', 90),
            ('DXB', 'BKK'): (220, 'Emirates', 360),
            ('DXB', 'KUL'): (250, 'Emirates', 360),
            ('DXB', 'SIN'): (280, 'Emirates', 360),
            ('DXB', 'CAI'): (150, 'Emirates', 240),
            # Istanbuldan
            ('IST', 'DXB'): (120, 'Turkish Airlines', 180),
            ('IST', 'DOH'): (140, 'Turkish Airlines', 210),
            ('IST', 'CAI'): (100, 'Turkish Airlines', 150),
            # Dohadan
            ('DOH', 'IST'): (140, 'Qatar Airways', 210),
            ('DOH', 'BKK'): (250, 'Qatar Airways', 390),
            ('DOH', 'CAI'): (130, 'Qatar Airways', 180),
            # Bangkokdan
            ('BKK', 'KUL'): (60, 'AirAsia', 120),
            ('BKK', 'SIN'): (80, 'AirAsia', 150),
            # Kuala-Lumpurdan
            ('KUL', 'SIN'): (40, 'AirAsia', 60),
        }

        key = (origin, destination)
        reverse_key = (destination, origin)

        if key in base_prices:
            price, airline, duration = base_prices[key]
        elif reverse_key in base_prices:
            price, airline, duration = base_prices[reverse_key]
        else:
            price, airline, duration = 200, 'Aviakompaniya', 240

        logger.info(f"Aviasales Fallback: {origin}->{destination} = ${price}")

        return [{
            'origin': origin,
            'destination': destination,
            'price': float(price),
            'airline': airline,
            'departure_at': departure_date.strftime('%Y-%m-%d'),
            'duration': duration,
            'transfers': 0,
            'link': f"https://www.aviasales.uz/search/{origin}{departure_date.strftime('%d%m')}{destination}1",
        }]

    def get_cheapest_price(self, origin: str, destination: str, departure_date: date) -> Optional[Dict]:
        """Eng arzon parvoz narxini olish"""
        flights = self.search_flights(origin, destination, departure_date)
        if flights:
            cheapest = min(flights, key=lambda x: x['price'])
            logger.info(f"Aviasales: {origin}->{destination} eng arzon: ${cheapest['price']} ({cheapest['airline']})")
            return cheapest
        return None

    def get_prices_calendar(self, origin: str, destination: str, month: str) -> Dict[str, float]:
        """Oylik narxlar kalendarini olish"""
        try:
            if self.is_configured():
                params = {
                    'origin': origin,
                    'destination': destination,
                    'calendar_type': 'departure_date',
                    'depart_date': month,
                    'token': self.token,
                    'currency': 'usd',
                }
                url = "https://api.travelpayouts.com/v1/prices/calendar"
                response = self.session.get(url, params=params, timeout=10)
                if response.status_code == 200:
                    data = response.json()
                    if data.get('success'):
                        return {d: info['price'] for d, info in data.get('data', {}).items()}
        except Exception as e:
            logger.error(f"Calendar API xatosi: {e}")
        return {}


# Backwards compatibility
TravelpayoutsAPI = AviasalesAPI


class BookingComAPI:
    """
    Booking.com API integratsiyasi (RapidAPI orqali)

    RapidAPI: https://rapidapi.com/apidojo/api/booking-com
    Bepul: 500 so'rov/oy
    """

    BASE_URL = "https://booking-com.p.rapidapi.com/v1"

    # Shahar ID lari keshi (API chaqiruvlarini kamaytirish uchun)
    CITY_IDS = {
        'Istanbul': '-755070',
        'Dubai': '-782831',
        'Doha': '-551013',
        'Bangkok': '-3414440',
        'Kuala Lumpur': '-2403010',
        'Singapore': '-73635',
        'Cairo': '-290692',
        'Tashkent': '-653837',
        'Moscow': '-2960561',
        'Bali': '-2701757',
        'Phuket': '-3418536',
        'Maldives': '-1282890',
    }

    def __init__(self):
        self.api_key = os.getenv('RAPIDAPI_KEY', '')
        self.headers = {
            'X-RapidAPI-Key': self.api_key,
            'X-RapidAPI-Host': 'booking-com.p.rapidapi.com'
        }
        self.session = requests.Session()
        self.session.headers.update(self.headers)
        self._last_request_time = None
        self._min_request_interval = 1.0  # Minimal 1 sekund oralig'i

    def is_configured(self) -> bool:
        """API sozlanganligini tekshirish"""
        return bool(self.api_key and self.api_key != 'your_rapidapi_key_here')

    def _rate_limit(self):
        """Rate limiting - so'rovlar orasida minimal vaqt"""
        import time
        if self._last_request_time:
            elapsed = time.time() - self._last_request_time
            if elapsed < self._min_request_interval:
                time.sleep(self._min_request_interval - elapsed)
        self._last_request_time = time.time()

    def get_api_status(self) -> Dict[str, Any]:
        """API holatini tekshirish"""
        return {
            'configured': self.is_configured(),
            'api_key_set': bool(self.api_key),
            'base_url': self.BASE_URL,
            'cached_cities': list(self.CITY_IDS.keys()),
        }

    def search_hotels(
        self,
        city_name: str,
        checkin_date: date,
        checkout_date: date,
        adults: int = 1,
        rooms: int = 1,
        currency: str = 'USD',
        min_stars: int = 3,
        use_cache: bool = True
    ) -> List[Dict]:
        """
        Booking.com dan mehmonxona narxlarini qidirish

        Args:
            city_name: Shahar nomi (masalan, 'Istanbul')
            checkin_date: Kirish sanasi
            checkout_date: Chiqish sanasi
            adults: Kattalar soni
            rooms: Xonalar soni
            currency: Valyuta
            min_stars: Minimal yulduzlar (1=hostel, 2-5=yulduzli)
            use_cache: Keshdan foydalanish

        Returns:
            Mehmonxonalar ro'yxati
        """
        # Keshni tekshirish
        cache_key = f"booking:{city_name}:{checkin_date}:{checkout_date}:{min_stars}"
        cache_key_hash = hashlib.md5(cache_key.encode()).hexdigest()

        if use_cache:
            cached = cache.get(cache_key_hash)
            if cached:
                logger.info(f"Booking.com keshdan: {city_name}")
                return cached

        if not self.is_configured():
            logger.warning("Booking.com API sozlanmagan, fallback narxlar qaytariladi")
            return self._get_fallback_hotels(city_name, checkin_date, checkout_date, min_stars)

        try:
            # Avval keshdan shahar ID sini olish
            dest_id = self.CITY_IDS.get(city_name)
            if not dest_id:
                dest_id = self._get_destination_id(city_name)
            if not dest_id:
                logger.warning(f"Booking.com: {city_name} topilmadi")
                return self._get_fallback_hotels(city_name, checkin_date, checkout_date, min_stars)

            # Yulduz filtri (hostel uchun maxsus)
            class_filter = None
            if min_stars == 1:
                class_filter = '0'  # Hostel/budget
            elif min_stars >= 2:
                class_filter = str(min_stars)

            params = {
                'dest_id': dest_id,
                'dest_type': 'city',
                'checkin_date': checkin_date.strftime('%Y-%m-%d'),
                'checkout_date': checkout_date.strftime('%Y-%m-%d'),
                'adults_number': adults,
                'room_number': rooms,
                'currency': currency,
                'order_by': 'price',
                'filter_by_currency': currency,
                'units': 'metric',
                'locale': 'en-gb',
                'page_number': 0,
                'include_adjacency': 'true',
            }

            if class_filter:
                params['categories_filter_ids'] = f'class::{class_filter}'

            # Rate limiting qo'llash
            self._rate_limit()

            response = self.session.get(
                f"{self.BASE_URL}/hotels/search",
                params=params,
                timeout=15
            )

            # 403 yoki 429 xatosi - fallback ishlatish
            if response.status_code in [403, 429]:
                logger.warning(f"Booking.com API rate limit ({response.status_code}), fallback ishlatiladi")
                return self._get_fallback_hotels(city_name, checkin_date, checkout_date, min_stars)

            response.raise_for_status()
            data = response.json()

            hotels = []
            if data.get('result'):
                hotels = self._parse_hotels(data['result'], min_stars)
                logger.info(f"Booking.com API: {city_name} - {len(hotels)} ta mehmonxona topildi")

                # Keshga saqlash (1 soat)
                if hotels and use_cache:
                    cache.set(cache_key_hash, hotels, 3600)

                return hotels

            return self._get_fallback_hotels(city_name, checkin_date, checkout_date, min_stars)

        except requests.Timeout:
            logger.warning(f"Booking.com API timeout: {city_name}")
            return self._get_fallback_hotels(city_name, checkin_date, checkout_date, min_stars)
        except requests.RequestException as e:
            logger.error(f"Booking.com API xatosi: {e}")
            return self._get_fallback_hotels(city_name, checkin_date, checkout_date, min_stars)

    def _get_destination_id(self, city_name: str) -> Optional[str]:
        """Shahar ID sini topish"""
        try:
            # Rate limiting qo'llash
            self._rate_limit()

            params = {
                'name': city_name,
                'locale': 'en-gb',
            }

            response = self.session.get(
                f"{self.BASE_URL}/hotels/locations",
                params=params,
                timeout=10
            )

            # 403 yoki 429 xatosi
            if response.status_code in [403, 429]:
                logger.warning(f"Booking.com locations API rate limit ({response.status_code})")
                return None

            response.raise_for_status()
            data = response.json()

            if data:
                for item in data:
                    if item.get('dest_type') == 'city':
                        # Keshga qo'shish
                        self.CITY_IDS[city_name] = item.get('dest_id')
                        return item.get('dest_id')
            return None

        except requests.Timeout:
            logger.warning(f"Destination ID olishda timeout: {city_name}")
            return None
        except requests.RequestException as e:
            logger.error(f"Destination ID olishda xato: {e}")
            return None

    def _parse_hotels(self, hotels_data: List[Dict], min_stars: int) -> List[Dict]:
        """API javobini parse qilish"""
        hotels = []
        for hotel in hotels_data:
            stars = hotel.get('class', 0)
            if stars >= min_stars:
                price_breakdown = hotel.get('price_breakdown', {})
                hotels.append({
                    'hotel_name': hotel.get('hotel_name', 'Unknown'),
                    'stars': int(stars),
                    'price_per_night': float(price_breakdown.get('gross_price', 0)),
                    'total_price': float(price_breakdown.get('all_inclusive_price', 0)),
                    'rating': float(hotel.get('review_score', 0)),
                    'address': hotel.get('address', ''),
                    'image_url': hotel.get('main_photo_url', ''),
                    'url': hotel.get('url', ''),
                })
        return hotels

    def _get_fallback_hotels(
        self,
        city_name: str,
        checkin_date: date,
        checkout_date: date,
        min_stars: int
    ) -> List[Dict]:
        """API ishlamasa, taxminiy narxlar"""
        nights = (checkout_date - checkin_date).days

        # Shahar bo'yicha taxminiy narxlar (1=hostel, 2-5=yulduzli mehmonxona)
        city_prices = {
            'Istanbul': {1: 15, 2: 30, 3: 55, 4: 95, 5: 180},
            'Dubai': {1: 20, 2: 35, 3: 45, 4: 85, 5: 200},
            'Dubay': {1: 20, 2: 35, 3: 45, 4: 85, 5: 200},
            'Doha': {1: 25, 2: 40, 3: 60, 4: 110, 5: 200},
            'Bangkok': {1: 8, 2: 15, 3: 25, 4: 65, 5: 150},
            'Kuala Lumpur': {1: 10, 2: 20, 3: 35, 4: 80, 5: 150},
            'Kuala-Lumpur': {1: 10, 2: 20, 3: 35, 4: 80, 5: 150},
            'Singapore': {1: 25, 2: 45, 3: 70, 4: 150, 5: 300},
            'Singapur': {1: 25, 2: 45, 3: 70, 4: 150, 5: 300},
            'Cairo': {1: 10, 2: 20, 3: 35, 4: 90, 5: 180},
            'Qohira': {1: 10, 2: 20, 3: 35, 4: 90, 5: 180},
        }

        prices = city_prices.get(city_name, {1: 15, 2: 30, 3: 50, 4: 100, 5: 200})
        price_per_night = prices.get(min_stars, 50)

        # Hostel yoki mehmonxona nomini aniqlash
        if min_stars == 1:
            hotel_name = f'{city_name} Hostel'
            hotel_type = 'Hostel'
        elif min_stars == 2:
            hotel_name = f'{city_name} Budget Hotel'
            hotel_type = '2-Star'
        else:
            hotel_name = f'{city_name} {min_stars}-Star Hotel'
            hotel_type = f'{min_stars}-Star'

        return [{
            'hotel_name': hotel_name,
            'stars': min_stars,
            'hotel_type': hotel_type,
            'price_per_night': float(price_per_night),
            'total_price': float(price_per_night * nights),
            'rating': 7.5 if min_stars == 1 else 8.0,
            'address': city_name,
            'image_url': '',
        }]

    def get_cheapest_hotel(
        self,
        city_name: str,
        checkin_date: date,
        checkout_date: date,
        min_stars: int = 3
    ) -> Optional[Dict]:
        """Eng arzon mehmonxonani olish"""
        hotels = self.search_hotels(city_name, checkin_date, checkout_date, min_stars=min_stars)
        if hotels:
            return min(hotels, key=lambda x: x['price_per_night'])
        return None


# API instanslari
travelpayouts_api = TravelpayoutsAPI()
booking_api = BookingComAPI()

