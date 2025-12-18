from rest_framework import serializers
from .models import TravelSearch, RouteVariant
from apps.destinations.serializers import CityMinimalSerializer
from datetime import date, timedelta


# Maksimal sayohat davomiyligi (kunlarda)
MAX_TRIP_DAYS = 60


class TravelSearchSerializer(serializers.ModelSerializer):
    """Sayohat qidiruvi serializeri"""
    origin_details = CityMinimalSerializer(source='origin', read_only=True)
    destination_details = CityMinimalSerializer(source='destination', read_only=True)
    nights = serializers.IntegerField(read_only=True)

    class Meta:
        model = TravelSearch
        fields = [
            'id', 'origin', 'destination', 'origin_details', 'destination_details',
            'departure_date', 'return_date', 'nights', 'travelers',
            'include_transit', 'hotel_stars', 'budget_max_usd', 'created_at'
        ]


class TravelSearchCreateSerializer(serializers.Serializer):
    """Sayohat qidiruvi yaratish serializeri"""
    origin = serializers.CharField(max_length=3)  # IATA kodi
    destination = serializers.CharField(max_length=3)
    departure_date = serializers.DateField()
    return_date = serializers.DateField()
    travelers = serializers.IntegerField(default=1, min_value=1, max_value=10)
    include_transit = serializers.BooleanField(default=True)
    max_stops = serializers.IntegerField(default=2, min_value=0, max_value=3)
    hotel_stars = serializers.IntegerField(default=3, min_value=1, max_value=5)
    budget_max = serializers.DecimalField(
        max_digits=10,
        decimal_places=2,
        required=False,
        allow_null=True,
        min_value=0  # Manfiy budget bo'lmasligi kerak
    )

    def validate_departure_date(self, value):
        """Ketish sanasi bugungi kundan oldin bo'lmasligi kerak"""
        today = date.today()
        if value < today:
            raise serializers.ValidationError(
                f"Ketish sanasi bugungi kundan ({today.strftime('%Y-%m-%d')}) oldin bo'lishi mumkin emas"
            )
        return value

    def validate(self, data):
        """Umumiy validatsiya"""
        # Qaytish sanasi ketish sanasidan keyin bo'lishi kerak
        if data['departure_date'] >= data['return_date']:
            raise serializers.ValidationError(
                "Qaytish sanasi ketish sanasidan keyin bo'lishi kerak"
            )

        # Ketish va kelish shaharlari bir xil bo'lmasligi kerak
        if data['origin'] == data['destination']:
            raise serializers.ValidationError(
                "Ketish va kelish shaharlari bir xil bo'lmasligi kerak"
            )

        # Sayohat davomiyligi maksimal chegaradan oshmasligi kerak
        trip_days = (data['return_date'] - data['departure_date']).days
        if trip_days > MAX_TRIP_DAYS:
            raise serializers.ValidationError(
                f"Sayohat davomiyligi {MAX_TRIP_DAYS} kundan oshmasligi kerak. "
                f"Siz {trip_days} kun tanladingiz."
            )

        return data


class RouteVariantSerializer(serializers.ModelSerializer):
    """Yo'nalish varianti serializeri"""
    route_type_display = serializers.CharField(
        source='get_route_type_display',
        read_only=True
    )

    class Meta:
        model = RouteVariant
        fields = [
            'id', 'route_type', 'route_type_display', 'cities_sequence',
            'total_flight_cost', 'total_hotel_cost', 'total_cost',
            'savings_percent', 'savings_amount', 'is_recommended',
            'score', 'details'
        ]


class SearchResultSerializer(serializers.Serializer):
    """Qidiruv natijasi serializeri"""
    search = TravelSearchSerializer()
    variants = RouteVariantSerializer(many=True)
    recommended = RouteVariantSerializer(allow_null=True)
