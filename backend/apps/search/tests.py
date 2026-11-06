import datetime

from django.test import TestCase

from apps.destinations.models import Country, City, TransportLeg
from apps.pricing.models import FlightPrice
from apps.search.models import TravelSearch
from services.route_optimizer import RouteOptimizer


class ScoreTests(TestCase):
    def test_cheaper_variant_scores_higher_above_2000(self):
        opt = RouteOptimizer.__new__(RouteOptimizer)
        opt.budget_max = None
        a = {'total_cost': 2400, 'total_duration': 600, 'stops': 0, 'route_type': 'direct'}
        b = {'total_cost': 3300, 'total_duration': 600, 'stops': 0, 'route_type': 'direct'}
        cheapest = min(a['total_cost'], b['total_cost'])
        self.assertGreater(
            opt._calculate_advanced_score(a, 'balanced', cheapest),
            opt._calculate_advanced_score(b, 'balanced', cheapest),
        )


class MultimodalTests(TestCase):
    """docs/MULTIMODAL_DESIGN.md 2.4: Farg'ona → Kapadokya"""

    def setUp(self):
        uz = Country.objects.create(name='UZ', name_uz="O'zbekiston", code='UZ', flag_emoji='', currency='UZS')
        tr = Country.objects.create(name='TR', name_uz='Turkiya', code='TR', flag_emoji='', currency='TRY')
        city = lambda c, name, iata=None: City.objects.create(country=c, name=name, name_uz=name, iata_code=iata,
                                                              latitude=0, longitude=0)
        self.feg = city(uz, "Farg'ona", 'FEG')
        self.tas = city(uz, 'Toshkent', 'TAS')
        self.ist = city(tr, 'Istanbul', 'IST')
        self.asr = city(tr, 'Kayseri', 'ASR')
        self.goreme = city(tr, 'Goreme')
        leg = lambda a, b, mode, mins, usd, headway=0: TransportLeg.objects.create(
            from_city=a, to_city=b, mode=mode, duration_min=mins, price_usd=usd, headway_min=headway)
        leg(self.feg, self.tas, 'train', 270, 8, 360)
        leg(self.feg, self.tas, 'car', 300, 25)
        leg(self.ist, self.goreme, 'bus', 660, 20, 120)
        leg(self.asr, self.goreme, 'car', 75, 30)
        for o, d, usd, mins in ((self.tas, self.ist, 250, 270), (self.ist, self.tas, 250, 270),
                                (self.ist, self.asr, 45, 80), (self.asr, self.ist, 45, 80)):
            FlightPrice.objects.create(origin=o, destination=d, price_usd=usd, airline='TK',
                                       flight_duration_minutes=mins, departure_date='2030-05-10')

    def variants(self, nights=7):
        s = TravelSearch.objects.create(origin=self.feg, destination=self.goreme,
                                        departure_date=datetime.date(2030, 5, 10),
                                        return_date=datetime.date(2030, 5, 10) + datetime.timedelta(days=nights),
                                        travelers=1, hotel_stars=3, include_transit=False)
        return {v['route_type']: v for v in RouteOptimizer(s).find_optimal_route('balanced')}

    def modes(self, v):
        return [(s['from'], s['to'], s['mode']) for s in v['details']['segments']]

    def test_cheapest_uses_train_and_bus(self):
        v = self.variants()['optimal_cheap']
        self.assertEqual(self.modes(v)[:3], [('FEG', 'TAS', 'train'), ('TAS', 'IST', 'plane'), ('IST', 'Goreme', 'bus')])
        self.assertEqual(v['cities_sequence'], ['FEG', 'TAS', 'IST', 'Goreme'])

    def test_fastest_uses_taxi_and_flight_to_kayseri(self):
        v = self.variants()['optimal_fast']
        self.assertEqual(self.modes(v)[:4], [('FEG', 'TAS', 'car'), ('TAS', 'IST', 'plane'),
                                             ('IST', 'ASR', 'plane'), ('ASR', 'Goreme', 'car')])
        # Qaytish teskari va ground segmentlari 'ground' turida
        self.assertEqual([s['type'] for s in v['details']['segments']],
                         ['ground', 'outbound', 'transit', 'ground', 'ground', 'inbound', 'inbound', 'ground'])

    def test_totals_add_up(self):
        for v in self.variants().values():
            segs = v['details']['segments']
            self.assertAlmostEqual(v['total_flight_cost'], sum(s['price'] for s in segs))
            self.assertAlmostEqual(v['total_cost'], v['total_flight_cost'] + v['total_hotel_cost'])
            # Tunda yo'lda o'tgan kun (IST→Goreme avtobus) mehmonxonasiz: 7 tundan kam bo'lishi mumkin
            nights = [h['nights'] for h in v['details']['hotels']]
            self.assertTrue(all(n >= 1 for n in nights) and 6 <= sum(nights) <= 7, nights)

    def test_direct_allows_only_one_flight_each_way(self):
        v = self.variants()['direct']
        self.assertEqual(sum(s['mode'] == 'plane' for s in v['details']['segments']), 2)

    def test_inactive_leg_is_ignored(self):
        TransportLeg.objects.filter(mode='train').update(is_active=False)
        variants = self.variants()
        self.assertTrue(variants)
        for v in variants.values():
            self.assertNotIn('train', [m for _, _, m in self.modes(v)])
