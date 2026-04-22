"""
Views cho recipes app.
"""
from django.db.models import F, Avg, Count
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from django_filters.rest_framework import DjangoFilterBackend

from core.permissions import IsOwner
from core.services.ai_moderator import moderate_text, ModerationTimeoutError, ModerationServiceError
from .models import Recipe
from .serializers import RecipeListSerializer, RecipeDetailSerializer, RecipeCreateSerializer
from .filters import RecipeFilter


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
        return Recipe.objects.select_related('user').prefetch_related(
            'recipe_ingredients__ingredient', 'steps'
        )

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
        recipe = serializer.save(user=request.user, visibility='PRIVATE')
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
        recipe.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

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
        Gửi công thức PRIVATE qua AI moderation để công khai.

        Endpoint: POST /api/recipes/{id}/publish/
        Permission: IsOwner — chỉ chủ sở hữu công thức mới được gọi.

        Điều kiện tiên quyết:
            - Công thức phải đang ở trạng thái PRIVATE.
              Nếu đang PENDING hoặc PUBLIC → trả về 400.

        AI Moderation Flow:
            1. Ghép text kiểm duyệt: title + description + các bước (theo step_number).
            2. Gửi text tới Local LLM service (moderate_text).
            3. Xử lý kết quả:
                • YES     → Đặt visibility=PUBLIC, trả về 200 kèm dữ liệu công thức.
                • NO      → Không lưu, trả về 400 "Nội dung không phù hợp".
                • SUSPECT → Đặt visibility=PENDING (chờ Admin duyệt), trả về 200.

        Returns:
            200: Công thức đã PUBLIC hoặc chuyển sang PENDING chờ duyệt.
            400: Công thức không ở trạng thái PRIVATE, hoặc nội dung vi phạm (AI trả NO).
            404: Công thức không tồn tại.
            503: Dịch vụ AI moderation tạm thời không khả dụng.
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
        # Ghép text kiểm duyệt: title + description + các bước theo step_number
        steps_text = '\n'.join(
            step.instruction
            for step in recipe.steps.order_by('step_number')
        )
        text_to_moderate = f"{recipe.title}\n{recipe.description}\n{steps_text}".strip()

        try:
            result = moderate_text(text_to_moderate)
        except (ModerationTimeoutError, ModerationServiceError):
            return Response(
                {'success': False, 'error': {
                    'message': 'Dịch vụ kiểm duyệt tạm thời không khả dụng. Vui lòng thử lại sau.'
                }},
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )

        if result == 'YES':
            recipe.visibility = 'PUBLIC'
            recipe.save(update_fields=['visibility'])
            return Response({
                'success': True,
                'message': 'Công thức đã được công khai thành công.',
                'data': RecipeDetailSerializer(recipe).data
            })
        elif result == 'NO':
            return Response(
                {'success': False, 'error': {
                    'message': 'Nội dung không phù hợp với tiêu chuẩn cộng đồng.'
                }},
                status=status.HTTP_400_BAD_REQUEST
            )
        else:  # SUSPECT
            recipe.visibility = 'PENDING'
            recipe.save(update_fields=['visibility'])
            return Response({
                'success': True,
                'message': 'Công thức đang chờ Admin xem xét.',
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
