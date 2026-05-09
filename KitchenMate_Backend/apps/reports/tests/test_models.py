import uuid
from django.test import TestCase
from django.contrib.auth import get_user_model
from apps.reports.models import (
    Report,
    Notification,
    ReportReason,
    ReportStatus,
    NotificationType,
    TargetType,
)

User = get_user_model()


class ReportModelTest(TestCase):
    """Unit tests cho Report model."""

    def setUp(self):
        self.user = User.objects.create_user(
            email='testuser@test.com',
            password='TestPass123@',
            full_name='Test User'
        )

    def test_report_creation(self):
        """Test tạo report với các trường cơ bản."""
        report = Report.objects.create(
            reporter=self.user,
            target_type=TargetType.RECIPE,
            target_id=uuid.uuid4(),
            reason=ReportReason.SPAM,
            additional_info='This is spam content.'
        )
        self.assertIsNotNone(report.id)
        self.assertEqual(report.reporter, self.user)
        self.assertEqual(report.target_type, TargetType.RECIPE)
        self.assertEqual(report.reason, ReportReason.SPAM)
        self.assertEqual(report.status, ReportStatus.PENDING)
        self.assertIsNone(report.reviewed_by)
        self.assertIsNone(report.reviewed_at)
        self.assertEqual(report.review_note, '')

    def test_report_reason_choices(self):
        """Test các lựa chọn reason không thay đổi."""
        expected_reasons = ['SPAM', 'WRONG_CONTENT', 'HARASSMENT', 'COPYRIGHT', 'INAPPROPRIATE']
        actual_reasons = [choice[0] for choice in ReportReason.choices]
        self.assertEqual(sorted(actual_reasons), sorted(expected_reasons))

    def test_report_status_choices(self):
        """Test các lựa chọn status không thay đổi."""
        expected_statuses = ['PENDING', 'REVIEWED', 'DISMISSED']
        actual_statuses = [choice[0] for choice in ReportStatus.choices]
        self.assertEqual(sorted(actual_statuses), sorted(expected_statuses))

    def test_report_target_type_choices(self):
        """Test các lựa chọn target_type không thay đổi."""
        expected_types = ['recipe', 'review', 'user']
        actual_types = [choice[0] for choice in TargetType.choices]
        self.assertEqual(sorted(actual_types), sorted(expected_types))

    def test_report_str_representation(self):
        """Test string representation của report."""
        report = Report.objects.create(
            reporter=self.user,
            target_type=TargetType.USER,
            target_id=uuid.uuid4(),
            reason=ReportReason.HARASSMENT,
        )
        str_repr = str(report)
        self.assertIn('Báo cáo', str_repr)
        self.assertIn('Quấy rối', str_repr)


class NotificationModelTest(TestCase):
    """Unit tests cho Notification model."""

    def setUp(self):
        self.user = User.objects.create_user(
            email='testuser@test.com',
            password='TestPass123@',
            full_name='Test User'
        )

    def test_notification_creation(self):
        """Test tạo notification với các trường cơ bản."""
        notification = Notification.objects.create(
            user=self.user,
            type=NotificationType.REPORT_PROCESSED,
            title='Báo cáo đã được xử lý',
            message='Báo cáo của bạn đã được xử lý bởi admin.',
            data={'report_id': str(uuid.uuid4()), 'action': 'dismissed'}
        )
        self.assertIsNotNone(notification.id)
        self.assertEqual(notification.user, self.user)
        self.assertEqual(notification.type, NotificationType.REPORT_PROCESSED)
        self.assertEqual(notification.title, 'Báo cáo đã được xử lý')
        self.assertFalse(notification.is_read)

    def test_notification_type_choices(self):
        """Test các lựa chọn type không thay đổi."""
        expected_types = ['REPORT_PROCESSED', 'WARNING']
        actual_types = [choice[0] for choice in NotificationType.choices]
        self.assertEqual(sorted(actual_types), sorted(expected_types))

    def test_notification_str_representation(self):
        """Test string representation của notification."""
        notification = Notification.objects.create(
            user=self.user,
            type=NotificationType.WARNING,
            title='Cảnh cáo vi phạm',
            message='Bạn đã vi phạm quy định cộng đồng.'
        )
        str_repr = str(notification)
        self.assertIn('Cảnh cáo', str_repr)
        self.assertIn('Cảnh cáo vi phạm', str_repr)

    def test_notification_default_is_read(self):
        """Test notification có is_read=False mặc định."""
        notification = Notification.objects.create(
            user=self.user,
            type=NotificationType.REPORT_PROCESSED,
            title='Test',
            message='Test message'
        )
        self.assertFalse(notification.is_read)

    def test_notification_data_field_optional(self):
        """Test notification data field có thể null."""
        notification = Notification.objects.create(
            user=self.user,
            type=NotificationType.REPORT_PROCESSED,
            title='Test',
            message='Test message'
        )
        self.assertIsNone(notification.data)
