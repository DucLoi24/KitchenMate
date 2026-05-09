"""
Views cho reports app.
User endpoints: tạo báo cáo, xem danh sách báo cáo của mình.
Admin endpoints: xem danh sách, chi tiết, xử lý báo cáo.
"""
from django.db import transaction
from django.utils import timezone
from django.shortcuts import get_object_or_404
from rest_framework import viewsets, mixins, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from core.permissions import IsAdminUser
from .models import Report, Notification, ReportStatus, TargetType, NotificationType
from .serializers import ReportSerializer, NotificationSerializer


class ReportViewSet(viewsets.GenericViewSet,
                    mixins.CreateModelMixin,
                    mixins.ListModelMixin):
    """
    ViewSet cho người dùng gửi báo cáo nội dung.

    create: Tạo báo cáo mới (R1, R2, R3)
    list_my_reports: Danh sách báo cáo của người dùng hiện tại (R4)
    """
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Chỉ trả về báo cáo của người dùng hiện tại."""
        return Report.objects.filter(reporter=self.request.user).order_by('-created_at')

    def get_serializer_class(self):
        """Dùng ReportSerializer cho cả create và list."""
        return ReportSerializer

    def create(self, request, *args, **kwargs):
        """
        Tạo báo cáo mới (R1, R2, R3).
        - R1: User gửi report recipe
        - R2: User gửi report review
        - R3: User gửi report user

        Validation (từ serializer):
        - R13: Không cho phép tự báo cáo chính mình
        - R14: Không cho phép báo cáo trùng lặp
        """
        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            # Return consistent error format
            errors = serializer.errors
            # Flatten error messages for message field
            error_msgs = []
            for field, msgs in errors.items():
                if isinstance(msgs, list):
                    for msg in msgs:
                        error_msgs.append(str(msg))
                else:
                    error_msgs.append(str(msgs))
            message = '; '.join(error_msgs) if error_msgs else 'Dữ liệu không hợp lệ'
            return Response(
                {'success': False, 'message': message},
                status=status.HTTP_400_BAD_REQUEST
            )
        self.perform_create(serializer, request.user)
        headers = self.get_success_headers(serializer.data)
        return Response(
            {'success': True, 'data': serializer.data},
            status=status.HTTP_201_CREATED,
            headers=headers
        )

    def list(self, request, *args, **kwargs):
        """
        Danh sách báo cáo của người dùng hiện tại (R4).
        Lọc theo reporter=request.user.
        """
        queryset = self.get_queryset()

        # Filter by status if provided
        status_filter = request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)

        # Filter by reason if provided
        reason_filter = request.query_params.get('reason')
        if reason_filter:
            queryset = queryset.filter(reason=reason_filter)

        page = self._paginate(request, queryset, ReportSerializer)
        return page

    @action(detail=False, methods=['get'], url_path='my-reports')
    def list_my_reports(self, request):
        """
        Danh sách báo cáo của người dùng hiện tại (R4).
        Endpoint: GET /api/reports/my-reports/
        """
        return self.list(request)

    def perform_create(self, serializer, user):
        """Override to set reporter from request user."""
        serializer.save(reporter=user)

    def _paginate(self, request, queryset, serializer_class):
        """Paginate query results."""
        from rest_framework.pagination import PageNumberPagination
        paginator = PageNumberPagination()
        paginator.page_size = 20
        page = paginator.paginate_queryset(queryset, request)
        if page is not None:
            serializer = serializer_class(page, many=True)
            paginated = paginator.get_paginated_response(serializer.data)
            return Response({'success': True, 'data': paginated.data})
        serializer = serializer_class(queryset, many=True)
        return Response({'success': True, 'data': serializer.data})


class AdminReportViewSet(viewsets.GenericViewSet,
                        mixins.ListModelMixin,
                        mixins.RetrieveModelMixin):
    """
    ViewSet quản trị báo cáo cho admin.

    Actions:
        list: Danh sách tất cả báo cáo với filter theo status (R5)
        retrieve: Xem chi tiết báo cáo (R6)
        review: Xử lý báo cáo với các hành động (R7-R11)
    """
    permission_classes = [IsAdminUser]

    def get_queryset(self):
        return Report.objects.select_related('reporter', 'reviewed_by').order_by('-created_at')

    def get_serializer_class(self):
        return ReportSerializer

    def list(self, request):
        """Danh sách tất cả báo cáo với filter theo status (R5)."""
        reports = self.get_queryset()

        # Filter by status
        report_status = request.query_params.get('status')
        if report_status in (choice[0] for choice in ReportStatus.choices):
            reports = reports.filter(status=report_status)

        page = self._paginate(request, reports, ReportSerializer)
        return page

    def retrieve(self, request, pk=None):
        """Xem chi tiết báo cáo (R6)."""
        report = get_object_or_404(Report.objects.select_related('reporter', 'reviewed_by'), pk=pk)
        serializer = ReportSerializer(report)
        return Response({'success': True, 'data': serializer.data})

    @action(detail=True, methods=['post'], url_path='review')
    def review(self, request, pk=None):
        """
        Xử lý báo cáo với các hành động (R7-R11).
        CRITICAL: Chỉ superuser mới có thể thực hiện hành động này.
        """
        # Explicit superuser check (không chỉ là is_staff)
        if not request.user.is_superuser:
            return Response(
                {'success': False, 'message': 'Bạn không có quyen thuc hien hanh dong nay. Chi superuser moi co the thuc hien.'},
                status=status.HTTP_403_FORBIDDEN
            )

        report = get_object_or_404(Report, pk=pk)

        action_type = request.data.get('action')
        note = request.data.get('note', '')

        if action_type not in ('dismiss', 'remove_content', 'warn_user'):
            return Response(
                {'success': False, 'message': 'Han dong khong hop le. Chi chap nhan: dismiss, remove_content, warn_user'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Lấy content owner trước khi thay đổi
        content_owner = self._get_content_owner(report)

        with transaction.atomic():
            if action_type == 'dismiss':
                # R7: Admin dismiss report
                report.status = ReportStatus.DISMISSED
                report.reviewed_by = request.user
                report.reviewed_at = timezone.now()
                report.review_note = note
                report.save(update_fields=['status', 'reviewed_by', 'reviewed_at', 'review_note'])

            elif action_type == 'remove_content':
                # R8, R9, R10: Remove content
                if report.target_type == TargetType.RECIPE:
                    from apps.recipes.models import Recipe
                    recipe = get_object_or_404(Recipe, pk=report.target_id)
                    recipe.soft_delete()

                elif report.target_type == TargetType.REVIEW:
                    from apps.social.models import Review
                    review = get_object_or_404(Review, pk=int(report.target_id))
                    review.delete()

                elif report.target_type == TargetType.USER:
                    from django.contrib.auth import get_user_model
                    User = get_user_model()
                    user = get_object_or_404(User, pk=report.target_id)
                    user.is_active = False
                    user.save(update_fields=['is_active'])

                report.status = ReportStatus.REVIEWED
                report.reviewed_by = request.user
                report.reviewed_at = timezone.now()
                report.review_note = note
                report.save(update_fields=['status', 'reviewed_by', 'reviewed_at', 'review_note'])

            elif action_type == 'warn_user':
                # R11: Warn user - tạo WARNING notification cho content owner
                if content_owner:
                    Notification.objects.create(
                        user=content_owner,
                        type=NotificationType.WARNING,
                        title='Bạn đã nhận cảnh báo từ quản trị viên',
                        message=f'Nội dung bạn đã đăng đã bị báo cáo và xem xét. Vui lòng tuân thủ quy định của cộng đồng. Lý do: {report.get_reason_display()}',
                        data={
                            'report_id': str(report.id),
                            'reason': report.reason,
                        }
                    )

                report.status = ReportStatus.REVIEWED
                report.reviewed_by = request.user
                report.reviewed_at = timezone.now()
                report.review_note = note
                report.save(update_fields=['status', 'reviewed_by', 'reviewed_at', 'review_note'])

            # R12: Tạo thông báo cho reporter
            action_message = {
                'dismiss': 'đã bỏ qua',
                'remove_content': 'đã xóa nội dung vi phạm',
                'warn_user': 'đã gửi cảnh báo',
            }.get(action_type, 'đã xử lý')

            Notification.objects.create(
                user=report.reporter,
                type=NotificationType.REPORT_PROCESSED,
                title='Báo cáo của bạn đã được xử lý',
                message=f'Báo cáo của bạn về "{report.get_reason_display()}" {action_message} bởi quản trị viên.',
                data={
                    'report_id': str(report.id),
                    'action': action_type,
                    'reviewed_by': str(request.user.id),
                }
            )

        serializer = ReportSerializer(report)
        return Response({
            'success': True,
            'message': f'Báo cáo đã được xử lý với hành động {action_type}',
            'data': serializer.data
        })

    def _get_content_owner(self, report):
        """Lấy người sở hữu nội dung dựa trên target_type và target_id."""
        if report.target_type == TargetType.RECIPE:
            from apps.recipes.models import Recipe
            recipe = get_object_or_404(Recipe, pk=report.target_id)
            return recipe.user
        elif report.target_type == TargetType.REVIEW:
            from apps.social.models import Review
            review = get_object_or_404(Review, pk=int(report.target_id))
            return review.user
        elif report.target_type == TargetType.USER:
            from django.contrib.auth import get_user_model
            User = get_user_model()
            return get_object_or_404(User, pk=report.target_id)
        return None

    def _paginate(self, request, queryset, serializer_class):
        """Paginate query results."""
        from rest_framework.pagination import PageNumberPagination
        paginator = PageNumberPagination()
        paginator.page_size = 20
        page = paginator.paginate_queryset(queryset, request)
        if page is not None:
            serializer = serializer_class(page, many=True)
            paginated = paginator.get_paginated_response(serializer.data)
            return Response({'success': True, 'data': paginated.data})
        serializer = serializer_class(queryset, many=True)
        return Response({'success': True, 'data': serializer.data})


class NotificationViewSet(viewsets.GenericViewSet,
                         mixins.ListModelMixin):
    """
    ViewSet cho người dùng xem và quản lý thông báo.

    list: Danh sách thông báo của user hiện tại (N1)
    mark_as_read: Đánh dấu một thông báo đã đọc (N2)
    mark_all_read: Đánh dấu tất cả thông báo đã đọc (N3)
    get_unread_count: Lấy số thông báo chưa đọc (N4)
    """
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Chỉ trả về thông báo của người dùng hiện tại."""
        return Notification.objects.filter(user=self.request.user).order_by('-created_at')

    def get_serializer_class(self):
        return NotificationSerializer

    def list(self, request):
        """
        Danh sách thông báo của user hiện tại (N1).
        Hỗ trợ filter theo is_read.
        """
        queryset = self.get_queryset()

        # Filter by is_read if provided
        is_read = request.query_params.get('is_read')
        if is_read is not None:
            if is_read.lower() in ('false', '0'):
                queryset = queryset.filter(is_read=False)
            elif is_read.lower() in ('true', '1'):
                queryset = queryset.filter(is_read=True)

        page = self._paginate(request, queryset, NotificationSerializer)
        return page

    @action(detail=True, methods=['patch'], url_path='read')
    def mark_as_read(self, request, pk=None):
        """
        Đánh dấu một thông báo đã đọc (N2).
        Chỉ user sở hữu notification mới có thể đánh dấu.
        """
        notification = get_object_or_404(
            Notification.objects.filter(user=request.user),
            pk=pk
        )
        notification.is_read = True
        notification.save(update_fields=['is_read'])
        serializer = NotificationSerializer(notification)
        return Response({'success': True, 'data': serializer.data})

    @action(detail=False, methods=['post'], url_path='mark-all-read')
    def mark_all_read(self, request):
        """
        Đánh dấu tất cả thông báo của user đã đọc (N3).
        """
        updated = Notification.objects.filter(
            user=request.user,
            is_read=False
        ).update(is_read=True)
        return Response({
            'success': True,
            'message': f'Đã đánh dấu {updated} thông báo là đã đọc'
        })

    @action(detail=False, methods=['get'], url_path='unread-count')
    def get_unread_count(self, request):
        """
        Lấy số thông báo chưa đọc (N4).
        """
        count = Notification.objects.filter(
            user=request.user,
            is_read=False
        ).count()
        return Response({'success': True, 'data': {'unread_count': count}})

    def _paginate(self, request, queryset, serializer_class):
        """Paginate query results."""
        from rest_framework.pagination import PageNumberPagination
        paginator = PageNumberPagination()
        paginator.page_size = 20
        page = paginator.paginate_queryset(queryset, request)
        if page is not None:
            serializer = serializer_class(page, many=True)
            paginated = paginator.get_paginated_response(serializer.data)
            return Response({'success': True, 'data': paginated.data})
        serializer = serializer_class(queryset, many=True)
        return Response({'success': True, 'data': serializer.data})
