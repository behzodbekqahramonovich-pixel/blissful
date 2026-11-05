from rest_framework.permissions import BasePermission


class IsAgency(BasePermission):
    message = 'Faqat agentliklar uchun'

    def has_permission(self, request, view):
        profile = getattr(request.user, 'profile', None)
        return profile is not None and profile.role == 'agency'
