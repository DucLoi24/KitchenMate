"""
URL patterns cho admin_panel app.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import AdminRecipeViewSet, AdminIngredientViewSet, AdminUserViewSet, DashboardChartViewSet

router = DefaultRouter()
router.register(r'recipes', AdminRecipeViewSet, basename='admin-recipe')
router.register(r'ingredients', AdminIngredientViewSet, basename='admin-ingredient')
router.register(r'users', AdminUserViewSet, basename='admin-user')
router.register(r'dashboard', DashboardChartViewSet, basename='admin-dashboard')

urlpatterns = [
    path('', include(router.urls)),
]
