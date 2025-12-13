from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from .models import TravelSearch, RouteVariant
from .serializers import (
    TravelSearchSerializer,
    TravelSearchCreateSerializer,
    RouteVariantSerializer,
    SearchResultSerializer
)
from apps.destinations.models import City
from services.route_finder import RouteFinder


class TravelSearchViewSet(viewsets.ModelViewSet):
    """Sayohat qidiruvi API"""
    queryset = TravelSearch.objects.prefetch_related('variants').all()
    serializer_class = TravelSearchSerializer

    def get_serializer_class(self):
        if self.action == 'create':
            return TravelSearchCreateSerializer
        return TravelSearchSerializer

    def create(self, request, *args, **kwargs):
        """Yangi qidiruv yaratish va variantlarni topish"""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        # Shaharlarni topish
        origin = get_object_or_404(City, iata_code=data['origin'])
        destination = get_object_or_404(City, iata_code=data['destination'])

        # Qidiruvni yaratish
        search = TravelSearch.objects.create(
            origin=origin,
            destination=destination,
            departure_date=data['departure_date'],
            return_date=data['return_date'],
            travelers=data.get('travelers', 1),
            include_transit=data.get('include_transit', True),
            hotel_stars=data.get('hotel_stars', 3),
            budget_max_usd=data.get('budget_max')
        )

        # Yo'nalishlarni topish
        finder = RouteFinder(search)
        variants = finder.find_all_routes()
        saved_variants = finder.save_variants(variants)

        # Tavsiya qilingan variant
        recommended = next(
            (v for v in saved_variants if v.is_recommended),
            saved_variants[0] if saved_variants else None
        )

        result = {
            'search': TravelSearchSerializer(search).data,
            'variants': RouteVariantSerializer(saved_variants, many=True).data,
            'recommended': RouteVariantSerializer(recommended).data if recommended else None
        }

        return Response(result, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['get'])
    def variants(self, request, pk=None):
        """Qidiruv variantlari"""
        search = self.get_object()
        variants = search.variants.all()
        serializer = RouteVariantSerializer(variants, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def popular(self, request):
        """Mashhur yo'nalishlar"""
        popular_routes = [
            {
                'origin': 'TAS',
                'origin_name': 'Toshkent',
                'destination': 'IST',
                'destination_name': 'Istanbul',
                'avg_price': 450,
                'image': 'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=400'
            },
            {
                'origin': 'TAS',
                'origin_name': 'Toshkent',
                'destination': 'DXB',
                'destination_name': 'Dubai',
                'avg_price': 380,
                'image': 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=400'
            },
            {
                'origin': 'TAS',
                'origin_name': 'Toshkent',
                'destination': 'BKK',
                'destination_name': 'Bangkok',
                'avg_price': 520,
                'image': 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=400'
            },
            {
                'origin': 'TAS',
                'origin_name': 'Toshkent',
                'destination': 'KUL',
                'destination_name': 'Kuala Lumpur',
                'avg_price': 480,
                'image': 'https://images.unsplash.com/photo-1596422846543-75c6fc197f07?w=400'
            }
        ]
        return Response(popular_routes)


class RouteVariantViewSet(viewsets.ReadOnlyModelViewSet):
    """Yo'nalish varianti API"""
    queryset = RouteVariant.objects.select_related('search').all()
    serializer_class = RouteVariantSerializer
