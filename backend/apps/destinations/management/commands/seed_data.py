"""
Test ma'lumotlarni bazaga kiritish
"""
from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta, date
from decimal import Decimal
from apps.destinations.models import Country, City
from apps.pricing.models import FlightPrice, HotelPrice


class Command(BaseCommand):
    help = "Bazaga test ma'lumotlarni kiritish"

    def handle(self, *args, **options):
        self.stdout.write("Ma'lumotlar kiritilmoqda...")

        # Mamlakatlar
        countries_data = [
            {'name': 'Uzbekistan', 'name_uz': "O'zbekiston", 'code': 'UZB', 'flag_emoji': '🇺🇿', 'currency': 'UZS', 'visa_required_for_uz': False},
            {'name': 'Turkey', 'name_uz': 'Turkiya', 'code': 'TUR', 'flag_emoji': '🇹🇷', 'currency': 'TRY', 'visa_required_for_uz': False},
            {'name': 'United Arab Emirates', 'name_uz': 'BAA', 'code': 'UAE', 'flag_emoji': '🇦🇪', 'currency': 'AED', 'visa_required_for_uz': False},
            {'name': 'Qatar', 'name_uz': 'Qatar', 'code': 'QAT', 'flag_emoji': '🇶🇦', 'currency': 'QAR', 'visa_required_for_uz': False},
            {'name': 'Thailand', 'name_uz': 'Tailand', 'code': 'THA', 'flag_emoji': '🇹🇭', 'currency': 'THB', 'visa_required_for_uz': True},
            {'name': 'Malaysia', 'name_uz': 'Malayziya', 'code': 'MYS', 'flag_emoji': '🇲🇾', 'currency': 'MYR', 'visa_required_for_uz': False},
            {'name': 'Singapore', 'name_uz': 'Singapur', 'code': 'SGP', 'flag_emoji': '🇸🇬', 'currency': 'SGD', 'visa_required_for_uz': True},
            {'name': 'Egypt', 'name_uz': 'Misr', 'code': 'EGY', 'flag_emoji': '🇪🇬', 'currency': 'EGP', 'visa_required_for_uz': True},
        ]

        countries = {}
        for data in countries_data:
            country, created = Country.objects.update_or_create(
                code=data['code'],
                defaults=data
            )
            countries[data['code']] = country
            status = "yaratildi" if created else "yangilandi"
            self.stdout.write(f"  {data['name_uz']} ({data['code']}) {status}")

        # Shaharlar
        cities_data = [
            {'country': 'UZB', 'name': 'Tashkent', 'name_uz': 'Toshkent', 'iata_code': 'TAS', 'latitude': Decimal('41.2995'), 'longitude': Decimal('69.2401'), 'is_hub': False, 'avg_hotel_price_usd': Decimal('45.00')},
            {'country': 'TUR', 'name': 'Istanbul', 'name_uz': 'Istanbul', 'iata_code': 'IST', 'latitude': Decimal('41.0082'), 'longitude': Decimal('28.9784'), 'is_hub': True, 'avg_hotel_price_usd': Decimal('80.00')},
            {'country': 'UAE', 'name': 'Dubai', 'name_uz': 'Dubay', 'iata_code': 'DXB', 'latitude': Decimal('25.2048'), 'longitude': Decimal('55.2708'), 'is_hub': True, 'avg_hotel_price_usd': Decimal('60.00')},
            {'country': 'UAE', 'name': 'Abu Dhabi', 'name_uz': 'Abu-Dabi', 'iata_code': 'AUH', 'latitude': Decimal('24.4539'), 'longitude': Decimal('54.3773'), 'is_hub': True, 'avg_hotel_price_usd': Decimal('70.00')},
            {'country': 'QAT', 'name': 'Doha', 'name_uz': 'Doha', 'iata_code': 'DOH', 'latitude': Decimal('25.2854'), 'longitude': Decimal('51.5310'), 'is_hub': True, 'avg_hotel_price_usd': Decimal('75.00')},
            {'country': 'THA', 'name': 'Bangkok', 'name_uz': 'Bangkok', 'iata_code': 'BKK', 'latitude': Decimal('13.7563'), 'longitude': Decimal('100.5018'), 'is_hub': True, 'avg_hotel_price_usd': Decimal('40.00')},
            {'country': 'MYS', 'name': 'Kuala Lumpur', 'name_uz': 'Kuala-Lumpur', 'iata_code': 'KUL', 'latitude': Decimal('3.1390'), 'longitude': Decimal('101.6869'), 'is_hub': True, 'avg_hotel_price_usd': Decimal('50.00')},
            {'country': 'SGP', 'name': 'Singapore', 'name_uz': 'Singapur', 'iata_code': 'SIN', 'latitude': Decimal('1.3521'), 'longitude': Decimal('103.8198'), 'is_hub': True, 'avg_hotel_price_usd': Decimal('120.00')},
            {'country': 'EGY', 'name': 'Cairo', 'name_uz': 'Qohira', 'iata_code': 'CAI', 'latitude': Decimal('30.0444'), 'longitude': Decimal('31.2357'), 'is_hub': False, 'avg_hotel_price_usd': Decimal('55.00')},
        ]

        cities = {}
        for data in cities_data:
            country = countries[data.pop('country')]
            city, created = City.objects.update_or_create(
                iata_code=data['iata_code'],
                defaults={'country': country, **data}
            )
            cities[data['iata_code']] = city
            status = "yaratildi" if created else "yangilandi"
            self.stdout.write(f"  {data['name_uz']} ({data['iata_code']}) {status}")

        # Parvoz narxlari
        self.stdout.write("\nParvoz narxlari kiritilmoqda...")

        # Kelajakdagi 90 kun uchun parvoz narxlari
        today = date.today()

        flight_routes = [
            # Toshkentdan
            ('TAS', 'IST', 225, 280, 'Turkish Airlines', 300),
            ('TAS', 'DXB', 160, 200, 'Flydubai', 270),
            ('TAS', 'DOH', 180, 220, 'Qatar Airways', 300),
            ('TAS', 'BKK', 320, 400, 'Thai Airways', 420),
            ('TAS', 'KUL', 380, 450, 'AirAsia', 480),
            ('TAS', 'CAI', 280, 350, 'Egyptair', 360),
            # Dubaydan
            ('DXB', 'IST', 120, 180, 'Emirates', 180),
            ('DXB', 'DOH', 60, 100, 'Emirates', 90),
            ('DXB', 'BKK', 220, 300, 'Emirates', 360),
            ('DXB', 'KUL', 250, 320, 'Emirates', 360),
            ('DXB', 'SIN', 280, 350, 'Emirates', 360),
            ('DXB', 'CAI', 150, 200, 'Emirates', 240),
            # Istanbuldan
            ('IST', 'DXB', 120, 180, 'Turkish Airlines', 180),
            ('IST', 'DOH', 140, 200, 'Turkish Airlines', 210),
            ('IST', 'BKK', 320, 420, 'Turkish Airlines', 540),
            ('IST', 'KUL', 380, 480, 'Turkish Airlines', 540),
            ('IST', 'CAI', 100, 150, 'Turkish Airlines', 150),
            # Dohadan
            ('DOH', 'IST', 140, 200, 'Qatar Airways', 210),
            ('DOH', 'BKK', 250, 350, 'Qatar Airways', 390),
            ('DOH', 'KUL', 280, 380, 'Qatar Airways', 420),
            ('DOH', 'SIN', 300, 400, 'Qatar Airways', 420),
            ('DOH', 'CAI', 130, 180, 'Qatar Airways', 180),
            # Bangkokdan
            ('BKK', 'KUL', 60, 100, 'AirAsia', 120),
            ('BKK', 'SIN', 80, 130, 'AirAsia', 150),
            # Kuala-Lumpurdan
            ('KUL', 'SIN', 40, 70, 'AirAsia', 60),
        ]

        flight_count = 0
        for origin, dest, min_price, max_price, airline, duration in flight_routes:
            for day_offset in range(0, 90, 3):  # Har 3 kunda
                flight_date = today + timedelta(days=day_offset)
                price = Decimal(str(min_price + (max_price - min_price) * (day_offset % 30) / 30))

                FlightPrice.objects.update_or_create(
                    origin=cities[origin],
                    destination=cities[dest],
                    departure_date=flight_date,
                    airline=airline,
                    defaults={
                        'price_usd': price,
                        'flight_duration_minutes': duration,
                    }
                )
                flight_count += 1

        self.stdout.write(f"  {flight_count} ta parvoz narxi kiritildi")

        # Mehmonxona narxlari
        self.stdout.write("\nMehmonxona narxlari kiritilmoqda...")

        hotels_data = [
            # Istanbul
            ('IST', 'Grand Bazaar Hotel', 3, Decimal('55.00'), Decimal('8.2')),
            ('IST', 'Hilton Istanbul', 4, Decimal('95.00'), Decimal('8.8')),
            ('IST', 'Four Seasons Sultanahmet', 5, Decimal('180.00'), Decimal('9.4')),
            # Dubai
            ('DXB', 'Rove Downtown', 3, Decimal('45.00'), Decimal('8.5')),
            ('DXB', 'JW Marriott Marquis', 4, Decimal('85.00'), Decimal('8.9')),
            ('DXB', 'Burj Al Arab', 5, Decimal('500.00'), Decimal('9.6')),
            # Doha
            ('DOH', 'Souq Waqif Hotel', 3, Decimal('60.00'), Decimal('8.3')),
            ('DOH', 'InterContinental Doha', 4, Decimal('110.00'), Decimal('8.7')),
            ('DOH', 'Mondrian Doha', 5, Decimal('200.00'), Decimal('9.2')),
            # Bangkok
            ('BKK', 'Khao San Palace Hotel', 3, Decimal('25.00'), Decimal('7.8')),
            ('BKK', 'Centara Grand', 4, Decimal('65.00'), Decimal('8.6')),
            ('BKK', 'Mandarin Oriental', 5, Decimal('250.00'), Decimal('9.5')),
            # Kuala Lumpur
            ('KUL', 'Traders Hotel', 3, Decimal('35.00'), Decimal('8.0')),
            ('KUL', 'Grand Hyatt', 4, Decimal('80.00'), Decimal('8.7')),
            ('KUL', 'Four Seasons KL', 5, Decimal('200.00'), Decimal('9.3')),
            # Singapore
            ('SIN', 'Hotel Boss', 3, Decimal('70.00'), Decimal('7.9')),
            ('SIN', 'Pan Pacific', 4, Decimal('150.00'), Decimal('8.8')),
            ('SIN', 'Marina Bay Sands', 5, Decimal('350.00'), Decimal('9.4')),
            # Cairo
            ('CAI', 'Pyramids View Inn', 3, Decimal('35.00'), Decimal('7.5')),
            ('CAI', 'Marriott Mena House', 4, Decimal('90.00'), Decimal('8.9')),
            ('CAI', 'Four Seasons Cairo', 5, Decimal('180.00'), Decimal('9.2')),
        ]

        hotel_count = 0
        for city_code, hotel_name, stars, price, rating in hotels_data:
            for day_offset in range(0, 90, 1):  # Har kun uchun
                checkin = today + timedelta(days=day_offset)
                HotelPrice.objects.update_or_create(
                    city=cities[city_code],
                    hotel_name=hotel_name,
                    checkin_date=checkin,
                    defaults={
                        'stars': stars,
                        'price_per_night_usd': price,
                        'rating': rating,
                    }
                )
                hotel_count += 1

        self.stdout.write(f"  {hotel_count} ta mehmonxona narxi kiritildi")

        self.stdout.write(self.style.SUCCESS("\nBarcha ma'lumotlar muvaffaqiyatli kiritildi!"))
