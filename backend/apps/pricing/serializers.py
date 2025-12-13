from rest_framework import serializers
from .models import FlightPrice, HotelPrice


class FlightPriceSerializer(serializers.ModelSerializer):
    """Parvoz narxi serializeri"""
    origin_name = serializers.CharField(source='origin.name_uz', read_only=True)
    origin_code = serializers.CharField(source='origin.iata_code', read_only=True)
    destination_name = serializers.CharField(source='destination.name_uz', read_only=True)
    destination_code = serializers.CharField(source='destination.iata_code', read_only=True)
    duration_formatted = serializers.SerializerMethodField()

    class Meta:
        model = FlightPrice
        fields = [
            'id', 'origin', 'destination', 'origin_name', 'origin_code',
            'destination_name', 'destination_code', 'price_usd', 'airline',
            'flight_duration_minutes', 'duration_formatted', 'departure_date',
            'departure_time', 'arrival_time', 'is_roundtrip'
        ]

    def get_duration_formatted(self, obj):
        hours = obj.flight_duration_minutes // 60
        minutes = obj.flight_duration_minutes % 60
        return f"{hours}s {minutes}d"


class HotelPriceSerializer(serializers.ModelSerializer):
    """Mehmonxona narxi serializeri"""
    city_name = serializers.CharField(source='city.name_uz', read_only=True)
    stars_display = serializers.SerializerMethodField()

    class Meta:
        model = HotelPrice
        fields = [
            'id', 'city', 'city_name', 'hotel_name', 'stars',
            'stars_display', 'price_per_night_usd', 'rating',
            'checkin_date', 'image_url'
        ]

    def get_stars_display(self, obj):
        return '⭐' * obj.stars
