from django.db import models


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
