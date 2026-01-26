from rest_framework import serializers
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from .models import UserProfile, AgencyClient, Booking


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        user = authenticate(username=data['username'], password=data['password'])
        if not user:
            raise serializers.ValidationError("Login yoki parol noto'g'ri")
        if not user.is_staff:
            raise serializers.ValidationError("Admin huquqi talab qilinadi")
        if not user.is_active:
            raise serializers.ValidationError("Foydalanuvchi faol emas")
        return {'user': user}


class UserLoginSerializer(serializers.Serializer):
    """Regular user login serializer (not admin)."""
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        user = authenticate(username=data['username'], password=data['password'])
        if not user:
            raise serializers.ValidationError("Login yoki parol noto'g'ri")
        if not user.is_active:
            raise serializers.ValidationError("Foydalanuvchi faol emas")
        return {'user': user}


class RegisterSerializer(serializers.ModelSerializer):
    """User registration serializer."""
    password = serializers.CharField(write_only=True, min_length=8)
    confirm_password = serializers.CharField(write_only=True, required=False)
    phone = serializers.CharField(max_length=20, required=False, allow_blank=True)
    role = serializers.ChoiceField(choices=['traveler', 'agency'], default='traveler')
    agency_name = serializers.CharField(max_length=255, required=False, allow_blank=True)

    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'confirm_password', 'first_name', 'last_name', 'phone', 'role', 'agency_name']

    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("Bu foydalanuvchi nomi allaqachon mavjud")
        return value

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("Bu email allaqachon ro'yxatdan o'tgan")
        return value

    def validate(self, data):
        # Agentlik uchun agency_name majburiy
        if data.get('role') == 'agency' and not data.get('agency_name'):
            raise serializers.ValidationError({'agency_name': 'Agentlik nomi kiritilishi shart'})
        return data

    def create(self, validated_data):
        validated_data.pop('confirm_password', None)
        phone = validated_data.pop('phone', None)
        role = validated_data.pop('role', 'traveler')
        agency_name = validated_data.pop('agency_name', None)

        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
        )

        # UserProfile yangilash (signal orqali yaratilgan)
        if hasattr(user, 'profile'):
            user.profile.role = role
            user.profile.phone = phone
            if role == 'agency':
                user.profile.agency_name = agency_name
            user.profile.save()

        return user


class UserProfileSerializer(serializers.ModelSerializer):
    """UserProfile serializer."""
    class Meta:
        model = UserProfile
        fields = ['role', 'agency_name', 'phone', 'agency_logo', 'agency_description',
                  'agency_address', 'agency_license', 'total_bookings', 'total_clients']


class UserSerializer(serializers.ModelSerializer):
    profile = UserProfileSerializer(read_only=True)
    role = serializers.SerializerMethodField()
    agency_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'is_staff', 'profile', 'role', 'agency_name']

    def get_role(self, obj):
        if hasattr(obj, 'profile'):
            return obj.profile.role
        return 'traveler'

    def get_agency_name(self, obj):
        if hasattr(obj, 'profile'):
            return obj.profile.agency_name
        return None


class AgencyClientSerializer(serializers.ModelSerializer):
    """Agentlik mijozlari serializer."""
    full_name = serializers.ReadOnlyField()

    class Meta:
        model = AgencyClient
        fields = ['id', 'first_name', 'last_name', 'full_name', 'email', 'phone',
                  'passport_number', 'birth_date', 'notes', 'is_active', 'created_at']
        read_only_fields = ['created_at']


class BookingSerializer(serializers.ModelSerializer):
    """Bron serializer."""
    client_name = serializers.SerializerMethodField()
    status_display = serializers.SerializerMethodField()

    class Meta:
        model = Booking
        fields = ['id', 'client', 'client_name', 'origin', 'destination', 'departure_date',
                  'return_date', 'travelers', 'nights', 'flight_cost', 'hotel_cost',
                  'total_cost', 'variant_data', 'status', 'status_display', 'notes', 'created_at']
        read_only_fields = ['created_at']

    def get_client_name(self, obj):
        if obj.client:
            return obj.client.full_name
        return None

    def get_status_display(self, obj):
        return obj.get_status_display()


class RefreshTokenSerializer(serializers.Serializer):
    refresh = serializers.CharField()
