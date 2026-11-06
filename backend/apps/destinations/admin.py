from django.contrib import admin
from .models import Country, City, TransportLeg


@admin.register(Country)
class CountryAdmin(admin.ModelAdmin):
    list_display = ['flag_emoji', 'name_uz', 'code', 'currency', 'visa_required_for_uz']
    list_filter = ['visa_required_for_uz']
    search_fields = ['name', 'name_uz', 'code']


@admin.register(City)
class CityAdmin(admin.ModelAdmin):
    list_display = ['name_uz', 'iata_code', 'country', 'is_hub', 'avg_hotel_price_usd']
    list_filter = ['is_hub', 'country']
    search_fields = ['name', 'name_uz', 'iata_code']


@admin.register(TransportLeg)
class TransportLegAdmin(admin.ModelAdmin):
    list_display = ['from_city', 'to_city', 'mode', 'duration_min', 'price_usd', 'is_bidirectional', 'is_active']
    list_filter = ['mode', 'is_active', 'source']
    search_fields = ['from_city__name_uz', 'to_city__name_uz', 'from_city__iata_code', 'to_city__iata_code']
    raw_id_fields = ['from_city', 'to_city']
