from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver


class UserProfile(models.Model):
    """Extended user profile with role and agency information."""

    ROLE_CHOICES = [
        ('traveler', 'Sayohatchi'),
        ('agency', 'Sayohat Agentligi'),
    ]

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='traveler')
    agency_name = models.CharField(max_length=255, blank=True, null=True)
    phone = models.CharField(max_length=20, blank=True, null=True)

    # Agentlik uchun qo'shimcha ma'lumotlar
    agency_logo = models.URLField(blank=True, null=True)
    agency_description = models.TextField(blank=True, null=True)
    agency_address = models.CharField(max_length=500, blank=True, null=True)
    agency_license = models.CharField(max_length=100, blank=True, null=True)  # Litsenziya raqami

    # Statistika
    total_bookings = models.IntegerField(default=0)
    total_clients = models.IntegerField(default=0)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Foydalanuvchi profili'
        verbose_name_plural = 'Foydalanuvchi profillari'

    def __str__(self):
        if self.role == 'agency' and self.agency_name:
            return f"{self.agency_name} (Agentlik)"
        return f"{self.user.username} ({self.get_role_display()})"

    @property
    def is_agency(self):
        return self.role == 'agency'

    @property
    def is_traveler(self):
        return self.role == 'traveler'


class AgencyClient(models.Model):
    """Agentlik mijozlari - agentlik o'z mijozlarini boshqaradi."""

    agency = models.ForeignKey(
        UserProfile,
        on_delete=models.CASCADE,
        related_name='clients',
        limit_choices_to={'role': 'agency'}
    )

    # Mijoz ma'lumotlari
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    email = models.EmailField(blank=True, null=True)
    phone = models.CharField(max_length=20)
    passport_number = models.CharField(max_length=50, blank=True, null=True)
    birth_date = models.DateField(blank=True, null=True)

    # Qo'shimcha
    notes = models.TextField(blank=True, null=True)
    is_active = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Agentlik mijozi'
        verbose_name_plural = 'Agentlik mijozlari'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.first_name} {self.last_name}"

    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}"


class Booking(models.Model):
    """Bron qilish - sayohatchi yoki agentlik mijozi uchun."""

    STATUS_CHOICES = [
        ('pending', 'Kutilmoqda'),
        ('confirmed', 'Tasdiqlangan'),
        ('cancelled', 'Bekor qilingan'),
        ('completed', 'Yakunlangan'),
    ]

    # Bron qiluvchi
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='bookings')

    # Agentlik uchun - qaysi mijoz uchun bron qilingan
    client = models.ForeignKey(
        AgencyClient,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='bookings'
    )

    # Sayohat ma'lumotlari
    origin = models.CharField(max_length=10)  # IATA kod
    destination = models.CharField(max_length=10)  # IATA kod
    departure_date = models.DateField()
    return_date = models.DateField(blank=True, null=True)
    travelers = models.IntegerField(default=1)
    nights = models.IntegerField(default=1)

    # Narx
    flight_cost = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    hotel_cost = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total_cost = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    # Variant ma'lumotlari (JSON)
    variant_data = models.JSONField(blank=True, null=True)

    # Status
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')

    # Qo'shimcha
    notes = models.TextField(blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Bron'
        verbose_name_plural = 'Bronlar'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.origin} -> {self.destination} ({self.departure_date})"

    @property
    def is_agency_booking(self):
        return self.client is not None


# Signal: User yaratilganda avtomatik UserProfile yaratish
@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        UserProfile.objects.create(user=instance)


@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    if hasattr(instance, 'profile'):
        instance.profile.save()
