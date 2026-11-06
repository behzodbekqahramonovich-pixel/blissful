from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    AdminCountryViewSet,
    AdminCityViewSet,
    AdminFlightPriceViewSet,
    AdminHotelPriceViewSet,
    AdminTransportLegViewSet
)

router = DefaultRouter()
router.register(r'countries', AdminCountryViewSet, basename='admin-country')
router.register(r'cities', AdminCityViewSet, basename='admin-city')
router.register(r'flights', AdminFlightPriceViewSet, basename='admin-flight')
router.register(r'hotels', AdminHotelPriceViewSet, basename='admin-hotel')
router.register(r'transport', AdminTransportLegViewSet, basename='admin-transport')

urlpatterns = [
    path('', include(router.urls)),
]
