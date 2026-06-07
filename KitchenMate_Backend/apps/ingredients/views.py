"""
Views cho ingredients app.
"""
import re
import unicodedata

from rest_framework import viewsets, mixins, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated, AllowAny, IsAdminUser
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django_filters.rest_framework import DjangoFilterBackend

from .models import Ingredient, Unit
from .serializers import IngredientSerializer, UnitSerializer, IngredientUnitsSerializer
from core.services.ai_moderator import moderate_text, ModerationTimeoutError, ModerationServiceError


def normalize_search_text(value):
    """Chuẩn hóa text để search tiếng Việt không phụ thuộc dấu."""
    normalized = unicodedata.normalize('NFD', value or '').lower()
    without_marks = ''.join(
        char for char in normalized
        if unicodedata.category(char) != 'Mn'
    )
    return without_marks.replace('đ', 'd')


def tokenize_search_text(value):
    """Tách text đã normalize thành các từ, giữ nguyên dấu nối bên trong từ."""
    normalized = normalize_search_text(value)
    tokens = []
    for raw_token in normalized.split():
        token = re.sub(r'^[^a-z0-9]+|[^a-z0-9]+$', '', raw_token)
        if token:
            tokens.append(token)
    return tokens


def rank_ingredient_match(query, ingredient_name):
    """
    Trả về điểm ưu tiên khi ingredient khớp query, hoặc None nếu không khớp.

    Ưu tiên:
    0. Tên đầy đủ bắt đầu bằng query
    1. Một token bắt đầu bằng query
    """
    normalized_query = normalize_search_text(query).strip()
    if not normalized_query:
        return None

    normalized_name = normalize_search_text(ingredient_name)
    tokens = tokenize_search_text(ingredient_name)

    if normalized_name.startswith(normalized_query):
        return (0, len(tokens), len(normalized_name))

    for token in tokens:
        if token.startswith(normalized_query):
            return (1, len(token), len(tokens), len(normalized_name))

    return None


class UnitViewSet(viewsets.GenericViewSet,
                  mixins.ListModelMixin,
                  mixins.RetrieveModelMixin,
                  mixins.CreateModelMixin,
                  mixins.UpdateModelMixin):
    """
    ViewSet quản lý Unit (đơn vị đo lường) — Admin only.

    Actions:
        list       — GET /api/admin/units/ — List all units (chỉ is_active=True)
        retrieve   — GET /api/admin/units/{id}/ — Get single unit
        create     — POST /api/admin/units/ — Create new unit
        partial_update — PATCH /api/admin/units/{id}/ — Update unit
        destroy    — DELETE /api/admin/units/{id}/ — Soft delete (is_active=False)
    """
    permission_classes = [IsAdminUser]

    def get_queryset(self):
        queryset = Unit.objects.all()
        # Filter by is_active unless ?include_inactive=true
        if not self.request.query_params.get('include_inactive'):
            queryset = queryset.filter(is_active=True)
        return queryset.order_by('name')

    def list(self, request):
        queryset = self.filter_queryset(self.get_queryset())
        serializer = UnitSerializer(queryset, many=True)
        return Response({'success': True, 'data': serializer.data})

    def retrieve(self, request, pk=None):
        instance = get_object_or_404(Unit, pk=pk)
        serializer = UnitSerializer(instance)
        return Response({'success': True, 'data': serializer.data})

    def create(self, request):
        serializer = UnitSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                {'success': False, 'message': serializer.errors},
                status=status.HTTP_400_BAD_REQUEST
            )
        serializer.save()
        return Response(
            {'success': True, 'data': serializer.data},
            status=status.HTTP_201_CREATED
        )

    def partial_update(self, request, pk=None):
        instance = get_object_or_404(Unit, pk=pk)
        serializer = UnitSerializer(instance, data=request.data, partial=True)
        if not serializer.is_valid():
            return Response(
                {'success': False, 'message': serializer.errors},
                status=status.HTTP_400_BAD_REQUEST
            )
        serializer.save()
        return Response({'success': True, 'data': serializer.data})

    def destroy(self, request, pk=None):
        instance = get_object_or_404(Unit, pk=pk)
        instance.is_active = False
        instance.save(update_fields=['is_active'])
        return Response(status=status.HTTP_204_NO_CONTENT)


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
        search  — AllowAny. Tìm kiếm nguyên liệu APPROVED theo tên, hỗ trợ không dấu.
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
        Tìm kiếm nguyên liệu APPROVED theo tên, hỗ trợ query không dấu.
        Trả về tối đa 10 kết quả.
        Trả về [] nếu q rỗng.
        """
        q = request.query_params.get('q', '').strip()
        if not q:
            return Response({'success': True, 'data': []})
        candidates = Ingredient.objects.filter(status='APPROVED').order_by('name')
        ranked_results = []
        for ingredient in candidates:
            rank = rank_ingredient_match(q, ingredient.name)
            if rank is not None:
                ranked_results.append((rank, ingredient.name, ingredient))

        ranked_results.sort(key=lambda item: (item[0], normalize_search_text(item[1])))
        results = [ingredient for _, _, ingredient in ranked_results[:10]]
        return Response({'success': True, 'data': IngredientSerializer(results, many=True).data})

    @action(detail=True, methods=['get', 'patch'], url_path='units')
    def units(self, request, pk=None):
        """
        GET /api/ingredients/{id}/units/ — Lấy units của ingredient
        PATCH /api/ingredients/{id}/units/ — Gán units cho ingredient
        """
        ingredient = get_object_or_404(Ingredient, pk=pk)

        if request.method == 'GET':
            # Filter out inactive units from allowed_units
            active_allowed_units = ingredient.allowed_units.filter(is_active=True)
            return Response({
                'success': True,
                'data': {
                    'default_unit': UnitSerializer(ingredient.default_unit).data if ingredient.default_unit else None,
                    'allowed_units': UnitSerializer(active_allowed_units, many=True).data
                }
            })

        # PATCH — gán units
        serializer = IngredientUnitsSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                {'success': False, 'message': serializer.errors},
                status=status.HTTP_400_BAD_REQUEST
            )

        default_unit_id = serializer.validated_data.get('default_unit_id')
        allowed_unit_ids = serializer.validated_data.get('allowed_unit_ids', [])

        # Update allowed_units
        if allowed_unit_ids is not None:
            ingredient.allowed_units.set(allowed_unit_ids)

        # Update default_unit
        if default_unit_id is not None:
            ingredient.default_unit_id = default_unit_id
        else:
            ingredient.default_unit = None
        ingredient.save(update_fields=['default_unit'])

        return Response({
            'success': True,
            'data': {
                'default_unit': UnitSerializer(ingredient.default_unit).data if ingredient.default_unit else None,
                'allowed_units': UnitSerializer(ingredient.allowed_units.all(), many=True).data
            }
        })
