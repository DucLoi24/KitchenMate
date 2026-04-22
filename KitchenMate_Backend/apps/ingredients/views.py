"""
Views cho ingredients app.
"""
from rest_framework import viewsets, mixins, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend

from .models import Ingredient
from .serializers import IngredientSerializer
from core.services.ai_moderator import moderate_text, ModerationTimeoutError, ModerationServiceError


class IngredientViewSet(viewsets.GenericViewSet,
                        mixins.ListModelMixin,
                        mixins.CreateModelMixin):
    """
    ViewSet quản lý nguyên liệu (Ingredient) với AI moderation.

    Actions:
        list    — AllowAny. Chỉ trả về nguyên liệu có status=APPROVED.
                  Hỗ trợ filter theo category qua query param (DjangoFilterBackend).
        create  — IsAuthenticated. Tạo nguyên liệu mới với AI moderation:
                    • YES / SUSPECT → Lưu với status=PENDING, chờ Admin duyệt.
                    • NO            → Trả về 400, không lưu.
                    • AI lỗi        → Graceful degradation: lưu PENDING, không block user.
        search  — AllowAny. Tìm kiếm nguyên liệu APPROVED theo tên (icontains).
                  Trả về tối đa 10 kết quả. Trả về [] nếu query rỗng.
    """
    serializer_class = IngredientSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['category']

    def get_queryset(self):
        return Ingredient.objects.filter(status='APPROVED').order_by('name')

    def get_permissions(self):
        if self.action == 'create':
            return [IsAuthenticated()]
        return [AllowAny()]

    def perform_create(self, serializer):
        # Logic đã chuyển vào create() để xử lý AI moderation
        pass

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                {'success': False, 'error': {'message': 'Dữ liệu không hợp lệ.', 'details': serializer.errors}},
                status=status.HTTP_400_BAD_REQUEST
            )

        name = serializer.validated_data.get('name', '')

        try:
            result = moderate_text(name)
        except (ModerationTimeoutError, ModerationServiceError):
            # Graceful degradation: lưu với PENDING khi AI lỗi
            serializer.save(status='PENDING', created_by=request.user)
            return Response(
                {'success': True, 'message': 'Nguyên liệu đã được gửi và đang chờ duyệt.', 'data': serializer.data},
                status=status.HTTP_201_CREATED
            )

        if result == 'NO':
            return Response(
                {'success': False, 'error': {'message': 'Tên nguyên liệu không phù hợp.'}},
                status=status.HTTP_400_BAD_REQUEST
            )
        else:  # YES hoặc SUSPECT — đều chuyển cho Admin duyệt
            serializer.save(status='PENDING', created_by=request.user)
            return Response(
                {'success': True, 'message': 'Nguyên liệu đã được gửi và đang chờ Admin xem xét.', 'data': serializer.data},
                status=status.HTTP_201_CREATED
            )

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            paginated = self.get_paginated_response(serializer.data)
            return Response({'success': True, 'data': paginated.data})
        serializer = self.get_serializer(queryset, many=True)
        return Response({'success': True, 'data': serializer.data})

    @action(detail=False, methods=['get'], url_path='search', permission_classes=[AllowAny])
    def search(self, request):
        """
        GET /api/ingredients/search/?q={keyword}
        Tìm kiếm nguyên liệu APPROVED theo tên, trả về tối đa 10 kết quả.
        Trả về [] nếu q rỗng.
        """
        q = request.query_params.get('q', '').strip()
        if not q:
            return Response({'success': True, 'data': []})
        results = Ingredient.objects.filter(
            name__icontains=q, status='APPROVED'
        ).order_by('name')[:10]
        return Response({'success': True, 'data': IngredientSerializer(results, many=True).data})
