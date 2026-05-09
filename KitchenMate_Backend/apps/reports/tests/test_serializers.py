"""
Tests for reports serializers.
Tests that ReportSerializer includes human-readable fields.
"""
import uuid
from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIRequestFactory

from apps.reports.models import Report, ReportReason, ReportStatus, TargetType
from apps.reports.serializers import ReportSerializer

User = get_user_model()


class ReportSerializerHumanReadableFieldsTest(TestCase):
    """Test that ReportSerializer includes human-readable fields."""

    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser@test.com',
            email='testuser@test.com',
            password='TestPass123@',
            full_name='Test User'
        )
        self.report = Report.objects.create(
            reporter=self.user,
            target_type=TargetType.RECIPE,
            target_id=str(uuid.uuid4()),
            reason=ReportReason.SPAM,
            additional_info='Test info',
            status=ReportStatus.PENDING,
        )
        factory = APIRequestFactory()
        self.request = factory.get('/')
        self.request.user = self.user

    def test_reporter_name_field_exists(self):
        """ReportSerializer should include reporter_name field."""
        serializer = ReportSerializer(self.report, context={'request': self.request})
        data = serializer.data
        self.assertIn('reporter_name', data,
            "ReportSerializer must include 'reporter_name' for admin display")

    def test_reporter_name_contains_user_full_name(self):
        """reporter_name should contain the reporter's full_name."""
        serializer = ReportSerializer(self.report, context={'request': self.request})
        data = serializer.data
        self.assertEqual(data['reporter_name'], 'Test User',
            "reporter_name should match reporter's full_name")

    def test_reason_display_field_exists(self):
        """ReportSerializer should include reason_display field."""
        serializer = ReportSerializer(self.report, context={'request': self.request})
        data = serializer.data
        self.assertIn('reason_display', data,
            "ReportSerializer must include 'reason_display' for admin display")

    def test_reason_display_shows_human_readable_label(self):
        """reason_display should show 'Spam' not 'SPAM'."""
        serializer = ReportSerializer(self.report, context={'request': self.request})
        data = serializer.data
        self.assertEqual(data['reason_display'], 'Spam',
            "reason_display should show human-readable label 'Spam', not 'SPAM'")

    def test_reason_display_for_wrong_content(self):
        """reason_display for WRONG_CONTENT should be 'Nội dung sai'."""
        self.report.reason = ReportReason.WRONG_CONTENT
        self.report.save()
        serializer = ReportSerializer(self.report, context={'request': self.request})
        data = serializer.data
        self.assertEqual(data['reason_display'], 'Nội dung sai',
            "reason_display should be 'Nội dung sai' for WRONG_CONTENT")

    def test_reason_display_for_harassment(self):
        """reason_display for HARASSMENT should be 'Quấy rối'."""
        self.report.reason = ReportReason.HARASSMENT
        self.report.save()
        serializer = ReportSerializer(self.report, context={'request': self.request})
        data = serializer.data
        self.assertEqual(data['reason_display'], 'Quấy rối',
            "reason_display should be 'Quấy rối' for HARASSMENT")

    def test_reason_display_for_copyright(self):
        """reason_display for COPYRIGHT should be 'Vi phạm bản quyền'."""
        self.report.reason = ReportReason.COPYRIGHT
        self.report.save()
        serializer = ReportSerializer(self.report, context={'request': self.request})
        data = serializer.data
        self.assertEqual(data['reason_display'], 'Vi phạm bản quyền',
            "reason_display should be 'Vi phạm bản quyền' for COPYRIGHT")

    def test_reason_display_for_inappropriate(self):
        """reason_display for INAPPROPRIATE should be 'Không phù hợp'."""
        self.report.reason = ReportReason.INAPPROPRIATE
        self.report.save()
        serializer = ReportSerializer(self.report, context={'request': self.request})
        data = serializer.data
        self.assertEqual(data['reason_display'], 'Không phù hợp',
            "reason_display should be 'Không phù hợp' for INAPPROPRIATE")

    def test_status_display_field_exists(self):
        """ReportSerializer should include status_display field."""
        serializer = ReportSerializer(self.report, context={'request': self.request})
        data = serializer.data
        self.assertIn('status_display', data,
            "ReportSerializer must include 'status_display' for admin display")

    def test_status_display_shows_human_readable_label(self):
        """status_display should show 'Chờ duyệt' not 'PENDING'."""
        serializer = ReportSerializer(self.report, context={'request': self.request})
        data = serializer.data
        self.assertEqual(data['status_display'], 'Chờ duyệt',
            "status_display should show 'Chờ duyệt' for PENDING")

    def test_target_label_field_exists(self):
        """ReportSerializer should include target_label field for content identification."""
        serializer = ReportSerializer(self.report, context={'request': self.request})
        data = serializer.data
        self.assertIn('target_label', data,
            "ReportSerializer must include 'target_label' for admin to identify content")

    def test_target_url_field_exists_for_recipe(self):
        """ReportSerializer should include target_url for recipe reports."""
        serializer = ReportSerializer(self.report, context={'request': self.request})
        data = serializer.data
        self.assertIn('target_url', data,
            "ReportSerializer must include 'target_url' for admin navigation")
        self.assertEqual(data['target_url'], f'/recipe/{self.report.target_id}',
            "target_url for recipe should be /recipe/{target_id}")
