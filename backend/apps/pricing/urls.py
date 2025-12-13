from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import FlightPriceViewSet, HotelPriceViewSet, PriceMatrixViewSet

router = DefaultRouter()
router.register(r'flights', FlightPriceViewSet, basename='flight')
router.register(r'hotels', HotelPriceViewSet, basename='hotel')
router.register(r'matrix', PriceMatrixViewSet, basename='matrix')

urlpatterns = [
    path('', include(router.urls)),
]
