"""
Views cho admin_panel app.
Cac ViewSet quan tri: Recipe, Ingredient, User.
Tat ca deu yeu cau is_staff=True.
"""
from django.contrib.auth import get_user_model
from django.db import models
from django.shortcuts import get_object_or_404
from rest_framework import viewsets, mixins, status
from rest_framework.decorators import action
from rest_framework.response import Response

from core.permissions import IsAdminUser
from apps.recipes.models import Recipe
from apps.recipes.serializers import RecipeListSerializer
from apps.ingredients.models import Ingredient
from apps.ingredients.serializers import IngredientSerializer
from apps.accounts.serializers import UserSerializer

User = get_user_model()


class AdminRecipeViewSet(viewsets.GenericViewSet,
                        mixins.ListModelMixin):
    """
    ViewSet quan tri cong thuc.
    list: danh sach tat ca cong thuc
    pending: danh sach PENDING
    approve: chuyen sang PUBLIC
    reject: chuyen ve PRIVATE
    """
    permission_classes = [IsAdminUser]

    def list(self, request):
        recipes = Recipe.objects.select_related('user').order_by('-created_at')
        page = self._paginate(request, recipes, RecipeListSerializer)
        return page

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


class AdminIngredientViewSet(viewsets.GenericViewSet,
                              mixins.ListModelMixin):
    """
    ViewSet quan tri nguyen lieu.
    list: danh sach tat ca nguyen lieu
    pending: danh sach PENDING
    approve: chuyen sang APPROVED
    reject: chuyen sang REJECTED
    """
    permission_classes = [IsAdminUser]

    def list(self, request):
        ingredients = Ingredient.objects.all().order_by('created_at')
        page = self._paginate(request, ingredients, IngredientSerializer)
        return page

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
        users = User.objects.all()

        # Search by full_name or email
        search = request.query_params.get('search')
        if search:
            users = users.filter(
                models.Q(full_name__icontains=search) |
                models.Q(email__icontains=search)
            )

        # Filter by is_active (for 'blocked' tab)
        is_active = request.query_params.get('is_active')
        if is_active is not None:
            # Handle both boolean and string representations
            if is_active in ('false', 'False', '0', 0, False):
                users = users.filter(is_active=False)
            elif is_active in ('true', 'True', '1', 1, True):
                users = users.filter(is_active=True)

        # Filter by is_staff (for 'admin' tab)
        is_staff = request.query_params.get('is_staff')
        if is_staff is not None:
            if is_staff in ('true', 'True', '1', 1, True):
                users = users.filter(is_staff=True)
            elif is_staff in ('false', 'False', '0', 0, False):
                users = users.filter(is_staff=False)

        users = users.order_by('-date_joined')
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
        if not request.user.is_superuser:
            return Response(
                {'success': False, 'message': 'Ban khong co quyen thuc hien hanh dong nay. Chi quan tri vien moi co the thuc hien.'},
                status=status.HTTP_403_FORBIDDEN
            )
        user = get_object_or_404(User, pk=pk)

        from django.db import transaction
        with transaction.atomic():
            user.is_active = False
            user.save(update_fields=['is_active'])

            from django.contrib.sessions.models import Session
            from django.contrib.sessions.backends.db import SessionStore
            for session in Session.objects.all().iterator():
                try:
                    store = SessionStore(session_key=session.session_key)
                    if store.get('_auth_user_id') == str(user.pk):
                        session.delete()
                except (ValueError, KeyError):
                    continue

        return Response({'success': True, 'message': f'Tai khoan {user.email} da bi khoa.'})

    @action(detail=True, methods=['post'], url_path='set-admin')
    def set_admin(self, request, pk=None):
        if not request.user.is_superuser:
            return Response(
                {'success': False, 'message': 'Ban khong co quyen thuc hien hanh dong nay. Chi superuser moi co the thuc hien.'},
                status=status.HTTP_403_FORBIDDEN
            )
        user = get_object_or_404(User, pk=pk)
        if user == request.user:
            return Response(
                {'success': False, 'message': 'Ban khong the thay doi quyen quan tri cua chinh minh.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        is_admin = request.data.get('is_admin', False)
        from django.db import transaction
        with transaction.atomic():
            user.is_staff = bool(is_admin)
            user.save(update_fields=['is_staff'])

            if not is_admin:
                from django.contrib.sessions.models import Session
                from django.contrib.sessions.backends.db import SessionStore
                for session in Session.objects.all().iterator():
                    try:
                        store = SessionStore(session_key=session.session_key)
                        if store.get('_auth_user_id') == str(user.pk):
                            session.delete()
                    except (ValueError, KeyError):
                        continue

        action_word = 'phan quyen quan tri vien' if user.is_staff else 'xoa quyen quan tri vien'
        return Response({
            'success': True,
            'message': f'Tai khoan {user.email} da duoc {action_word}.'
        })

    @action(detail=True, methods=['post'])
    def unblock(self, request, pk=None):
        user = get_object_or_404(User, pk=pk)
        user.is_active = True
        user.save(update_fields=['is_active'])
        return Response({'success': True, 'message': f'Tai khoan {user.email} da duoc mo khoa.'})


class DashboardChartViewSet(viewsets.GenericViewSet):
    """
    ViewSet tra ve du lieu chart cho dashboard admin.
    """
    permission_classes = [IsAdminUser]

    def _date_range(self, days=7):
        from django.utils import timezone
        from datetime import timedelta
        today = timezone.now().date()
        return [today - timedelta(days=i) for i in range(days - 1, -1, -1)]

    @action(detail=False, methods=['get'], url_path='charts')
    def charts(self, request):
        from django.db.models import Count, Sum
        from django.db.models.functions import TruncDate
        from django.utils import timezone

        dates = self._date_range(7)
        date_strings = [d.isoformat() for d in dates]

        user_growth = (
            User.objects
            .filter(created_at__date__in=dates)
            .annotate(date=TruncDate('created_at'))
            .values('date')
            .annotate(count=Count('id'))
            .order_by('date')
        )
        user_growth_dict = {str(u['date']): u['count'] for u in user_growth}

        recipe_submissions_qs = (
            Recipe.objects
            .filter(created_at__date__in=dates)
            .annotate(date=TruncDate('created_at'))
            .values('date')
            .annotate(
                created=Count('id'),
                public=Count('id', filter=models.Q(visibility='PUBLIC'))
            )
            .order_by('date')
        )
        recipe_submissions_dict = {
            str(r['date']): {'created': r['created'], 'public': r['public']}
            for r in recipe_submissions_qs
        }

        total_views_qs = (
            Recipe.objects
            .filter(created_at__date__in=dates)
            .annotate(date=TruncDate('created_at'))
            .values('date')
            .annotate(count=Sum('view_count'))
            .order_by('date')
        )
        total_views_dict = {str(v['date']): v['count'] for v in total_views_qs}

        result = {
            'user_growth': [
                {'date': d, 'new_users': user_growth_dict.get(d, 0)}
                for d in date_strings
            ],
            'recipe_submissions': [
                {'date': d, 'new_recipes': recipe_submissions_dict.get(d, {}).get('created', 0),
                 'public_recipes': recipe_submissions_dict.get(d, {}).get('public', 0)}
                for d in date_strings
            ],
            'total_views': [
                {'date': d, 'views': total_views_dict.get(d, 0)}
                for d in date_strings
            ],
        }
        return Response(result)
