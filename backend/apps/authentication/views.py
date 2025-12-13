import jwt
from datetime import datetime, timedelta
from django.conf import settings
from django.contrib.auth.models import User
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated

from .serializers import LoginSerializer, UserLoginSerializer, RegisterSerializer, UserSerializer, RefreshTokenSerializer
from .middleware import JWTAuthentication


def generate_tokens(user):
    """Generate access and refresh tokens for a user."""
    now = datetime.utcnow()

    # Access token - 15 minutes
    access_payload = {
        'user_id': user.id,
        'username': user.username,
        'type': 'access',
        'exp': now + timedelta(minutes=15),
        'iat': now,
    }
    access_token = jwt.encode(access_payload, settings.SECRET_KEY, algorithm='HS256')

    # Refresh token - 7 days
    refresh_payload = {
        'user_id': user.id,
        'type': 'refresh',
        'exp': now + timedelta(days=7),
        'iat': now,
    }
    refresh_token = jwt.encode(refresh_payload, settings.SECRET_KEY, algorithm='HS256')

    return access_token, refresh_token


class LoginView(APIView):
    """
    Admin login endpoint.
    Returns access and refresh JWT tokens.
    """

    def post(self, request):
        serializer = LoginSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(
                {'error': serializer.errors},
                status=status.HTTP_400_BAD_REQUEST
            )

        user = serializer.validated_data['user']
        access_token, refresh_token = generate_tokens(user)

        return Response({
            'access': access_token,
            'refresh': refresh_token,
            'user': UserSerializer(user).data,
        })


class UserLoginView(APIView):
    """
    Regular user login endpoint.
    Returns access and refresh JWT tokens.
    """

    def post(self, request):
        serializer = UserLoginSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(
                {'error': serializer.errors},
                status=status.HTTP_400_BAD_REQUEST
            )

        user = serializer.validated_data['user']
        access_token, refresh_token = generate_tokens(user)

        return Response({
            'access': access_token,
            'refresh': refresh_token,
            'user': UserSerializer(user).data,
        })


class RegisterView(APIView):
    """
    User registration endpoint.
    Creates a new user and returns access and refresh tokens.
    """

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST
            )

        user = serializer.save()
        access_token, refresh_token = generate_tokens(user)

        return Response({
            'access': access_token,
            'refresh': refresh_token,
            'user': UserSerializer(user).data,
            'message': 'Muvaffaqiyatli ro\'yxatdan o\'tdingiz!'
        }, status=status.HTTP_201_CREATED)


class RefreshTokenView(APIView):
    """
    Refresh access token using refresh token.
    """

    def post(self, request):
        serializer = RefreshTokenSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(
                {'error': 'Refresh token talab qilinadi'},
                status=status.HTTP_400_BAD_REQUEST
            )

        refresh_token = serializer.validated_data['refresh']

        try:
            payload = jwt.decode(
                refresh_token,
                settings.SECRET_KEY,
                algorithms=['HS256']
            )

            if payload.get('type') != 'refresh':
                return Response(
                    {'error': 'Token turi noto\'g\'ri'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            user = User.objects.get(id=payload['user_id'])

            if not user.is_active:
                return Response(
                    {'error': 'Foydalanuvchi faol emas'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Generate new access token
            access_token, _ = generate_tokens(user)

            return Response({
                'access': access_token,
            })

        except jwt.ExpiredSignatureError:
            return Response(
                {'error': 'Refresh token muddati tugagan'},
                status=status.HTTP_401_UNAUTHORIZED
            )
        except jwt.InvalidTokenError:
            return Response(
                {'error': 'Token noto\'g\'ri'},
                status=status.HTTP_400_BAD_REQUEST
            )
        except User.DoesNotExist:
            return Response(
                {'error': 'Foydalanuvchi topilmadi'},
                status=status.HTTP_404_NOT_FOUND
            )


class LogoutView(APIView):
    """
    Logout endpoint.
    In a stateless JWT setup, logout is handled client-side.
    This endpoint can be used to blacklist tokens if needed.
    """
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        # In a production environment, you might want to:
        # 1. Add the refresh token to a blacklist
        # 2. Use Redis to store blacklisted tokens
        # For now, we just return success
        return Response({'message': 'Muvaffaqiyatli chiqildi'})


class MeView(APIView):
    """
    Get current authenticated user info.
    """
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)
