"""
URL patterns cho reports app.
User endpoints: tạo báo cáo, xem danh sách báo cáo của mình.
Admin endpoints: được include riêng tại api/admin/reports/ trong core/urls.py
Notification endpoints: được include tại api/notifications/
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import ReportViewSet, NotificationViewSet

router = DefaultRouter()
router.register(r'', ReportViewSet, basename='report')
router.register(r'notifications', NotificationViewSet, basename='notification')

urlpatterns = [
    path('', include(router.urls)),
]