import jwt
from django.conf import settings
from django.contrib.auth.models import User
from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed


class JWTAuthentication(BaseAuthentication):
    """
    Custom JWT Authentication class for Django REST Framework.
    """

    def authenticate(self, request):
        auth_header = request.headers.get('Authorization')

        if not auth_header:
            return None

        if not auth_header.startswith('Bearer '):
            return None

        token = auth_header.split(' ')[1]

        try:
            payload = jwt.decode(
                token,
                settings.SECRET_KEY,
                algorithms=['HS256']
            )

            # Check token type
            if payload.get('type') != 'access':
                raise AuthenticationFailed('Invalid token type')

            user = User.objects.get(id=payload['user_id'])

            if not user.is_active:
                raise AuthenticationFailed('User is inactive')

            return (user, token)

        except jwt.ExpiredSignatureError:
            raise AuthenticationFailed('Token muddati tugagan')
        except jwt.InvalidTokenError:
            raise AuthenticationFailed('Token noto\'g\'ri')
        except User.DoesNotExist:
            raise AuthenticationFailed('Foydalanuvchi topilmadi')

    def authenticate_header(self, request):
        return 'Bearer'
