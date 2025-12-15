from django.db import models
from django.utils import timezone


class Country(models.Model):
    """Mamlakat modeli"""
    name = models.CharField(max_length=100, verbose_name="Nomi (English)")
    name_uz = models.CharField(max_length=100, verbose_name="Nomi (O'zbekcha)")
    code = models.CharField(max_length=3, unique=True, verbose_name="ISO kod")
    flag_emoji = models.CharField(max_length=10, verbose_name="Bayroq emoji")
    currency = models.CharField(max_length=10, verbose_name="Valyuta")
    visa_required_for_uz = models.BooleanField(default=False, verbose_name="Viza kerakmi")

    class Meta:
        verbose_name = "Mamlakat"
        verbose_name_plural = "Mamlakatlar"
        ordering = ['name_uz']

    def __str__(self):
        return f"{self.flag_emoji} {self.name_uz}"


class City(models.Model):
    """Shahar modeli"""
    country = models.ForeignKey(
        Country,
        on_delete=models.CASCADE,
        related_name='cities',
        verbose_name="Mamlakat"
    )
    name = models.CharField(max_length=100, verbose_name="Nomi (English)")
    name_uz = models.CharField(max_length=100, verbose_name="Nomi (O'zbekcha)")
    iata_code = models.CharField(max_length=3, unique=True, verbose_name="IATA kodi")
    latitude = models.DecimalField(
        max_digits=10,
        decimal_places=7,
        verbose_name="Kenglik"
    )
    longitude = models.DecimalField(
        max_digits=10,
        decimal_places=7,
        verbose_name="Uzunlik"
    )
    is_hub = models.BooleanField(default=False, verbose_name="Tranzit hub")
    avg_hotel_price_usd = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=50.00,
        verbose_name="O'rtacha mehmonxona narxi (USD)"
    )

    class Meta:
        verbose_name = "Shahar"
        verbose_name_plural = "Shaharlar"
        ordering = ['name_uz']

    def __str__(self):
        return f"{self.name_uz} ({self.iata_code})"


class PopularRoute(models.Model):
    """Mashhur yo'nalishlar modeli"""
    origin = models.ForeignKey(
        City,
        on_delete=models.CASCADE,
        related_name='popular_routes_from',
        verbose_name="Qayerdan"
    )
    destination = models.ForeignKey(
        City,
        on_delete=models.CASCADE,
        related_name='popular_routes_to',
        verbose_name="Qayerga"
    )
    avg_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        verbose_name="O'rtacha narx (USD)"
    )
    min_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name="Minimal narx (USD)"
    )
    popularity_score = models.IntegerField(
        default=0,
        verbose_name="Mashhurlik balli"
    )
    searches_count = models.IntegerField(
        default=0,
        verbose_name="Qidiruvlar soni"
    )
    image_url = models.URLField(
        max_length=500,
        blank=True,
        verbose_name="Rasm URL"
    )
    description = models.TextField(
        blank=True,
        verbose_name="Tavsif"
    )
    best_season = models.CharField(
        max_length=50,
        blank=True,
        verbose_name="Eng yaxshi mavsum"
    )
    flight_duration_avg = models.IntegerField(
        default=0,
        verbose_name="O'rtacha parvoz davomiyligi (daqiqa)"
    )
    is_active = models.BooleanField(
        default=True,
        verbose_name="Faol"
    )
    last_updated = models.DateTimeField(
        auto_now=True,
        verbose_name="Oxirgi yangilanish"
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Yaratilgan vaqt"
    )

    class Meta:
        verbose_name = "Mashhur yo'nalish"
        verbose_name_plural = "Mashhur yo'nalishlar"
        ordering = ['-popularity_score', '-searches_count']
        unique_together = ['origin', 'destination']

    def __str__(self):
        return f"{self.origin.iata_code} → {self.destination.iata_code} (${self.avg_price})"
