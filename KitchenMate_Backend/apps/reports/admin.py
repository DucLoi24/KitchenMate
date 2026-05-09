from django.contrib import admin
from .models import Report, Notification


@admin.register(Report)
class ReportAdmin(admin.ModelAdmin):
    list_display = ['reporter', 'target_type', 'status', 'reason', 'created_at']
    list_filter = ['status', 'target_type', 'reason']
    search_fields = ['reporter__email', 'reporter__full_name', 'target_id', 'additional_info']
    raw_id_fields = ['reporter', 'reviewed_by']
    readonly_fields = ['id', 'created_at']
    ordering = ['-created_at']


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ['user', 'type', 'title', 'is_read', 'created_at']
    list_filter = ['type', 'is_read']
    search_fields = ['user__email', 'user__full_name', 'title', 'message']
    raw_id_fields = ['user']
    readonly_fields = ['id', 'created_at']
    ordering = ['-created_at']