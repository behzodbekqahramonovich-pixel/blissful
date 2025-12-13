from django.db import models
from apps.destinations.models import City


class TravelSearch(models.Model):
    """Sayohat qidiruvi modeli"""
    origin = models.ForeignKey(
        City,
        on_delete=models.CASCADE,
        related_name='search_origins',
        verbose_name="Qayerdan"
    )
    destination = models.ForeignKey(
        City,
        on_delete=models.CASCADE,
        related_name='search_destinations',
        verbose_name="Qayerga"
    )
    departure_date = models.DateField(verbose_name="Ketish sanasi")
    return_date = models.DateField(verbose_name="Qaytish sanasi")
    travelers = models.IntegerField(default=1, verbose_name="Yo'lovchilar soni")
    include_transit = models.BooleanField(default=True, verbose_name="Tranzit qo'shish")
    hotel_stars = models.IntegerField(default=3, verbose_name="Mehmonxona yulduzlari")
    budget_max_usd = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name="Maksimal byudjet (USD)"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Sayohat qidiruvi"
        verbose_name_plural = "Sayohat qidiruvlari"
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.origin.iata_code} -> {self.destination.iata_code} ({self.departure_date})"

    @property
    def nights(self):
        """Kechalar soni"""
        return (self.return_date - self.departure_date).days


class RouteVariant(models.Model):
    """Yo'nalish varianti modeli"""
    ROUTE_TYPES = [
        ('direct', "To'g'ridan-to'g'ri"),
        ('transit', "Tranzit"),
        ('multi', "Multi-city"),
    ]

    search = models.ForeignKey(
        TravelSearch,
        on_delete=models.CASCADE,
        related_name='variants',
        verbose_name="Qidiruv"
    )
    route_type = models.CharField(
        max_length=20,
        choices=ROUTE_TYPES,
        verbose_name="Yo'nalish turi"
    )
    cities_sequence = models.JSONField(
        default=list,
        verbose_name="Shaharlar ketma-ketligi"
    )
    total_flight_cost = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        verbose_name="Jami parvoz narxi (USD)"
    )
    total_hotel_cost = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        verbose_name="Jami mehmonxona narxi (USD)"
    )
    total_cost = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        verbose_name="Jami narx (USD)"
    )
    savings_percent = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=0,
        verbose_name="Tejamkorlik (%)"
    )
    savings_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
        verbose_name="Tejamkorlik (USD)"
    )
    is_recommended = models.BooleanField(default=False, verbose_name="Tavsiya etiladi")
    score = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=0,
        verbose_name="Ball"
    )
    details = models.JSONField(default=dict, verbose_name="Tafsilotlar")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Yo'nalish varianti"
        verbose_name_plural = "Yo'nalish variantlari"
        ordering = ['total_cost']

    def __str__(self):
        return f"{self.get_route_type_display()}: ${self.total_cost}"
