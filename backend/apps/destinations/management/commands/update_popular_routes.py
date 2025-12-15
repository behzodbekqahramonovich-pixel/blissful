"""
Mashhur yo'nalishlarni yangilash management command

Ishlatish:
    python manage.py update_popular_routes
    python manage.py update_popular_routes --origin TAS
    python manage.py update_popular_routes --all
"""

from django.core.management.base import BaseCommand
from services.popular_routes_scraper import popular_routes_scraper
from apps.destinations.models import City


class Command(BaseCommand):
    help = "Mashhur yo'nalishlarni API dan olib bazaga saqlaydi"

    def add_arguments(self, parser):
        parser.add_argument(
            '--origin',
            type=str,
            default='TAS',
            help="Boshlang'ich shahar IATA kodi (default: TAS)"
        )
        parser.add_argument(
            '--all',
            action='store_true',
            help="Barcha shaharlar uchun yangilash"
        )

    def handle(self, *args, **options):
        if options['all']:
            # Barcha hub shaharlar uchun yangilash
            origins = City.objects.filter(is_hub=True).values_list('iata_code', flat=True)
            if not origins:
                origins = ['TAS']  # Default
        else:
            origins = [options['origin']]

        total_updated = 0

        for origin in origins:
            self.stdout.write(f"\n{origin} dan mashhur yo'nalishlar yangilanmoqda...")

            try:
                count = popular_routes_scraper.update_popular_routes(origin)
                total_updated += count
                self.stdout.write(
                    self.style.SUCCESS(f"  [OK] {count} ta yo'nalish yangilandi")
                )
            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(f"  [XATO] {e}")
                )

        self.stdout.write(
            self.style.SUCCESS(f"\nJami {total_updated} ta yo'nalish yangilandi!")
        )
