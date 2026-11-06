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
    # Aeroportsiz shahar: iata_code bo'sh, aeroportga yo'l TransportLeg orqali
    iata_code = models.CharField(max_length=3, unique=True, null=True, blank=True, verbose_name="IATA kodi")
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
        return f"{self.name_uz} ({self.iata_code or 'transfer'})"


class TransportLeg(models.Model):
    """Graf qirrasi: bir shahardan ikkinchisiga bitta transport turi bilan"""
    MODES = [('plane', 'Samolyot'), ('train', 'Poyezd'), ('bus', 'Avtobus'),
             ('car', 'Avtomobil/Taksi')]
    from_city = models.ForeignKey(City, on_delete=models.CASCADE, related_name='legs_out', verbose_name="Qayerdan")
    to_city = models.ForeignKey(City, on_delete=models.CASCADE, related_name='legs_in', verbose_name="Qayerga")
    mode = models.CharField(max_length=10, choices=MODES, verbose_name="Transport turi")
    duration_min = models.PositiveIntegerField(verbose_name="Davomiylik (daqiqa)")
    price_usd = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="Narx (USD, 1 kishi)")
    headway_min = models.PositiveIntegerField(default=0, verbose_name="Reyslar oralig'i (daqiqa)")  # 0 = istalgan vaqtda (taksi)
    first_departure = models.TimeField(null=True, blank=True, verbose_name="Birinchi reys")
    last_departure = models.TimeField(null=True, blank=True, verbose_name="Oxirgi reys")
    is_bidirectional = models.BooleanField(default=True, verbose_name="Ikki tomonga")
    source = models.CharField(max_length=20, default='admin', verbose_name="Manba")  # admin | api | estimate
    link = models.URLField(blank=True, verbose_name="Havola")
    is_active = models.BooleanField(default=True, verbose_name="Faol")

    class Meta:
        verbose_name = "Transport qirrasi"
        verbose_name_plural = "Transport qirralari"
        unique_together = ['from_city', 'to_city', 'mode']
        ordering = ['from_city__name_uz', 'to_city__name_uz', 'mode']

    def __str__(self):
        arrow = '↔' if self.is_bidirectional else '→'
        return f"{self.from_city.name_uz} {arrow} {self.to_city.name_uz} ({self.get_mode_display()})"

    def directions(self):
        """Qirra yuradigan yo'nalishlar: [(qayerdan, qayerga), ...]"""
        pairs = [(self.from_city, self.to_city)]
        if self.is_bidirectional:
            pairs.append((self.to_city, self.from_city))
        return pairs


def airport_access(city):
    """
    Aeroportsiz shahar uchun eng arzon yer transporti juftligi.
    Qaytadi: (aeroport, borish qirrasi aeroport→shahar, qaytish qirrasi shahar→aeroport) yoki None.
    """
    legs = (TransportLeg.objects.filter(is_active=True).exclude(mode='plane')
            .filter(models.Q(from_city=city) | models.Q(to_city=city))
            .select_related('from_city', 'to_city'))
    to_city, from_city = {}, {}  # aeroport id -> eng arzon qirra
    for leg in legs:
        for a, b in leg.directions():
            if b.id == city.id and a.iata_code:
                best, key = to_city, a
            elif a.id == city.id and b.iata_code:
                best, key = from_city, b
            else:
                continue
            if key.id not in best or leg.price_usd < best[key.id][1].price_usd:
                best[key.id] = (key, leg)
    common = to_city.keys() & from_city.keys()
    if not common:
        return None
    aid = min(common, key=lambda i: to_city[i][1].price_usd + from_city[i][1].price_usd)
    return to_city[aid][0], to_city[aid][1], from_city[aid][1]


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
