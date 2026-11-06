"""
Route Optimizer Service - Multimodal marshrut optimallashtirish

Bitta graf: tugun = shahar, qirra = samolyot (FlightPrice, taxminiy, jonli API)
yoki yer transporti (TransportLeg: poyezd, avtobus, taksi).
Bitta algoritm: vaznli Dijkstra, score = narx + λ * soat (docs/MULTIMODAL_DESIGN.md, 2-bo'lim).
Barcha variantlar (arzon, muvozanatli, tez, to'g'ridan-to'g'ri, tranzit, multi-city)
shu algoritmdan turli λ, stopover va parvozlar soni cheklovi bilan chiqadi.
"""

import heapq
import logging
from collections import namedtuple
from dataclasses import dataclass, field
from decimal import Decimal
from datetime import timedelta
from typing import List, Dict, Optional, Tuple
from concurrent.futures import ThreadPoolExecutor, as_completed
from django.db.models import Min, Avg
from apps.destinations.models import City, TransportLeg, airport_access
from apps.pricing.models import FlightPrice, HotelPrice
from apps.search.models import TravelSearch, RouteVariant
from services.external_apis import travelpayouts_api, booking_api

logger = logging.getLogger(__name__)

# Parallel API chaqiruvlar uchun thread pool
MAX_WORKERS = 10  # Bir vaqtda maksimum API chaqiruvlar soni

# Graf qirrasi. price - 1 kishi uchun USD, duration/headway - daqiqa
Edge = namedtuple('Edge', 'to mode price duration headway source link airline')

MAX_LEGS = 5        # bir yo'nalishdagi qirralar soni (qolishlar bilan)
DAY_HOURS = 16      # bir kunda yo'lga ketadigan maksimal soat

# Ikki ketma-ket qirra orasida o'tish vaqti (daqiqa) - transport juftligiga bog'liq
TRANSFER_MIN = {
    ('plane', 'plane'): 120,   # bir aeroport ichida
    ('plane', 'train'): 150,   # aeroport → vokzal
    ('plane', 'bus'): 150,
    ('plane', 'car'): 45,
    ('train', 'plane'): 180,   # ro'yxatdan o'tish bilan
    ('train', 'train'): 40,
    ('car', 'plane'): 150,
    ('car', 'train'): 40,
    ('bus', 'plane'): 150,
}
DEFAULT_TRANSFER_MIN = 60


@dataclass(order=True)
class State:
    score: float
    city: str = field(compare=False)
    day: int = field(compare=False)
    prev_mode: str = field(compare=False)     # '' = boshlanish yoki tunab qolgandan keyin
    hours_today: float = field(compare=False)
    price: float = field(compare=False)       # barcha yo'lovchilar uchun
    hours: float = field(compare=False)
    flights: int = field(compare=False)       # samolyot qirralari soni
    stops_done: int = field(compare=False)    # bajarilgan majburiy qolishlar (tartib bilan)
    legs: list = field(compare=False)


class RouteOptimizer:
    """Multimodal marshrut optimallashtiruvchi"""

    # Optimallashtirish rejimlari
    MODE_CHEAPEST = 'cheapest'      # Eng arzon
    MODE_FASTEST = 'fastest'        # Eng tez
    MODE_BALANCED = 'balanced'      # Muvozanatli
    MODE_COMFORT = 'comfort'        # Eng qulay

    # 1 soat necha dollarga teng (score = narx + λ * soat).
    # Tartib muhim: balanced chekka variantlardan biriga teng bo'lsa, dublikat sifatida tushadi.
    LAMBDAS = {'optimal_cheap': 0, 'optimal_fast': 500, 'balanced': 50}
    VIA_LAMBDA = 50  # to'g'ridan-to'g'ri, tranzit va multi-city variantlar uchun

    def __init__(self, search: TravelSearch, use_live_prices: bool = False):
        self.search = search
        self.origin = search.origin
        self.destination = search.destination      # aeroportsiz shahar bo'lishi mumkin
        self.departure_date = search.departure_date
        self.return_date = search.return_date
        self.nights = search.nights
        self.travelers = search.travelers
        self.hotel_stars = search.hotel_stars
        self.budget_max = float(search.budget_max_usd) if search.budget_max_usd else None
        self.use_live_prices = use_live_prices

        # Aeroportsiz manzil uchun jonli narx eng yaqin aeroportgacha olinadi
        access = None if self.destination.iata_code else airport_access(self.destination)
        self.dest_airport = access[0] if access else self.destination

        # Keshlar
        self._hotel_cache = {}
        self._live_prices_cache = {}

        self._build_graph()
        self.origin_key = self._key(self.origin)
        self.dest_key = self._key(self.destination)

        # Parallel API prefetch (agar live prices yoqilgan bo'lsa)
        if self.use_live_prices:
            self._prefetch_flight_prices_parallel()
            self._add_live_edges()

    @staticmethod
    def _key(city: City) -> str:
        """Graf tugunining kaliti: IATA kodi, aeroportsiz shahar uchun id"""
        return city.iata_code or str(city.id)

    def _add_edge(self, frm: str, edge: Edge):
        if frm in self.graph and edge.to in self.graph:  # ikkala shahar ham bazada bo'lsin
            self.graph[frm].append(edge)

    def _has_plane(self, frm: str, to: str) -> bool:
        return any(e.to == to and e.mode == 'plane' for e in self.graph.get(frm, []))

    def _build_graph(self):
        """Samolyot + yer transporti grafini tuzish"""
        self.graph = {}   # {key: [Edge, ...]}
        self.cities = {}  # {key: City}
        for city in City.objects.select_related('country').all():
            k = self._key(city)
            self.cities[k] = city
            self.graph[k] = []

        # 1. Bazadagi parvozlar: yo'nalish bo'yicha minimal narx
        flights = FlightPrice.objects.values(
            'origin__iata_code', 'destination__iata_code'
        ).annotate(min_price=Min('price_usd'), avg_duration=Avg('flight_duration_minutes'))
        for f in flights:
            self._add_edge(f['origin__iata_code'], Edge(
                f['destination__iata_code'], 'plane', float(f['min_price']),
                int(f['avg_duration'] or 240), 0, 'graph_cache', '', '',
            ))

        # Aniq sanadagi eng arzon parvoz: {(qayerdan, qayerga, sana): (narx, aviakompaniya, daqiqa)}
        self._dated = {}
        for f in FlightPrice.objects.values_list(
            'origin__iata_code', 'destination__iata_code', 'departure_date',
            'price_usd', 'airline', 'flight_duration_minutes'
        ).order_by('-price_usd'):
            self._dated[f[:3]] = (float(f[3]), f[4], f[5])

        # 2. Hub shaharlar orasida taxminiy narxlar
        self._add_estimated_routes()

        # 3. Yer transporti (va admin kiritgan taxminiy aviaqirralar)
        for leg in TransportLeg.objects.filter(is_active=True).select_related('from_city', 'to_city'):
            for a, b in leg.directions():
                frm, to = self._key(a), self._key(b)
                if leg.mode == 'plane' and self._has_plane(frm, to):
                    continue  # sanali FlightPrice ustun
                self._add_edge(frm, Edge(to, leg.mode, float(leg.price_usd), leg.duration_min,
                                         leg.headway_min, leg.source, leg.link, leg.get_mode_display()))

    def _add_live_edges(self):
        """Prefetch topgan, lekin grafda yo'q parvozlarni qo'shish"""
        for (frm, to, _), data in self._live_prices_cache.items():
            if not self._has_plane(frm, to):
                self._add_edge(frm, Edge(to, 'plane', data['price'], data['duration'], 0,
                                         'live_api', data.get('link', ''), data.get('airline', '')))

    def _add_estimated_routes(self):
        """Taxminiy marshrutlarni qo'shish"""
        hubs = ['DXB', 'IST', 'DOH', 'AUH', 'BKK', 'KUL', 'SIN', 'JFK', 'LHR', 'CDG', 'FRA', 'AMS']
        major_cities = ['TAS', 'CAI', 'HND', 'ICN', 'PEK', 'PVG', 'HKG', 'SYD', 'MAD', 'FCO', 'YYZ', 'LAX', 'ORD', 'MEX'] + hubs

        estimated_prices = {
            # O'zbekistondan (TAS)
            ('TAS', 'IST'): (250, 300),
            ('TAS', 'DXB'): (200, 270),
            ('TAS', 'DOH'): (220, 300),
            ('TAS', 'BKK'): (350, 420),
            ('TAS', 'KUL'): (400, 480),
            ('TAS', 'SIN'): (450, 540),
            ('TAS', 'CAI'): (300, 360),
            ('TAS', 'JFK'): (650, 900),
            ('TAS', 'LHR'): (450, 600),
            ('TAS', 'CDG'): (480, 600),
            ('TAS', 'FRA'): (420, 540),
            ('TAS', 'AMS'): (450, 570),
            ('TAS', 'HND'): (550, 720),
            ('TAS', 'ICN'): (500, 660),
            ('TAS', 'PEK'): (380, 480),
            ('TAS', 'PVG'): (400, 510),
            ('TAS', 'HKG'): (480, 600),
            ('TAS', 'SYD'): (800, 1080),
            ('TAS', 'MAD'): (500, 630),
            ('TAS', 'FCO'): (480, 600),
            ('TAS', 'YYZ'): (700, 960),
            ('TAS', 'LAX'): (750, 1020),
            ('TAS', 'ORD'): (680, 900),
            ('TAS', 'MEX'): (850, 1140),

            # Dubaydan (DXB)
            ('DXB', 'IST'): (150, 180),
            ('DXB', 'DOH'): (80, 90),
            ('DXB', 'BKK'): (250, 360),
            ('DXB', 'KUL'): (280, 360),
            ('DXB', 'SIN'): (300, 360),
            ('DXB', 'CAI'): (180, 240),
            ('DXB', 'JFK'): (550, 840),
            ('DXB', 'LHR'): (350, 480),
            ('DXB', 'CDG'): (380, 510),
            ('DXB', 'FRA'): (350, 480),
            ('DXB', 'AMS'): (380, 510),
            ('DXB', 'HND'): (500, 720),
            ('DXB', 'ICN'): (480, 660),
            ('DXB', 'PEK'): (450, 600),
            ('DXB', 'PVG'): (480, 630),
            ('DXB', 'HKG'): (400, 540),
            ('DXB', 'SYD'): (650, 900),
            ('DXB', 'MAD'): (350, 480),
            ('DXB', 'FCO'): (320, 450),
            ('DXB', 'YYZ'): (600, 840),
            ('DXB', 'LAX'): (650, 900),
            ('DXB', 'ORD'): (580, 810),
            ('DXB', 'MEX'): (750, 1020),

            # Istanbuldan (IST)
            ('IST', 'DOH'): (160, 210),
            ('IST', 'BKK'): (350, 540),
            ('IST', 'KUL'): (400, 540),
            ('IST', 'SIN'): (420, 540),
            ('IST', 'CAI'): (120, 150),
            ('IST', 'JFK'): (450, 660),
            ('IST', 'LHR'): (150, 210),
            ('IST', 'CDG'): (150, 210),
            ('IST', 'FRA'): (130, 180),
            ('IST', 'AMS'): (160, 210),
            ('IST', 'HND'): (550, 780),
            ('IST', 'ICN'): (500, 720),
            ('IST', 'PEK'): (450, 660),
            ('IST', 'PVG'): (480, 690),
            ('IST', 'HKG'): (450, 660),
            ('IST', 'SYD'): (750, 1080),
            ('IST', 'MAD'): (150, 210),
            ('IST', 'FCO'): (120, 180),
            ('IST', 'YYZ'): (500, 720),
            ('IST', 'LAX'): (550, 780),
            ('IST', 'ORD'): (480, 690),
            ('IST', 'MEX'): (650, 900),

            # Dohadan (DOH)
            ('DOH', 'BKK'): (280, 390),
            ('DOH', 'KUL'): (300, 420),
            ('DOH', 'SIN'): (320, 420),
            ('DOH', 'CAI'): (150, 180),
            ('DOH', 'JFK'): (550, 810),
            ('DOH', 'LHR'): (350, 480),
            ('DOH', 'CDG'): (380, 510),
            ('DOH', 'FRA'): (350, 480),
            ('DOH', 'HND'): (500, 720),
            ('DOH', 'ICN'): (480, 660),
            ('DOH', 'SYD'): (650, 900),

            # Bangkokdan (BKK)
            ('BKK', 'KUL'): (80, 120),
            ('BKK', 'SIN'): (100, 150),
            ('BKK', 'HND'): (280, 390),
            ('BKK', 'ICN'): (250, 360),
            ('BKK', 'PEK'): (300, 420),
            ('BKK', 'PVG'): (280, 390),
            ('BKK', 'HKG'): (180, 270),
            ('BKK', 'SYD'): (400, 570),

            # Kuala-Lumpurdan (KUL)
            ('KUL', 'SIN'): (50, 60),
            ('KUL', 'HND'): (350, 480),
            ('KUL', 'ICN'): (320, 450),
            ('KUL', 'PEK'): (350, 480),
            ('KUL', 'HKG'): (200, 300),
            ('KUL', 'SYD'): (350, 510),

            # Singapurdan (SIN)
            ('SIN', 'HND'): (350, 480),
            ('SIN', 'ICN'): (300, 420),
            ('SIN', 'PEK'): (380, 510),
            ('SIN', 'HKG'): (200, 270),
            ('SIN', 'SYD'): (300, 450),

            # Londondan (LHR)
            ('LHR', 'JFK'): (350, 480),
            ('LHR', 'CDG'): (80, 120),
            ('LHR', 'FRA'): (80, 120),
            ('LHR', 'AMS'): (80, 120),
            ('LHR', 'MAD'): (100, 150),
            ('LHR', 'FCO'): (100, 150),
            ('LHR', 'YYZ'): (400, 540),
            ('LHR', 'LAX'): (450, 600),
            ('LHR', 'ORD'): (400, 540),
            ('LHR', 'HND'): (550, 780),
            ('LHR', 'HKG'): (500, 720),
            ('LHR', 'SYD'): (700, 1020),

            # Parijdan (CDG)
            ('CDG', 'JFK'): (380, 510),
            ('CDG', 'FRA'): (80, 120),
            ('CDG', 'AMS'): (80, 120),
            ('CDG', 'MAD'): (100, 150),
            ('CDG', 'FCO'): (100, 150),
            ('CDG', 'YYZ'): (420, 570),
            ('CDG', 'LAX'): (480, 630),
            ('CDG', 'HND'): (580, 810),

            # Frankfurtdan (FRA)
            ('FRA', 'JFK'): (380, 510),
            ('FRA', 'AMS'): (80, 120),
            ('FRA', 'MAD'): (120, 180),
            ('FRA', 'FCO'): (100, 150),
            ('FRA', 'YYZ'): (400, 540),
            ('FRA', 'LAX'): (480, 630),
            ('FRA', 'HND'): (550, 780),
            ('FRA', 'PEK'): (480, 660),

            # Nyu-Yorkdan (JFK)
            ('JFK', 'LAX'): (200, 330),
            ('JFK', 'ORD'): (150, 240),
            ('JFK', 'YYZ'): (150, 240),
            ('JFK', 'MEX'): (300, 420),
            ('JFK', 'MAD'): (350, 480),
            ('JFK', 'FCO'): (380, 510),
            ('JFK', 'HND'): (700, 960),
            ('JFK', 'ICN'): (650, 900),
            ('JFK', 'PEK'): (600, 840),
            ('JFK', 'HKG'): (650, 900),

            # Los-Anjelesdan (LAX)
            ('LAX', 'ORD'): (150, 270),
            ('LAX', 'YYZ'): (250, 360),
            ('LAX', 'MEX'): (200, 300),
            ('LAX', 'HND'): (500, 720),
            ('LAX', 'ICN'): (480, 660),
            ('LAX', 'PEK'): (500, 690),
            ('LAX', 'HKG'): (550, 750),
            ('LAX', 'SYD'): (600, 870),

            # Tokiodan (HND)
            ('HND', 'ICN'): (150, 180),
            ('HND', 'PEK'): (250, 330),
            ('HND', 'PVG'): (220, 300),
            ('HND', 'HKG'): (280, 390),
            ('HND', 'SYD'): (500, 720),

            # Seuldan (ICN)
            ('ICN', 'PEK'): (180, 240),
            ('ICN', 'PVG'): (180, 240),
            ('ICN', 'HKG'): (280, 390),

            # Pekindan (PEK)
            ('PEK', 'PVG'): (120, 150),
            ('PEK', 'HKG'): (250, 330),

            # Shanxaydan (PVG)
            ('PVG', 'HKG'): (200, 270),

            # Gonkongdan (HKG)
            ('HKG', 'SYD'): (450, 630),

            # Madriddan (MAD)
            ('MAD', 'FCO'): (80, 120),
            ('MAD', 'MEX'): (450, 630),

            # Torontodan (YYZ)
            ('YYZ', 'ORD'): (150, 210),
            ('YYZ', 'MEX'): (350, 480),
        }

        for (origin, dest), (price, duration) in estimated_prices.items():
            for a, b in ((origin, dest), (dest, origin)):
                if not self._has_plane(a, b):  # bazadagi narx ustun
                    self._add_edge(a, Edge(b, 'plane', price, duration, 0, 'estimated', '', ''))

    def _prefetch_flight_prices_parallel(self):
        """Barcha kerakli yo'nalishlar uchun narxlarni parallel olish"""
        import time
        start_time = time.time()

        # Kerakli yo'nalishlarni aniqlash
        routes_to_fetch = set()
        origin_code = self.origin.iata_code
        dest_code = self.dest_airport.iata_code

        # Asosiy yo'nalishlar
        routes_to_fetch.add((origin_code, dest_code, self.departure_date))
        routes_to_fetch.add((dest_code, origin_code, self.return_date))

        # Tranzit hublar orqali yo'nalishlar
        popular_hubs = ['IST', 'DXB', 'DOH', 'FRA', 'LHR', 'CDG', 'FCO', 'AMS', 'VIE', 'SVO']
        for hub in popular_hubs:
            if hub != origin_code and hub != dest_code:
                # Origin -> Hub
                routes_to_fetch.add((origin_code, hub, self.departure_date))
                # Hub -> Destination
                hub_departure = self.departure_date + timedelta(days=max(1, self.nights // 3))
                routes_to_fetch.add((hub, dest_code, hub_departure))

        # Multi-city hublar
        multi_hubs = [
            ('DXB', 'BKK'), ('DOH', 'BKK'), ('IST', 'CAI'),
            ('DXB', 'KUL'), ('DOH', 'SIN'), ('IST', 'BKK')
        ]
        for hub1, hub2 in multi_hubs:
            if hub1 != origin_code and hub2 != dest_code:
                routes_to_fetch.add((origin_code, hub1, self.departure_date))
                hub1_dep = self.departure_date + timedelta(days=max(1, self.nights // 4))
                routes_to_fetch.add((hub1, hub2, hub1_dep))
                hub2_dep = hub1_dep + timedelta(days=max(1, self.nights // 4))
                routes_to_fetch.add((hub2, dest_code, hub2_dep))

        logger.info(f"Prefetch: {len(routes_to_fetch)} ta yo'nalish parallel yuklanmoqda...")

        # Parallel API chaqiruvlar
        def fetch_price(route_info):
            origin, dest, dep_date = route_info
            try:
                flights = travelpayouts_api.search_flights(origin, dest, dep_date, use_cache=True)
                if flights:
                    cheapest = min(flights, key=lambda x: x['price'])
                    return (origin, dest, str(dep_date), {
                        'price': cheapest['price'],
                        'airline': cheapest.get('airline', 'Aviakompaniya'),
                        'duration': cheapest.get('duration', 240),
                        'data_source': 'live_api',
                        'link': cheapest.get('link', ''),
                    })
            except Exception as e:
                logger.warning(f"Prefetch xatosi {origin}->{dest}: {e}")
            return None

        # ThreadPoolExecutor bilan parallel bajarish
        with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
            futures = {executor.submit(fetch_price, route): route for route in routes_to_fetch}

            for future in as_completed(futures):
                result = future.result()
                if result:
                    origin, dest, dep_date, data = result
                    cache_key = (origin, dest, dep_date)
                    # Vaqtlarni qo'shish
                    data['duration'] = self._flight_duration(origin, dest, data['duration'])
                    self._live_prices_cache[cache_key] = data

        elapsed = time.time() - start_time
        logger.info(f"Prefetch yakunlandi: {len(self._live_prices_cache)} ta narx, {elapsed:.2f}s")


    def find_optimal_route(self, mode: str = MODE_BALANCED) -> List[Dict]:
        """Barcha variantlarni bitta shortest_chain bilan topish"""
        variants = []
        start, goal = self.origin_key, self.dest_key

        # 1. To'g'ridan-to'g'ri: har yo'nalishda ko'pi bilan 1 ta parvoz (yer transporti mumkin).
        #    Birinchi turadi: tejamkorlik shunga nisbatan hisoblanadi, bir xil optimal variant dublikat bo'ladi.
        variants.append(self._build_trip('direct', self.VIA_LAMBDA, max_flights=1))

        # 2. Uch xil λ - eng arzon, muvozanatli, eng tez
        for route_type, lam in self.LAMBDAS.items():
            variants.append(self._build_trip(route_type, lam))

        # 3. Hub orqali tranzit: hubda 1 tun
        transit = [self._build_trip('transit', self.VIA_LAMBDA, stopovers=[(hub, 1)])
                   for hub in self._get_dynamic_hubs() if hub not in (start, goal)]
        transit = sorted(filter(None, transit), key=lambda v: v['total_cost'])
        variants.extend(transit[:3])

        # 4. Ko'p shaharli marshrutlar
        if self.search.include_transit and self.nights >= 5:
            per_city = max(1, self.nights // 3)
            multi = 0
            for hub1, hub2 in [('DXB', 'IST'), ('IST', 'DXB'), ('DOH', 'BKK')]:
                if {hub1, hub2} & {start, goal}:
                    continue
                v = self._build_trip('multi', self.VIA_LAMBDA, stopovers=[(hub1, per_city), (hub2, per_city)])
                if v:
                    variants.append(v)
                    multi += 1
                    if multi >= 2:
                        break

        variants = [v for v in variants if v]
        # Hub orqali majburlangan yo'l boshlang'ich shaharga qaytib kelsa (TAS→DXB→TAS→UGC) - ma'nosiz
        variants = [v for v in variants if len(set(v['cities_sequence'])) == len(v['cities_sequence'])]

        # Byudjet cheklovini qo'llash
        if self.budget_max:
            variants = [v for v in variants if v['total_cost'] <= self.budget_max]

        # Dublikatlarni olib tashlash
        variants = self._remove_duplicates(variants)

        # Tejamkorlikni hisoblash
        self._calculate_savings(variants)

        # Baholash va tartiblash
        cheapest = min((v['total_cost'] for v in variants), default=0)
        for variant in variants:
            variant['score'] = self._calculate_advanced_score(variant, mode, cheapest)

        variants.sort(key=lambda x: x['score'], reverse=True)

        # Eng yaxshisini belgilash
        self._mark_recommended(variants, mode)

        return variants

    def shortest_chain(self, start: str, goal: str, start_day: int, lam: float,
                       stopovers: List[Tuple[str, int]] = (), max_flights: Optional[int] = None) -> Optional[State]:
        """
        Vaznli Dijkstra: score = narx + lam * soat.
        Holat = (shahar, kun, oldingi transport, bajarilgan stopoverlar soni).
        stopovers = [(shahar, tunlar), ...] - shu tartibda tunab o'tish majburiy.
        max_flights - samolyot qirralari soni cheklovi (to'g'ridan-to'g'ri variant uchun 1).
        Qaytadi: oxirgi holat (legs, day, price, hours) yoki None.
        """
        if start not in self.graph or goal not in self.graph:
            return None
        heap = [State(0.0, start, start_day, '', 0.0, 0.0, 0.0, 0, 0, [])]
        best = {}

        while heap:
            s = heapq.heappop(heap)
            key = (s.city, s.day, s.prev_mode, s.stops_done)
            if key in best:
                continue
            best[key] = s.score

            if s.city == goal and s.stops_done == len(stopovers):
                return s
            if len(s.legs) >= MAX_LEGS:
                continue

            # 1) Navbatdagi majburiy qolish shu shaharda bo'lsa - tunab qolish qirrasi
            if s.stops_done < len(stopovers) and stopovers[s.stops_done][0] == s.city:
                nights = stopovers[s.stops_done][1]
                hotel = float(self._get_hotel_cost(s.city, nights))
                heapq.heappush(heap, State(
                    s.score + hotel, s.city, s.day + nights, '', 0.0, s.price + hotel, s.hours,
                    s.flights, s.stops_done + 1,
                    s.legs + [{'type': 'stay', 'city': s.city, 'day': s.day, 'nights': nights, 'price': hotel}]))

            # 2) Transport qirralari
            for e in self.graph[s.city]:
                if e.mode == 'plane' and max_flights is not None and s.flights >= max_flights:
                    continue
                transfer = TRANSFER_MIN.get((s.prev_mode, e.mode), DEFAULT_TRANSFER_MIN) if s.prev_mode else 0
                wait = e.headway / 2
                day = s.day
                info = self._leg_info(s.city, e, day)
                leg_hours = (transfer + wait + info['duration']) / 60
                hours_today = s.hours_today + leg_hours
                if hours_today > DAY_HOURS:      # kun tugadi, ertaga davom
                    day += 1
                    hours_today = leg_hours
                    if e.mode == 'plane':        # ertangi parvoz narxi boshqa bo'lishi mumkin
                        info = self._leg_info(s.city, e, day)
                price = s.price + info['price'] * self.travelers
                hours = s.hours + leg_hours
                leg = {**info, 'type': 'transport', 'from': s.city, 'to': e.to, 'mode': e.mode, 'day': day,
                       'wait': round(wait), 'transfer': transfer}
                heapq.heappush(heap, State(
                    price + lam * hours, e.to, day, e.mode, hours_today, price, hours,
                    s.flights + (e.mode == 'plane'), s.stops_done, s.legs + [leg]))
        return None

    def _leg_info(self, frm: str, e: Edge, day: int) -> Dict:
        """Qirraning shu kundagi narxi va ma'lumoti. Jonli API qirra ichida chaqirilmaydi."""
        if e.mode != 'plane':
            return {'price': e.price, 'airline': e.airline, 'duration': e.duration,
                    'data_source': e.source, 'link': e.link}
        date = self.departure_date + timedelta(days=day)
        live = self._live_prices_cache.get((frm, e.to, str(date))) or next(
            (v for k, v in self._live_prices_cache.items() if k[:2] == (frm, e.to)), None)
        if live:
            return {'price': live['price'], 'airline': live.get('airline', 'Aviakompaniya'),
                    'duration': live['duration'], 'data_source': 'live_api', 'link': live.get('link', '')}
        dated = self._dated.get((frm, e.to, date))
        if dated:
            price, airline, duration = dated
            return {'price': price, 'airline': airline, 'duration': self._flight_duration(frm, e.to, duration),
                    'data_source': 'database', 'link': ''}
        return {'price': e.price, 'airline': e.airline or self._get_airline_for_route(frm, e.to),
                'duration': self._flight_duration(frm, e.to, e.duration),
                'data_source': e.source, 'link': e.link}

    def _build_trip(self, route_type: str, lam: float, stopovers: List[Tuple[str, int]] = (),
                    max_flights: Optional[int] = None) -> Optional[Dict]:
        """Borish yo'li + manzildagi tunlar + qaytish yo'li"""
        out = self.shortest_chain(self.origin_key, self.dest_key, 0, lam, list(stopovers), max_flights)
        if not out:
            return None
        dest_nights = self.nights - out.day
        if dest_nights < 1:
            return None  # yo'lda juda ko'p kun ketdi
        back = self._return_chain(lam, max_flights)
        if not back:
            return None
        return self._assemble(route_type, out, dest_nights, back)

    def _return_chain(self, lam: float, max_flights: Optional[int]) -> Optional[State]:
        """Qaytish yo'li - stopoversiz, bir xil parametrlar uchun bir marta hisoblanadi"""
        if not hasattr(self, '_back_cache'):
            self._back_cache = {}
        key = (lam, max_flights)
        if key not in self._back_cache:
            self._back_cache[key] = self.shortest_chain(self.dest_key, self.origin_key, self.nights, lam,
                                                        [], max_flights)
        return self._back_cache[key]

    def _label(self, key: str) -> Tuple[str, str]:
        """Segment uchun (kod, nom). Aeroportsiz shahar: (shahar nomi, mamlakat nomi)"""
        city = self.cities.get(key)
        if not city:
            return key, key
        if city.iata_code:
            return city.iata_code, city.name_uz
        return city.name_uz, city.country.name_uz

    def _hotel_entry(self, key: str, nights: int, total: float) -> Dict:
        return {
            'city': self._label(key)[0],
            'city_name': self._get_city_name(key),
            'nights': nights,
            'price_per_night': total / nights if nights > 0 else 0,
            'total_price': total,
            'stars': self.hotel_stars,
        }

    def _assemble(self, route_type: str, out: State, dest_nights: int, back: State) -> Dict:
        """Dijkstra natijasini variant formatiga o'tkazish (frontend kutgan details.segments)"""
        segments, hotels = [], []
        sequence = [self._label(self.origin_key)[0]]
        first_flight = True

        for direction, chain in (('out', out), ('back', back)):
            for leg in chain.legs:
                if leg['type'] == 'stay':
                    hotels.append(self._hotel_entry(leg['city'], leg['nights'], leg['price']))
                    continue
                if leg['mode'] != 'plane':
                    seg_type = 'ground'
                elif direction == 'back':
                    seg_type = 'inbound'
                else:
                    seg_type = 'outbound' if first_flight else 'transit'
                    first_flight = False
                (frm, frm_name), (to, to_name) = self._label(leg['from']), self._label(leg['to'])
                segments.append({
                    'from': frm, 'from_name': frm_name, 'to': to, 'to_name': to_name,
                    'price': leg['price'], 'airline': leg['airline'], 'duration': leg['duration'],
                    'date': str(self.departure_date + timedelta(days=leg['day'])),
                    'type': seg_type, 'mode': leg['mode'],
                    'data_source': leg['data_source'], 'link': leg['link'],
                    'wait_min': leg['wait'], 'transfer_min': leg['transfer'],
                })
                if direction == 'out':
                    sequence.append(to)

        dest_hotel = float(self._get_hotel_cost(self.dest_key, dest_nights))
        hotels.append(self._hotel_entry(self.dest_key, dest_nights, dest_hotel))

        stays = [l['city'] for l in out.legs if l['type'] == 'stay']
        total_hotel = sum(h['total_price'] for h in hotels)
        total_transport = sum(s['price'] for s in segments) * self.travelers
        details = {
            'segments': segments,
            'hotels': hotels,
            'optimization': {'type': route_type, 'algorithm': 'multimodal_dijkstra',
                             'path_length': len(sequence)},
            'bonus': self._get_bonus(stays, segments),
        }
        if len(stays) == 1:
            hub = self.cities[stays[0]]
            details['hub_city'] = {'code': self._label(stays[0])[0], 'name': hub.name_uz,
                                   'country': hub.country.name_uz, 'flag': hub.country.flag_emoji}
        if stays:
            details['countries_count'] = len(stays) + 1

        return {
            'route_type': route_type,
            'cities_sequence': sequence,
            'total_flight_cost': float(total_transport),
            'total_hotel_cost': float(total_hotel),
            'total_cost': float(total_transport + total_hotel),
            'total_duration': round((out.hours + back.hours) * 60),
            'stops': len(sequence) - 2,
            'savings_percent': 0,
            'savings_amount': 0,
            'is_recommended': False,
            'score': 0,
            'details': details,
        }

    def _get_bonus(self, stays: List[str], segments: List[Dict]) -> str:
        """Variant uchun bonus xabari"""
        if stays:
            names = [self._get_city_name(c) for c in stays]
            if len(stays) == 1:
                return f"2 ta mamlakatni ko'rasiz! {names[0]} shahriga tashrif buyuring."
            return f"{len(stays) + 1} ta mamlakatni ko'rasiz! {' va '.join(names)} orqali ajoyib sayohat."
        ground = {s['airline'] for s in segments if s['mode'] != 'plane'}
        if ground:
            return f"Uydan uygacha: {', '.join(sorted(ground))} ham hisobga olingan."
        return "Eng tez va qulay sayohat! Vaqtingizni tejang."

    def _get_dynamic_hubs(self) -> List[str]:
        """Tranzit uchun hub shaharlar: standart hublar + origindan to'g'ri parvoz bor shaharlar"""
        hubs = ['DXB', 'IST', 'DOH', 'BKK', 'KUL', 'SIN']
        for e in self.graph.get(self.origin_key, []):
            if e.mode == 'plane' and e.to not in hubs and e.to not in (self.origin_key, self.dest_key):
                hubs.append(e.to)
        return hubs[:8]  # Maksimal 8 ta hub

    def _flight_duration(self, origin: str, dest: str, fallback: int) -> int:
        """Parvoz davomiyligi (daqiqa): API/baza qiymati ba'zan noto'g'ri - ma'lum yo'nalishlar jadvaldan"""
        # To'g'ridan-to'g'ri parvoz davomiyliklari (real ma'lumotlar asosida)
        flight_durations = {
            # O'zbekistondan
            ('TAS', 'IST'): 270,   # 4.5 soat
            ('TAS', 'DXB'): 210,   # 3.5 soat
            ('TAS', 'DOH'): 240,   # 4 soat
            ('TAS', 'SVO'): 240,   # 4 soat
            ('TAS', 'LED'): 270,   # 4.5 soat
            ('TAS', 'FRA'): 420,   # 7 soat
            ('TAS', 'LHR'): 480,   # 8 soat
            ('TAS', 'CDG'): 450,   # 7.5 soat
            ('TAS', 'FCO'): 390,   # 6.5 soat
            ('TAS', 'BKK'): 360,   # 6 soat
            ('TAS', 'KUL'): 420,   # 7 soat
            ('TAS', 'SIN'): 450,   # 7.5 soat
            ('TAS', 'DEL'): 180,   # 3 soat
            ('TAS', 'PEK'): 300,   # 5 soat
            ('TAS', 'ICN'): 420,   # 7 soat
            # Istanbuldan
            ('IST', 'DXB'): 240,   # 4 soat
            ('IST', 'DOH'): 210,   # 3.5 soat
            ('IST', 'CAI'): 120,   # 2 soat
            ('IST', 'LHR'): 240,   # 4 soat
            ('IST', 'CDG'): 210,   # 3.5 soat
            ('IST', 'FRA'): 180,   # 3 soat
            ('IST', 'FCO'): 150,   # 2.5 soat
            ('IST', 'BKK'): 540,   # 9 soat
            ('IST', 'SIN'): 600,   # 10 soat
            ('IST', 'JFK'): 660,   # 11 soat
            # Dubaydan
            ('DXB', 'IST'): 240,   # 4 soat
            ('DXB', 'DOH'): 60,    # 1 soat
            ('DXB', 'BKK'): 360,   # 6 soat
            ('DXB', 'KUL'): 420,   # 7 soat
            ('DXB', 'SIN'): 450,   # 7.5 soat
            ('DXB', 'CAI'): 240,   # 4 soat
            ('DXB', 'LHR'): 420,   # 7 soat
            # Dohadan
            ('DOH', 'IST'): 210,   # 3.5 soat
            ('DOH', 'BKK'): 390,   # 6.5 soat
            ('DOH', 'SIN'): 480,   # 8 soat
            ('DOH', 'CAI'): 210,   # 3.5 soat
            # Bangkokdan
            ('BKK', 'KUL'): 120,   # 2 soat
            ('BKK', 'SIN'): 150,   # 2.5 soat
            ('BKK', 'HKG'): 180,   # 3 soat
            # Kuala Lumpurdan
            ('KUL', 'SIN'): 60,    # 1 soat
            ('KUL', 'BKK'): 120,   # 2 soat
            # Frankfurtdan
            ('FRA', 'IST'): 180,   # 3 soat
            ('FRA', 'DXB'): 360,   # 6 soat
            # Londondan
            ('LHR', 'IST'): 240,   # 4 soat
            ('LHR', 'DXB'): 420,   # 7 soat
            # Rimdan
            ('FCO', 'IST'): 150,   # 2.5 soat
        }

        # To'g'ridan-to'g'ri qidirish
        key = (origin, dest)
        if key in flight_durations:
            return flight_durations[key]

        # Teskari yo'nalish
        reverse_key = (dest, origin)
        if reverse_key in flight_durations:
            return flight_durations[reverse_key]

        # Jadvalda yo'q - bazadagi/API qiymati
        return int(fallback or 240)

    def _get_airline_for_route(self, origin: str, dest: str) -> str:
        """Yo'nalish uchun aviakompaniyani aniqlash"""
        # O'zbekistondan yoki O'zbekistonga
        if origin == 'TAS' or dest == 'TAS':
            if dest in ['IST', 'AYT'] or origin in ['IST', 'AYT']:
                return 'Turkish Airlines'
            if dest in ['DXB', 'AUH'] or origin in ['DXB', 'AUH']:
                return 'Flydubai'
            if dest == 'DOH' or origin == 'DOH':
                return 'Qatar Airways'
            if dest in ['SVO', 'LED'] or origin in ['SVO', 'LED']:
                return 'Aeroflot'
            if dest in ['JFK', 'LAX', 'ORD'] or origin in ['JFK', 'LAX', 'ORD']:
                return 'Turkish Airlines'
            if dest in ['LHR'] or origin in ['LHR']:
                return 'Turkish Airlines'
            if dest in ['CDG'] or origin in ['CDG']:
                return 'Turkish Airlines'
            if dest in ['FRA'] or origin in ['FRA']:
                return 'Lufthansa'
            return 'Uzbekistan Airways'

        # Turkiyadan
        if origin == 'IST' or dest == 'IST':
            return 'Turkish Airlines'

        # BAA dan
        if origin in ['DXB', 'AUH'] or dest in ['DXB', 'AUH']:
            return 'Emirates'

        # Qatardan
        if origin == 'DOH' or dest == 'DOH':
            return 'Qatar Airways'

        # Singapurdan
        if origin == 'SIN' or dest == 'SIN':
            return 'Singapore Airlines'

        # Yaponiyadan
        if origin == 'HND' or dest == 'HND':
            return 'ANA'

        # Koreyadan
        if origin == 'ICN' or dest == 'ICN':
            return 'Korean Air'

        # Yevropadan
        if origin in ['LHR'] or dest in ['LHR']:
            return 'British Airways'
        if origin in ['CDG'] or dest in ['CDG']:
            return 'Air France'
        if origin in ['FRA'] or dest in ['FRA']:
            return 'Lufthansa'

        # AQSh dan
        if origin in ['JFK', 'LAX', 'ORD'] or dest in ['JFK', 'LAX', 'ORD']:
            return 'American Airlines'

        return 'Aviakompaniya'

    def _get_hotel_cost(self, city_code: str, nights: int) -> Decimal:
        """Mehmonxona narxini olish - Faqat lokal bazadan (tez)"""
        if nights <= 0:
            return Decimal('0')

        # 1. Keshdan tekshirish
        cache_key = (city_code, self.hotel_stars)
        if hasattr(self, '_hotel_cache') and cache_key in self._hotel_cache:
            return self._hotel_cache[cache_key] * nights

        # 2. Lokal bazadan qidirish (kalit aeroportsiz shahar uchun id - shahar obyekti bo'yicha)
        hotel = HotelPrice.objects.filter(
            city=self.cities.get(city_code),
            stars__gte=self.hotel_stars
        ).order_by('price_per_night_usd').first()

        if hotel:
            if not hasattr(self, '_hotel_cache'):
                self._hotel_cache = {}
            self._hotel_cache[cache_key] = hotel.price_per_night_usd
            return hotel.price_per_night_usd * nights

        # 3. Taxminiy narxlar (hostel va mehmonxona turlari bo'yicha)
        fallback_prices = {
            # Mavjud shaharlar
            'IST': {1: 15, 2: 30, 3: 55, 4: 95, 5: 180},
            'DXB': {1: 20, 2: 35, 3: 45, 4: 85, 5: 200},
            'DOH': {1: 25, 2: 40, 3: 60, 4: 110, 5: 200},
            'BKK': {1: 8, 2: 15, 3: 25, 4: 65, 5: 150},
            'KUL': {1: 10, 2: 20, 3: 35, 4: 80, 5: 150},
            'SIN': {1: 25, 2: 45, 3: 70, 4: 150, 5: 300},
            'CAI': {1: 10, 2: 20, 3: 35, 4: 90, 5: 180},
            'TAS': {1: 12, 2: 25, 3: 40, 4: 70, 5: 120},
            'AUH': {1: 22, 2: 38, 3: 50, 4: 90, 5: 210},
            # Yangi shaharlar - Amerika
            'JFK': {1: 40, 2: 80, 3: 150, 4: 250, 5: 450},
            'LAX': {1: 35, 2: 70, 3: 130, 4: 220, 5: 400},
            'ORD': {1: 30, 2: 60, 3: 110, 4: 180, 5: 320},
            'YYZ': {1: 30, 2: 60, 3: 120, 4: 200, 5: 350},
            'YVR': {1: 32, 2: 65, 3: 125, 4: 210, 5: 370},
            'MEX': {1: 15, 2: 30, 3: 55, 4: 100, 5: 180},
            # Yevropa
            'LHR': {1: 35, 2: 70, 3: 130, 4: 220, 5: 400},
            'CDG': {1: 30, 2: 60, 3: 120, 4: 200, 5: 380},
            'FRA': {1: 28, 2: 55, 3: 100, 4: 170, 5: 300},
            'AMS': {1: 30, 2: 60, 3: 110, 4: 190, 5: 350},
            'MAD': {1: 20, 2: 40, 3: 80, 4: 140, 5: 260},
            'FCO': {1: 22, 2: 45, 3: 85, 4: 150, 5: 280},
            # Osiyo
            'HND': {1: 30, 2: 55, 3: 100, 4: 180, 5: 350},
            'ICN': {1: 20, 2: 40, 3: 75, 4: 140, 5: 280},
            'PEK': {1: 15, 2: 30, 3: 60, 4: 120, 5: 250},
            'PVG': {1: 18, 2: 35, 3: 70, 4: 130, 5: 270},
            'HKG': {1: 30, 2: 55, 3: 100, 4: 180, 5: 350},
            # Avstraliya
            'SYD': {1: 35, 2: 70, 3: 130, 4: 220, 5: 400},
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
            # Bir xil shaharlar, lekin boshqa transport (poyezd va taksi) - boshqa variant
            key = tuple((s['from'], s['to'], s['mode']) for s in v['details']['segments']) + \
                tuple((h['city'], h['nights']) for h in v['details']['hotels'])
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

    def _calculate_advanced_score(self, variant: Dict, mode: str, cheapest: float) -> float:
        """Ilg'or baholash algoritmi"""
        score = 0

        # Narx balli (0-40)
        cost = variant['total_cost']
        if self.budget_max:
            cost_ratio = cost / self.budget_max
            cost_score = max(0, 40 * (1 - cost_ratio))
        else:
            # Eng arzon variantga nisbatan (absolyut shkala $2000+ da hammani 0 qilardi)
            cost_score = 40 * cheapest / cost if cost > 0 else 40
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
