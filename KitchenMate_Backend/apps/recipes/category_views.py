"""
Views cho recipe categories.
"""
from django.db import transaction
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
        is_active = self.request.query_params.get('is_active')
        include_inactive = self.request.query_params.get('include_inactive')

        if is_active is not None:
            is_active_bool = is_active.lower() in ('true', '1', 'yes')
            return queryset.filter(is_active=is_active_bool)

        if self.action == 'restore':
            return queryset

        if self.action == 'list' and getattr(self.request.user, 'is_staff', False):
            include_inactive_bool = str(include_inactive).lower() in ('true', '1', 'yes')
            if include_inactive_bool:
                return queryset

        return queryset.filter(is_active=True)

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

    @action(detail=True, methods=['post'], url_path='move')
    def move(self, request, slug=None):
        """Đổi thứ tự danh mục bằng cách swap với danh mục liền kề."""
        instance = self.get_object()
        direction = request.data.get('direction')
        if direction not in ('up', 'down'):
            return Response(
                {'message': 'Hướng di chuyển không hợp lệ.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        with transaction.atomic():
            categories = list(
                RecipeCategory.objects.select_for_update()
                .filter(is_active=True)
                .order_by('order', 'name', 'id')
            )
            current_index = next(
                (index for index, category in enumerate(categories) if category.id == instance.id),
                None
            )
            if current_index is None:
                return Response(
                    {'message': 'Danh mục không tồn tại hoặc đã bị vô hiệu hóa.'},
                    status=status.HTTP_404_NOT_FOUND
                )

            target_index = current_index - 1 if direction == 'up' else current_index + 1
            if target_index < 0 or target_index >= len(categories):
                return Response(
                    {'message': 'Không thể di chuyển danh mục xa hơn.'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            categories[current_index], categories[target_index] = categories[target_index], categories[current_index]
            for order, category in enumerate(categories, start=1):
                category.order = order
            RecipeCategory.objects.bulk_update(categories, ['order'])

        serializer = self.get_serializer(categories, many=True)
        return Response(
            {
                'message': 'Đã cập nhật thứ tự danh mục.',
                'results': serializer.data,
            },
            status=status.HTTP_200_OK
        )
