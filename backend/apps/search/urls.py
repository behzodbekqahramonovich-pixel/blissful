from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import TravelSearchViewSet, RouteVariantViewSet

router = DefaultRouter()
router.register(r'', TravelSearchViewSet, basename='search')
router.register(r'variants', RouteVariantViewSet, basename='variant')

urlpatterns = [
    path('', include(router.urls)),
]
