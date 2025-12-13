from django.contrib import admin
from .models import FlightPrice, HotelPrice


@admin.register(FlightPrice)
class FlightPriceAdmin(admin.ModelAdmin):
    list_display = ['origin', 'destination', 'price_usd', 'airline', 'departure_date']
    list_filter = ['airline', 'departure_date', 'is_roundtrip']
    search_fields = ['origin__name_uz', 'destination__name_uz', 'airline']


@admin.register(HotelPrice)
class HotelPriceAdmin(admin.ModelAdmin):
    list_display = ['hotel_name', 'city', 'stars', 'price_per_night_usd', 'rating']
    list_filter = ['stars', 'city']
    search_fields = ['hotel_name', 'city__name_uz']
