"""
Serializers cho reports app.
"""
from rest_framework import serializers

from .models import Report, Notification, ReportStatus, TargetType


class ReportSerializer(serializers.ModelSerializer):
    """
    Serializer cho báo cáo nội dung vi phạm.

    Validation rules:
    - R13: Không cho phép tự báo cáo chính mình (target_type='user' và target_id trùng reporter)
    - R14: Không cho phép báo cáo trùng lặp (cùng reporter + target_type + target_id với status PENDING/REVIEWED)
    """

    class Meta:
        model = Report
        fields = ('id', 'reporter', 'target_type', 'target_id', 'reason', 'additional_info', 'status', 'reviewed_by', 'reviewed_at', 'review_note', 'created_at')
        read_only_fields = ('id', 'reporter', 'status', 'reviewed_by', 'reviewed_at', 'review_note', 'created_at')

    def validate_target_type(self, value):
        """Validate target_type is one of: recipe, review, user."""
        valid_types = [choice[0] for choice in TargetType.choices]
        if value not in valid_types:
            raise serializers.ValidationError(
                f"target_type phải là một trong: {', '.join(valid_types)}"
            )
        return value

    def validate(self, attrs):
        """Apply R13 and R14 validation rules."""
        reporter = self.context['request'].user
        target_type = attrs.get('target_type')
        target_id = attrs.get('target_id')

        # R13: Self-report prevention
        if target_type == TargetType.USER and target_id:
            # Convert target_id to string for comparison if needed
            target_id_str = str(target_id)
            reporter_id_str = str(reporter.id)
            if target_id_str == reporter_id_str:
                raise serializers.ValidationError({
                    'target_id': "Bạn không thể báo cáo nội dung của chính mình"
                })

        # R14: Duplicate report check
        existing_report = Report.objects.filter(
            reporter=reporter,
            target_type=target_type,
            target_id=target_id
        ).filter(
            status__in=[ReportStatus.PENDING, ReportStatus.REVIEWED]
        ).exists()

        if existing_report:
            raise serializers.ValidationError({
                'target_id': "Bạn đã báo cáo nội dung này rồi"
            })

        return attrs


class NotificationSerializer(serializers.ModelSerializer):
    """
    Serializer cho thông báo người dùng (read-only).

    Exposes: id, type, title, message, data, is_read, created_at
    """

    class Meta:
        model = Notification
        fields = ('id', 'type', 'title', 'message', 'data', 'is_read', 'created_at')
        read_only_fields = fields