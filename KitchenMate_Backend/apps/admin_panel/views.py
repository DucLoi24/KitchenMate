"""
Views cho admin_panel app.
Cac ViewSet quan tri: Recipe, Ingredient, User.
Tat ca deu yeu cau is_staff=True.
"""
from django.contrib.auth import get_user_model
from django.shortcuts import get_object_or_404
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response

from core.permissions import IsAdminUser
from apps.recipes.models import Recipe
from apps.recipes.serializers import RecipeListSerializer
from apps.ingredients.models import Ingredient
from apps.ingredients.serializers import IngredientSerializer
from apps.accounts.serializers import UserSerializer

User = get_user_model()


class AdminRecipeViewSet(viewsets.GenericViewSet):
    """
    ViewSet quan tri cong thuc.
    pending: danh sach PENDING
    approve: chuyen sang PUBLIC
    reject: chuyen ve PRIVATE
    """
    permission_classes = [IsAdminUser]

    @action(detail=False, methods=['get'], url_path='pending')
    def pending(self, request):
        recipes = Recipe.objects.filter(
            visibility='PENDING'
        ).select_related('user').order_by('-created_at')
        page = self._paginate(request, recipes, RecipeListSerializer)
        return page

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        recipe = get_object_or_404(Recipe, pk=pk)
        recipe.visibility = 'PUBLIC'
        recipe.save(update_fields=['visibility'])
        return Response({'success': True, 'message': 'Cong thuc da duoc duyet va cong khai.'})

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        recipe = get_object_or_404(Recipe, pk=pk)
        recipe.visibility = 'PRIVATE'
        recipe.save(update_fields=['visibility'])
        return Response({'success': True, 'message': 'Cong thuc da bi tu choi, chuyen ve PRIVATE.'})

    def _paginate(self, request, queryset, serializer_class):
        from rest_framework.pagination import PageNumberPagination
        paginator = PageNumberPagination()
        paginator.page_size = 20
        page = paginator.paginate_queryset(queryset, request)
        if page is not None:
            serializer = serializer_class(page, many=True)
            paginated = paginator.get_paginated_response(serializer.data)
            return Response({'success': True, 'data': paginated.data})
        serializer = serializer_class(queryset, many=True)
        return Response({'success': True, 'data': serializer.data})


class AdminIngredientViewSet(viewsets.GenericViewSet):
    """
    ViewSet quan tri nguyen lieu.
    pending: danh sach PENDING
    approve: chuyen sang APPROVED
    reject: chuyen sang REJECTED
    """
    permission_classes = [IsAdminUser]

    @action(detail=False, methods=['get'], url_path='pending')
    def pending(self, request):
        ingredients = Ingredient.objects.filter(status='PENDING').order_by('created_at')
        page = self._paginate(request, ingredients, IngredientSerializer)
        return page

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        ingredient = get_object_or_404(Ingredient, pk=pk)
        ingredient.status = 'APPROVED'
        ingredient.save(update_fields=['status'])
        return Response({'success': True, 'message': 'Nguyen lieu da duoc duyet.'})

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        ingredient = get_object_or_404(Ingredient, pk=pk)
        ingredient.status = 'REJECTED'
        ingredient.save(update_fields=['status'])
        return Response({'success': True, 'message': 'Nguyen lieu da bi tu choi.'})

    def _paginate(self, request, queryset, serializer_class):
        from rest_framework.pagination import PageNumberPagination
        paginator = PageNumberPagination()
        paginator.page_size = 20
        page = paginator.paginate_queryset(queryset, request)
        if page is not None:
            serializer = serializer_class(page, many=True)
            paginated = paginator.get_paginated_response(serializer.data)
            return Response({'success': True, 'data': paginated.data})
        serializer = serializer_class(queryset, many=True)
        return Response({'success': True, 'data': serializer.data})


class AdminUserViewSet(viewsets.GenericViewSet):
    """
    ViewSet quan tri nguoi dung.
    list: tat ca users ke ca is_active=False
    block: dat is_active=False
    unblock: dat is_active=True
    """
    permission_classes = [IsAdminUser]

    @action(detail=False, methods=['get'], url_path='list')
    def list_users(self, request):
        users = User.objects.all().order_by('-date_joined')
        from rest_framework.pagination import PageNumberPagination
        paginator = PageNumberPagination()
        paginator.page_size = 20
        page = paginator.paginate_queryset(users, request)
        if page is not None:
            serializer = UserSerializer(page, many=True)
            paginated = paginator.get_paginated_response(serializer.data)
            return Response({'success': True, 'data': paginated.data})
        serializer = UserSerializer(users, many=True)
        return Response({'success': True, 'data': serializer.data})

    @action(detail=True, methods=['post'])
    def block(self, request, pk=None):
        user = get_object_or_404(User, pk=pk)
        user.is_active = False
        user.save(update_fields=['is_active'])
        return Response({'success': True, 'message': f'Tai khoan {user.email} da bi khoa.'})

    @action(detail=True, methods=['post'])
    def unblock(self, request, pk=None):
        user = get_object_or_404(User, pk=pk)
        user.is_active = True
        user.save(update_fields=['is_active'])
        return Response({'success': True, 'message': f'Tai khoan {user.email} da duoc mo khoa.'})
