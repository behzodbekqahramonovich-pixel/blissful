from rest_framework import serializers
from django.contrib.auth.models import User
from django.contrib.auth import authenticate


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


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'is_staff']


class RefreshTokenSerializer(serializers.Serializer):
    refresh = serializers.CharField()
