from rest_framework import serializers
from apps.destinations.models import Country, City, TransportLeg
from apps.pricing.models import FlightPrice, HotelPrice


class AdminCountrySerializer(serializers.ModelSerializer):
    cities_count = serializers.SerializerMethodField()

    class Meta:
        model = Country
        fields = [
            'id', 'name', 'name_uz', 'code', 'flag_emoji',
            'currency', 'visa_required_for_uz', 'cities_count'
        ]

    def get_cities_count(self, obj):
        return obj.cities.count()


class AdminCitySerializer(serializers.ModelSerializer):
    country_name = serializers.CharField(source='country.name_uz', read_only=True)
    country_code = serializers.CharField(source='country.code', read_only=True)

    class Meta:
        model = City
        fields = [
            'id', 'country', 'country_name', 'country_code',
            'name', 'name_uz', 'iata_code',
            'latitude', 'longitude', 'is_hub', 'avg_hotel_price_usd'
        ]

    def validate_iata_code(self, value):
        return (value or '').upper() or None  # '' unique'ni buzadi


class AdminTransportLegSerializer(serializers.ModelSerializer):
    from_name = serializers.CharField(source='from_city.name_uz', read_only=True)
    from_code = serializers.CharField(source='from_city.iata_code', read_only=True)
    to_name = serializers.CharField(source='to_city.name_uz', read_only=True)
    to_code = serializers.CharField(source='to_city.iata_code', read_only=True)
    mode_display = serializers.CharField(source='get_mode_display', read_only=True)

    class Meta:
        model = TransportLeg
        fields = [
            'id', 'from_city', 'from_name', 'from_code', 'to_city', 'to_name', 'to_code',
            'mode', 'mode_display', 'duration_min', 'price_usd', 'headway_min',
            'first_departure', 'last_departure', 'is_bidirectional', 'source', 'link', 'is_active'
        ]

    def validate(self, data):
        get = lambda f: data.get(f, getattr(self.instance, f, None))
        src, dst, mode = get('from_city'), get('to_city'), get('mode')
        if src == dst:
            raise serializers.ValidationError({'to_city': "Qayerdan va qayerga bir xil bo'lmasin"})
        # B→A ikki tomonlama bo'lsa, A→B shu transport bilan allaqachon bor
        reverse = TransportLeg.objects.filter(from_city=dst, to_city=src, mode=mode)
        if self.instance:
            reverse = reverse.exclude(pk=self.instance.pk)
        bidir = data.get('is_bidirectional', getattr(self.instance, 'is_bidirectional', True))
        if reverse.filter(is_bidirectional=True).exists() or (bidir and reverse.exists()):
            raise serializers.ValidationError({'to_city': "Teskari yo'nalishda shu transport allaqachon kiritilgan"})
        return data


class AdminFlightPriceSerializer(serializers.ModelSerializer):
    origin_name = serializers.CharField(source='origin.name_uz', read_only=True)
    origin_code = serializers.CharField(source='origin.iata_code', read_only=True)
    destination_name = serializers.CharField(source='destination.name_uz', read_only=True)
    destination_code = serializers.CharField(source='destination.iata_code', read_only=True)

    class Meta:
        model = FlightPrice
        fields = [
            'id', 'origin', 'origin_name', 'origin_code',
            'destination', 'destination_name', 'destination_code',
            'price_usd', 'airline', 'flight_duration_minutes',
            'departure_date', 'departure_time', 'arrival_time',
            'is_roundtrip', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']


class AdminHotelPriceSerializer(serializers.ModelSerializer):
    city_name = serializers.CharField(source='city.name_uz', read_only=True)
    city_code = serializers.CharField(source='city.iata_code', read_only=True)

    class Meta:
        model = HotelPrice
        fields = [
            'id', 'city', 'city_name', 'city_code',
            'hotel_name', 'stars', 'price_per_night_usd',
            'rating', 'checkin_date', 'image_url',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']
