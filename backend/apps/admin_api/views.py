from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.authentication.middleware import JWTAuthentication
from .permissions import IsAdminUser
from .serializers import (
    AdminCountrySerializer,
    AdminCitySerializer,
    AdminFlightPriceSerializer,
    AdminHotelPriceSerializer
)
from apps.destinations.models import Country, City
from apps.pricing.models import FlightPrice, HotelPrice


class AdminCountryViewSet(viewsets.ModelViewSet):
    """
    CRUD operations for Countries.
    Only accessible to admin users.
    """
    queryset = Country.objects.all()
    serializer_class = AdminCountrySerializer
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAdminUser]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'name_uz', 'code']
    ordering_fields = ['name_uz', 'code', 'id']
    ordering = ['name_uz']


class AdminCityViewSet(viewsets.ModelViewSet):
    """
    CRUD operations for Cities.
    Only accessible to admin users.
    """
    queryset = City.objects.select_related('country').all()
    serializer_class = AdminCitySerializer
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAdminUser]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'name_uz', 'iata_code']
    ordering_fields = ['name_uz', 'iata_code', 'id', 'country__name_uz']
    ordering = ['name_uz']

    def get_queryset(self):
        queryset = super().get_queryset()
        country = self.request.query_params.get('country')
        is_hub = self.request.query_params.get('is_hub')

        if country:
            queryset = queryset.filter(country_id=country)
        if is_hub is not None:
            queryset = queryset.filter(is_hub=is_hub.lower() == 'true')

        return queryset


class AdminFlightPriceViewSet(viewsets.ModelViewSet):
    """
    CRUD operations for Flight Prices.
    Only accessible to admin users.
    """
    queryset = FlightPrice.objects.select_related('origin', 'destination').all()
    serializer_class = AdminFlightPriceSerializer
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAdminUser]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['airline', 'origin__name_uz', 'destination__name_uz']
    ordering_fields = ['price_usd', 'departure_date', 'id', 'airline']
    ordering = ['-departure_date']

    def get_queryset(self):
        queryset = super().get_queryset()
        origin = self.request.query_params.get('origin')
        destination = self.request.query_params.get('destination')
        airline = self.request.query_params.get('airline')
        departure_date = self.request.query_params.get('departure_date')

        if origin:
            queryset = queryset.filter(origin_id=origin)
        if destination:
            queryset = queryset.filter(destination_id=destination)
        if airline:
            queryset = queryset.filter(airline__icontains=airline)
        if departure_date:
            queryset = queryset.filter(departure_date=departure_date)

        return queryset


class AdminHotelPriceViewSet(viewsets.ModelViewSet):
    """
    CRUD operations for Hotel Prices.
    Only accessible to admin users.
    """
    queryset = HotelPrice.objects.select_related('city').all()
    serializer_class = AdminHotelPriceSerializer
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAdminUser]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['hotel_name', 'city__name_uz']
    ordering_fields = ['price_per_night_usd', 'stars', 'id', 'hotel_name']
    ordering = ['hotel_name']

    def get_queryset(self):
        queryset = super().get_queryset()
        city = self.request.query_params.get('city')
        stars = self.request.query_params.get('stars')
        checkin_date = self.request.query_params.get('checkin_date')

        if city:
            queryset = queryset.filter(city_id=city)
        if stars:
            queryset = queryset.filter(stars=stars)
        if checkin_date:
            queryset = queryset.filter(checkin_date=checkin_date)

        return queryset

    @action(detail=False, methods=['get'])
    def stats(self, request):
        """
        Dashboard statistics endpoint.
        Returns counts of all main entities.
        """
        return Response({
            'countries_count': Country.objects.count(),
            'cities_count': City.objects.count(),
            'flights_count': FlightPrice.objects.count(),
            'hotels_count': HotelPrice.objects.count(),
            'hub_cities_count': City.objects.filter(is_hub=True).count(),
        })
