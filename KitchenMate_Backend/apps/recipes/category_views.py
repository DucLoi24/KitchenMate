"""
Views cho recipe categories.
"""
from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from core.permissions import IsAdminUser
from .models import RecipeCategory
from .serializers import RecipeCategorySerializer


class RecipeCategoryViewSet(viewsets.ModelViewSet):
    """
    ViewSet cho phép Admin CRUD categories.

    - list/retrieve: Ai cũng xem được (is_active=True filter).
    - create/update/delete: Chỉ Admin (IsAdminUser).
    """
    queryset = RecipeCategory.objects.filter(is_active=True)
    serializer_class = RecipeCategorySerializer
    lookup_field = 'slug'

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            permission_classes = []
        else:
            permission_classes = [IsAdminUser]
        return [permission() for permission in permission_classes]

    def get_queryset(self):
        if self.action in ['list', 'retrieve']:
            return RecipeCategory.objects.filter(is_active=True)
        return RecipeCategory.objects.all()

    def destroy(self, request, *args, **kwargs):
        """Soft delete - set is_active=False thay vì xóa."""
        instance = self.get_object()
        instance.is_active = False
        instance.save()
        return Response(status=status.HTTP_204_NO_CONTENT)