"""
Admin URL patterns cho reports app.
Được include tại api/admin/reports/ trong core/urls.py
"""
from django.urls import path
from .views import AdminReportViewSet

urlpatterns = [
    path('', AdminReportViewSet.as_view({
        'get': 'list',
    }), name='admin-report-list'),
    path('<uuid:pk>/', AdminReportViewSet.as_view({
        'get': 'retrieve',
    }), name='admin-report-detail'),
    path('<uuid:pk>/review/', AdminReportViewSet.as_view({
        'post': 'review',
    }), name='admin-report-review'),
]