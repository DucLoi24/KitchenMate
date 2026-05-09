"""
URL patterns cho recipes app.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import RecipeViewSet, RecipeStatsView
from .category_views import RecipeCategoryViewSet

router = DefaultRouter()
router.register(r'', RecipeViewSet, basename='recipe')

category_router = DefaultRouter()
category_router.register(r'categories', RecipeCategoryViewSet, basename='category')
category_router.include_root_view = False

urlpatterns = [
    path('', include(category_router.urls)),
    path('', include(router.urls)),
    path('<uuid:pk>/stats/', RecipeStatsView.as_view(), name='recipe-stats'),
]
