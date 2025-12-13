"""
Route Finder Service - Optimal sayohat yo'nalishlarini topish algoritmi

Bu servis quyidagi vazifalarni bajaradi:
1. To'g'ridan-to'g'ri parvozlarni topish
2. Tranzit hub shaharlar orqali variantlarni generatsiya qilish
3. Multi-city variantlarni yaratish (2 ta hub orqali)
4. Narxlarni hisoblash (aviabilet + mehmonxona)
5. Tejamkorlikni hisoblash
6. Eng yaxshi variantni tavsiya qilish
"""

from decimal import Decimal
from datetime import timedelta
from django.db.models import Min, Avg
from apps.destinations.models import City
from apps.pricing.models import FlightPrice, HotelPrice
from apps.search.models import TravelSearch, RouteVariant


# Tranzit hub shaharlar
HUB_CITIES = ['DXB', 'IST', 'DOH', 'AUH', 'BKK', 'KUL', 'SIN']


class RouteFinder:
    """Optimal yo'nalish topuvchi"""

    def __init__(self, search: TravelSearch):
        self.search = search
        self.origin = search.origin
        self.destination = search.destination
        self.departure_date = search.departure_date
        self.return_date = search.return_date
        self.nights = search.nights
        self.travelers = search.travelers
        self.hotel_stars = search.hotel_stars
        self.budget_max = search.budget_max_usd

    def find_all_routes(self):
        """Barcha variantlarni topish"""
        variants = []

        # 1. To'g'ridan-to'g'ri parvoz
        direct = self._find_direct_route()
        if direct:
            variants.append(direct)

        # 2. Tranzit variantlar (1 ta hub orqali)
        transit_variants = self._find_transit_routes()
        variants.extend(transit_variants)

        # 3. Multi-city variantlar (2 ta hub orqali)
        if self.search.include_transit:
            multi_variants = self._find_multi_city_routes()
            variants.extend(multi_variants)

        # Tejamkorlikni hisoblash
        if direct and variants:
            direct_cost = direct['total_cost']
            for variant in variants:
                if variant['route_type'] != 'direct':
                    savings = direct_cost - variant['total_cost']
                    variant['savings_amount'] = float(savings)
                    if direct_cost > 0:
                        variant['savings_percent'] = float((savings / direct_cost) * 100)

        # Eng yaxshi variantni belgilash
        self._mark_recommended(variants)

        return variants

    def _find_direct_route(self):
        """To'g'ridan-to'g'ri parvoz topish"""
        # Borib kelish parvozi
        outbound = self._get_cheapest_flight(
            self.origin.iata_code,
            self.destination.iata_code,
            self.departure_date
        )

        inbound = self._get_cheapest_flight(
            self.destination.iata_code,
            self.origin.iata_code,
            self.return_date
        )

        if not outbound or not inbound:
            # Agar parvoz topilmasa, o'rtacha narx ishlatamiz
            outbound = self._estimate_flight_price(
                self.origin.iata_code,
                self.destination.iata_code
            )
            inbound = self._estimate_flight_price(
                self.destination.iata_code,
                self.origin.iata_code
            )

        # Mehmonxona narxi
        hotel_cost = self._get_hotel_cost(
            self.destination.iata_code,
            self.nights
        )

        total_flight = (outbound['price'] + inbound['price']) * self.travelers
        total_hotel = float(hotel_cost)
        total_cost = total_flight + total_hotel

        return {
            'route_type': 'direct',
            'cities_sequence': [self.origin.iata_code, self.destination.iata_code],
            'total_flight_cost': float(total_flight),
            'total_hotel_cost': float(total_hotel),
            'total_cost': float(total_cost),
            'savings_percent': 0,
            'savings_amount': 0,
            'is_recommended': False,
            'score': self._calculate_score(total_cost, 0, 1),
            'details': {
                'segments': [
                    {
                        'from': self.origin.iata_code,
                        'from_name': self.origin.name_uz,
                        'to': self.destination.iata_code,
                        'to_name': self.destination.name_uz,
                        'price': outbound['price'],
                        'airline': outbound.get('airline', 'Aviakompaniya'),
                        'duration': outbound.get('duration', 180),
                        'date': str(self.departure_date),
                        'type': 'outbound'
                    },
                    {
                        'from': self.destination.iata_code,
                        'from_name': self.destination.name_uz,
                        'to': self.origin.iata_code,
                        'to_name': self.origin.name_uz,
                        'price': inbound['price'],
                        'airline': inbound.get('airline', 'Aviakompaniya'),
                        'duration': inbound.get('duration', 180),
                        'date': str(self.return_date),
                        'type': 'inbound'
                    }
                ],
                'hotels': [
                    {
                        'city': self.destination.iata_code,
                        'city_name': self.destination.name_uz,
                        'nights': self.nights,
                        'price_per_night': float(hotel_cost / self.nights) if self.nights > 0 else 0,
                        'total_price': float(hotel_cost),
                        'stars': self.hotel_stars
                    }
                ]
            }
        }

    def _find_transit_routes(self):
        """Tranzit yo'nalishlarni topish (1 ta hub orqali)"""
        variants = []
        hubs = City.objects.filter(iata_code__in=HUB_CITIES, is_hub=True)

        for hub in hubs:
            if hub.iata_code in [self.origin.iata_code, self.destination.iata_code]:
                continue

            variant = self._calculate_transit_route(hub, nights_at_hub=1)
            if variant:
                variants.append(variant)

        return sorted(variants, key=lambda x: x['total_cost'])[:3]

    def _find_multi_city_routes(self):
        """Multi-city yo'nalishlarni topish (2 ta hub orqali)"""
        variants = []
        hubs = City.objects.filter(iata_code__in=HUB_CITIES, is_hub=True)

        for hub1 in hubs:
            for hub2 in hubs:
                if hub1 == hub2:
                    continue
                if hub1.iata_code in [self.origin.iata_code, self.destination.iata_code]:
                    continue
                if hub2.iata_code in [self.origin.iata_code, self.destination.iata_code]:
                    continue

                variant = self._calculate_multi_city_route(hub1, hub2)
                if variant:
                    variants.append(variant)

        return sorted(variants, key=lambda x: x['total_cost'])[:2]

    def _calculate_transit_route(self, hub, nights_at_hub=1):
        """Tranzit yo'nalishni hisoblash"""
        # Segment 1: Origin -> Hub
        seg1 = self._get_cheapest_flight(
            self.origin.iata_code,
            hub.iata_code,
            self.departure_date
        ) or self._estimate_flight_price(self.origin.iata_code, hub.iata_code)

        # Segment 2: Hub -> Destination
        hub_departure = self.departure_date + timedelta(days=nights_at_hub)
        seg2 = self._get_cheapest_flight(
            hub.iata_code,
            self.destination.iata_code,
            hub_departure
        ) or self._estimate_flight_price(hub.iata_code, self.destination.iata_code)

        # Segment 3: Destination -> Origin (qaytish)
        seg3 = self._get_cheapest_flight(
            self.destination.iata_code,
            self.origin.iata_code,
            self.return_date
        ) or self._estimate_flight_price(self.destination.iata_code, self.origin.iata_code)

        # Mehmonxonalar
        hub_hotel = self._get_hotel_cost(hub.iata_code, nights_at_hub)
        dest_nights = self.nights - nights_at_hub
        dest_hotel = self._get_hotel_cost(self.destination.iata_code, dest_nights)

        total_flight = (seg1['price'] + seg2['price'] + seg3['price']) * self.travelers
        total_hotel = float(hub_hotel) + float(dest_hotel)
        total_cost = total_flight + total_hotel

        return {
            'route_type': 'transit',
            'cities_sequence': [
                self.origin.iata_code,
                hub.iata_code,
                self.destination.iata_code
            ],
            'total_flight_cost': float(total_flight),
            'total_hotel_cost': float(total_hotel),
            'total_cost': float(total_cost),
            'savings_percent': 0,
            'savings_amount': 0,
            'is_recommended': False,
            'score': self._calculate_score(total_cost, 1, 2),
            'details': {
                'segments': [
                    {
                        'from': self.origin.iata_code,
                        'from_name': self.origin.name_uz,
                        'to': hub.iata_code,
                        'to_name': hub.name_uz,
                        'price': seg1['price'],
                        'airline': seg1.get('airline', 'Aviakompaniya'),
                        'duration': seg1.get('duration', 240),
                        'date': str(self.departure_date),
                        'type': 'outbound'
                    },
                    {
                        'from': hub.iata_code,
                        'from_name': hub.name_uz,
                        'to': self.destination.iata_code,
                        'to_name': self.destination.name_uz,
                        'price': seg2['price'],
                        'airline': seg2.get('airline', 'Aviakompaniya'),
                        'duration': seg2.get('duration', 240),
                        'date': str(hub_departure),
                        'type': 'transit'
                    },
                    {
                        'from': self.destination.iata_code,
                        'from_name': self.destination.name_uz,
                        'to': self.origin.iata_code,
                        'to_name': self.origin.name_uz,
                        'price': seg3['price'],
                        'airline': seg3.get('airline', 'Aviakompaniya'),
                        'duration': seg3.get('duration', 240),
                        'date': str(self.return_date),
                        'type': 'inbound'
                    }
                ],
                'hotels': [
                    {
                        'city': hub.iata_code,
                        'city_name': hub.name_uz,
                        'nights': nights_at_hub,
                        'price_per_night': float(hub_hotel / nights_at_hub) if nights_at_hub > 0 else 0,
                        'total_price': float(hub_hotel),
                        'stars': self.hotel_stars
                    },
                    {
                        'city': self.destination.iata_code,
                        'city_name': self.destination.name_uz,
                        'nights': dest_nights,
                        'price_per_night': float(dest_hotel / dest_nights) if dest_nights > 0 else 0,
                        'total_price': float(dest_hotel),
                        'stars': self.hotel_stars
                    }
                ],
                'hub_city': {
                    'code': hub.iata_code,
                    'name': hub.name_uz,
                    'country': hub.country.name_uz,
                    'flag': hub.country.flag_emoji
                }
            }
        }

    def _calculate_multi_city_route(self, hub1, hub2):
        """Multi-city yo'nalishni hisoblash"""
        nights_per_city = max(1, self.nights // 3)

        # Segment 1: Origin -> Hub1
        seg1 = self._get_cheapest_flight(
            self.origin.iata_code,
            hub1.iata_code,
            self.departure_date
        ) or self._estimate_flight_price(self.origin.iata_code, hub1.iata_code)

        # Segment 2: Hub1 -> Hub2
        hub1_departure = self.departure_date + timedelta(days=nights_per_city)
        seg2 = self._get_cheapest_flight(
            hub1.iata_code,
            hub2.iata_code,
            hub1_departure
        ) or self._estimate_flight_price(hub1.iata_code, hub2.iata_code)

        # Segment 3: Hub2 -> Destination
        hub2_departure = hub1_departure + timedelta(days=nights_per_city)
        seg3 = self._get_cheapest_flight(
            hub2.iata_code,
            self.destination.iata_code,
            hub2_departure
        ) or self._estimate_flight_price(hub2.iata_code, self.destination.iata_code)

        # Segment 4: Destination -> Origin
        seg4 = self._get_cheapest_flight(
            self.destination.iata_code,
            self.origin.iata_code,
            self.return_date
        ) or self._estimate_flight_price(self.destination.iata_code, self.origin.iata_code)

        # Mehmonxonalar
        dest_nights = self.nights - (nights_per_city * 2)
        hub1_hotel = self._get_hotel_cost(hub1.iata_code, nights_per_city)
        hub2_hotel = self._get_hotel_cost(hub2.iata_code, nights_per_city)
        dest_hotel = self._get_hotel_cost(self.destination.iata_code, dest_nights)

        total_flight = (seg1['price'] + seg2['price'] + seg3['price'] + seg4['price']) * self.travelers
        total_hotel = float(hub1_hotel) + float(hub2_hotel) + float(dest_hotel)
        total_cost = total_flight + total_hotel

        return {
            'route_type': 'multi',
            'cities_sequence': [
                self.origin.iata_code,
                hub1.iata_code,
                hub2.iata_code,
                self.destination.iata_code
            ],
            'total_flight_cost': float(total_flight),
            'total_hotel_cost': float(total_hotel),
            'total_cost': float(total_cost),
            'savings_percent': 0,
            'savings_amount': 0,
            'is_recommended': False,
            'score': self._calculate_score(total_cost, 2, 3),
            'details': {
                'segments': [
                    {
                        'from': self.origin.iata_code,
                        'from_name': self.origin.name_uz,
                        'to': hub1.iata_code,
                        'to_name': hub1.name_uz,
                        'price': seg1['price'],
                        'airline': seg1.get('airline', 'Aviakompaniya'),
                        'duration': seg1.get('duration', 240),
                        'date': str(self.departure_date),
                        'type': 'outbound'
                    },
                    {
                        'from': hub1.iata_code,
                        'from_name': hub1.name_uz,
                        'to': hub2.iata_code,
                        'to_name': hub2.name_uz,
                        'price': seg2['price'],
                        'airline': seg2.get('airline', 'Aviakompaniya'),
                        'duration': seg2.get('duration', 180),
                        'date': str(hub1_departure),
                        'type': 'transit'
                    },
                    {
                        'from': hub2.iata_code,
                        'from_name': hub2.name_uz,
                        'to': self.destination.iata_code,
                        'to_name': self.destination.name_uz,
                        'price': seg3['price'],
                        'airline': seg3.get('airline', 'Aviakompaniya'),
                        'duration': seg3.get('duration', 240),
                        'date': str(hub2_departure),
                        'type': 'transit'
                    },
                    {
                        'from': self.destination.iata_code,
                        'from_name': self.destination.name_uz,
                        'to': self.origin.iata_code,
                        'to_name': self.origin.name_uz,
                        'price': seg4['price'],
                        'airline': seg4.get('airline', 'Aviakompaniya'),
                        'duration': seg4.get('duration', 240),
                        'date': str(self.return_date),
                        'type': 'inbound'
                    }
                ],
                'hotels': [
                    {
                        'city': hub1.iata_code,
                        'city_name': hub1.name_uz,
                        'nights': nights_per_city,
                        'price_per_night': float(hub1_hotel / nights_per_city) if nights_per_city > 0 else 0,
                        'total_price': float(hub1_hotel),
                        'stars': self.hotel_stars
                    },
                    {
                        'city': hub2.iata_code,
                        'city_name': hub2.name_uz,
                        'nights': nights_per_city,
                        'price_per_night': float(hub2_hotel / nights_per_city) if nights_per_city > 0 else 0,
                        'total_price': float(hub2_hotel),
                        'stars': self.hotel_stars
                    },
                    {
                        'city': self.destination.iata_code,
                        'city_name': self.destination.name_uz,
                        'nights': dest_nights,
                        'price_per_night': float(dest_hotel / dest_nights) if dest_nights > 0 else 0,
                        'total_price': float(dest_hotel),
                        'stars': self.hotel_stars
                    }
                ],
                'countries_count': 3,
                'bonus': f"{3} ta mamlakatni ko'rasiz!"
            }
        }

    def _get_cheapest_flight(self, origin_code, dest_code, date):
        """Eng arzon parvozni topish"""
        flight = FlightPrice.objects.filter(
            origin__iata_code=origin_code,
            destination__iata_code=dest_code,
            departure_date=date
        ).order_by('price_usd').first()

        if flight:
            return {
                'price': float(flight.price_usd),
                'airline': flight.airline,
                'duration': flight.flight_duration_minutes
            }
        return None

    def _estimate_flight_price(self, origin_code, dest_code):
        """Parvoz narxini taxmin qilish"""
        # Avval o'rtacha narxni tekshirish
        avg_price = FlightPrice.objects.filter(
            origin__iata_code=origin_code,
            destination__iata_code=dest_code
        ).aggregate(avg=Avg('price_usd'))['avg']

        if avg_price:
            return {'price': float(avg_price), 'airline': 'Aviakompaniya', 'duration': 240}

        # Aks holda standart narx
        base_prices = {
            ('TAS', 'IST'): 250,
            ('TAS', 'DXB'): 200,
            ('TAS', 'DOH'): 220,
            ('DXB', 'IST'): 150,
            ('DOH', 'IST'): 160,
        }

        key = (origin_code, dest_code)
        reverse_key = (dest_code, origin_code)

        if key in base_prices:
            return {'price': base_prices[key], 'airline': 'Aviakompaniya', 'duration': 240}
        elif reverse_key in base_prices:
            return {'price': base_prices[reverse_key], 'airline': 'Aviakompaniya', 'duration': 240}

        return {'price': 200, 'airline': 'Aviakompaniya', 'duration': 240}

    def _get_hotel_cost(self, city_code, nights):
        """Mehmonxona narxini hisoblash"""
        if nights <= 0:
            return Decimal('0')

        # Bazadan eng arzon mehmonxona
        hotel = HotelPrice.objects.filter(
            city__iata_code=city_code,
            stars__gte=self.hotel_stars
        ).order_by('price_per_night_usd').first()

        if hotel:
            return hotel.price_per_night_usd * nights

        # Shahar o'rtacha narxi
        city = City.objects.filter(iata_code=city_code).first()
        if city:
            return city.avg_hotel_price_usd * nights

        return Decimal('50') * nights

    def _calculate_score(self, total_cost, stops, days_count):
        """Variant ballini hisoblash"""
        # Kam narx = yuqori ball
        cost_score = max(0, 100 - (total_cost / 20))
        # Kam to'xtash = yuqori ball
        stops_score = max(0, 30 - (stops * 10))
        # Ko'p kun = bonus
        days_bonus = min(days_count * 5, 20)

        return cost_score + stops_score + days_bonus

    def _mark_recommended(self, variants):
        """Eng yaxshi variantni belgilash"""
        if not variants:
            return

        # Eng yuqori ballli variant
        best = max(variants, key=lambda x: x.get('score', 0))

        # Agar tranzit variant 10% dan ko'p tejasa, uni tavsiya qilish
        for variant in variants:
            if variant['route_type'] != 'direct':
                if variant.get('savings_percent', 0) >= 10:
                    if variant['score'] >= best['score'] * 0.9:
                        variant['is_recommended'] = True
                        return

        best['is_recommended'] = True

    def save_variants(self, variants):
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
