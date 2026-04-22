"""
URL patterns cho kitchen app.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import PantryViewSet, ShoppingListViewSet

router = DefaultRouter()
router.register(r'pantry', PantryViewSet, basename='pantry')
router.register(r'shopping-list', ShoppingListViewSet, basename='shopping-list')

urlpatterns = [
    path('', include(router.urls)),
]
