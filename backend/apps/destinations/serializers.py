from rest_framework import serializers
from .models import Country, City, airport_access


class CountrySerializer(serializers.ModelSerializer):
    """Mamlakat serializeri"""

    class Meta:
        model = Country
        fields = [
            'id', 'name', 'name_uz', 'code',
            'flag_emoji', 'currency', 'visa_required_for_uz'
        ]


class CitySerializer(serializers.ModelSerializer):
    """Shahar serializeri"""
    country_name = serializers.CharField(source='country.name_uz', read_only=True)
    country_flag = serializers.CharField(source='country.flag_emoji', read_only=True)

    class Meta:
        model = City
        fields = [
            'id', 'name', 'name_uz', 'iata_code',
            'latitude', 'longitude', 'is_hub',
            'avg_hotel_price_usd', 'country',
            'country_name', 'country_flag'
        ]


class CityMinimalSerializer(serializers.ModelSerializer):
    """Shahar minimal serializeri (autocomplete uchun)"""
    label = serializers.SerializerMethodField()

    class Meta:
        model = City
        fields = ['id', 'iata_code', 'name_uz', 'label']

    def get_label(self, obj):
        code = obj.iata_code
        if not code:  # aeroportsiz shahar - kam uchraydi, alohida so'rov mayli
            access = airport_access(obj)
            code = f"{access[0].iata_code} orqali" if access else 'transfer'
        return f"{obj.country.flag_emoji} {obj.name_uz} ({code})"
