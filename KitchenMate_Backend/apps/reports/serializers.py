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

    Extra fields for admin display:
    - reporter_name: Full name of the reporter
    - reason_display: Human-readable reason label
    - status_display: Human-readable status label
    - target_label: Title/name of the reported content
    - target_url: URL to the reported content
    """

    reporter_name = serializers.CharField(source='reporter.full_name', read_only=True)
    reason_display = serializers.CharField(source='get_reason_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    target_label = serializers.SerializerMethodField()
    target_url = serializers.SerializerMethodField()

    class Meta:
        model = Report
        fields = ('id', 'reporter', 'reporter_name', 'target_type', 'target_id',
                  'reason', 'reason_display', 'additional_info', 'status', 'status_display',
                  'reviewed_by', 'reviewed_at', 'review_note', 'created_at',
                  'target_label', 'target_url')
        read_only_fields = ('id', 'reporter', 'status', 'reviewed_by', 'reviewed_at',
                            'review_note', 'created_at', 'reporter_name', 'reason_display',
                            'status_display', 'target_label', 'target_url')

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

    def get_target_label(self, obj):
        """Get human-readable label for the reported content."""
        if obj.target_type == TargetType.RECIPE:
            from apps.recipes.models import Recipe
            try:
                recipe = Recipe.objects.get(pk=obj.target_id)
                return recipe.title
            except Recipe.DoesNotExist:
                return f'Công thức #{obj.target_id[:8]}'
        elif obj.target_type == TargetType.REVIEW:
            from apps.social.models import Review
            try:
                review = Review.objects.get(pk=int(obj.target_id))
                return review.comment or f'Đánh giá #{str(review.id)[:8]}'
            except (Review.DoesNotExist, ValueError):
                return f'Đánh giá #{obj.target_id[:8]}'
        elif obj.target_type == TargetType.USER:
            from django.contrib.auth import get_user_model
            User = get_user_model()
            try:
                user = User.objects.get(pk=obj.target_id)
                return user.full_name
            except User.DoesNotExist:
                return f'Người dùng #{obj.target_id[:8]}'
        return obj.target_id

    def get_target_url(self, obj):
        """Get URL to the reported content for admin navigation."""
        if obj.target_type == TargetType.RECIPE:
            return f'/recipe/{obj.target_id}'
        elif obj.target_type == TargetType.REVIEW:
            # Reviews are on recipe pages, try to get parent recipe
            from apps.social.models import Review
            try:
                review = Review.objects.select_related('recipe').get(pk=int(obj.target_id))
                return f'/recipe/{review.recipe.id}'
            except (Review.DoesNotExist, ValueError):
                return None
        elif obj.target_type == TargetType.USER:
            return f'/profile/{obj.target_id}'
        return None


class NotificationSerializer(serializers.ModelSerializer):
    """
    Serializer cho thông báo người dùng (read-only).

    Exposes: id, type, title, message, data, is_read, created_at
    """

    class Meta:
        model = Notification
        fields = ('id', 'type', 'title', 'message', 'data', 'is_read', 'created_at')
        read_only_fields = fields