from django.db import models
from apps.destinations.models import City


class FlightPrice(models.Model):
    """Parvoz narxi modeli"""
    origin = models.ForeignKey(
        City,
        on_delete=models.CASCADE,
        related_name='departures',
        verbose_name="Qayerdan"
    )
    destination = models.ForeignKey(
        City,
        on_delete=models.CASCADE,
        related_name='arrivals',
        verbose_name="Qayerga"
    )
    price_usd = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        verbose_name="Narx (USD)"
    )
    airline = models.CharField(max_length=100, verbose_name="Aviakompaniya")
    flight_duration_minutes = models.IntegerField(verbose_name="Davomiylik (daqiqa)")
    departure_date = models.DateField(verbose_name="Uchish sanasi")
    departure_time = models.TimeField(null=True, blank=True, verbose_name="Uchish vaqti")
    arrival_time = models.TimeField(null=True, blank=True, verbose_name="Qo'nish vaqti")
    is_roundtrip = models.BooleanField(default=False, verbose_name="Borib-qaytish")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Parvoz narxi"
        verbose_name_plural = "Parvoz narxlari"
        ordering = ['price_usd']

    def __str__(self):
        return f"{self.origin.iata_code} -> {self.destination.iata_code}: ${self.price_usd}"


class HotelPrice(models.Model):
    """Mehmonxona narxi modeli"""
    STAR_CHOICES = [
        (1, '1 yulduz'),
        (2, '2 yulduz'),
        (3, '3 yulduz'),
        (4, '4 yulduz'),
        (5, '5 yulduz'),
    ]

    city = models.ForeignKey(
        City,
        on_delete=models.CASCADE,
        related_name='hotels',
        verbose_name="Shahar"
    )
    hotel_name = models.CharField(max_length=200, verbose_name="Mehmonxona nomi")
    stars = models.IntegerField(choices=STAR_CHOICES, verbose_name="Yulduzlar")
    price_per_night_usd = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        verbose_name="Kechalik narx (USD)"
    )
    rating = models.DecimalField(
        max_digits=3,
        decimal_places=1,
        default=8.0,
        verbose_name="Reyting"
    )
    checkin_date = models.DateField(verbose_name="Kirish sanasi")
    image_url = models.URLField(blank=True, null=True, verbose_name="Rasm URL")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Mehmonxona narxi"
        verbose_name_plural = "Mehmonxona narxlari"
        ordering = ['price_per_night_usd']

    def __str__(self):
        return f"{self.hotel_name} ({self.city.name_uz}): ${self.price_per_night_usd}/kecha"


class PriceAlert(models.Model):
    """Narx alert modeli - foydalanuvchilarga narx tushsa xabar berish"""

    email = models.EmailField(
        verbose_name="Email",
        help_text="Foydalanuvchi emaili"
    )

    origin = models.ForeignKey(
        City,
        on_delete=models.CASCADE,
        related_name='price_alerts_from',
        verbose_name="Boshlang'ich shahar"
    )

    destination = models.ForeignKey(
        City,
        on_delete=models.CASCADE,
        related_name='price_alerts_to',
        verbose_name="Manzil shahar"
    )

    target_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        verbose_name="Maqsadli narx (USD)",
        help_text="Narx bu summadan past bo'lsa xabar yuboriladi"
    )

    departure_date = models.DateField(
        null=True,
        blank=True,
        verbose_name="Jo'nash sanasi",
        help_text="Aniq sana uchun (optional)"
    )

    last_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name="Oxirgi tekshirilgan narx"
    )

    is_active = models.BooleanField(
        default=True,
        verbose_name="Faolmi",
        help_text="Alert faolmi"
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Yaratilgan"
    )

    last_checked = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name="Oxirgi tekshirilgan vaqt"
    )

    triggered_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name="Trigger bo'lgan vaqt",
        help_text="Narx maqsadga yetganda"
    )

    class Meta:
        db_table = 'price_alerts'
        verbose_name = 'Narx Alert'
        verbose_name_plural = 'Narx Alertlar'
        indexes = [
            models.Index(fields=['email', '-created_at']),
            models.Index(fields=['is_active', 'last_checked']),
        ]
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.email}: {self.origin.iata_code} → {self.destination.iata_code} @ ${self.target_price}"
