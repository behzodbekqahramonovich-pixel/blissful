import jwt
from datetime import datetime, timedelta
from django.conf import settings
from django.contrib.auth.models import User
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated

from .serializers import (
    LoginSerializer, UserLoginSerializer, RegisterSerializer, UserSerializer,
    RefreshTokenSerializer, AgencyClientSerializer, BookingSerializer
)
from .middleware import JWTAuthentication
from .models import AgencyClient, Booking


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


class AgencyClientsView(APIView):
    """
    Agency clients list and create endpoint.
    Only agency users can access this.
    """
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Faqat agentlik foydalanuvchilari
        if not hasattr(request.user, 'profile') or request.user.profile.role != 'agency':
            return Response(
                {'error': 'Faqat agentliklar uchun'},
                status=status.HTTP_403_FORBIDDEN
            )

        clients = AgencyClient.objects.filter(agency=request.user.profile, is_active=True)
        serializer = AgencyClientSerializer(clients, many=True)
        return Response(serializer.data)

    def post(self, request):
        # Faqat agentlik foydalanuvchilari
        if not hasattr(request.user, 'profile') or request.user.profile.role != 'agency':
            return Response(
                {'error': 'Faqat agentliklar uchun'},
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = AgencyClientSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(agency=request.user.profile)
            # Update total clients count
            request.user.profile.total_clients = AgencyClient.objects.filter(
                agency=request.user.profile, is_active=True
            ).count()
            request.user.profile.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class AgencyClientDetailView(APIView):
    """
    Agency client detail, update and delete endpoint.
    """
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get_object(self, pk, user):
        try:
            return AgencyClient.objects.get(pk=pk, agency=user.profile)
        except AgencyClient.DoesNotExist:
            return None

    def get(self, request, pk):
        if not hasattr(request.user, 'profile') or request.user.profile.role != 'agency':
            return Response(
                {'error': 'Faqat agentliklar uchun'},
                status=status.HTTP_403_FORBIDDEN
            )

        client = self.get_object(pk, request.user)
        if not client:
            return Response(
                {'error': 'Mijoz topilmadi'},
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = AgencyClientSerializer(client)
        return Response(serializer.data)

    def put(self, request, pk):
        if not hasattr(request.user, 'profile') or request.user.profile.role != 'agency':
            return Response(
                {'error': 'Faqat agentliklar uchun'},
                status=status.HTTP_403_FORBIDDEN
            )

        client = self.get_object(pk, request.user)
        if not client:
            return Response(
                {'error': 'Mijoz topilmadi'},
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = AgencyClientSerializer(client, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        if not hasattr(request.user, 'profile') or request.user.profile.role != 'agency':
            return Response(
                {'error': 'Faqat agentliklar uchun'},
                status=status.HTTP_403_FORBIDDEN
            )

        client = self.get_object(pk, request.user)
        if not client:
            return Response(
                {'error': 'Mijoz topilmadi'},
                status=status.HTTP_404_NOT_FOUND
            )

        client.is_active = False
        client.save()
        # Update total clients count
        request.user.profile.total_clients = AgencyClient.objects.filter(
            agency=request.user.profile, is_active=True
        ).count()
        request.user.profile.save()
        return Response(status=status.HTTP_204_NO_CONTENT)


class AgencyBookingsView(APIView):
    """
    Agency bookings list and create endpoint.
    """
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Faqat agentlik foydalanuvchilari
        if not hasattr(request.user, 'profile') or request.user.profile.role != 'agency':
            return Response(
                {'error': 'Faqat agentliklar uchun'},
                status=status.HTTP_403_FORBIDDEN
            )

        bookings = Booking.objects.filter(user=request.user).order_by('-created_at')
        serializer = BookingSerializer(bookings, many=True)
        return Response(serializer.data)

    def post(self, request):
        # Faqat agentlik foydalanuvchilari
        if not hasattr(request.user, 'profile') or request.user.profile.role != 'agency':
            return Response(
                {'error': 'Faqat agentliklar uchun'},
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = BookingSerializer(data=request.data)
        if serializer.is_valid():
            booking = serializer.save(user=request.user)
            # Update total bookings count
            request.user.profile.total_bookings = Booking.objects.filter(
                user=request.user
            ).count()
            request.user.profile.save()
            return Response(BookingSerializer(booking).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class AgencyStatsView(APIView):
    """
    Agency dashboard statistics.
    """
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not hasattr(request.user, 'profile') or request.user.profile.role != 'agency':
            return Response(
                {'error': 'Faqat agentliklar uchun'},
                status=status.HTTP_403_FORBIDDEN
            )

        profile = request.user.profile
        clients = AgencyClient.objects.filter(agency=profile, is_active=True)
        bookings = Booking.objects.filter(user=request.user)

        stats = {
            'total_clients': clients.count(),
            'total_bookings': bookings.count(),
            'confirmed_bookings': bookings.filter(status='confirmed').count(),
            'pending_bookings': bookings.filter(status='pending').count(),
            'total_revenue': sum(float(b.total_cost) for b in bookings.filter(status__in=['confirmed', 'completed'])),
        }

        return Response(stats)
