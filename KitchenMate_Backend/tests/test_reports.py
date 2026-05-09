"""
Integration tests cho user report system (R1-R4).
Test các API endpoints: tạo report và xem danh sách report của mình.
"""
import pytest
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model
from uuid import uuid4

from apps.reports.models import Report, Notification, ReportStatus, TargetType, ReportReason

User = get_user_model()


# ==============================================================================
# FIXTURES
# ==============================================================================

@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def user(db):
    return User.objects.create_user(
        username='reporter',
        email='reporter@example.com',
        password='testpass123',
        full_name='Reporter User'
    )


@pytest.fixture
def another_user(db):
    return User.objects.create_user(
        username='another',
        email='another@example.com',
        password='testpass123',
        full_name='Another User'
    )


@pytest.fixture
def auth_client(api_client, user):
    api_client.force_authenticate(user=user)
    return api_client


@pytest.fixture
def target_recipe(db, another_user):
    """Tạo recipe để report (belongs to another_user)."""
    from apps.recipes.models import Recipe
    recipe = Recipe.objects.create(
        user=another_user,
        title='Công thức test',
        description='Mô tả test',
        difficulty='EASY',
        prep_time=30,
        visibility='PUBLIC'
    )
    return recipe


@pytest.fixture
def target_review(db, another_user, target_recipe):
    """Tạo review để report."""
    from apps.social.models import Review
    review = Review.objects.create(
        user=another_user,
        recipe=target_recipe,
        rating=5,
        comment='Bình luận test'
    )
    return review


@pytest.fixture
def target_user(db, another_user):
    """Trả về another_user làm target cho user report."""
    return another_user


# ==============================================================================
# HELPERS
# ==============================================================================

def get_results(response):
    """Lấy results từ paginated response."""
    return response.json().get('data', {}).get('results', [])


def get_data(response):
    """Lấy data từ response."""
    return response.json().get('data', {})


# ==============================================================================
# R1: User gửi report recipe thành công
# ==============================================================================

@pytest.mark.django_db
def test_create_report_recipe_success(auth_client, target_recipe):
    """
    R1: User gửi report recipe thành công.
    Given: User đã login và target recipe tồn tại
    When: POST /api/reports/ với target_type='recipe'
    Then: Report được tạo với status PENDING, target_type='recipe'
    """
    payload = {
        'target_type': 'recipe',
        'target_id': str(target_recipe.id),
        'reason': 'SPAM',
        'additional_info': 'Nội dung spam'
    }

    response = auth_client.post('/api/reports/', payload, format='json')

    assert response.status_code == 201, f"Expected 201, got {response.status_code}: {response.json()}"

    json_data = response.json()
    assert json_data.get('success') is True
    data = json_data.get('data', {})
    assert data['target_type'] == 'recipe'
    assert data['target_id'] == str(target_recipe.id)
    assert data['reason'] == 'SPAM'
    assert data['status'] == 'PENDING'

    # Verify in database
    report = Report.objects.get(id=data['id'])
    assert report.reporter == auth_client.handler._force_user
    assert report.status == ReportStatus.PENDING


# ==============================================================================
# R2: User gửi report review thành công
# ==============================================================================

@pytest.mark.django_db
def test_create_report_review_success(auth_client, target_review):
    """
    R2: User gửi report review thành công.
    Given: User đã login và target review tồn tại
    When: POST /api/reports/ với target_type='review'
    Then: Report được tạo với status PENDING, target_type='review'
    """
    payload = {
        'target_type': 'review',
        'target_id': str(target_review.id),
        'reason': 'HARASSMENT',
        'additional_info': 'Bình luận quấy rối'
    }

    response = auth_client.post('/api/reports/', payload, format='json')

    assert response.status_code == 201, f"Expected 201, got {response.status_code}: {response.json()}"

    json_data = response.json()
    assert json_data.get('success') is True
    data = json_data.get('data', {})
    assert data['target_type'] == 'review'
    assert data['target_id'] == str(target_review.id)
    assert data['reason'] == 'HARASSMENT'
    assert data['status'] == 'PENDING'


# ==============================================================================
# R3: User gửi report user thành công
# ==============================================================================

@pytest.mark.django_db
def test_create_report_user_success(auth_client, target_user):
    """
    R3: User gửi report user thành công.
    Given: User đã login và target user tồn tại (không phải chính mình)
    When: POST /api/reports/ với target_type='user'
    Then: Report được tạo với status PENDING, target_type='user'
    """
    payload = {
        'target_type': 'user',
        'target_id': str(target_user.id),
        'reason': 'WRONG_CONTENT',
        'additional_info': 'Thông tin không chính xác'
    }

    response = auth_client.post('/api/reports/', payload, format='json')

    assert response.status_code == 201, f"Expected 201, got {response.status_code}: {response.json()}"

    json_data = response.json()
    assert json_data.get('success') is True
    data = json_data.get('data', {})
    assert data['target_type'] == 'user'
    assert data['target_id'] == str(target_user.id)
    assert data['reason'] == 'WRONG_CONTENT'
    assert data['status'] == 'PENDING'


# ==============================================================================
# R4: User xem danh sách reports đã gửi
# ==============================================================================

@pytest.mark.django_db
def test_list_my_reports_success(auth_client, user, target_recipe, target_user):
    """
    R4: User xem danh sách reports đã gửi.
    Given: User đã login và đã gửi một số reports
    When: GET /api/reports/my-reports/
    Then: Hiển thị danh sách reports của user đó (target_type, reason, status, created_at)
    """
    # Tạo 2 reports cho user này
    Report.objects.create(
        reporter=user,
        target_type=TargetType.RECIPE,
        target_id=target_recipe.id,
        reason=ReportReason.SPAM,
        status=ReportStatus.PENDING
    )
    Report.objects.create(
        reporter=user,
        target_type=TargetType.USER,
        target_id=target_user.id,
        reason=ReportReason.WRONG_CONTENT,
        status=ReportStatus.REVIEWED
    )

    # Tạo 1 report cho user khác (không được hiển thị)
    other_user = User.objects.create_user(
        username='other2',
        email='other2@example.com',
        password='testpass123',
        full_name='Other User'
    )
    Report.objects.create(
        reporter=other_user,
        target_type=TargetType.USER,
        target_id=target_user.id,
        reason=ReportReason.HARASSMENT,
        status=ReportStatus.PENDING
    )

    response = auth_client.get('/api/reports/my-reports/')

    assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.json()}"

    json_data = response.json()
    assert json_data.get('success') is True
    results = get_results(response)

    # Chỉ có 2 reports của user hiện tại
    assert len(results) == 2

    # Verify các fields
    for report_data in results:
        assert 'target_type' in report_data
        assert 'reason' in report_data
        assert 'status' in report_data
        assert 'created_at' in report_data

    # Verify target_types
    target_types = {r['target_type'] for r in results}
    assert 'recipe' in target_types
    assert 'user' in target_types

    # Verify status
    statuses = {r['status'] for r in results}
    assert 'PENDING' in statuses
    assert 'REVIEWED' in statuses


# ==============================================================================
# R4: Filter theo status
# ==============================================================================

@pytest.mark.django_db
def test_list_my_reports_filter_by_status(auth_client, user, target_recipe, target_user):
    """
    R4 variant: Lọc reports theo status.
    Given: User có reports ở nhiều trạng thái khác nhau
    When: GET /api/reports/my-reports/?status=PENDING
    Then: Chỉ trả về reports có status PENDING
    """
    Report.objects.create(
        reporter=user,
        target_type=TargetType.RECIPE,
        target_id=target_recipe.id,
        reason=ReportReason.SPAM,
        status=ReportStatus.PENDING
    )
    Report.objects.create(
        reporter=user,
        target_type=TargetType.USER,
        target_id=target_user.id,
        reason=ReportReason.WRONG_CONTENT,
        status=ReportStatus.REVIEWED
    )

    response = auth_client.get('/api/reports/my-reports/?status=PENDING')

    assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.json()}"

    json_data = response.json()
    assert json_data.get('success') is True
    results = get_results(response)

    # Chỉ có 1 report PENDING
    assert len(results) == 1
    assert results[0]['status'] == 'PENDING'


# ==============================================================================
# R4: Filter theo reason
# ==============================================================================

@pytest.mark.django_db
def test_list_my_reports_filter_by_reason(auth_client, user, target_recipe, target_user):
    """
    R4 variant: Lọc reports theo reason.
    Given: User có reports với các reason khác nhau
    When: GET /api/reports/my-reports/?reason=SPAM
    Then: Chỉ trả về reports có reason SPAM
    """
    Report.objects.create(
        reporter=user,
        target_type=TargetType.RECIPE,
        target_id=target_recipe.id,
        reason=ReportReason.SPAM,
        status=ReportStatus.PENDING
    )
    Report.objects.create(
        reporter=user,
        target_type=TargetType.USER,
        target_id=target_user.id,
        reason=ReportReason.WRONG_CONTENT,
        status=ReportStatus.REVIEWED
    )

    response = auth_client.get('/api/reports/my-reports/?reason=SPAM')

    assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.json()}"

    json_data = response.json()
    assert json_data.get('success') is True
    results = get_results(response)

    # Chỉ có 1 report với reason SPAM
    assert len(results) == 1
    assert results[0]['reason'] == 'SPAM'


# ==============================================================================
# Unauthenticated access - phải trả về 401
# ==============================================================================

@pytest.mark.django_db
def test_create_report_unauthenticated(api_client, target_recipe):
    """
    Validation: Unauthenticated user không thể tạo report.
    """
    payload = {
        'target_type': 'recipe',
        'target_id': str(target_recipe.id),
        'reason': 'SPAM'
    }

    response = api_client.post('/api/reports/', payload, format='json')

    assert response.status_code == 401, f"Expected 401, got {response.status_code}"


@pytest.mark.django_db
def test_list_reports_unauthenticated(api_client):
    """
    Validation: Unauthenticated user không thể xem danh sách reports.
    """
    response = api_client.get('/api/reports/my-reports/')

    assert response.status_code == 401, f"Expected 401, got {response.status_code}"


# ==============================================================================
# ADMIN FIXTURES
# ==============================================================================

@pytest.fixture
def admin_user(db):
    """Tạo admin user (superuser) để test admin endpoints."""
    return User.objects.create_user(
        username='admin',
        email='admin@example.com',
        password='adminpass123',
        full_name='Admin User',
        is_staff=True,
        is_superuser=True
    )


@pytest.fixture
def staff_user(db):
    """Tạo staff user (is_staff=True nhưng không phải superuser) để test permission."""
    return User.objects.create_user(
        username='staff',
        email='staff@example.com',
        password='staffpass123',
        full_name='Staff User',
        is_staff=True,
        is_superuser=False
    )


@pytest.fixture
def admin_client(api_client, admin_user):
    """APIClient đã authenticate với admin user."""
    api_client.force_authenticate(user=admin_user)
    return api_client


@pytest.fixture
def staff_client(api_client, staff_user):
    """APIClient đã authenticate với staff user (không phải superuser)."""
    api_client.force_authenticate(user=staff_user)
    return api_client


@pytest.fixture
def pending_report(db, user, target_recipe):
    """Tạo một report PENDING để test admin actions."""
    return Report.objects.create(
        reporter=user,
        target_type=TargetType.RECIPE,
        target_id=target_recipe.id,
        reason=ReportReason.SPAM,
        status=ReportStatus.PENDING
    )


@pytest.fixture
def reviewed_report(db, user, target_user):
    """Tạo một report đã được reviewed."""
    return Report.objects.create(
        reporter=user,
        target_type=TargetType.USER,
        target_id=target_user.id,
        reason=ReportReason.HARASSMENT,
        status=ReportStatus.REVIEWED
    )


# ==============================================================================
# R5: Admin xem danh sách reports với filter
# ==============================================================================

@pytest.mark.django_db
def test_admin_list_reports_success(admin_client, pending_report, reviewed_report):
    """
    R5: Admin xem danh sách tất cả reports.
    Given: Admin đã login và có reports trong hệ thống
    When: GET /api/admin/reports/
    Then: Trả về danh sách tất cả reports
    """
    response = admin_client.get('/api/admin/reports/')

    assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.json()}"

    json_data = response.json()
    assert json_data.get('success') is True
    results = get_results(response)

    # Có 2 reports (pending_report và reviewed_report)
    assert len(results) == 2


@pytest.mark.django_db
def test_admin_list_reports_filter_by_status(admin_client, pending_report, reviewed_report):
    """
    R5: Admin lọc reports theo status.
    Given: Admin đã login và có reports ở nhiều status
    When: GET /api/admin/reports/?status=PENDING
    Then: Chỉ trả về reports có status PENDING
    """
    response = admin_client.get('/api/admin/reports/?status=PENDING')

    assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.json()}"

    json_data = response.json()
    assert json_data.get('success') is True
    results = get_results(response)

    # Chỉ có 1 report PENDING
    assert len(results) == 1
    assert results[0]['status'] == 'PENDING'


@pytest.mark.django_db
def test_admin_list_reports_filter_reviewed(admin_client, pending_report, reviewed_report):
    """
    R5: Admin lọc reports đã reviewed.
    Given: Admin đã login và có reports đã reviewed
    When: GET /api/admin/reports/?status=REVIEWED
    Then: Chỉ trả về reports có status REVIEWED
    """
    response = admin_client.get('/api/admin/reports/?status=REVIEWED')

    assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.json()}"

    json_data = response.json()
    assert json_data.get('success') is True
    results = get_results(response)

    # Chỉ có 1 report REVIEWED
    assert len(results) == 1
    assert results[0]['status'] == 'REVIEWED'


# ==============================================================================
# R6: Admin xem chi tiết report
# ==============================================================================

@pytest.mark.django_db
def test_admin_retrieve_report_success(admin_client, pending_report):
    """
    R6: Admin xem chi tiết một report.
    Given: Admin đã login và report tồn tại
    When: GET /api/admin/reports/{id}/
    Then: Trả về đầy đủ thông tin report
    """
    response = admin_client.get(f'/api/admin/reports/{pending_report.id}/')

    assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.json()}"

    json_data = response.json()
    assert json_data.get('success') is True
    data = json_data.get('data', {})

    assert data['id'] == str(pending_report.id)
    assert data['target_type'] == 'recipe'
    assert data['reason'] == 'SPAM'
    assert data['status'] == 'PENDING'


@pytest.mark.django_db
def test_admin_retrieve_report_not_found(admin_client):
    """
    R6: Admin xem chi tiết report không tồn tại.
    Given: Report không tồn tại
    When: GET /api/admin/reports/{invalid_id}/
    Then: Trả về 404
    """
    response = admin_client.get(f'/api/admin/reports/{uuid4()}/')

    assert response.status_code == 404, f"Expected 404, got {response.status_code}"


# ==============================================================================
# R7: Admin dismiss report
# ==============================================================================

@pytest.mark.django_db
def test_admin_dismiss_report_success(admin_client, pending_report):
    """
    R7: Admin dismiss report.
    Given: Admin đã login và report có status PENDING
    When: POST /api/admin/reports/{id}/review/ với action='dismiss'
    Then: Report status thành DISMISSED, reviewed_by=admin, reviewed_at được set
    """
    payload = {
        'action': 'dismiss',
        'note': 'Không có vi phạm'
    }

    response = admin_client.post(f'/api/admin/reports/{pending_report.id}/review/', payload, format='json')

    assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.json()}"

    json_data = response.json()
    assert json_data.get('success') is True
    data = json_data.get('data', {})

    assert data['status'] == 'DISMISSED'
    assert data['reviewed_by'] is not None

    # Verify database
    pending_report.refresh_from_db()
    assert pending_report.status == ReportStatus.DISMISSED
    assert pending_report.reviewed_by is not None
    assert pending_report.reviewed_at is not None
    assert pending_report.review_note == 'Không có vi phạm'


# ==============================================================================
# R8: Admin remove recipe (soft delete)
# ==============================================================================

@pytest.mark.django_db
def test_admin_remove_content_recipe(admin_client, pending_report, target_recipe):
    """
    R8: Admin remove recipe (soft delete).
    Given: Admin đã login và report recipe có status PENDING
    When: POST /api/admin/reports/{id}/review/ với action='remove_content'
    Then: Report status thành REVIEWED, recipe.is_deleted=True, recipe.deleted_at được set
    """
    # Verify recipe chưa bị xóa
    assert target_recipe.is_deleted is False
    assert target_recipe.deleted_at is None

    payload = {
        'action': 'remove_content',
        'note': 'Nội dung vi phạm quy định'
    }

    response = admin_client.post(f'/api/admin/reports/{pending_report.id}/review/', payload, format='json')

    assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.json()}"

    json_data = response.json()
    assert json_data.get('success') is True

    # Verify database
    pending_report.refresh_from_db()
    target_recipe.refresh_from_db()

    assert pending_report.status == ReportStatus.REVIEWED
    assert pending_report.reviewed_by is not None
    assert target_recipe.is_deleted is True
    assert target_recipe.deleted_at is not None


# ==============================================================================
# R9: Admin remove review (hard delete)
# ==============================================================================

@pytest.mark.django_db
def test_admin_remove_content_review(admin_client, target_review, another_user, admin_user):
    """
    R9: Admin remove review (hard delete).
    Given: Admin đã login và có report review
    When: POST /api/admin/reports/{id}/review/ với action='remove_content'
    Then: Report status thành REVIEWED, review bị xóa khỏi database
    """
    from apps.social.models import Review

    # Tạo report cho review
    review_report = Report.objects.create(
        reporter=another_user,
        target_type=TargetType.REVIEW,
        target_id=target_review.id,
        reason=ReportReason.SPAM,
        status=ReportStatus.PENDING
    )

    review_id = target_review.id

    payload = {
        'action': 'remove_content',
        'note': 'Review vi phạm'
    }

    response = admin_client.post(f'/api/admin/reports/{review_report.id}/review/', payload, format='json')

    assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.json()}"

    # Verify review đã bị xóa
    assert not Review.objects.filter(id=review_id).exists()

    # Verify report đã được reviewed
    review_report.refresh_from_db()
    assert review_report.status == ReportStatus.REVIEWED


# ==============================================================================
# R10: Admin deactivate user
# ==============================================================================

@pytest.mark.django_db
def test_admin_remove_content_user(admin_client, target_user):
    """
    R10: Admin deactivate user.
    Given: Admin đã login và có report user
    When: POST /api/admin/reports/{id}/review/ với action='remove_content'
    Then: Report status thành REVIEWED, user.is_active=False
    """
    # Tạo report cho user
    user_report = Report.objects.create(
        reporter=User.objects.create_user(
            username='reporter2',
            email='reporter2@example.com',
            password='testpass123'
        ),
        target_type=TargetType.USER,
        target_id=target_user.id,
        reason=ReportReason.HARASSMENT,
        status=ReportStatus.PENDING
    )

    # Verify user chưa bị deactivate
    assert target_user.is_active is True

    payload = {
        'action': 'remove_content',
        'note': 'User vi phạm quy định'
    }

    response = admin_client.post(f'/api/admin/reports/{user_report.id}/review/', payload, format='json')

    assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.json()}"

    # Verify user đã bị deactivate
    target_user.refresh_from_db()
    assert target_user.is_active is False

    # Verify report đã được reviewed
    user_report.refresh_from_db()
    assert user_report.status == ReportStatus.REVIEWED


# ==============================================================================
# R11: Admin warn user
# ==============================================================================

@pytest.mark.django_db
def test_admin_warn_user_success(admin_client, pending_report, target_recipe):
    """
    R11: Admin warn user - tạo WARNING notification cho content owner.
    Given: Admin đã login và report có status PENDING
    When: POST /api/admin/reports/{id}/review/ với action='warn_user'
    Then: Report status thành REVIEWED, content owner nhận WARNING notification
    """
    # Verify chưa có notification nào cho content owner
    initial_notification_count = Notification.objects.filter(user=target_recipe.user).count()

    payload = {
        'action': 'warn_user',
        'note': 'Cảnh báo lần 1'
    }

    response = admin_client.post(f'/api/admin/reports/{pending_report.id}/review/', payload, format='json')

    assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.json()}"

    # Verify notification được tạo
    new_notification_count = Notification.objects.filter(user=target_recipe.user).count()
    assert new_notification_count == initial_notification_count + 1

    # Verify notification content
    warning = Notification.objects.filter(user=target_recipe.user).latest('created_at')
    assert warning.type == 'WARNING'
    assert 'Bạn đã nhận cảnh báo' in warning.title

    # Verify report đã được reviewed
    pending_report.refresh_from_db()
    assert pending_report.status == ReportStatus.REVIEWED


# ==============================================================================
# R12: Reporter nhận notification khi report được xử lý
# ==============================================================================

@pytest.mark.django_db
def test_reporter_notification_on_dismiss(admin_client, pending_report, user):
    """
    R12: Reporter nhận notification khi report bị dismiss.
    Given: Admin đã dismiss report
    When: POST /api/admin/reports/{id}/review/ với action='dismiss'
    Then: Reporter nhận notification REPORT_PROCESSED
    """
    initial_count = Notification.objects.filter(user=user).count()

    payload = {'action': 'dismiss', 'note': 'Dismissed'}

    response = admin_client.post(f'/api/admin/reports/{pending_report.id}/review/', payload, format='json')

    assert response.status_code == 200

    # Verify notification được tạo cho reporter
    new_count = Notification.objects.filter(user=user).count()
    assert new_count == initial_count + 1

    notification = Notification.objects.filter(user=user).latest('created_at')
    assert notification.type == 'REPORT_PROCESSED'
    assert 'đã bỏ qua' in notification.message


@pytest.mark.django_db
def test_reporter_notification_on_remove_content(admin_client, pending_report, user):
    """
    R12: Reporter nhận notification khi content bị remove.
    Given: Admin đã remove content
    When: POST /api/admin/reports/{id}/review/ với action='remove_content'
    Then: Reporter nhận notification REPORT_PROCESSED
    """
    initial_count = Notification.objects.filter(user=user).count()

    payload = {'action': 'remove_content', 'note': 'Content removed'}

    response = admin_client.post(f'/api/admin/reports/{pending_report.id}/review/', payload, format='json')

    assert response.status_code == 200

    # Verify notification được tạo cho reporter
    new_count = Notification.objects.filter(user=user).count()
    assert new_count == initial_count + 1

    notification = Notification.objects.filter(user=user).latest('created_at')
    assert notification.type == 'REPORT_PROCESSED'
    assert 'đã xóa nội dung' in notification.message


@pytest.mark.django_db
def test_reporter_notification_on_warn_user(admin_client, pending_report, user):
    """
    R12: Reporter nhận notification khi admin warn user.
    Given: Admin đã warn user
    When: POST /api/admin/reports/{id}/review/ với action='warn_user'
    Then: Reporter nhận notification REPORT_PROCESSED
    """
    initial_count = Notification.objects.filter(user=user).count()

    payload = {'action': 'warn_user', 'note': 'User warned'}

    response = admin_client.post(f'/api/admin/reports/{pending_report.id}/review/', payload, format='json')

    assert response.status_code == 200

    # Verify notification được tạo cho reporter
    new_count = Notification.objects.filter(user=user).count()
    assert new_count == initial_count + 1

    notification = Notification.objects.filter(user=user).latest('created_at')
    assert notification.type == 'REPORT_PROCESSED'
    assert 'đã gửi cảnh báo' in notification.message


# ==============================================================================
# Permission Tests: Non-superuser không thể review
# ==============================================================================

@pytest.mark.django_db
def test_admin_review_requires_superuser(staff_client, pending_report):
    """
    Security: Review action yêu cầu superuser, không chỉ is_staff.
    Given: Staff user (is_staff=True, is_superuser=False) đã login
    When: POST /api/admin/reports/{id}/review/
    Then: Trả về 403 Forbidden
    """
    payload = {'action': 'dismiss', 'note': 'Test'}

    response = staff_client.post(f'/api/admin/reports/{pending_report.id}/review/', payload, format='json')

    assert response.status_code == 403, f"Expected 403, got {response.status_code}: {response.json()}"

    # Verify report không bị thay đổi
    pending_report.refresh_from_db()
    assert pending_report.status == ReportStatus.PENDING


@pytest.mark.django_db
def test_admin_list_requires_admin(staff_client):
    """
    Security: Admin list yêu cầu is_staff.
    Given: Staff user (is_staff=True) đã login
    When: GET /api/admin/reports/
    Then: Trả về 200 (staff có quyền xem danh sách, chỉ review cần superuser)
    """
    response = staff_client.get('/api/admin/reports/')

    assert response.status_code == 200, f"Expected 200, got {response.status_code}"


# ==============================================================================
# Invalid Action Tests
# ==============================================================================

@pytest.mark.django_db
def test_admin_review_invalid_action(admin_client, pending_report):
    """
    Error handling: Invalid action type trả về 400.
    Given: Admin đã login
    When: POST /api/admin/reports/{id}/review/ với action='invalid'
    Then: Trả về 400 Bad Request
    """
    payload = {'action': 'invalid_action'}

    response = admin_client.post(f'/api/admin/reports/{pending_report.id}/review/', payload, format='json')

    assert response.status_code == 400, f"Expected 400, got {response.status_code}: {response.json()}"

    json_data = response.json()
    assert json_data.get('success') is False
    assert 'Han dong khong hop le' in json_data.get('message', '')