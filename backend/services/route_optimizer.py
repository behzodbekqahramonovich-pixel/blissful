"""
Route Optimizer Service - Ilg'or marshrut optimallashtirish algoritmi

Bu servis quyidagi funksiyalarni o'z ichiga oladi:
1. Dijkstra algoritmi - eng arzon/tez yo'lni topish
2. Dinamik hub tanlash - haqiqiy narxlar asosida
3. Ko'p kriteriyali baholash (narx, vaqt, qulaylik)
4. Byudjet cheklovlari
5. Vaqt optimallashtiruvi
6. Real API integratsiya (Travelpayouts, Booking.com)
"""

import heapq
import logging
from decimal import Decimal
from datetime import timedelta, datetime
from typing import List, Dict, Optional, Tuple
from dataclasses import dataclass, field
from django.db.models import Min, Avg, Q
from apps.destinations.models import City
from apps.pricing.models import FlightPrice, HotelPrice
from apps.search.models import TravelSearch, RouteVariant
from services.external_apis import travelpayouts_api, booking_api

logger = logging.getLogger(__name__)


@dataclass
class FlightNode:
    """Parvoz ma'lumotlari"""
    origin: str
    destination: str
    price: float
    duration: int  # daqiqalarda
    airline: str
    departure_time: Optional[str] = None


@dataclass
class RouteNode:
    """Marshrut nuqtasi"""
    city_code: str
    city_name: str
    arrival_date: Optional[datetime] = None
    departure_date: Optional[datetime] = None
    nights: int = 0
    hotel_cost: float = 0


@dataclass(order=True)
class PriorityItem:
    """Dijkstra uchun priority queue elementi"""
    priority: float
    city: str = field(compare=False)
    path: List[str] = field(compare=False)
    total_cost: float = field(compare=False)
    total_time: int = field(compare=False)


class RouteOptimizer:
    """Ilg'or marshrut optimallashtiruvchi"""

    # Optimallashtirish rejimlari
    MODE_CHEAPEST = 'cheapest'      # Eng arzon
    MODE_FASTEST = 'fastest'        # Eng tez
    MODE_BALANCED = 'balanced'      # Muvozanatli
    MODE_COMFORT = 'comfort'        # Eng qulay

    def __init__(self, search: TravelSearch, use_live_prices: bool = False):
        self.search = search
        self.origin = search.origin
        self.destination = search.destination
        self.departure_date = search.departure_date
        self.return_date = search.return_date
        self.nights = search.nights
        self.travelers = search.travelers
        self.hotel_stars = search.hotel_stars
        self.budget_max = float(search.budget_max_usd) if search.budget_max_usd else None
        self.use_live_prices = use_live_prices

        # Keshlar
        self._avg_prices_cache = {}
        self._hotel_cache = {}
        self._live_prices_cache = {}

        # Graf tuzish
        self._build_flight_graph()

    def _build_flight_graph(self):
        """Parvozlar grafini tuzish"""
        self.graph = {}  # {origin: [(dest, price, duration, airline), ...]}
        self.cities = {}  # {iata_code: City}

        # Barcha shaharlarni olish
        all_cities = City.objects.select_related('country').all()
        for city in all_cities:
            self.cities[city.iata_code] = city
            self.graph[city.iata_code] = []

        # Parvoz narxlarini grafga qo'shish
        flights = FlightPrice.objects.select_related(
            'origin', 'destination'
        ).values(
            'origin__iata_code',
            'destination__iata_code'
        ).annotate(
            min_price=Min('price_usd'),
            avg_duration=Avg('flight_duration_minutes')
        )

        for flight in flights:
            origin = flight['origin__iata_code']
            dest = flight['destination__iata_code']
            price = float(flight['min_price'])
            duration = int(flight['avg_duration'] or 240)

            if origin in self.graph:
                self.graph[origin].append((dest, price, duration, 'Multiple'))

        # Hub shaharlar orasida standart narxlar qo'shish
        self._add_estimated_routes()

    def _add_estimated_routes(self):
        """Taxminiy marshrutlarni qo'shish"""
        hubs = ['DXB', 'IST', 'DOH', 'AUH', 'BKK', 'KUL', 'SIN']
        major_cities = ['TAS', 'CAI'] + hubs

        estimated_prices = {
            ('TAS', 'IST'): (250, 300),
            ('TAS', 'DXB'): (200, 270),
            ('TAS', 'DOH'): (220, 300),
            ('TAS', 'BKK'): (350, 420),
            ('TAS', 'KUL'): (400, 480),
            ('TAS', 'SIN'): (450, 540),
            ('TAS', 'CAI'): (300, 360),
            ('DXB', 'IST'): (150, 180),
            ('DXB', 'DOH'): (80, 90),
            ('DXB', 'BKK'): (250, 360),
            ('DXB', 'KUL'): (280, 360),
            ('DXB', 'SIN'): (300, 360),
            ('DXB', 'CAI'): (180, 240),
            ('IST', 'DOH'): (160, 210),
            ('IST', 'BKK'): (350, 540),
            ('IST', 'KUL'): (400, 540),
            ('IST', 'SIN'): (420, 540),
            ('IST', 'CAI'): (120, 150),
            ('DOH', 'BKK'): (280, 390),
            ('DOH', 'KUL'): (300, 420),
            ('DOH', 'SIN'): (320, 420),
            ('DOH', 'CAI'): (150, 180),
            ('BKK', 'KUL'): (80, 120),
            ('BKK', 'SIN'): (100, 150),
            ('KUL', 'SIN'): (50, 60),
        }

        for (origin, dest), (price, duration) in estimated_prices.items():
            if origin in self.graph:
                # Mavjud bo'lmasa qo'shish
                existing = [x for x in self.graph[origin] if x[0] == dest]
                if not existing:
                    self.graph[origin].append((dest, price, duration, 'Estimated'))
            if dest in self.graph:
                existing = [x for x in self.graph[dest] if x[0] == origin]
                if not existing:
                    self.graph[dest].append((origin, price, duration, 'Estimated'))

    def find_optimal_route(self, mode: str = MODE_BALANCED) -> List[Dict]:
        """Optimal marshrutni topish"""
        variants = []

        # 1. Dijkstra bilan eng arzon yo'l
        cheapest_path = self._dijkstra_cheapest(
            self.origin.iata_code,
            self.destination.iata_code
        )
        if cheapest_path:
            variant = self._build_variant_from_path(cheapest_path, 'optimal_cheap')
            if variant:
                variants.append(variant)

        # 2. Dijkstra bilan eng tez yo'l
        fastest_path = self._dijkstra_fastest(
            self.origin.iata_code,
            self.destination.iata_code
        )
        if fastest_path and fastest_path != cheapest_path:
            variant = self._build_variant_from_path(fastest_path, 'optimal_fast')
            if variant:
                variants.append(variant)

        # 3. To'g'ridan-to'g'ri parvoz
        direct = self._find_direct_route()
        if direct:
            variants.append(direct)

        # 4. Eng yaxshi tranzit variantlar
        transit_variants = self._find_best_transit_routes()
        variants.extend(transit_variants)

        # 5. Ko'p shaharli marshrutlar
        if self.search.include_transit and self.nights >= 5:
            multi_variants = self._find_smart_multi_city()
            variants.extend(multi_variants)

        # Byudjet cheklovini qo'llash
        if self.budget_max:
            variants = [v for v in variants if v['total_cost'] <= self.budget_max]

        # Dublikatlarni olib tashlash
        variants = self._remove_duplicates(variants)

        # Tejamkorlikni hisoblash
        self._calculate_savings(variants)

        # Baholash va tartiblash
        for variant in variants:
            variant['score'] = self._calculate_advanced_score(variant, mode)

        variants.sort(key=lambda x: x['score'], reverse=True)

        # Eng yaxshisini belgilash
        self._mark_recommended(variants, mode)

        return variants

    def _dijkstra_cheapest(self, start: str, end: str) -> Optional[List[str]]:
        """Dijkstra algoritmi - eng arzon yo'l"""
        if start not in self.graph or end not in self.graph:
            return None

        # Priority queue: (cost, city, path)
        heap = [(0, start, [start])]
        visited = set()

        while heap:
            cost, current, path = heapq.heappop(heap)

            if current in visited:
                continue
            visited.add(current)

            if current == end:
                return path

            for neighbor, price, duration, airline in self.graph.get(current, []):
                if neighbor not in visited:
                    new_cost = cost + price
                    heapq.heappush(heap, (new_cost, neighbor, path + [neighbor]))

        return None

    def _dijkstra_fastest(self, start: str, end: str) -> Optional[List[str]]:
        """Dijkstra algoritmi - eng tez yo'l"""
        if start not in self.graph or end not in self.graph:
            return None

        heap = [(0, start, [start])]
        visited = set()

        while heap:
            time, current, path = heapq.heappop(heap)

            if current in visited:
                continue
            visited.add(current)

            if current == end:
                return path

            for neighbor, price, duration, airline in self.graph.get(current, []):
                if neighbor not in visited:
                    # Vaqtga layover qo'shamiz (2 soat)
                    new_time = time + duration + (120 if len(path) > 1 else 0)
                    heapq.heappush(heap, (new_time, neighbor, path + [neighbor]))

        return None

    def _build_variant_from_path(self, path: List[str], route_type: str) -> Optional[Dict]:
        """Yo'ldan variant yaratish"""
        if len(path) < 2:
            return None

        segments = []
        total_flight_cost = 0
        total_duration = 0

        current_date = self.departure_date

        for i in range(len(path) - 1):
            origin_code = path[i]
            dest_code = path[i + 1]

            flight_info = self._get_flight_info(origin_code, dest_code, current_date)
            segment = {
                'from': origin_code,
                'from_name': self._get_city_name(origin_code),
                'to': dest_code,
                'to_name': self._get_city_name(dest_code),
                'price': flight_info['price'],
                'airline': flight_info['airline'],
                'duration': flight_info['duration'],
                'date': str(current_date),
                'type': 'outbound' if i == 0 else 'transit',
                'data_source': flight_info.get('data_source', 'unknown'),
                'link': flight_info.get('link', ''),
            }
            segments.append(segment)
            total_flight_cost += flight_info['price']
            total_duration += flight_info['duration']

            # Keyingi kun (layover uchun)
            if i < len(path) - 2:
                current_date = current_date + timedelta(days=1)

        # Qaytish parvozi
        return_flight = self._get_flight_info(
            self.destination.iata_code,
            self.origin.iata_code,
            self.return_date
        )
        segments.append({
            'from': self.destination.iata_code,
            'from_name': self._get_city_name(self.destination.iata_code),
            'to': self.origin.iata_code,
            'to_name': self._get_city_name(self.origin.iata_code),
            'price': return_flight['price'],
            'airline': return_flight['airline'],
            'duration': return_flight['duration'],
            'date': str(self.return_date),
            'type': 'inbound',
            'data_source': return_flight.get('data_source', 'unknown'),
            'link': return_flight.get('link', ''),
        })
        total_flight_cost += return_flight['price']
        total_duration += return_flight['duration']

        # Mehmonxonalar
        hotels = self._calculate_hotels_for_path(path)
        total_hotel_cost = sum(h['total_price'] for h in hotels)

        total_cost = (total_flight_cost * self.travelers) + total_hotel_cost

        return {
            'route_type': route_type,
            'cities_sequence': path,
            'total_flight_cost': float(total_flight_cost * self.travelers),
            'total_hotel_cost': float(total_hotel_cost),
            'total_cost': float(total_cost),
            'total_duration': total_duration,
            'stops': len(path) - 2,
            'savings_percent': 0,
            'savings_amount': 0,
            'is_recommended': False,
            'score': 0,
            'details': {
                'segments': segments,
                'hotels': hotels,
                'optimization': {
                    'type': route_type,
                    'algorithm': 'dijkstra',
                    'path_length': len(path)
                },
                'bonus': self._get_bonus_for_path(path, route_type)
            }
        }

    def _get_bonus_for_path(self, path: List[str], route_type: str) -> str:
        """Yo'l uchun bonus xabarini yaratish"""
        stops = len(path) - 2
        if stops == 0:
            return "Eng tez va qulay sayohat! Vaqtingizni tejang."
        elif stops == 1:
            hub = path[1]
            return f"2 ta mamlakatni ko'rasiz! {self._get_city_name(hub)} shahriga tashrif buyuring."
        else:
            cities = [self._get_city_name(c) for c in path[1:-1]]
            return f"{stops + 1} ta mamlakatni ko'rasiz! {', '.join(cities)} orqali ajoyib sayohat."

    def _calculate_hotels_for_path(self, path: List[str]) -> List[Dict]:
        """Yo'l uchun mehmonxonalarni hisoblash"""
        hotels = []
        stops = len(path) - 2  # Oraliq shaharlar soni

        if stops == 0:
            # To'g'ridan-to'g'ri - faqat manzilda
            hotel_cost = self._get_hotel_cost(self.destination.iata_code, self.nights)
            hotels.append({
                'city': self.destination.iata_code,
                'city_name': self._get_city_name(self.destination.iata_code),
                'nights': self.nights,
                'price_per_night': float(hotel_cost / self.nights) if self.nights > 0 else 0,
                'total_price': float(hotel_cost),
                'stars': self.hotel_stars
            })
        else:
            # Oraliq shaharlarda ham
            nights_per_stop = max(1, self.nights // (stops + 1))
            remaining_nights = self.nights

            for i, city_code in enumerate(path[1:-1]):  # Oraliq shaharlar
                nights = nights_per_stop if i < stops - 1 else 1
                remaining_nights -= nights
                hotel_cost = self._get_hotel_cost(city_code, nights)
                hotels.append({
                    'city': city_code,
                    'city_name': self._get_city_name(city_code),
                    'nights': nights,
                    'price_per_night': float(hotel_cost / nights) if nights > 0 else 0,
                    'total_price': float(hotel_cost),
                    'stars': self.hotel_stars
                })

            # Manzilda qolgan kunlar
            if remaining_nights > 0:
                hotel_cost = self._get_hotel_cost(self.destination.iata_code, remaining_nights)
                hotels.append({
                    'city': self.destination.iata_code,
                    'city_name': self._get_city_name(self.destination.iata_code),
                    'nights': remaining_nights,
                    'price_per_night': float(hotel_cost / remaining_nights) if remaining_nights > 0 else 0,
                    'total_price': float(hotel_cost),
                    'stars': self.hotel_stars
                })

        return hotels

    def _find_direct_route(self) -> Optional[Dict]:
        """To'g'ridan-to'g'ri marshrut"""
        outbound = self._get_flight_info(
            self.origin.iata_code,
            self.destination.iata_code,
            self.departure_date
        )
        inbound = self._get_flight_info(
            self.destination.iata_code,
            self.origin.iata_code,
            self.return_date
        )

        hotel_cost = self._get_hotel_cost(self.destination.iata_code, self.nights)

        total_flight = (outbound['price'] + inbound['price']) * self.travelers
        total_cost = total_flight + float(hotel_cost)

        return {
            'route_type': 'direct',
            'cities_sequence': [self.origin.iata_code, self.destination.iata_code],
            'total_flight_cost': float(total_flight),
            'total_hotel_cost': float(hotel_cost),
            'total_cost': float(total_cost),
            'total_duration': outbound['duration'] + inbound['duration'],
            'stops': 0,
            'savings_percent': 0,
            'savings_amount': 0,
            'is_recommended': False,
            'score': 0,
            'details': {
                'segments': [
                    {
                        'from': self.origin.iata_code,
                        'from_name': self._get_city_name(self.origin.iata_code),
                        'to': self.destination.iata_code,
                        'to_name': self._get_city_name(self.destination.iata_code),
                        'price': outbound['price'],
                        'airline': outbound['airline'],
                        'duration': outbound['duration'],
                        'date': str(self.departure_date),
                        'type': 'outbound',
                        'data_source': outbound.get('data_source', 'unknown'),
                        'link': outbound.get('link', ''),
                    },
                    {
                        'from': self.destination.iata_code,
                        'from_name': self._get_city_name(self.destination.iata_code),
                        'to': self.origin.iata_code,
                        'to_name': self._get_city_name(self.origin.iata_code),
                        'price': inbound['price'],
                        'airline': inbound['airline'],
                        'duration': inbound['duration'],
                        'date': str(self.return_date),
                        'type': 'inbound',
                        'data_source': inbound.get('data_source', 'unknown'),
                        'link': inbound.get('link', ''),
                    }
                ],
                'hotels': [{
                    'city': self.destination.iata_code,
                    'city_name': self._get_city_name(self.destination.iata_code),
                    'nights': self.nights,
                    'price_per_night': float(hotel_cost / self.nights) if self.nights > 0 else 0,
                    'total_price': float(hotel_cost),
                    'stars': self.hotel_stars
                }],
                'bonus': "Eng tez va qulay sayohat! Vaqtingizni tejang."
            }
        }

    def _find_best_transit_routes(self) -> List[Dict]:
        """Eng yaxshi tranzit marshrutlarni topish"""
        variants = []
        hubs = self._get_dynamic_hubs()

        for hub_code in hubs:
            if hub_code in [self.origin.iata_code, self.destination.iata_code]:
                continue

            variant = self._calculate_transit_variant(hub_code)
            if variant:
                variants.append(variant)

        # Narx bo'yicha tartiblash va top 3 ni olish
        variants.sort(key=lambda x: x['total_cost'])
        return variants[:3]

    def _get_dynamic_hubs(self) -> List[str]:
        """Dinamik hub shaharlarni tanlash - optimallashtirilgan"""
        # Standart hub shaharlarni qaytarish (tez)
        # Graf allaqachon eng arzon parvozlarni o'z ichiga oladi
        standard_hubs = ['DXB', 'IST', 'DOH', 'BKK', 'KUL', 'SIN']

        # Graf orqali qo'shimcha hublarni topish (DB so'rovsiz)
        hubs = set(standard_hubs)
        for dest, price, duration, airline in self.graph.get(self.origin.iata_code, []):
            if dest not in [self.origin.iata_code, self.destination.iata_code]:
                hubs.add(dest)

        return list(hubs)[:8]  # Maksimal 8 ta hub

    def _calculate_transit_variant(self, hub_code: str) -> Optional[Dict]:
        """Tranzit variant hisoblash"""
        hub = self.cities.get(hub_code)
        if not hub:
            return None

        nights_at_hub = 1
        dest_nights = self.nights - nights_at_hub

        # Parvozlar
        seg1 = self._get_flight_info(self.origin.iata_code, hub_code, self.departure_date)
        hub_departure = self.departure_date + timedelta(days=nights_at_hub)
        seg2 = self._get_flight_info(hub_code, self.destination.iata_code, hub_departure)
        seg3 = self._get_flight_info(self.destination.iata_code, self.origin.iata_code, self.return_date)

        # Mehmonxonalar
        hub_hotel = self._get_hotel_cost(hub_code, nights_at_hub)
        dest_hotel = self._get_hotel_cost(self.destination.iata_code, dest_nights)

        total_flight = (seg1['price'] + seg2['price'] + seg3['price']) * self.travelers
        total_hotel = float(hub_hotel) + float(dest_hotel)
        total_cost = total_flight + total_hotel

        return {
            'route_type': 'transit',
            'cities_sequence': [self.origin.iata_code, hub_code, self.destination.iata_code],
            'total_flight_cost': float(total_flight),
            'total_hotel_cost': float(total_hotel),
            'total_cost': float(total_cost),
            'total_duration': seg1['duration'] + seg2['duration'] + seg3['duration'],
            'stops': 1,
            'savings_percent': 0,
            'savings_amount': 0,
            'is_recommended': False,
            'score': 0,
            'details': {
                'segments': [
                    {
                        'from': self.origin.iata_code,
                        'from_name': self._get_city_name(self.origin.iata_code),
                        'to': hub_code,
                        'to_name': self._get_city_name(hub_code),
                        'price': seg1['price'],
                        'airline': seg1['airline'],
                        'duration': seg1['duration'],
                        'date': str(self.departure_date),
                        'type': 'outbound',
                        'data_source': seg1.get('data_source', 'unknown'),
                        'link': seg1.get('link', ''),
                    },
                    {
                        'from': hub_code,
                        'from_name': self._get_city_name(hub_code),
                        'to': self.destination.iata_code,
                        'to_name': self._get_city_name(self.destination.iata_code),
                        'price': seg2['price'],
                        'airline': seg2['airline'],
                        'duration': seg2['duration'],
                        'date': str(hub_departure),
                        'type': 'transit',
                        'data_source': seg2.get('data_source', 'unknown'),
                        'link': seg2.get('link', ''),
                    },
                    {
                        'from': self.destination.iata_code,
                        'from_name': self._get_city_name(self.destination.iata_code),
                        'to': self.origin.iata_code,
                        'to_name': self._get_city_name(self.origin.iata_code),
                        'price': seg3['price'],
                        'airline': seg3['airline'],
                        'duration': seg3['duration'],
                        'date': str(self.return_date),
                        'type': 'inbound',
                        'data_source': seg3.get('data_source', 'unknown'),
                        'link': seg3.get('link', ''),
                    }
                ],
                'hotels': [
                    {
                        'city': hub_code,
                        'city_name': self._get_city_name(hub_code),
                        'nights': nights_at_hub,
                        'price_per_night': float(hub_hotel / nights_at_hub) if nights_at_hub > 0 else 0,
                        'total_price': float(hub_hotel),
                        'stars': self.hotel_stars
                    },
                    {
                        'city': self.destination.iata_code,
                        'city_name': self._get_city_name(self.destination.iata_code),
                        'nights': dest_nights,
                        'price_per_night': float(dest_hotel / dest_nights) if dest_nights > 0 else 0,
                        'total_price': float(dest_hotel),
                        'stars': self.hotel_stars
                    }
                ],
                'hub_city': {
                    'code': hub_code,
                    'name': self._get_city_name(hub_code),
                    'country': hub.country.name_uz if hub and hub.country else '',
                    'flag': hub.country.flag_emoji if hub and hub.country else ''
                },
                'bonus': f"2 ta mamlakatni ko'rasiz! {self._get_city_name(hub_code)} shahriga tashrif buyuring.",
                'countries_count': 2
            }
        }

    def _find_smart_multi_city(self) -> List[Dict]:
        """Aqlli ko'p shaharli marshrutlar - optimallashtirilgan"""
        variants = []

        # Faqat eng mashhur kombinatsiyalar (tez)
        popular_combos = [
            ('DXB', 'IST'),
            ('IST', 'DXB'),
            ('DOH', 'BKK'),
        ]

        for hub1, hub2 in popular_combos:
            if hub1 in [self.origin.iata_code, self.destination.iata_code]:
                continue
            if hub2 in [self.origin.iata_code, self.destination.iata_code]:
                continue

            variant = self._calculate_multi_city_variant(hub1, hub2)
            if variant:
                variants.append(variant)
                if len(variants) >= 2:  # Maksimal 2 ta multi-city
                    break

        return variants

    def _estimate_multi_city_cost(self, hub1: str, hub2: str) -> float:
        """Ko'p shaharli marshrut narxini taxmin qilish"""
        cost = 0
        cost += self._get_flight_info(self.origin.iata_code, hub1, self.departure_date)['price']
        cost += self._get_flight_info(hub1, hub2, self.departure_date)['price']
        cost += self._get_flight_info(hub2, self.destination.iata_code, self.departure_date)['price']
        cost += self._get_flight_info(self.destination.iata_code, self.origin.iata_code, self.return_date)['price']
        return cost

    def _calculate_multi_city_variant(self, hub1: str, hub2: str) -> Optional[Dict]:
        """Ko'p shaharli variant hisoblash"""
        hub1_city = self.cities.get(hub1)
        hub2_city = self.cities.get(hub2)
        if not hub1_city or not hub2_city:
            return None

        nights_per_city = max(1, self.nights // 3)
        dest_nights = self.nights - (nights_per_city * 2)

        # Parvozlar
        seg1 = self._get_flight_info(self.origin.iata_code, hub1, self.departure_date)
        hub1_departure = self.departure_date + timedelta(days=nights_per_city)
        seg2 = self._get_flight_info(hub1, hub2, hub1_departure)
        hub2_departure = hub1_departure + timedelta(days=nights_per_city)
        seg3 = self._get_flight_info(hub2, self.destination.iata_code, hub2_departure)
        seg4 = self._get_flight_info(self.destination.iata_code, self.origin.iata_code, self.return_date)

        # Mehmonxonalar
        hub1_hotel = self._get_hotel_cost(hub1, nights_per_city)
        hub2_hotel = self._get_hotel_cost(hub2, nights_per_city)
        dest_hotel = self._get_hotel_cost(self.destination.iata_code, dest_nights)

        total_flight = (seg1['price'] + seg2['price'] + seg3['price'] + seg4['price']) * self.travelers
        total_hotel = float(hub1_hotel) + float(hub2_hotel) + float(dest_hotel)
        total_cost = total_flight + total_hotel

        return {
            'route_type': 'multi',
            'cities_sequence': [self.origin.iata_code, hub1, hub2, self.destination.iata_code],
            'total_flight_cost': float(total_flight),
            'total_hotel_cost': float(total_hotel),
            'total_cost': float(total_cost),
            'total_duration': seg1['duration'] + seg2['duration'] + seg3['duration'] + seg4['duration'],
            'stops': 2,
            'savings_percent': 0,
            'savings_amount': 0,
            'is_recommended': False,
            'score': 0,
            'details': {
                'segments': [
                    {
                        'from': self.origin.iata_code,
                        'from_name': self._get_city_name(self.origin.iata_code),
                        'to': hub1,
                        'to_name': self._get_city_name(hub1),
                        'price': seg1['price'],
                        'airline': seg1['airline'],
                        'duration': seg1['duration'],
                        'date': str(self.departure_date),
                        'type': 'outbound',
                        'data_source': seg1.get('data_source', 'unknown'),
                        'link': seg1.get('link', ''),
                    },
                    {
                        'from': hub1,
                        'from_name': self._get_city_name(hub1),
                        'to': hub2,
                        'to_name': self._get_city_name(hub2),
                        'price': seg2['price'],
                        'airline': seg2['airline'],
                        'duration': seg2['duration'],
                        'date': str(hub1_departure),
                        'type': 'transit',
                        'data_source': seg2.get('data_source', 'unknown'),
                        'link': seg2.get('link', ''),
                    },
                    {
                        'from': hub2,
                        'from_name': self._get_city_name(hub2),
                        'to': self.destination.iata_code,
                        'to_name': self._get_city_name(self.destination.iata_code),
                        'price': seg3['price'],
                        'airline': seg3['airline'],
                        'duration': seg3['duration'],
                        'date': str(hub2_departure),
                        'type': 'transit',
                        'data_source': seg3.get('data_source', 'unknown'),
                        'link': seg3.get('link', ''),
                    },
                    {
                        'from': self.destination.iata_code,
                        'from_name': self._get_city_name(self.destination.iata_code),
                        'to': self.origin.iata_code,
                        'to_name': self._get_city_name(self.origin.iata_code),
                        'price': seg4['price'],
                        'airline': seg4['airline'],
                        'duration': seg4['duration'],
                        'date': str(self.return_date),
                        'type': 'inbound',
                        'data_source': seg4.get('data_source', 'unknown'),
                        'link': seg4.get('link', ''),
                    }
                ],
                'hotels': [
                    {
                        'city': hub1,
                        'city_name': self._get_city_name(hub1),
                        'nights': nights_per_city,
                        'price_per_night': float(hub1_hotel / nights_per_city) if nights_per_city > 0 else 0,
                        'total_price': float(hub1_hotel),
                        'stars': self.hotel_stars
                    },
                    {
                        'city': hub2,
                        'city_name': self._get_city_name(hub2),
                        'nights': nights_per_city,
                        'price_per_night': float(hub2_hotel / nights_per_city) if nights_per_city > 0 else 0,
                        'total_price': float(hub2_hotel),
                        'stars': self.hotel_stars
                    },
                    {
                        'city': self.destination.iata_code,
                        'city_name': self._get_city_name(self.destination.iata_code),
                        'nights': dest_nights,
                        'price_per_night': float(dest_hotel / dest_nights) if dest_nights > 0 else 0,
                        'total_price': float(dest_hotel),
                        'stars': self.hotel_stars
                    }
                ],
                'countries_count': 3,
                'bonus': f"3 ta mamlakatni ko'rasiz! {self._get_city_name(hub1)} va {self._get_city_name(hub2)} orqali ajoyib sayohat."
            }
        }

    def _get_flight_info(self, origin: str, dest: str, date) -> Dict:
        """Parvoz ma'lumotlarini olish - Real API yoki lokal bazadan"""

        # 0. Real vaqtda narxlar (agar yoqilgan bo'lsa)
        if self.use_live_prices:
            cache_key = (origin, dest, str(date))
            if cache_key in self._live_prices_cache:
                return self._live_prices_cache[cache_key]

            try:
                flights = travelpayouts_api.search_flights(origin, dest, date)
                if flights:
                    cheapest = min(flights, key=lambda x: x['price'])
                    result = {
                        'price': cheapest['price'],
                        'airline': cheapest.get('airline', 'Aviakompaniya'),
                        'duration': cheapest.get('duration', 240),
                        'data_source': 'live_api',
                        'link': cheapest.get('link', ''),
                    }
                    self._live_prices_cache[cache_key] = result
                    logger.info(f"Live API: {origin}->{dest} = ${cheapest['price']}")
                    return result
            except Exception as e:
                logger.warning(f"Live API xatosi: {e}")

        # 1. Graf dan olish (eng tez - keshdan)
        for neighbor, price, duration, airline in self.graph.get(origin, []):
            if neighbor == dest:
                return {'price': price, 'airline': airline, 'duration': duration, 'data_source': 'graph_cache'}

        # 2. Lokal bazadan qidirish (aniq sana)
        flight = FlightPrice.objects.filter(
            origin__iata_code=origin,
            destination__iata_code=dest,
            departure_date=date
        ).order_by('price_usd').first()

        if flight:
            return {
                'price': float(flight.price_usd),
                'airline': flight.airline,
                'duration': flight.flight_duration_minutes,
                'data_source': 'database',
            }

        # 3. O'rtacha narxni tekshirish
        key = (origin, dest)
        if key in self._avg_prices_cache:
            return self._avg_prices_cache[key]

        avg_price = FlightPrice.objects.filter(
            origin__iata_code=origin,
            destination__iata_code=dest
        ).aggregate(avg=Avg('price_usd'))['avg']

        if avg_price:
            result = {'price': float(avg_price), 'airline': 'Aviakompaniya', 'duration': 240, 'data_source': 'database_avg'}
            self._avg_prices_cache[key] = result
            return result

        return {'price': 200, 'airline': 'Aviakompaniya', 'duration': 240, 'data_source': 'fallback'}

    def _get_hotel_cost(self, city_code: str, nights: int) -> Decimal:
        """Mehmonxona narxini olish - Faqat lokal bazadan (tez)"""
        if nights <= 0:
            return Decimal('0')

        # 1. Keshdan tekshirish
        cache_key = (city_code, self.hotel_stars)
        if hasattr(self, '_hotel_cache') and cache_key in self._hotel_cache:
            return self._hotel_cache[cache_key] * nights

        # 2. Lokal bazadan qidirish
        hotel = HotelPrice.objects.filter(
            city__iata_code=city_code,
            stars__gte=self.hotel_stars
        ).order_by('price_per_night_usd').first()

        if hotel:
            if not hasattr(self, '_hotel_cache'):
                self._hotel_cache = {}
            self._hotel_cache[cache_key] = hotel.price_per_night_usd
            return hotel.price_per_night_usd * nights

        # 3. Taxminiy narxlar (hostel va mehmonxona turlari bo'yicha)
        fallback_prices = {
            'IST': {1: 15, 2: 30, 3: 55, 4: 95, 5: 180},
            'DXB': {1: 20, 2: 35, 3: 45, 4: 85, 5: 200},
            'DOH': {1: 25, 2: 40, 3: 60, 4: 110, 5: 200},
            'BKK': {1: 8, 2: 15, 3: 25, 4: 65, 5: 150},
            'KUL': {1: 10, 2: 20, 3: 35, 4: 80, 5: 150},
            'SIN': {1: 25, 2: 45, 3: 70, 4: 150, 5: 300},
            'CAI': {1: 10, 2: 20, 3: 35, 4: 90, 5: 180},
            'TAS': {1: 12, 2: 25, 3: 40, 4: 70, 5: 120},
        }

        city_fallback = fallback_prices.get(city_code, {1: 15, 2: 30, 3: 50, 4: 100, 5: 200})
        price_per_night = city_fallback.get(self.hotel_stars, 50)

        if not hasattr(self, '_hotel_cache'):
            self._hotel_cache = {}
        self._hotel_cache[cache_key] = Decimal(str(price_per_night))
        return Decimal(str(price_per_night)) * nights

    def _get_city_name(self, code: str) -> str:
        """Shahar nomini olish"""
        city = self.cities.get(code)
        return city.name_uz if city else code

    def _remove_duplicates(self, variants: List[Dict]) -> List[Dict]:
        """Dublikat variantlarni olib tashlash"""
        seen = set()
        unique = []

        for v in variants:
            key = tuple(v['cities_sequence'])
            if key not in seen:
                seen.add(key)
                unique.append(v)

        return unique

    def _calculate_savings(self, variants: List[Dict]):
        """Tejamkorlikni hisoblash"""
        direct = next((v for v in variants if v['route_type'] == 'direct'), None)
        if not direct:
            return

        baseline = direct['total_cost']
        for variant in variants:
            if variant['route_type'] != 'direct':
                savings = baseline - variant['total_cost']
                variant['savings_amount'] = float(savings)
                if baseline > 0:
                    variant['savings_percent'] = float((savings / baseline) * 100)

    def _calculate_advanced_score(self, variant: Dict, mode: str) -> float:
        """Ilg'or baholash algoritmi"""
        score = 0

        # Narx balli (0-40)
        cost = variant['total_cost']
        if self.budget_max:
            cost_ratio = cost / self.budget_max
            cost_score = max(0, 40 * (1 - cost_ratio))
        else:
            cost_score = max(0, 40 - (cost / 50))
        score += cost_score

        # Vaqt balli (0-25)
        duration = variant.get('total_duration', 0)
        time_score = max(0, 25 - (duration / 60))  # Har bir soat uchun 1 ball kamaytirish
        score += time_score

        # To'xtashlar balli (0-20)
        stops = variant.get('stops', 0)
        stops_score = max(0, 20 - (stops * 8))
        score += stops_score

        # Qulaylik balli (0-15)
        comfort_score = 15
        if variant['route_type'] == 'direct':
            comfort_score = 15
        elif variant['route_type'] == 'transit':
            comfort_score = 10
        elif variant['route_type'] == 'multi':
            comfort_score = 5
        score += comfort_score

        # Rejimga qarab vaznlarni o'zgartirish
        if mode == self.MODE_CHEAPEST:
            score = cost_score * 2 + time_score * 0.5 + stops_score + comfort_score * 0.5
        elif mode == self.MODE_FASTEST:
            score = cost_score * 0.5 + time_score * 2 + stops_score * 1.5 + comfort_score
        elif mode == self.MODE_COMFORT:
            score = cost_score * 0.5 + time_score + stops_score * 1.5 + comfort_score * 2

        return round(score, 2)

    def _mark_recommended(self, variants: List[Dict], mode: str):
        """Tavsiya etiladigan variantni belgilash"""
        if not variants:
            return

        # Rejimga qarab eng yaxshisini tanlash
        if mode == self.MODE_CHEAPEST:
            best = min(variants, key=lambda x: x['total_cost'])
        elif mode == self.MODE_FASTEST:
            best = min(variants, key=lambda x: x.get('total_duration', 9999))
        else:
            best = max(variants, key=lambda x: x['score'])

        # Agar tejamkorlik 10% dan ko'p bo'lsa, uni tavsiya qilish
        for v in variants:
            if v.get('savings_percent', 0) >= 10 and v['score'] >= best['score'] * 0.9:
                v['is_recommended'] = True
                return

        best['is_recommended'] = True

    def save_variants(self, variants: List[Dict]) -> List[RouteVariant]:
        """Variantlarni bazaga saqlash"""
        saved = []
        for v in variants:
            route = RouteVariant.objects.create(
                search=self.search,
                route_type=v['route_type'],
                cities_sequence=v['cities_sequence'],
                total_flight_cost=v['total_flight_cost'],
                total_hotel_cost=v['total_hotel_cost'],
                total_cost=v['total_cost'],
                savings_percent=v.get('savings_percent', 0),
                savings_amount=v.get('savings_amount', 0),
                is_recommended=v.get('is_recommended', False),
                score=v.get('score', 0),
                details=v.get('details', {})
            )
            saved.append(route)
        return saved
