from django.contrib.auth.models import User
from rest_framework.test import APITestCase

from apps.authentication.views import generate_tokens
from apps.pricing.models import FlightPrice
from .models import Country, City, TransportLeg, airport_access


class GroundTransferTests(APITestCase):
    def setUp(self):
        c = Country.objects.create(name='UZ', name_uz="O'zbekiston", code='UZ', flag_emoji='', currency='UZS')
        self.tas = City.objects.create(country=c, name='Tashkent', name_uz='Toshkent', iata_code='TAS', latitude=0, longitude=0)
        self.ugc = City.objects.create(country=c, name='Urgench', name_uz='Urganch', iata_code='UGC', latitude=0, longitude=0)
        self.xiva = City.objects.create(country=c, name='Khiva', name_uz='Xiva', latitude=0, longitude=0)
        TransportLeg.objects.create(from_city=self.ugc, to_city=self.xiva, mode='car', duration_min=40, price_usd=10)
        for o, d in ((self.tas, self.ugc), (self.ugc, self.tas)):
            FlightPrice.objects.create(origin=o, destination=d, price_usd=60, airline='HY',
                                       flight_duration_minutes=90, departure_date='2030-01-10')
        access, _ = generate_tokens(User.objects.create_user('u', password='pass12345'))
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {access}')

    def search(self, dest):
        return self.client.post('/api/v1/search/', {
            'origin': 'TAS', 'destination': str(dest.id), 'travelers': 2,
            'departure_date': '2030-01-10', 'return_date': '2030-01-13', 'use_live_prices': False,
        }, format='json')

    def test_search_to_city_without_airport_adds_transfer_both_ways(self):
        r = self.search(self.xiva)
        self.assertEqual(r.status_code, 201, r.content)
        direct = next(v for v in r.json()['variants'] if v['route_type'] == 'direct')
        segs = direct['details']['segments']
        self.assertEqual([s['type'] for s in segs], ['outbound', 'ground', 'ground', 'inbound'])
        self.assertEqual(segs[1]['to'], 'Xiva')
        self.assertEqual(direct['cities_sequence'], ['TAS', 'UGC', 'Xiva'])
        self.assertEqual(segs[1]['mode'], 'car')
        # (60 + 60) parvoz + (10 + 10) transfer, 2 kishi
        self.assertEqual(float(direct['total_flight_cost']), (120 + 20) * 2)

    def test_one_way_legs_use_their_own_price(self):
        TransportLeg.objects.all().delete()
        TransportLeg.objects.create(from_city=self.ugc, to_city=self.xiva, mode='bus',
                                    duration_min=60, price_usd=3, is_bidirectional=False)
        TransportLeg.objects.create(from_city=self.xiva, to_city=self.ugc, mode='car',
                                    duration_min=40, price_usd=12, is_bidirectional=False)
        r = self.search(self.xiva)
        self.assertEqual(r.status_code, 201, r.content)
        direct = next(v for v in r.json()['variants'] if v['route_type'] == 'direct')
        self.assertEqual(float(direct['total_flight_cost']), (120 + 3 + 12) * 2)

    def test_city_without_airport_needs_transport_both_ways(self):
        lonely = City.objects.create(country=self.tas.country, name='X', name_uz='X', latitude=0, longitude=0)
        self.assertEqual(self.search(lonely).status_code, 400)
        # Faqat borish bor, qaytish yo'q - hali ham yetarli emas
        TransportLeg.objects.create(from_city=self.ugc, to_city=lonely, mode='car',
                                    duration_min=30, price_usd=5, is_bidirectional=False)
        self.assertIsNone(airport_access(lonely))
        self.assertEqual(self.search(lonely).status_code, 400)

    def test_airport_access_picks_cheapest_airport(self):
        TransportLeg.objects.create(from_city=self.tas, to_city=self.xiva, mode='train', duration_min=900, price_usd=8)
        airport, to_leg, back_leg = airport_access(self.xiva)
        self.assertEqual(airport, self.tas)
        self.assertEqual(to_leg.mode, 'train')
        # Nofaol qirra hisobga olinmaydi
        TransportLeg.objects.filter(mode='train').update(is_active=False)
        self.assertEqual(airport_access(self.xiva)[0], self.ugc)


class AdminTransportLegTests(APITestCase):
    def setUp(self):
        c = Country.objects.create(name='UZ', name_uz="O'zbekiston", code='UZ', flag_emoji='', currency='UZS')
        self.feg = City.objects.create(country=c, name='Fergana', name_uz="Farg'ona", iata_code='FEG', latitude=0, longitude=0)
        self.tas = City.objects.create(country=c, name='Tashkent', name_uz='Toshkent', iata_code='TAS', latitude=0, longitude=0)
        admin = User.objects.create_user('admin', password='pass12345', is_staff=True)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {generate_tokens(admin)[0]}')
        self.url = '/api/v1/admin/transport/'

    def leg(self, **kw):
        return {'from_city': self.feg.id, 'to_city': self.tas.id, 'mode': 'train',
                'duration_min': 270, 'price_usd': '8.00', 'headway_min': 360, **kw}

    def test_create_and_list(self):
        r = self.client.post(self.url, self.leg(), format='json')
        self.assertEqual(r.status_code, 201, r.content)
        self.assertEqual(r.json()['from_code'], 'FEG')
        self.assertEqual(r.json()['mode_display'], 'Poyezd')
        r = self.client.get(self.url, {'city': self.tas.id})
        self.assertEqual(r.json()['count'], 1)

    def test_rejects_same_city_and_reverse_duplicate(self):
        r = self.client.post(self.url, self.leg(to_city=self.feg.id), format='json')
        self.assertEqual(r.status_code, 400)
        self.client.post(self.url, self.leg(), format='json')
        r = self.client.post(self.url, self.leg(from_city=self.tas.id, to_city=self.feg.id), format='json')
        self.assertEqual(r.status_code, 400)
        # Boshqa transport turi bilan teskari yo'nalish mumkin
        r = self.client.post(self.url, self.leg(from_city=self.tas.id, to_city=self.feg.id, mode='car'), format='json')
        self.assertEqual(r.status_code, 201, r.content)

    def test_non_admin_forbidden(self):
        user = User.objects.create_user('u', password='pass12345')
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {generate_tokens(user)[0]}')
        self.assertEqual(self.client.get(self.url).status_code, 403)
