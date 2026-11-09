"""
Yer transporti qirralarini (va kerak bo'lsa yangi shaharlarni) CSV dan yuklash.

    python manage.py import_transport
    python manage.py import_transport --cities my_cities.csv --legs my_legs.csv

cities CSV:  iata,name,name_uz,same_country_as,lat,lon   (iata bo'sh = aeroportsiz shahar;
             same_country_as = o'sha mamlakatdagi mavjud shahar IATA kodi)
legs CSV:    from,to,mode,duration_min,price_usd,headway_min   (from/to = IATA yoki name_uz)
Mavjud yozuvlar yangilanadi (update_or_create), o'chirilmaydi.
"""
import csv
from pathlib import Path

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from apps.destinations.models import City, TransportLeg

FIXTURES = Path(__file__).resolve().parents[4] / 'fixtures'


def find_city(ref: str) -> City:
    city = City.objects.filter(iata_code=ref.upper()).first() or City.objects.filter(name_uz=ref).first()
    if not city:
        raise CommandError(f"Shahar topilmadi: {ref}")
    return city


class Command(BaseCommand):
    help = "Yer transporti qirralarini CSV dan yuklaydi"

    def add_arguments(self, parser):
        parser.add_argument('--cities', default=FIXTURES / 'ground_cities.csv')
        parser.add_argument('--legs', default=FIXTURES / 'transport_legs.csv')

    @transaction.atomic
    def handle(self, *args, **opts):
        created_cities = 0
        with open(opts['cities'], encoding='utf-8') as f:
            for row in csv.DictReader(f):
                iata = row['iata'].strip().upper() or None
                exists = City.objects.filter(iata_code=iata).exists() if iata else City.objects.filter(name_uz=row['name_uz']).exists()
                if exists:
                    continue
                City.objects.create(
                    iata_code=iata, name=row['name'], name_uz=row['name_uz'],
                    country=find_city(row['same_country_as']).country,
                    latitude=row['lat'], longitude=row['lon'],
                )
                created_cities += 1

        created = updated = 0
        with open(opts['legs'], encoding='utf-8') as f:
            for row in csv.DictReader(f):
                _, was_created = TransportLeg.objects.update_or_create(
                    from_city=find_city(row['from']), to_city=find_city(row['to']), mode=row['mode'],
                    defaults=dict(duration_min=int(row['duration_min']), price_usd=row['price_usd'],
                                  headway_min=int(row['headway_min'] or 0), source='admin', is_active=True),
                )
                created += was_created
                updated += not was_created

        self.stdout.write(self.style.SUCCESS(
            f"Shaharlar: +{created_cities}. Qirralar: +{created} yangi, {updated} yangilandi."
        ))
