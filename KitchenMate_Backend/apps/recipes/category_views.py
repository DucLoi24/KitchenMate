"""
Views cho recipe categories.
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
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
        queryset = RecipeCategory.objects.all()
        # Filter by is_active if provided in query params
        is_active = self.request.query_params.get('is_active')
        if is_active is not None:
            is_active_bool = is_active.lower() in ('true', '1', 'yes')
            queryset = queryset.filter(is_active=is_active_bool)
        elif self.action in ['list', 'retrieve']:
            # Default to active only for public access
            queryset = queryset.filter(is_active=True)
        return queryset

    def destroy(self, request, *args, **kwargs):
        """Soft delete - set is_active=False thay vì xóa."""
        instance = self.get_object()
        instance.is_active = False
        instance.save()
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=['post'], url_path='restore')
    def restore(self, request, slug=None):
        """Khôi phục danh mục đã xóa mềm."""
        instance = self.get_object()
        instance.is_active = True
        instance.save(update_fields=['is_active'])
        serializer = self.get_serializer(instance)
        return Response(serializer.data, status=status.HTTP_200_OK)