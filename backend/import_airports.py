"""
Aeroportlarni bazaga import qilish skripti
100+ yangi aeroportlar qo'shiladi
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.destinations.models import Country, City

# Yangi aeroportlar ro'yxati
airports_data = [
    # O'ZBEKISTON
    {"country_code": "UZB", "name": "Bukhara", "name_uz": "Buxoro", "iata": "BHK", "lat": 39.775, "lon": 64.4833, "hub": False},
    {"country_code": "UZB", "name": "Namangan", "name_uz": "Namangan", "iata": "NMA", "lat": 40.9846, "lon": 71.5567, "hub": False},
    {"country_code": "UZB", "name": "Urgench", "name_uz": "Urganch", "iata": "UGC", "lat": 41.5843, "lon": 60.6417, "hub": False},
    {"country_code": "UZB", "name": "Karshi", "name_uz": "Qarshi", "iata": "KSQ", "lat": 38.8336, "lon": 65.7850, "hub": False},
    {"country_code": "UZB", "name": "Termez", "name_uz": "Termiz", "iata": "TMJ", "lat": 37.2867, "lon": 67.3100, "hub": False},
    {"country_code": "UZB", "name": "Nukus", "name_uz": "Nukus", "iata": "NCU", "lat": 42.4884, "lon": 59.6233, "hub": False},
    {"country_code": "UZB", "name": "Fergana", "name_uz": "Farg'ona", "iata": "FEG", "lat": 40.3588, "lon": 71.7450, "hub": False},

    # MARKAZIY OSIYO
    {"country_code": "KZ", "name": "Almaty", "name_uz": "Almati", "iata": "ALA", "lat": 43.3521, "lon": 77.0405, "hub": True},
    {"country_code": "KZ", "name": "Astana", "name_uz": "Astana", "iata": "NQZ", "lat": 51.0222, "lon": 71.4669, "hub": True},
    {"country_code": "KG", "name": "Bishkek", "name_uz": "Bishkek", "iata": "FRU", "lat": 43.0610, "lon": 74.4776, "hub": False},
    {"country_code": "KG", "name": "Osh", "name_uz": "O'sh", "iata": "OSS", "lat": 40.6090, "lon": 72.7930, "hub": False},
    {"country_code": "TJ", "name": "Dushanbe", "name_uz": "Dushanbe", "iata": "DYU", "lat": 38.5433, "lon": 68.8250, "hub": False},
    {"country_code": "TM", "name": "Ashgabat", "name_uz": "Ashgabat", "iata": "ASB", "lat": 37.9868, "lon": 58.3610, "hub": False},

    # ROSSIYA
    {"country_code": "RU", "name": "Moscow Sheremetyevo", "name_uz": "Moskva Sheremetyevo", "iata": "SVO", "lat": 55.9726, "lon": 37.4146, "hub": True},
    {"country_code": "RU", "name": "Moscow Domodedovo", "name_uz": "Moskva Domodedovo", "iata": "DME", "lat": 55.4088, "lon": 37.9063, "hub": True},
    {"country_code": "RU", "name": "Saint Petersburg", "name_uz": "Sankt-Peterburg", "iata": "LED", "lat": 59.8003, "lon": 30.2625, "hub": True},
    {"country_code": "RU", "name": "Kazan", "name_uz": "Qazon", "iata": "KZN", "lat": 55.6062, "lon": 49.2787, "hub": False},
    {"country_code": "RU", "name": "Sochi", "name_uz": "Sochi", "iata": "AER", "lat": 43.4500, "lon": 39.9566, "hub": False},
    {"country_code": "RU", "name": "Novosibirsk", "name_uz": "Novosibirsk", "iata": "OVB", "lat": 55.0121, "lon": 82.6507, "hub": True},
    {"country_code": "RU", "name": "Yekaterinburg", "name_uz": "Yekaterinburg", "iata": "SVX", "lat": 56.7431, "lon": 60.8027, "hub": True},

    # YEVROPA
    {"country_code": "ESP", "name": "Barcelona", "name_uz": "Barselona", "iata": "BCN", "lat": 41.2971, "lon": 2.0785, "hub": True},
    {"country_code": "ITA", "name": "Milan Malpensa", "name_uz": "Milan", "iata": "MXP", "lat": 45.6306, "lon": 8.7281, "hub": True},
    {"country_code": "AT", "name": "Vienna", "name_uz": "Vena", "iata": "VIE", "lat": 48.1103, "lon": 16.5697, "hub": True},
    {"country_code": "DEU", "name": "Berlin", "name_uz": "Berlin", "iata": "BER", "lat": 52.3667, "lon": 13.5033, "hub": True},
    {"country_code": "DEU", "name": "Munich", "name_uz": "Myunxen", "iata": "MUC", "lat": 48.3538, "lon": 11.7861, "hub": True},
    {"country_code": "CH", "name": "Zurich", "name_uz": "Syurix", "iata": "ZRH", "lat": 47.4647, "lon": 8.5492, "hub": True},
    {"country_code": "CZ", "name": "Prague", "name_uz": "Praga", "iata": "PRG", "lat": 50.1008, "lon": 14.2632, "hub": True},
    {"country_code": "PL", "name": "Warsaw", "name_uz": "Varshava", "iata": "WAW", "lat": 52.1657, "lon": 20.9671, "hub": True},
    {"country_code": "GR", "name": "Athens", "name_uz": "Afina", "iata": "ATH", "lat": 37.9364, "lon": 23.9445, "hub": True},
    {"country_code": "PT", "name": "Lisbon", "name_uz": "Lissabon", "iata": "LIS", "lat": 38.7813, "lon": -9.1357, "hub": True},
    {"country_code": "BE", "name": "Brussels", "name_uz": "Bryussel", "iata": "BRU", "lat": 50.9010, "lon": 4.4844, "hub": True},
    {"country_code": "DK", "name": "Copenhagen", "name_uz": "Kopengagen", "iata": "CPH", "lat": 55.6180, "lon": 12.6506, "hub": True},
    {"country_code": "SE", "name": "Stockholm", "name_uz": "Stokgolm", "iata": "ARN", "lat": 59.6519, "lon": 17.9186, "hub": True},
    {"country_code": "NO", "name": "Oslo", "name_uz": "Oslo", "iata": "OSL", "lat": 60.1939, "lon": 11.1004, "hub": True},
    {"country_code": "FI", "name": "Helsinki", "name_uz": "Xelsinki", "iata": "HEL", "lat": 60.3172, "lon": 24.9633, "hub": True},
    {"country_code": "HU", "name": "Budapest", "name_uz": "Budapesht", "iata": "BUD", "lat": 47.4298, "lon": 19.2611, "hub": True},
    {"country_code": "CH", "name": "Geneva", "name_uz": "Jeneva", "iata": "GVA", "lat": 46.2381, "lon": 6.1089, "hub": True},
    {"country_code": "FRA", "name": "Nice", "name_uz": "Nitstsa", "iata": "NCE", "lat": 43.6584, "lon": 7.2159, "hub": False},

    # OSIYO
    {"country_code": "IN", "name": "Delhi", "name_uz": "Dehli", "iata": "DEL", "lat": 28.5562, "lon": 77.1000, "hub": True},
    {"country_code": "IN", "name": "Mumbai", "name_uz": "Mumbay", "iata": "BOM", "lat": 19.0896, "lon": 72.8656, "hub": True},
    {"country_code": "IN", "name": "Bangalore", "name_uz": "Bangalor", "iata": "BLR", "lat": 13.1986, "lon": 77.7066, "hub": True},
    {"country_code": "IN", "name": "Kolkata", "name_uz": "Kolkata", "iata": "CCU", "lat": 22.6547, "lon": 88.4467, "hub": False},
    {"country_code": "JPN", "name": "Tokyo Narita", "name_uz": "Tokio Narita", "iata": "NRT", "lat": 35.7647, "lon": 140.3864, "hub": True},
    {"country_code": "JPN", "name": "Osaka", "name_uz": "Osaka", "iata": "KIX", "lat": 34.4273, "lon": 135.2444, "hub": True},
    {"country_code": "TW", "name": "Taipei", "name_uz": "Taypey", "iata": "TPE", "lat": 25.0777, "lon": 121.2328, "hub": True},
    {"country_code": "PH", "name": "Manila", "name_uz": "Manila", "iata": "MNL", "lat": 14.5086, "lon": 121.0194, "hub": True},
    {"country_code": "ID", "name": "Jakarta", "name_uz": "Jakarta", "iata": "CGK", "lat": -6.1256, "lon": 106.6559, "hub": True},
    {"country_code": "VN", "name": "Ho Chi Minh City", "name_uz": "Xoshimin", "iata": "SGN", "lat": 10.8188, "lon": 106.6519, "hub": True},
    {"country_code": "VN", "name": "Hanoi", "name_uz": "Xanoy", "iata": "HAN", "lat": 21.2212, "lon": 105.8072, "hub": False},
    {"country_code": "KH", "name": "Phnom Penh", "name_uz": "Pnompen", "iata": "PNH", "lat": 11.5466, "lon": 104.8441, "hub": False},
    {"country_code": "MM", "name": "Yangon", "name_uz": "Yangon", "iata": "RGN", "lat": 16.9073, "lon": 96.1332, "hub": False},
    {"country_code": "BD", "name": "Dhaka", "name_uz": "Dakka", "iata": "DAC", "lat": 23.8433, "lon": 90.3978, "hub": False},
    {"country_code": "PK", "name": "Karachi", "name_uz": "Karachi", "iata": "KHI", "lat": 24.9056, "lon": 67.1608, "hub": True},
    {"country_code": "PK", "name": "Lahore", "name_uz": "Laxor", "iata": "LHE", "lat": 31.5217, "lon": 74.4036, "hub": False},
    {"country_code": "PK", "name": "Islamabad", "name_uz": "Islomobod", "iata": "ISB", "lat": 33.6169, "lon": 73.0992, "hub": False},
    {"country_code": "LK", "name": "Colombo", "name_uz": "Kolombo", "iata": "CMB", "lat": 7.1808, "lon": 79.8841, "hub": False},
    {"country_code": "NP", "name": "Kathmandu", "name_uz": "Katmandu", "iata": "KTM", "lat": 27.6966, "lon": 85.3591, "hub": False},
    {"country_code": "AZ", "name": "Baku", "name_uz": "Boku", "iata": "GYD", "lat": 40.4675, "lon": 50.0467, "hub": True},
    {"country_code": "GE", "name": "Tbilisi", "name_uz": "Tbilisi", "iata": "TBS", "lat": 41.6692, "lon": 44.9547, "hub": False},
    {"country_code": "AM", "name": "Yerevan", "name_uz": "Yerevan", "iata": "EVN", "lat": 40.1473, "lon": 44.3959, "hub": False},
    {"country_code": "IR", "name": "Tehran", "name_uz": "Tehron", "iata": "IKA", "lat": 35.4161, "lon": 51.1522, "hub": True},

    # AMERIKA
    {"country_code": "USA", "name": "San Francisco", "name_uz": "San-Fransisko", "iata": "SFO", "lat": 37.6213, "lon": -122.3790, "hub": True},
    {"country_code": "USA", "name": "Miami", "name_uz": "Mayami", "iata": "MIA", "lat": 25.7932, "lon": -80.2906, "hub": True},
    {"country_code": "USA", "name": "Boston", "name_uz": "Boston", "iata": "BOS", "lat": 42.3656, "lon": -71.0096, "hub": True},
    {"country_code": "USA", "name": "Washington", "name_uz": "Vashington", "iata": "IAD", "lat": 38.9531, "lon": -77.4565, "hub": True},
    {"country_code": "USA", "name": "Seattle", "name_uz": "Sietl", "iata": "SEA", "lat": 47.4502, "lon": -122.3088, "hub": True},
    {"country_code": "USA", "name": "Las Vegas", "name_uz": "Las-Vegas", "iata": "LAS", "lat": 36.0840, "lon": -115.1537, "hub": False},
    {"country_code": "USA", "name": "Orlando", "name_uz": "Orlando", "iata": "MCO", "lat": 28.4294, "lon": -81.3089, "hub": False},
    {"country_code": "USA", "name": "Denver", "name_uz": "Denver", "iata": "DEN", "lat": 39.8561, "lon": -104.6737, "hub": True},
    {"country_code": "USA", "name": "Houston", "name_uz": "Xyuston", "iata": "IAH", "lat": 29.9902, "lon": -95.3368, "hub": True},
    {"country_code": "USA", "name": "Dallas", "name_uz": "Dallas", "iata": "DFW", "lat": 32.8998, "lon": -97.0403, "hub": True},
    {"country_code": "USA", "name": "Atlanta", "name_uz": "Atlanta", "iata": "ATL", "lat": 33.6407, "lon": -84.4277, "hub": True},
    {"country_code": "USA", "name": "Phoenix", "name_uz": "Feniks", "iata": "PHX", "lat": 33.4352, "lon": -112.0101, "hub": False},
    {"country_code": "USA", "name": "San Diego", "name_uz": "San-Diego", "iata": "SAN", "lat": 32.7338, "lon": -117.1933, "hub": False},
    {"country_code": "USA", "name": "Philadelphia", "name_uz": "Filadelfia", "iata": "PHL", "lat": 39.8729, "lon": -75.2437, "hub": True},
    {"country_code": "USA", "name": "Minneapolis", "name_uz": "Minneapolis", "iata": "MSP", "lat": 44.8848, "lon": -93.2223, "hub": True},
    {"country_code": "USA", "name": "Detroit", "name_uz": "Detroyt", "iata": "DTW", "lat": 42.2162, "lon": -83.3554, "hub": True},
    {"country_code": "BR", "name": "Sao Paulo", "name_uz": "San-Paulu", "iata": "GRU", "lat": -23.4356, "lon": -46.4731, "hub": True},
    {"country_code": "AR", "name": "Buenos Aires", "name_uz": "Buenos-Ayres", "iata": "EZE", "lat": -34.8222, "lon": -58.5358, "hub": True},
    {"country_code": "PE", "name": "Lima", "name_uz": "Lima", "iata": "LIM", "lat": -12.0219, "lon": -77.1143, "hub": True},
    {"country_code": "CL", "name": "Santiago", "name_uz": "Santyago", "iata": "SCL", "lat": -33.3930, "lon": -70.7858, "hub": True},
    {"country_code": "CO", "name": "Bogota", "name_uz": "Bogota", "iata": "BOG", "lat": 4.7016, "lon": -74.1469, "hub": True},

    # AFRIKA
    {"country_code": "ZA", "name": "Johannesburg", "name_uz": "Yoxannesburg", "iata": "JNB", "lat": -26.1392, "lon": 28.2460, "hub": True},
    {"country_code": "ZA", "name": "Cape Town", "name_uz": "Keyptaun", "iata": "CPT", "lat": -33.9715, "lon": 18.6021, "hub": False},
    {"country_code": "KE", "name": "Nairobi", "name_uz": "Nayrobi", "iata": "NBO", "lat": -1.3192, "lon": 36.9278, "hub": True},
    {"country_code": "ET", "name": "Addis Ababa", "name_uz": "Addis-Abeba", "iata": "ADD", "lat": 8.9779, "lon": 38.7993, "hub": True},
    {"country_code": "MA", "name": "Casablanca", "name_uz": "Kasablanka", "iata": "CMN", "lat": 33.3676, "lon": -7.5898, "hub": True},
    {"country_code": "NG", "name": "Lagos", "name_uz": "Lagos", "iata": "LOS", "lat": 6.5774, "lon": 3.3213, "hub": True},
    {"country_code": "DZ", "name": "Algiers", "name_uz": "Jazoir", "iata": "ALG", "lat": 36.6910, "lon": 3.2154, "hub": False},
    {"country_code": "TN", "name": "Tunis", "name_uz": "Tunis", "iata": "TUN", "lat": 36.8510, "lon": 10.2272, "hub": False},

    # AVSTRALIYA VA OKEANIYA
    {"country_code": "AUS", "name": "Melbourne", "name_uz": "Melburn", "iata": "MEL", "lat": -37.6690, "lon": 144.8410, "hub": True},
    {"country_code": "AUS", "name": "Brisbane", "name_uz": "Brisben", "iata": "BNE", "lat": -27.3842, "lon": 153.1175, "hub": True},
    {"country_code": "AUS", "name": "Perth", "name_uz": "Pert", "iata": "PER", "lat": -31.9403, "lon": 115.9672, "hub": False},
    {"country_code": "NZ", "name": "Auckland", "name_uz": "Oklend", "iata": "AKL", "lat": -37.0082, "lon": 174.7850, "hub": True},

    # O'RTA SHARQ
    {"country_code": "IL", "name": "Tel Aviv", "name_uz": "Tel-Aviv", "iata": "TLV", "lat": 32.0114, "lon": 34.8867, "hub": True},
    {"country_code": "JO", "name": "Amman", "name_uz": "Amman", "iata": "AMM", "lat": 31.7226, "lon": 35.9932, "hub": False},
    {"country_code": "LB", "name": "Beirut", "name_uz": "Beyrut", "iata": "BEY", "lat": 33.8209, "lon": 35.4884, "hub": False},
    {"country_code": "IQ", "name": "Baghdad", "name_uz": "Bag'dod", "iata": "BGW", "lat": 33.2625, "lon": 44.2346, "hub": False},
    {"country_code": "KW", "name": "Kuwait", "name_uz": "Quvayt", "iata": "KWI", "lat": 29.2267, "lon": 47.9689, "hub": True},
    {"country_code": "OM", "name": "Muscat", "name_uz": "Maskat", "iata": "MCT", "lat": 23.5933, "lon": 58.2844, "hub": True},
    {"country_code": "BH", "name": "Manama", "name_uz": "Manama", "iata": "BAH", "lat": 26.2708, "lon": 50.6336, "hub": True},
    {"country_code": "SA", "name": "Jeddah", "name_uz": "Jidda", "iata": "JED", "lat": 21.6796, "lon": 39.1565, "hub": True},
    {"country_code": "SA", "name": "Riyadh", "name_uz": "Ar-Riyod", "iata": "RUH", "lat": 24.9578, "lon": 46.6988, "hub": True},
]


def import_airports():
    """Aeroportlarni import qilish"""
    added = 0
    skipped = 0
    errors = 0

    print(f"\nAeroportlarni import qilish boshlandi...")
    print(f"Jami: {len(airports_data)} ta aeroportlar\n")

    for airport in airports_data:
        try:
            # Aeroportlar allaqachon mavjudmi?
            if City.objects.filter(iata_code=airport['iata']).exists():
                print(f"SKIP {airport['iata']} - {airport['name_uz']} (mavjud)")
                skipped += 1
                continue

            # Mamlakatni topish
            country = Country.objects.filter(code=airport['country_code']).first()
            if not country:
                print(f"ERR  {airport['iata']} - Mamlakat topilmadi: {airport['country_code']}")
                errors += 1
                continue

            # Aeroportni yaratish
            city = City.objects.create(
                country=country,
                name=airport['name'],
                name_uz=airport['name_uz'],
                iata_code=airport['iata'],
                latitude=airport['lat'],
                longitude=airport['lon'],
                is_hub=airport['hub'],
                avg_hotel_price_usd=50.00  # Default narx
            )

            print(f"OK   {airport['iata']} - {airport['name_uz']} ({country.name_uz})")
            added += 1

        except Exception as e:
            print(f"ERR  {airport.get('iata', 'UNKNOWN')} - Xatolik: {str(e)}")
            errors += 1

    print(f"\n{'='*60}")
    print(f"Qo'shildi: {added} ta")
    print(f"O'tkazildi: {skipped} ta")
    print(f"Xatoliklar: {errors} ta")
    print(f"{'='*60}\n")

    # Jami statistika
    total_cities = City.objects.count()
    total_countries = Country.objects.count()

    print(f"Umumiy statistika:")
    print(f"   Jami shaharlar: {total_cities} ta")
    print(f"   Jami mamlakatlar: {total_countries} ta")
    print(f"   Tranzit hublar: {City.objects.filter(is_hub=True).count()} ta")


if __name__ == '__main__':
    import_airports()
