from django.contrib import admin
from .models import TravelSearch, RouteVariant


@admin.register(TravelSearch)
class TravelSearchAdmin(admin.ModelAdmin):
    list_display = ['origin', 'destination', 'departure_date', 'return_date', 'travelers']
    list_filter = ['departure_date', 'include_transit']
    search_fields = ['origin__name_uz', 'destination__name_uz']


@admin.register(RouteVariant)
class RouteVariantAdmin(admin.ModelAdmin):
    list_display = ['search', 'route_type', 'total_cost', 'savings_percent', 'is_recommended']
    list_filter = ['route_type', 'is_recommended']
