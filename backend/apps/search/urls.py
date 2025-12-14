from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    TravelSearchViewSet,
    RouteVariantViewSet,
    LiveFlightPricesView,
    FlightPriceCalendarView,
    LiveHotelPricesView,
    APIStatusView
)

router = DefaultRouter()
router.register(r'', TravelSearchViewSet, basename='search')
router.register(r'variants', RouteVariantViewSet, basename='variant')

urlpatterns = [
    # Real vaqtda narxlar
    path('flights/live/', LiveFlightPricesView.as_view(), name='live-flight-prices'),
    path('flights/calendar/', FlightPriceCalendarView.as_view(), name='flight-price-calendar'),
    path('hotels/live/', LiveHotelPricesView.as_view(), name='live-hotel-prices'),
    path('api-status/', APIStatusView.as_view(), name='api-status'),
    # Router URLlari
    path('', include(router.urls)),
]
