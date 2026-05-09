import uuid
from django.db import models
from django.conf import settings


# =============================================================================
# Constants / Choices
# =============================================================================

class ReportReason(models.TextChoices):
    """Lý do báo cáo nội dung."""
    SPAM = 'SPAM', 'Spam'
    WRONG_CONTENT = 'WRONG_CONTENT', 'Nội dung sai'
    HARASSMENT = 'HARASSMENT', 'Quấy rối'
    COPYRIGHT = 'COPYRIGHT', 'Vi phạm bản quyền'
    INAPPROPRIATE = 'INAPPROPRIATE', 'Không phù hợp'


class ReportStatus(models.TextChoices):
    """Trạng thái xử lý báo cáo."""
    PENDING = 'PENDING', 'Chờ duyệt'
    REVIEWED = 'REVIEWED', 'Đã duyệt'
    DISMISSED = 'DISMISSED', 'Bỏ qua'


class NotificationType(models.TextChoices):
    """Loại thông báo trong app."""
    REPORT_PROCESSED = 'REPORT_PROCESSED', 'Báo cáo đã xử lý'
    WARNING = 'WARNING', 'Cảnh cáo'


class TargetType(models.TextChoices):
    """Loại đối tượng được báo cáo."""
    RECIPE = 'recipe', 'Công thức'
    REVIEW = 'review', 'Đánh giá'
    USER = 'user', 'Người dùng'


# =============================================================================
# Models
# =============================================================================

class Report(models.Model):
    """
    Báo cáo nội dung vi phạm từ người dùng.

    Người dùng có thể báo cáo recipe, review hoặc user profile với các lý do:
    spam, nội dung sai, quấy rối, vi phạm bản quyền, hoặc nội dung không phù hợp.
    Admin xử lý thủ công các báo cáo.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    reporter = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='reports_filed'
    )
    target_type = models.CharField(
        max_length=10,
        choices=TargetType.choices
    )
    target_id = models.CharField(
        max_length=36,
        help_text='ID của đối tượng bị report (UUID cho Recipe/User, integer cho Review)'
    )
    reason = models.CharField(
        max_length=20,
        choices=ReportReason.choices
    )
    additional_info = models.TextField(
        blank=True,
        default='',
        help_text='Thông tin bổ sung từ người báo cáo'
    )
    status = models.CharField(
        max_length=10,
        choices=ReportStatus.choices,
        default=ReportStatus.PENDING
    )
    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='reports_reviewed'
    )
    reviewed_at = models.DateTimeField(null=True, blank=True)
    review_note = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'reports'
        verbose_name = 'Báo cáo'
        verbose_name_plural = 'Báo cáo'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['reporter', 'target_type', 'target_id'], name='rep_rtl_tid_idx'),
            models.Index(fields=['status'], name='rep_status_idx'),
        ]

    def __str__(self):
        return f"Báo cáo #{self.id} - {self.get_reason_display()} ({self.get_status_display()})"


class Notification(models.Model):
    """
    Thông báo trong app cho người dùng.

    Được tạo khi báo cáo của người dùng được xử lý hoặc khi admin gửi cảnh cáo.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='notifications'
    )
    type = models.CharField(
        max_length=20,
        choices=NotificationType.choices
    )
    title = models.CharField(max_length=200)
    message = models.TextField()
    data = models.JSONField(
        blank=True,
        null=True,
        help_text='Dữ liệu bổ sung dạng JSON'
    )
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'notifications'
        verbose_name = 'Thông báo'
        verbose_name_plural = 'Thông báo'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.get_type_display()}: {self.title}"
