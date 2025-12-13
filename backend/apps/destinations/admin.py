from django.contrib import admin
from .models import Country, City


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
