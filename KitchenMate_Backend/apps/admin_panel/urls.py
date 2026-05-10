"""
URL patterns cho admin_panel app.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import AdminRecipeViewSet, AdminIngredientViewSet, AdminUserViewSet, DashboardChartViewSet
from apps.ingredients.views import UnitViewSet

router = DefaultRouter()
router.register(r'recipes', AdminRecipeViewSet, basename='admin-recipe')
router.register(r'ingredients', AdminIngredientViewSet, basename='admin-ingredient')
router.register(r'users', AdminUserViewSet, basename='admin-user')
router.register(r'dashboard', DashboardChartViewSet, basename='admin-dashboard')

# Unit CRUD - placed first to avoid 'admin/units/' being matched as 'admin/<pk>/'
router.register(r'units', UnitViewSet, basename='admin-unit')

urlpatterns = [
    path('', include(router.urls)),
]
