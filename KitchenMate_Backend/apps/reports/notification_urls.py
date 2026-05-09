"""
URL patterns cho notifications app.
Được include tại api/notifications/ trong core/urls.py
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import NotificationViewSet

router = DefaultRouter()
router.register(r'', NotificationViewSet, basename='notification')

urlpatterns = [
    path('', include(router.urls)),
]
