"""
URL patterns cho recipes app.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import RecipeViewSet, RecipeStatsView

router = DefaultRouter()
router.register(r'', RecipeViewSet, basename='recipe')

urlpatterns = [
    # Stats endpoint phải đặt TRƯỚC router để tránh conflict với <pk> pattern
    path('<uuid:pk>/stats/', RecipeStatsView.as_view(), name='recipe-stats'),
    path('', include(router.urls)),
]
