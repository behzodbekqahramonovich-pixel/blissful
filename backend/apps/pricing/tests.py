from django.test import TestCase

from apps.destinations.models import Country, City
from .models import FlightPrice


class PriceMatrixTests(TestCase):
    def test_matrix_uses_cheapest_price_per_hub_pair(self):
        c = Country.objects.create(name='X', name_uz='X', code='XX', flag_emoji='', currency='USD')
        tas = City.objects.create(country=c, name='Tashkent', name_uz='Toshkent', iata_code='TAS', is_hub=True, latitude=0, longitude=0)
        ist = City.objects.create(country=c, name='Istanbul', name_uz='Istanbul', iata_code='IST', is_hub=True, latitude=0, longitude=0)
        for price in (300, 250):
            FlightPrice.objects.create(origin=tas, destination=ist, price_usd=price, airline='A',
                                       flight_duration_minutes=240, departure_date='2030-01-01')
        matrix = self.client.get('/api/v1/prices/matrix/').json()
        self.assertEqual(matrix['TAS']['IST'], 250.0)
        self.assertIsNone(matrix['IST']['TAS'])
