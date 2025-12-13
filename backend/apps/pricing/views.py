from rest_framework import viewsets, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Min
from .models import FlightPrice, HotelPrice
from .serializers import FlightPriceSerializer, HotelPriceSerializer
from apps.destinations.models import City


class FlightPriceViewSet(viewsets.ReadOnlyModelViewSet):
    """Parvoz narxlari API"""
    queryset = FlightPrice.objects.select_related('origin', 'destination').all()
    serializer_class = FlightPriceSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ['airline', 'origin__name_uz', 'destination__name_uz']

    @action(detail=False, methods=['get'])
    def search(self, request):
        """Parvoz qidirish"""
        origin = request.query_params.get('origin')
        destination = request.query_params.get('destination')
        date = request.query_params.get('date')

        flights = self.get_queryset()
        if origin:
            flights = flights.filter(origin__iata_code=origin)
        if destination:
            flights = flights.filter(destination__iata_code=destination)
        if date:
            flights = flights.filter(departure_date=date)

        serializer = self.get_serializer(flights[:20], many=True)
        return Response(serializer.data)


class HotelPriceViewSet(viewsets.ReadOnlyModelViewSet):
    """Mehmonxona narxlari API"""
    queryset = HotelPrice.objects.select_related('city').all()
    serializer_class = HotelPriceSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ['hotel_name', 'city__name_uz']

    @action(detail=False, methods=['get'])
    def search(self, request):
        """Mehmonxona qidirish"""
        city = request.query_params.get('city')
        stars = request.query_params.get('stars')
        date = request.query_params.get('date')

        hotels = self.get_queryset()
        if city:
            hotels = hotels.filter(city__iata_code=city)
        if stars:
            hotels = hotels.filter(stars__gte=int(stars))
        if date:
            hotels = hotels.filter(checkin_date=date)

        serializer = self.get_serializer(hotels[:20], many=True)
        return Response(serializer.data)


class PriceMatrixViewSet(viewsets.ViewSet):
    """Narxlar matritsasi"""

    def list(self, request):
        """Barcha yo'nalishlar bo'yicha eng arzon narxlar"""
        cities = City.objects.filter(is_hub=True).values_list('iata_code', flat=True)

        matrix = {}
        for origin in cities:
            matrix[origin] = {}
            for dest in cities:
                if origin != dest:
                    min_price = FlightPrice.objects.filter(
                        origin__iata_code=origin,
                        destination__iata_code=dest
                    ).aggregate(min_price=Min('price_usd'))['min_price']
                    matrix[origin][dest] = float(min_price) if min_price else None

        return Response(matrix)
