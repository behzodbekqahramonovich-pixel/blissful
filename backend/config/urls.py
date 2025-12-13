"""
URL configuration for Blissful Tour project.
"""

from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/v1/destinations/', include('apps.destinations.urls')),
    path('api/v1/prices/', include('apps.pricing.urls')),
    path('api/v1/search/', include('apps.search.urls')),
]
