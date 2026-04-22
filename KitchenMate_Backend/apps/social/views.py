"""
Views cho social app — ReviewViewSet, CollectionViewSet.
"""
from django.db import IntegrityError
from django.shortcuts import get_object_or_404
from rest_framework import viewsets, mixins, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response

from core.permissions import IsOwner
from .models import Review, Collection, CollectionRecipe
from .serializers import ReviewSerializer, CollectionSerializer, CollectionRecipeSerializer


class ReviewViewSet(viewsets.GenericViewSet,
                    mixins.ListModelMixin,
                    mixins.CreateModelMixin,
                    mixins.UpdateModelMixin,
                    mixins.DestroyModelMixin):
    """
    ViewSet quản lý đánh giá công thức nấu ăn (Review).

    Ràng buộc dữ liệu:
        rating          — Giá trị nguyên trong khoảng [1–5].
        unique(user, recipe) — Mỗi user chỉ được đánh giá một công thức một lần.
                               Gửi đánh giá trùng sẽ nhận lỗi 400.

    Actions:
        list            — AllowAny. Trả về tất cả đánh giá, tự động filter theo recipe_id
                          từ URL kwargs (nested router: /api/recipes/{recipe_pk}/reviews/).
        create          — IsAuthenticated. Tạo đánh giá mới, tự gán user và recipe_id từ URL.
        update          — IsOwner. Cập nhật toàn bộ đánh giá (PUT).
        partial_update  — IsOwner. Cập nhật một phần đánh giá (PATCH).
        destroy         — IsOwner. Xóa đánh giá.
    """
    serializer_class = ReviewSerializer

    def get_queryset(self):
        recipe_id = self.kwargs.get('recipe_pk')
        qs = Review.objects.select_related('user')
        if recipe_id:
            qs = qs.filter(recipe_id=recipe_id)
        return qs

    def get_permissions(self):
        if self.action in ('update', 'partial_update', 'destroy'):
            return [IsOwner()]
        if self.action == 'create':
            return [IsAuthenticated()]
        return [AllowAny()]

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            paginated = self.get_paginated_response(serializer.data)
            return Response({'success': True, 'data': paginated.data})
        serializer = self.get_serializer(queryset, many=True)
        return Response({'success': True, 'data': serializer.data})

    def create(self, request, *args, **kwargs):
        recipe_id = self.kwargs.get('recipe_pk')
        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                {'success': False, 'error': {'message': 'Du lieu khong hop le.', 'details': serializer.errors}},
                status=status.HTTP_400_BAD_REQUEST
            )
        try:
            serializer.save(user=request.user, recipe_id=recipe_id)
        except IntegrityError:
            return Response(
                {'success': False, 'error': {'message': 'Ban da danh gia cong thuc nay roi.'}},
                status=status.HTTP_400_BAD_REQUEST
            )
        return Response(
            {'success': True, 'message': 'Danh gia thanh cong.', 'data': serializer.data},
            status=status.HTTP_201_CREATED
        )

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
        return Response({'success': True, 'message': 'Cap nhat danh gia thanh cong.', 'data': serializer.data})

    def partial_update(self, request, *args, **kwargs):
        kwargs['partial'] = True
        return self.update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class CollectionViewSet(viewsets.GenericViewSet,
                        mixins.ListModelMixin,
                        mixins.CreateModelMixin,
                        mixins.DestroyModelMixin):
    """
    ViewSet quản lý bộ sưu tập công thức (Collection) của user.

    Affinity Bonus:
        Công thức nằm trong Collection của user sẽ nhận +50 điểm trong
        Tier-3 Scoring Algorithm khi tính gợi ý món ăn (RecommendationView).

    Actions:
        list            — IsAuthenticated. Trả về tất cả Collection của user hiện tại.
        create          — IsAuthenticated. Tạo Collection mới, tự gán user.
        destroy         — IsOwner. Xóa Collection (kéo theo xóa các CollectionRecipe liên quan).
        add_recipe      — IsOwner. Thêm một công thức vào Collection.
                          Body: { "recipe_id": <uuid> }
        remove_recipe   — IsOwner. Gỡ một công thức khỏi Collection.
                          Body: { "recipe_id": <uuid> }
    """
    serializer_class = CollectionSerializer

    def get_queryset(self):
        return Collection.objects.filter(user=self.request.user).prefetch_related('collection_recipes')

    def get_permissions(self):
        if self.action in ('destroy', 'add_recipe', 'remove_recipe'):
            return [IsOwner()]
        return [IsAuthenticated()]

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            paginated = self.get_paginated_response(serializer.data)
            return Response({'success': True, 'data': paginated.data})
        serializer = self.get_serializer(queryset, many=True)
        return Response({'success': True, 'data': serializer.data})

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                {'success': False, 'error': {'message': 'Du lieu khong hop le.', 'details': serializer.errors}},
                status=status.HTTP_400_BAD_REQUEST
            )
        serializer.save(user=request.user)
        return Response(
            {'success': True, 'message': 'Tao bo suu tap thanh cong.', 'data': serializer.data},
            status=status.HTTP_201_CREATED
        )

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=['post'], url_path='add-recipe')
    def add_recipe(self, request, pk=None):
        """POST /api/social/collections/{id}/add-recipe/ — Them cong thuc vao bo suu tap."""
        collection = self.get_object()
        recipe_id = request.data.get('recipe_id')
        if not recipe_id:
            return Response(
                {'success': False, 'error': {'message': 'recipe_id la bat buoc.'}},
                status=status.HTTP_400_BAD_REQUEST
            )
        try:
            cr = CollectionRecipe.objects.create(collection=collection, recipe_id=recipe_id)
        except IntegrityError:
            return Response(
                {'success': False, 'error': {'message': 'Cong thuc nay da co trong bo suu tap.'}},
                status=status.HTTP_400_BAD_REQUEST
            )
        return Response(
            {'success': True, 'message': 'Da them cong thuc vao bo suu tap.', 'data': CollectionRecipeSerializer(cr).data},
            status=status.HTTP_201_CREATED
        )

    @action(detail=True, methods=['delete'], url_path='remove-recipe')
    def remove_recipe(self, request, pk=None):
        """DELETE /api/social/collections/{id}/remove-recipe/ — Go cong thuc khoi bo suu tap."""
        collection = self.get_object()
        recipe_id = request.data.get('recipe_id')
        if not recipe_id:
            return Response(
                {'success': False, 'error': {'message': 'recipe_id la bat buoc.'}},
                status=status.HTTP_400_BAD_REQUEST
            )
        deleted, _ = CollectionRecipe.objects.filter(
            collection=collection, recipe_id=recipe_id
        ).delete()
        if not deleted:
            return Response(
                {'success': False, 'error': {'message': 'Cong thuc khong co trong bo suu tap.'}},
                status=status.HTTP_404_NOT_FOUND
            )
        return Response(status=status.HTTP_204_NO_CONTENT)
