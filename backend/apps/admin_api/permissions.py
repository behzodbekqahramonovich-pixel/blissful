from rest_framework.permissions import BasePermission


class IsAdminUser(BasePermission):
    """
    Permission class that only allows admin (staff) users.
    """

    def has_permission(self, request, view):
        return (
            request.user and
            request.user.is_authenticated and
            request.user.is_staff
        )
