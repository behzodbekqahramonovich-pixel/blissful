from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    TravelSearchViewSet,
    RouteVariantViewSet,
    LiveFlightPricesView,
    FlightPriceCalendarView,
    LiveHotelPricesView,
    APIStatusView,
    TravelNewsView,
    AIChatView
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
    # Yangiliklar
    path('news/', TravelNewsView.as_view(), name='travel-news'),
    # AI Chatbot
    path('ai-chat/', AIChatView.as_view(), name='ai-chat'),
    # Router URLlari
    path('', include(router.urls)),
]
