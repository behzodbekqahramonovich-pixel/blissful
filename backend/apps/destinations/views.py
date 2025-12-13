from rest_framework import viewsets, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Country, City
from .serializers import CountrySerializer, CitySerializer, CityMinimalSerializer


class CountryViewSet(viewsets.ReadOnlyModelViewSet):
    """Mamlakatlar API"""
    queryset = Country.objects.all()
    serializer_class = CountrySerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ['name', 'name_uz', 'code']


class CityViewSet(viewsets.ReadOnlyModelViewSet):
    """Shaharlar API"""
    queryset = City.objects.select_related('country').all()
    serializer_class = CitySerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ['name', 'name_uz', 'iata_code']

    @action(detail=False, methods=['get'])
    def hubs(self, request):
        """Tranzit hub shaharlar"""
        hubs = self.get_queryset().filter(is_hub=True)
        serializer = self.get_serializer(hubs, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def autocomplete(self, request):
        """Autocomplete uchun shaharlar"""
        query = request.query_params.get('q', '')
        cities = self.get_queryset()
        if query:
            cities = cities.filter(name_uz__icontains=query) | \
                     cities.filter(iata_code__icontains=query)
        cities = cities[:10]
        serializer = CityMinimalSerializer(cities, many=True)
        return Response(serializer.data)
