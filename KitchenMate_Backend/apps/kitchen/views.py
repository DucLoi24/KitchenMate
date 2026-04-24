"""
Views cho kitchen app — PantryViewSet, ShoppingListViewSet, RecommendationView.
"""
from django.db import transaction
from rest_framework import viewsets, mixins, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from core.permissions import IsOwner
from .models import Pantry, ShoppingList
from .serializers import PantrySerializer, ShoppingListSerializer


class PantryViewSet(viewsets.GenericViewSet,
                    mixins.ListModelMixin,
                    mixins.CreateModelMixin,
                    mixins.RetrieveModelMixin,
                    mixins.UpdateModelMixin,
                    mixins.DestroyModelMixin):
    """
    ViewSet quản lý tủ lạnh số (digital pantry) của user.

    Mỗi user chỉ thấy và thao tác được với dữ liệu của chính mình
    (ownership isolation — queryset tự động filter theo request.user).

    Actions:
        list            — IsAuthenticated. Trả về toàn bộ nguyên liệu trong tủ lạnh của user.
        create          — IsAuthenticated. Thêm nguyên liệu mới vào tủ lạnh, tự gán user.
        retrieve        — IsOwner. Xem chi tiết một mục trong tủ lạnh.
        update          — IsOwner. Cập nhật toàn bộ thông tin một mục (PUT).
        partial_update  — IsOwner. Cập nhật một phần thông tin một mục (PATCH).
        destroy         — IsOwner. Xóa một mục khỏi tủ lạnh.
    """
    serializer_class = PantrySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Pantry.objects.filter(user=self.request.user).select_related('ingredient')

    def get_permissions(self):
        if self.action in ('update', 'partial_update', 'destroy', 'retrieve'):
            return [IsOwner()]
        return [IsAuthenticated()]

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                {'success': False, 'error': {'message': 'Du lieu khong hop le.', 'details': serializer.errors}},
                status=status.HTTP_400_BAD_REQUEST
            )
        self.perform_create(serializer)
        return Response(
            {'success': True, 'message': 'Da them nguyen lieu vao tu lanh.', 'data': serializer.data},
            status=status.HTTP_201_CREATED
        )

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            paginated = self.get_paginated_response(serializer.data)
            return Response({'success': True, 'data': paginated.data})
        serializer = self.get_serializer(queryset, many=True)
        return Response({'success': True, 'data': serializer.data})

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        return Response({'success': True, 'data': self.get_serializer(instance).data})

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        if not serializer.is_valid():
            return Response(
                {'success': False, 'error': {'message': 'Du lieu khong hop le.', 'details': serializer.errors}},
                status=status.HTTP_400_BAD_REQUEST
            )
        serializer.save()
        return Response({'success': True, 'message': 'Cap nhat thanh cong.', 'data': serializer.data})

    def partial_update(self, request, *args, **kwargs):
        kwargs['partial'] = True
        return self.update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class ShoppingListViewSet(viewsets.GenericViewSet,
                          mixins.ListModelMixin,
                          mixins.CreateModelMixin,
                          mixins.DestroyModelMixin):
    """
    ViewSet quản lý danh sách đi chợ (shopping list) của user.

    Mỗi user chỉ thấy và thao tác được với danh sách của chính mình
    (queryset tự động filter theo request.user).

    Actions:
        list            — IsAuthenticated. Trả về toàn bộ items trong danh sách đi chợ.
        create          — IsAuthenticated. Thêm nguyên liệu cần mua vào danh sách.
        destroy         — IsOwner. Xóa một item khỏi danh sách.
        mark_purchased  — IsOwner. Đánh dấu đã mua và đồng bộ vào Pantry.
                          Thực hiện trong một atomic transaction 3 bước để đảm bảo
                          tính toàn vẹn dữ liệu giữa ShoppingList và Pantry.
    """
    serializer_class = ShoppingListSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return ShoppingList.objects.filter(user=self.request.user).select_related('ingredient')

    def get_permissions(self):
        if self.action in ('destroy', 'mark_purchased', 'mark_unpurchased'):
            return [IsOwner()]
        return [IsAuthenticated()]

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                {'success': False, 'error': {'message': 'Du lieu khong hop le.', 'details': serializer.errors}},
                status=status.HTTP_400_BAD_REQUEST
            )
        self.perform_create(serializer)
        return Response(
            {'success': True, 'message': 'Da them vao danh sach di cho.', 'data': serializer.data},
            status=status.HTTP_201_CREATED
        )

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            paginated = self.get_paginated_response(serializer.data)
            return Response({'success': True, 'data': paginated.data})
        serializer = self.get_serializer(queryset, many=True)
        return Response({'success': True, 'data': serializer.data})

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=['post'], url_path='mark-purchased')
    def mark_purchased(self, request, pk=None):
        """
        Đánh dấu đã mua và đồng bộ nguyên liệu vào tủ lạnh (Pantry).

        Endpoint: POST /api/kitchen/shopping-list/{id}/mark-purchased/
        Permission: IsOwner — chỉ chủ sở hữu item mới được gọi.

        Atomic Transaction (3 bước — rollback toàn bộ nếu bất kỳ bước nào thất bại):
            Bước 1: Đặt is_purchased=True cho ShoppingList item.
            Bước 2: get_or_create Pantry item tương ứng (cùng user + ingredient).
                    Nếu chưa có → tạo mới với quantity=0.
            Bước 3: Cộng dồn quantity từ ShoppingList vào Pantry item.

        Returns:
            200: Thành công — trả về dữ liệu Pantry item đã được cập nhật.
            403: Không phải owner của item.
            404: Item không tồn tại.
            500: Lỗi trong quá trình thực hiện transaction — toàn bộ đã được rollback.
        """
        item = self.get_object()
        try:
            with transaction.atomic():
                item.is_purchased = True
                item.save(update_fields=['is_purchased'])

                pantry_item, created = Pantry.objects.get_or_create(
                    user=request.user,
                    ingredient=item.ingredient,
                    defaults={'quantity': 0, 'unit': item.unit}
                )
                pantry_item.quantity += item.quantity
                pantry_item.save(update_fields=['quantity', 'updated_at'])

            from .serializers import PantrySerializer as PS
            return Response({
                'success': True,
                'message': 'Da danh dau da mua va cap nhat tu lanh.',
                'data': PS(pantry_item).data
            })
        except Exception as e:
            return Response(
                {'success': False, 'error': {'message': 'Co loi xay ra khi xu ly giao dich. Vui long thu lai.'}},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['post'], url_path='mark-unpurchased')
    def mark_unpurchased(self, request, pk=None):
        """
        Bỏ đánh dấu đã mua — trừ quantity khỏi Pantry và đặt is_purchased=False.

        Endpoint: POST /api/kitchen/shopping-list/{id}/mark-unpurchased/
        Permission: IsOwner

        Atomic Transaction (3 bước):
            Bước 1: Đặt is_purchased=False cho ShoppingList item.
            Bước 2: Tìm Pantry item tương ứng (user + ingredient).
            Bước 3: Trừ quantity đã mua từ Pantry item.
                    Nếu Pantry quantity ≤ 0 sau khi trừ → xóa Pantry item.

        Returns:
            200: Thành công — trả về dữ liệu Pantry item còn lại (hoặc null nếu đã xóa).
            403: Không phải owner của item.
            404: Item không tồn tại.
            500: Lỗi trong transaction.
        """
        item = self.get_object()
        try:
            with transaction.atomic():
                item.is_purchased = False
                item.save(update_fields=['is_purchased'])

                pantry_item = Pantry.objects.filter(
                    user=request.user, ingredient=item.ingredient
                ).first()

                if pantry_item:
                    pantry_item.quantity -= item.quantity
                    if pantry_item.quantity <= 0:
                        pantry_item.delete()
                    else:
                        pantry_item.save(update_fields=['quantity', 'updated_at'])
                    from .serializers import PantrySerializer as PS
                    return Response({
                        'success': True,
                        'message': 'Da bo danh dau da mua.',
                        'data': PS(pantry_item).data if pantry_item.quantity > 0 else None
                    })
                else:
                    return Response({
                        'success': True,
                        'message': 'Da bo danh dau da mua (khong co trong tu lanh).',
                        'data': None
                    })
        except Exception as e:
            return Response(
                {'success': False, 'error': {'message': 'Co loi xay ra khi xu ly giao dich. Vui long thu lai.'}},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class RecommendationView(APIView):
    """
    Gợi ý công thức nấu ăn dựa trên nguyên liệu trong tủ lạnh của user.

    Endpoint: POST /api/recommendations/suggest/
    Permission: IsAuthenticated.

    Tier-3 Scoring Algorithm:
        Phase 1 — Filter:
            Bỏ qua nguyên liệu STAPLE (muối, đường, dầu ăn...) — giả định user luôn có sẵn.

        Phase 2 — Scoring (tính điểm cho từng công thức):
            Match Score   : +20 điểm cho mỗi nguyên liệu user đang có trong tủ lạnh.
            Penalty Score : Trừ điểm theo category của nguyên liệu còn thiếu:
                              PROTEIN → -100 (thiếu nghiêm trọng)
                              CARB    → -80
                              VEG     → -50
                              OTHER   → -25
                              SPICE   → -10
            Affinity Bonus: +50 điểm nếu công thức nằm trong Collection (Favorites) của user.

        Phase 3 — Modes (lọc kết quả theo chế độ):
            COOK_NOW (Strict)   : Số nguyên liệu non-staple còn thiếu = 0.
            ADD_MORE (Flexible) : Số nguyên liệu non-staple còn thiếu ≤ 2 VÀ tổng điểm ≥ 0.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        """
        Trả về danh sách công thức được gợi ý dựa trên tủ lạnh của user.

        Request Body:
            {
                "mode": "COOK_NOW" | "ADD_MORE",   (bắt buộc)
                "exclude_ingredients": [<id>, ...]  (tùy chọn — loại trừ nguyên liệu khỏi tính toán)
            }

        Response (200):
            {
                "success": true,
                "data": [
                    {
                        "recipe": { ...RecipeListSerializer fields... },
                        "score": <int>,
                        "missing_ingredients": [ ...danh sách nguyên liệu còn thiếu... ]
                    },
                    ...
                ]
            }

        Returns:
            200: Danh sách công thức gợi ý (có thể rỗng nếu không có công thức phù hợp).
            400: mode không hợp lệ (không phải COOK_NOW hoặc ADD_MORE).
        """
        from apps.kitchen.services.recommendation_engine import get_recommendations
        from apps.recipes.serializers import RecipeListSerializer

        mode = request.data.get('mode')
        if mode not in ('COOK_NOW', 'ADD_MORE'):
            return Response(
                {'success': False, 'error': {'message': 'mode phai la COOK_NOW hoac ADD_MORE.'}},
                status=status.HTTP_400_BAD_REQUEST
            )

        exclude_ids = request.data.get('exclude_ingredients', [])
        results = get_recommendations(request.user, mode, exclude_ids if exclude_ids else None)

        data = []
        for item in results:
            data.append({
                'recipe': RecipeListSerializer(item['recipe']).data,
                'score': item['score'],
                'missing_ingredients': item['missing_ingredients'],
            })

        return Response({'success': True, 'data': data})
