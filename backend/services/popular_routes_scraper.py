"""
Mashhur yo'nalishlar scraper - Aviasales API dan ma'lumotlarni olish

Bu modul Aviasales/Travelpayouts API dan mashhur yo'nalishlarni
avtomatik ravishda oladi va bazaga saqlaydi.
"""

import os
import requests
import logging
from datetime import date, timedelta
from decimal import Decimal
from typing import List, Dict, Any, Optional
from django.db import transaction
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)


# Shahar rasmlari (Unsplash)
CITY_IMAGES = {
    'IST': 'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=800',
    'DXB': 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800',
    'BKK': 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=800',
    'KUL': 'https://images.unsplash.com/photo-1596422846543-75c6fc197f07?w=800',
    'SIN': 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=800',
    'DOH': 'https://images.unsplash.com/photo-1559564484-e48b3e040ff4?w=800',
    'CAI': 'https://images.unsplash.com/photo-1572252009286-268acec5ca0a?w=800',
    'AUH': 'https://images.unsplash.com/photo-1512632578888-169bbbc64f33?w=800',
    'SSH': 'https://images.unsplash.com/photo-1539768942893-daf53e448371?w=800',
    'AYT': 'https://images.unsplash.com/photo-1593238739364-18cfde865242?w=800',
    'MLE': 'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=800',
    'HKT': 'https://images.unsplash.com/photo-1589394815804-964ed0be2eb5?w=800',
    'LED': 'https://images.unsplash.com/photo-1556610961-2fecc5927173?w=800',
    'MOW': 'https://images.unsplash.com/photo-1513326738677-b964603b136d?w=800',
}

# Shahar tavsiflari
CITY_DESCRIPTIONS = {
    'IST': "Tarixiy Konstantinopol - sharq va g'arb madaniyatlari uchrashuvi. Ayasofya, Ko'k masjid va Bozor.",
    'DXB': "Zamonaviy mo'jizalar shahri - Burj Khalifa, Palm Jumeirah va jahon darajasidagi savdo markazlari.",
    'BKK': "Tailand poytaxti - qadimiy ibodatxonalar, suzuvchi bozorlar va mazali taomlar.",
    'KUL': "Petronas minoralar shahri - ko'p madaniyatli taomlar va tropik o'rmonlar.",
    'SIN': "Kelajak shahri - Marina Bay, Gardens by the Bay va eng toza shahar.",
    'DOH': "Qatar poytaxti - zamonaviy arxitektura va arab madaniyati uyg'unligi.",
    'CAI': "Fir'avnlar vatani - piramidalar, Sfinks va qadimiy tarix.",
    'AUH': "BAA poytaxti - Shayx Zayid masjidi va zamonaviy dam olish.",
    'SSH': "Qizil dengiz marvaridi - eng yaxshi sho'ng'in va plyajlar.",
    'AYT': "Turkiya Rivierasi - tarixiy joylar va oq qumli plyajlar.",
}

# Eng yaxshi mavsumlar
BEST_SEASONS = {
    'IST': "Aprel-May, Sentyabr-Oktyabr",
    'DXB': "Noyabr-Mart",
    'BKK': "Noyabr-Fevral",
    'KUL': "May-Iyul, Dekabr-Fevral",
    'SIN': "Fevral-Aprel",
    'DOH': "Noyabr-Aprel",
    'CAI': "Oktyabr-Aprel",
    'AUH': "Noyabr-Mart",
    'SSH': "Yil bo'yi",
    'AYT': "May-Oktyabr",
}


class PopularRoutesScraper:
    """Mashhur yo'nalishlarni scrape qiluvchi klass"""

    # Travelpayouts API endpoints
    POPULAR_ROUTES_URL = "https://api.travelpayouts.com/v1/city-directions"
    PRICES_URL = "https://api.travelpayouts.com/aviasales/v3/prices_for_dates"
    CHEAP_PRICES_URL = "https://api.travelpayouts.com/v1/prices/cheap"

    def __init__(self):
        self.token = os.getenv('TRAVELPAYOUTS_TOKEN', '')
        self.session = requests.Session()

    def is_configured(self) -> bool:
        """API sozlanganligini tekshirish"""
        return bool(self.token and self.token != 'your_travelpayouts_token_here')

    def fetch_popular_destinations(self, origin: str = 'TAS') -> List[Dict[str, Any]]:
        """
        Berilgan shahardan mashhur yo'nalishlarni olish

        Args:
            origin: Boshlang'ich shahar IATA kodi (default: TAS - Toshkent)

        Returns:
            Mashhur yo'nalishlar ro'yxati
        """
        if not self.is_configured():
            logger.warning("Travelpayouts API sozlanmagan, fallback ma'lumotlar qaytariladi")
            return self._get_fallback_popular_routes(origin)

        try:
            # Mashhur yo'nalishlarni olish
            params = {
                'origin': origin,
                'token': self.token,
            }

            response = self.session.get(self.POPULAR_ROUTES_URL, params=params, timeout=10)
            response.raise_for_status()

            response_data = response.json()
            routes = []

            # API javobida 'data' kaliti bor
            data = response_data.get('data', response_data)
            if isinstance(data, dict):
                for dest_code, info in data.items():
                    if dest_code and isinstance(info, dict) and len(dest_code) == 3:
                        # Narxni RUB dan USD ga o'zgartirish (taxminan 1 USD = 90 RUB)
                        price_rub = info.get('price', 0)
                        price_usd = round(price_rub / 90) if price_rub else 0
                        routes.append({
                            'destination': dest_code,
                            'popularity': 100 - len(routes) * 5,  # Ketma-ket kamayuvchi ball
                            'avg_price': price_usd,
                        })

            # Mashhurlik bo'yicha tartiblash
            routes.sort(key=lambda x: x.get('popularity', 0), reverse=True)

            logger.info(f"Travelpayouts: {origin} dan {len(routes)} ta mashhur yo'nalish topildi")
            return routes[:20]  # Top 20

        except Exception as e:
            logger.error(f"Mashhur yo'nalishlarni olishda xato: {e}")
            return self._get_fallback_popular_routes(origin)

    def fetch_cheap_prices(self, origin: str, destination: str) -> Dict[str, Any]:
        """
        Arzon narxlarni olish

        Args:
            origin: Boshlang'ich shahar
            destination: Manzil shahar

        Returns:
            Narx ma'lumotlari
        """
        if not self.is_configured():
            return self._get_fallback_price(origin, destination)

        try:
            # Keyingi 60 kun uchun arzon narxlar
            departure_date = date.today() + timedelta(days=7)

            params = {
                'origin': origin,
                'destination': destination,
                'departure_at': departure_date.strftime('%Y-%m'),
                'token': self.token,
                'sorting': 'price',
                'limit': 10,
            }

            response = self.session.get(self.PRICES_URL, params=params, timeout=10)
            response.raise_for_status()

            data = response.json()

            if data.get('success') and data.get('data'):
                prices = [item.get('price', 0) for item in data['data'] if item.get('price')]
                if prices:
                    return {
                        'min_price': min(prices),
                        'avg_price': sum(prices) / len(prices),
                        'max_price': max(prices),
                        'data_source': 'travelpayouts_api',
                    }

            return self._get_fallback_price(origin, destination)

        except Exception as e:
            logger.error(f"Narxlarni olishda xato ({origin}->{destination}): {e}")
            return self._get_fallback_price(origin, destination)

    def _get_fallback_popular_routes(self, origin: str) -> List[Dict[str, Any]]:
        """Fallback mashhur yo'nalishlar"""
        # O'zbekistondan mashhur yo'nalishlar
        fallback_routes = {
            'TAS': [
                {'destination': 'IST', 'popularity': 100, 'avg_price': 350},
                {'destination': 'DXB', 'popularity': 95, 'avg_price': 380},
                {'destination': 'BKK', 'popularity': 85, 'avg_price': 520},
                {'destination': 'KUL', 'popularity': 80, 'avg_price': 480},
                {'destination': 'SIN', 'popularity': 75, 'avg_price': 550},
                {'destination': 'DOH', 'popularity': 70, 'avg_price': 420},
                {'destination': 'CAI', 'popularity': 65, 'avg_price': 450},
                {'destination': 'AUH', 'popularity': 60, 'avg_price': 400},
                {'destination': 'SSH', 'popularity': 55, 'avg_price': 380},
                {'destination': 'AYT', 'popularity': 50, 'avg_price': 320},
            ],
            'SKD': [
                {'destination': 'IST', 'popularity': 90, 'avg_price': 380},
                {'destination': 'DXB', 'popularity': 85, 'avg_price': 420},
            ],
        }

        return fallback_routes.get(origin, fallback_routes.get('TAS', []))

    def _get_fallback_price(self, origin: str, destination: str) -> Dict[str, Any]:
        """Fallback narxlar"""
        # O'rtacha narxlar (taxminiy)
        fallback_prices = {
            ('TAS', 'IST'): {'min_price': 280, 'avg_price': 350, 'max_price': 500},
            ('TAS', 'DXB'): {'min_price': 300, 'avg_price': 380, 'max_price': 550},
            ('TAS', 'BKK'): {'min_price': 420, 'avg_price': 520, 'max_price': 700},
            ('TAS', 'KUL'): {'min_price': 380, 'avg_price': 480, 'max_price': 650},
            ('TAS', 'SIN'): {'min_price': 450, 'avg_price': 550, 'max_price': 750},
            ('TAS', 'DOH'): {'min_price': 350, 'avg_price': 420, 'max_price': 580},
            ('TAS', 'CAI'): {'min_price': 380, 'avg_price': 450, 'max_price': 600},
            ('TAS', 'AUH'): {'min_price': 320, 'avg_price': 400, 'max_price': 550},
            ('TAS', 'SSH'): {'min_price': 300, 'avg_price': 380, 'max_price': 500},
            ('TAS', 'AYT'): {'min_price': 250, 'avg_price': 320, 'max_price': 450},
        }

        default = {'min_price': 400, 'avg_price': 500, 'max_price': 700}
        result = fallback_prices.get((origin, destination), default)
        result['data_source'] = 'fallback'
        return result

    @transaction.atomic
    def update_popular_routes(self, origin: str = 'TAS') -> int:
        """
        Mashhur yo'nalishlarni yangilash

        Args:
            origin: Boshlang'ich shahar IATA kodi

        Returns:
            Yangilangan/yaratilgan yo'nalishlar soni
        """
        from apps.destinations.models import City, PopularRoute

        try:
            origin_city = City.objects.get(iata_code=origin)
        except City.DoesNotExist:
            logger.error(f"Shahar topilmadi: {origin}")
            return 0

        routes = self.fetch_popular_destinations(origin)
        updated_count = 0

        for route_data in routes:
            dest_code = route_data.get('destination')
            if not dest_code:
                continue

            try:
                dest_city = City.objects.get(iata_code=dest_code)
            except City.DoesNotExist:
                logger.warning(f"Manzil shahar topilmadi: {dest_code}")
                continue

            # Narxlarni olish
            price_data = self.fetch_cheap_prices(origin, dest_code)

            # PopularRoute yaratish yoki yangilash
            popular_route, created = PopularRoute.objects.update_or_create(
                origin=origin_city,
                destination=dest_city,
                defaults={
                    'avg_price': Decimal(str(price_data.get('avg_price', route_data.get('avg_price', 400)))),
                    'min_price': Decimal(str(price_data.get('min_price', 0))) if price_data.get('min_price') else None,
                    'popularity_score': route_data.get('popularity', 0),
                    'image_url': CITY_IMAGES.get(dest_code, ''),
                    'description': CITY_DESCRIPTIONS.get(dest_code, ''),
                    'best_season': BEST_SEASONS.get(dest_code, ''),
                    'is_active': True,
                }
            )

            action = "yaratildi" if created else "yangilandi"
            logger.info(f"PopularRoute {action}: {origin} → {dest_code}")
            updated_count += 1

        return updated_count

    def get_recommendations(self, origin: str = 'TAS', limit: int = 6) -> List[Dict[str, Any]]:
        """
        Tavsiya etiladigan yo'nalishlarni olish

        Args:
            origin: Boshlang'ich shahar
            limit: Maksimal natijalar soni

        Returns:
            Tavsiyalar ro'yxati
        """
        from apps.destinations.models import PopularRoute

        try:
            origin_city_id = None
            from apps.destinations.models import City
            try:
                origin_city = City.objects.get(iata_code=origin)
                origin_city_id = origin_city.id
            except City.DoesNotExist:
                pass

            # Bazadan mashhur yo'nalishlarni olish
            routes = PopularRoute.objects.filter(
                is_active=True
            ).select_related('origin', 'destination', 'destination__country')

            if origin_city_id:
                routes = routes.filter(origin_id=origin_city_id)

            routes = routes.order_by('-popularity_score', '-searches_count')[:limit]

            if routes.exists():
                return [
                    {
                        'origin': route.origin.iata_code,
                        'origin_name': route.origin.name_uz,
                        'destination': route.destination.iata_code,
                        'destination_name': route.destination.name_uz,
                        'country': route.destination.country.name_uz if route.destination.country else '',
                        'flag': route.destination.country.flag_emoji if route.destination.country else '',
                        'avg_price': float(route.avg_price),
                        'min_price': float(route.min_price) if route.min_price else None,
                        'image': route.image_url,
                        'description': route.description,
                        'best_season': route.best_season,
                        'popularity_score': route.popularity_score,
                    }
                    for route in routes
                ]

            # Fallback - API dan olish
            return self._get_fallback_recommendations(origin, limit)

        except Exception as e:
            logger.error(f"Tavsiyalarni olishda xato: {e}")
            return self._get_fallback_recommendations(origin, limit)

    def _get_fallback_recommendations(self, origin: str, limit: int) -> List[Dict[str, Any]]:
        """Fallback tavsiyalar"""
        fallback = [
            {
                'origin': origin,
                'origin_name': 'Toshkent',
                'destination': 'IST',
                'destination_name': 'Istanbul',
                'country': 'Turkiya',
                'flag': '🇹🇷',
                'avg_price': 350,
                'min_price': 280,
                'image': CITY_IMAGES.get('IST', ''),
                'description': CITY_DESCRIPTIONS.get('IST', ''),
                'best_season': BEST_SEASONS.get('IST', ''),
                'popularity_score': 100,
            },
            {
                'origin': origin,
                'origin_name': 'Toshkent',
                'destination': 'DXB',
                'destination_name': 'Dubay',
                'country': 'BAA',
                'flag': '🇦🇪',
                'avg_price': 380,
                'min_price': 300,
                'image': CITY_IMAGES.get('DXB', ''),
                'description': CITY_DESCRIPTIONS.get('DXB', ''),
                'best_season': BEST_SEASONS.get('DXB', ''),
                'popularity_score': 95,
            },
            {
                'origin': origin,
                'origin_name': 'Toshkent',
                'destination': 'BKK',
                'destination_name': 'Bangkok',
                'country': 'Tailand',
                'flag': '🇹🇭',
                'avg_price': 520,
                'min_price': 420,
                'image': CITY_IMAGES.get('BKK', ''),
                'description': CITY_DESCRIPTIONS.get('BKK', ''),
                'best_season': BEST_SEASONS.get('BKK', ''),
                'popularity_score': 85,
            },
            {
                'origin': origin,
                'origin_name': 'Toshkent',
                'destination': 'KUL',
                'destination_name': 'Kuala Lumpur',
                'country': 'Malayziya',
                'flag': '🇲🇾',
                'avg_price': 480,
                'min_price': 380,
                'image': CITY_IMAGES.get('KUL', ''),
                'description': CITY_DESCRIPTIONS.get('KUL', ''),
                'best_season': BEST_SEASONS.get('KUL', ''),
                'popularity_score': 80,
            },
            {
                'origin': origin,
                'origin_name': 'Toshkent',
                'destination': 'SSH',
                'destination_name': 'Sharm El Sheikh',
                'country': 'Misr',
                'flag': '🇪🇬',
                'avg_price': 380,
                'min_price': 300,
                'image': CITY_IMAGES.get('SSH', ''),
                'description': CITY_DESCRIPTIONS.get('SSH', ''),
                'best_season': BEST_SEASONS.get('SSH', ''),
                'popularity_score': 75,
            },
            {
                'origin': origin,
                'origin_name': 'Toshkent',
                'destination': 'AYT',
                'destination_name': 'Antalya',
                'country': 'Turkiya',
                'flag': '🇹🇷',
                'avg_price': 320,
                'min_price': 250,
                'image': CITY_IMAGES.get('AYT', ''),
                'description': CITY_DESCRIPTIONS.get('AYT', ''),
                'best_season': BEST_SEASONS.get('AYT', ''),
                'popularity_score': 70,
            },
        ]

        return fallback[:limit]


# Global instance
popular_routes_scraper = PopularRoutesScraper()
