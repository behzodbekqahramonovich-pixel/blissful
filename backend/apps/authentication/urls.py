from django.urls import path
from .views import (
    LoginView, UserLoginView, RegisterView, RefreshTokenView, LogoutView, MeView,
    AgencyClientsView, AgencyClientDetailView, AgencyBookingsView, AgencyStatsView
)

urlpatterns = [
    path('login/', LoginView.as_view(), name='auth-login'),
    path('user-login/', UserLoginView.as_view(), name='auth-user-login'),
    path('register/', RegisterView.as_view(), name='auth-register'),
    path('refresh/', RefreshTokenView.as_view(), name='auth-refresh'),
    path('logout/', LogoutView.as_view(), name='auth-logout'),
    path('me/', MeView.as_view(), name='auth-me'),
    # Agency endpoints
    path('agency/clients/', AgencyClientsView.as_view(), name='agency-clients'),
    path('agency/clients/<int:pk>/', AgencyClientDetailView.as_view(), name='agency-client-detail'),
    path('agency/bookings/', AgencyBookingsView.as_view(), name='agency-bookings'),
    path('agency/stats/', AgencyStatsView.as_view(), name='agency-stats'),
]
