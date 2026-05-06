"""
Views cho recipes app.
"""
from django.db.models import F, Avg, Count, Exists, OuterRef
from django.db.models.functions import Coalesce
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from django_filters.rest_framework import DjangoFilterBackend

from core.permissions import IsOwner
from core.services.ai_moderator import moderate_text, ModerationTimeoutError, ModerationServiceError
from core.services.recipe_moderation_task import trigger_async_moderation
from .models import Recipe
from .serializers import RecipeListSerializer, RecipeDetailSerializer, RecipeCreateSerializer
from .filters import RecipeFilter
from apps.social.models import Collection, CollectionRecipe


class RecipeViewSet(viewsets.GenericViewSet):
    """
    ViewSet quản lý công thức nấu ăn (Recipe).

    Visibility States:
        PRIVATE  — Trạng thái mặc định khi mới tạo. Chỉ owner mới xem/sửa được.
        PENDING  — Đang chờ Admin xem xét (sau khi AI moderation trả về SUSPECT).
                   Chỉ owner mới xem được, không thể sửa.
        PUBLIC   — Đã được công khai. Ai cũng xem được, view_count tăng mỗi lần xem.

    Actions:
        list            — AllowAny. Chỉ trả về công thức PUBLIC. Hỗ trợ filter qua RecipeFilter.
        create          — IsAuthenticated. Tạo công thức mới với visibility=PRIVATE.
        retrieve        — Custom permission:
                            • PRIVATE/PENDING: chỉ owner mới xem được (trả về 404 cho người khác).
                            • PUBLIC: ai cũng xem được, tự động tăng view_count (atomic F() update).
        update          — IsOwner. Chỉ cho phép khi visibility=PRIVATE.
        partial_update  — IsOwner. Chỉ cho phép khi visibility=PRIVATE.
        destroy         — IsOwner. Xóa công thức bất kể trạng thái.
        my_recipes      — IsAuthenticated. Trả về tất cả công thức của user hiện tại
                          (bao gồm PRIVATE, PENDING, PUBLIC).
        publish         — IsOwner. Gửi công thức PRIVATE qua AI moderation để công khai.
                          Kết quả: PUBLIC (YES), PENDING (SUSPECT), hoặc 400 (NO).
    """
    filter_backends = [DjangoFilterBackend]
    filterset_class = RecipeFilter

    def get_queryset(self):
        base_qs = Recipe.objects.select_related('user').prefetch_related(
            'categories', 'recipe_ingredients__ingredient', 'steps'
        )
        if self.action in ('list', 'retrieve'):
            queryset = base_qs.annotate(
                avg_rating=Coalesce(Avg('reviews__rating'), 0.0),
                save_count=Count('saved_in_collections', distinct=True),
            )
            # Annotate is_favorited if user is authenticated
            if self.request.user.is_authenticated:
                favorites_collection = Collection.objects.filter(
                    user=self.request.user, is_favorites=True
                ).values_list('id', flat=True)
                queryset = queryset.annotate(
                    is_favorited=Exists(
                        CollectionRecipe.objects.filter(
                            collection_id__in=favorites_collection,
                            recipe_id=OuterRef('pk')
                        )
                    )
                )
            return queryset
        return base_qs

    def get_serializer_class(self):
        if self.action == 'create':
            return RecipeCreateSerializer
        if self.action == 'retrieve':
            return RecipeDetailSerializer
        return RecipeListSerializer

    def list(self, request):
        queryset = self.filter_queryset(
            self.get_queryset().filter(visibility='PUBLIC')
        )
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = RecipeListSerializer(page, many=True)
            paginated = self.get_paginated_response(serializer.data)
            return Response({'success': True, 'data': paginated.data})
        serializer = RecipeListSerializer(queryset, many=True)
        return Response({'success': True, 'data': serializer.data})

    def create(self, request):
        if not request.user.is_authenticated:
            return Response(
                {'success': False, 'error': {'message': 'Ban can dang nhap de tao cong thuc.'}},
                status=status.HTTP_401_UNAUTHORIZED
            )
        serializer = RecipeCreateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                {'success': False, 'error': {'message': 'Du lieu khong hop le.', 'details': serializer.errors}},
                status=status.HTTP_400_BAD_REQUEST
            )
        recipe = serializer.save(user=request.user)

        if recipe.visibility == 'PUBLIC':
            recipe.save(update_fields=['visibility'])
            trigger_async_moderation(recipe.id)
            return Response(
                {'success': True, 'message': 'Cong thuc da duoc gui kiem duyet. Vui long cho ket qua.', 'data': RecipeDetailSerializer(recipe).data},
                status=status.HTTP_201_CREATED
            )

        return Response(
            {'success': True, 'message': 'Tao cong thuc thanh cong.', 'data': RecipeDetailSerializer(recipe).data},
            status=status.HTTP_201_CREATED
        )

    def retrieve(self, request, pk=None):
        try:
            recipe = self.get_queryset().get(pk=pk)
        except Recipe.DoesNotExist:
            return Response(
                {'success': False, 'error': {'message': 'Cong thuc khong ton tai.'}},
                status=status.HTTP_404_NOT_FOUND
            )
        if recipe.visibility in ('PRIVATE', 'PENDING'):
            # PRIVATE/PENDING: chỉ owner mới xem được, không tăng view_count
            if not request.user.is_authenticated or recipe.user != request.user:
                return Response(
                    {'success': False, 'error': {'message': 'Cong thuc khong ton tai.'}},
                    status=status.HTTP_404_NOT_FOUND
                )
            serializer = RecipeDetailSerializer(recipe)
            return Response({'success': True, 'data': serializer.data})

        # Chỉ tăng view_count khi PUBLIC — dùng F() để atomic increment, tránh race condition
        Recipe.objects.filter(pk=pk).update(view_count=F('view_count') + 1)
        serializer = RecipeDetailSerializer(recipe)
        return Response({'success': True, 'data': serializer.data})

    def _check_owner(self, request, recipe):
        if not request.user.is_authenticated:
            return Response(
                {'success': False, 'error': {'message': 'Ban can dang nhap.'}},
                status=status.HTTP_401_UNAUTHORIZED
            )
        if recipe.user != request.user:
            return Response(
                {'success': False, 'error': {'message': 'Ban khong co quyen thuc hien thao tac nay.'}},
                status=status.HTTP_403_FORBIDDEN
            )
        return None

    def update(self, request, pk=None, partial=False):
        try:
            recipe = self.get_queryset().get(pk=pk)
        except Recipe.DoesNotExist:
            return Response(
                {'success': False, 'error': {'message': 'Cong thuc khong ton tai.'}},
                status=status.HTTP_404_NOT_FOUND
            )
        err = self._check_owner(request, recipe)
        if err:
            return err
        if recipe.visibility != 'PRIVATE':
            # Nếu là partial update (PATCH) và chỉ thay đổi visibility, cho phép
            if partial and request.data.keys() == {'visibility'}:
                pass  # Cho phép visibility change
            else:
                return Response(
                    {'success': False, 'error': {'message': 'Chi duoc chinh sua cong thuc o trang thai PRIVATE.'}},
                    status=status.HTTP_403_FORBIDDEN
                )
        serializer = RecipeCreateSerializer(recipe, data=request.data, partial=partial)
        if not serializer.is_valid():
            return Response(
                {'success': False, 'error': {'message': 'Du lieu khong hop le.', 'details': serializer.errors}},
                status=status.HTTP_400_BAD_REQUEST
            )
        recipe = serializer.save()

        # Issue 3: Khi visibility thay đổi sang PUBLIC, trigger AI moderation
        if recipe.visibility == 'PUBLIC':
            recipe.visibility = 'PENDING'
            recipe.ai_moderation_attempted = False
            recipe.save(update_fields=['visibility', 'ai_moderation_attempted'])
            trigger_async_moderation(recipe.id)

        return Response({
            'success': True,
            'message': 'Cap nhat cong thuc thanh cong.',
            'data': RecipeDetailSerializer(recipe).data
        })

    def partial_update(self, request, pk=None):
        return self.update(request, pk=pk, partial=True)

    def destroy(self, request, pk=None):
        try:
            recipe = self.get_queryset().get(pk=pk)
        except Recipe.DoesNotExist:
            return Response(
                {'success': False, 'error': {'message': 'Cong thuc khong ton tai.'}},
                status=status.HTTP_404_NOT_FOUND
            )
        err = self._check_owner(request, recipe)
        if err:
            return err
        if recipe.visibility == 'PENDING':
            return Response(
                {'success': False, 'error': {'message': 'Khong the xoa cong thuc dang cho duyet.'}},
                status=status.HTTP_400_BAD_REQUEST
            )
        recipe.soft_delete()
        return Response({
            'success': True,
            'message': 'Cong thuc da duoc dua vao thung rac.',
            'data': RecipeDetailSerializer(recipe).data
        }, status=status.HTTP_200_OK)

    @action(detail=False, methods=['get'], url_path='trash', permission_classes=[IsAuthenticated])
    def trash(self, request):
        """
        Lấy danh sách công thức đã xóa của user hiện tại.
        Endpoint: GET /api/recipes/trash/
        """
        queryset = Recipe.objects.deleted().filter(user=request.user)
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = RecipeListSerializer(page, many=True)
            paginated = self.get_paginated_response(serializer.data)
            return Response({'success': True, 'data': paginated.data})
        serializer = RecipeListSerializer(queryset, many=True)
        return Response({'success': True, 'data': serializer.data})

    @action(detail=True, methods=['post'], url_path='restore', permission_classes=[IsAuthenticated])
    def restore(self, request, pk=None):
        """
        Khôi phục công thức từ thùng rác.
        Endpoint: POST /api/recipes/{id}/restore/
        """
        try:
            recipe = Recipe.objects.deleted().get(pk=pk)
        except Recipe.DoesNotExist:
            return Response(
                {'success': False, 'error': {'message': 'Cong thuc khong ton tai trong thung rac.'}},
                status=status.HTTP_404_NOT_FOUND
            )
        err = self._check_owner(request, recipe)
        if err:
            return err
        recipe.restore()
        return Response({
            'success': True,
            'message': 'Cong thuc da duoc khoi phuc.',
            'data': RecipeDetailSerializer(recipe).data
        })

    @action(detail=False, methods=['get'], url_path='my-recipes', permission_classes=[IsAuthenticated])
    def my_recipes(self, request):
        queryset = self.get_queryset().filter(user=request.user)
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = RecipeListSerializer(page, many=True)
            paginated = self.get_paginated_response(serializer.data)
            return Response({'success': True, 'data': paginated.data})
        serializer = RecipeListSerializer(queryset, many=True)
        return Response({'success': True, 'data': serializer.data})

    @action(detail=True, methods=['post'], url_path='publish')
    def publish(self, request, pk=None):
        """
        Gửi công thức PRIVATE sang PENDING và trigger AI moderation async.

        Endpoint: POST /api/recipes/{id}/publish/
        Permission: IsOwner — chỉ chủ sở hữu công thức mới được gọi.

        Flow:
            1. Validate: recipe.visibility == 'PRIVATE'
            2. Set visibility='PENDING', ai_moderation_attempted=False
            3. Save to DB
            4. Trigger background thread: run_ai_moderation(recipe_id)
            5. Return 200 "Đã gửi duyệt thành công"

        Returns:
            200: Công thức đã được gửi duyệt (đang chờ AI/Admin).
            400: Công thức không ở trạng thái PRIVATE.
            404: Công thức không tồn tại.
        """
        try:
            recipe = self.get_queryset().get(pk=pk)
        except Recipe.DoesNotExist:
            return Response(
                {'success': False, 'error': {'message': 'Công thức không tồn tại.'}},
                status=status.HTTP_404_NOT_FOUND
            )
        err = self._check_owner(request, recipe)
        if err:
            return err
        if recipe.visibility != 'PRIVATE':
            return Response(
                {'success': False, 'error': {
                    'message': f'Trạng thái hiện tại ({recipe.visibility}) không hợp lệ để gửi duyệt. Chỉ công thức PRIVATE mới được gửi duyệt.'
                }},
                status=status.HTTP_400_BAD_REQUEST
            )
        recipe.save(update_fields=['visibility'])
        trigger_async_moderation(recipe.id)
        return Response({
            'success': True,
            'message': 'Đã gửi công thức đi duyệt. Vui lòng chờ kết quả.',
            'data': RecipeDetailSerializer(recipe).data
        })


class RecipeStatsView(APIView):
    """
    GET /api/recipes/{id}/stats/
    Trả về thống kê chi tiết của một công thức: average_rating, review_count, view_count, save_count.
    - PUBLIC: ai cũng xem được
    - PRIVATE/PENDING: chỉ owner mới xem được (trả về 404 cho người khác để ẩn sự tồn tại)
    """
    permission_classes = [AllowAny]

    def get(self, request, pk):
        # Query 1: lấy recipe + visibility check
        try:
            recipe = Recipe.objects.get(pk=pk)
        except Recipe.DoesNotExist:
            return Response(
                {'success': False, 'error': {'message': 'Công thức không tồn tại.'}},
                status=status.HTTP_404_NOT_FOUND
            )

        if recipe.visibility in ('PRIVATE', 'PENDING'):
            # Trả về 404 thay vì 403 để không lộ sự tồn tại của công thức
            if not request.user.is_authenticated or recipe.user != request.user:
                return Response(
                    {'success': False, 'error': {'message': 'Công thức không tồn tại.'}},
                    status=status.HTTP_404_NOT_FOUND
                )

        # Query 2: tính tất cả stats bằng aggregate — một query duy nhất
        stats = Recipe.objects.filter(pk=pk).aggregate(
            average_rating=Avg('reviews__rating'),
            review_count=Count('reviews', distinct=True),
            save_count=Count('saved_in_collections', distinct=True),
        )

        average_rating = stats['average_rating']
        if average_rating is not None:
            average_rating = round(average_rating, 2)

        return Response({
            'success': True,
            'data': {
                'recipe_id': str(recipe.pk),
                'average_rating': average_rating,
                'review_count': stats['review_count'],
                'view_count': recipe.view_count,
                'save_count': stats['save_count'],
            }
        })
