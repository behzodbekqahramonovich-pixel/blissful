from django.contrib.auth.models import User
from rest_framework.test import APITestCase

from .models import AgencyClient
from .views import generate_tokens


class SecurityTests(APITestCase):
    def _auth(self, user):
        access, _ = generate_tokens(user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {access}')

    def test_search_requires_login(self):
        self.assertEqual(self.client.get('/api/v1/search/').status_code, 401)
        self.assertEqual(self.client.post('/api/v1/search/', {}).status_code, 401)

    def test_search_cannot_be_deleted(self):
        self._auth(User.objects.create_user('u1', password='pass12345'))
        self.assertEqual(self.client.delete('/api/v1/search/1/').status_code, 405)

    def test_booking_rejects_other_agency_client(self):
        a = User.objects.create_user('agency_a', password='pass12345')
        b = User.objects.create_user('agency_b', password='pass12345')
        for u in (a, b):
            u.profile.role = 'agency'
            u.profile.save()
        b_client = AgencyClient.objects.create(agency=b.profile, first_name='X', last_name='Y', phone='1')
        self._auth(a)
        payload = {'client': b_client.id, 'origin': 'TAS', 'destination': 'IST',
                   'departure_date': '2030-01-01', 'travelers': 1, 'nights': 1}
        self.assertEqual(self.client.post('/api/v1/auth/agency/bookings/', payload).status_code, 404)
        payload['client'] = AgencyClient.objects.create(agency=a.profile, first_name='A', last_name='B', phone='2').id
        self.assertEqual(self.client.post('/api/v1/auth/agency/bookings/', payload).status_code, 201)
