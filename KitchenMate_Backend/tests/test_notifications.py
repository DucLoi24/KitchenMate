"""
Integration tests cho notification API.
Test các API endpoints: list notifications và mark-as-read.
"""
import pytest
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model

from apps.reports.models import Notification, NotificationType

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
        username='testuser',
        email='test@example.com',
        password='testpass123',
        full_name='Test User'
    )


@pytest.fixture
def auth_client(api_client, user):
    api_client.force_authenticate(user=user)
    return api_client


# ==============================================================================
# NOTIFICATION LIST TESTS
# ==============================================================================

@pytest.mark.django_db
def test_list_notifications_success(auth_client, user):
    """
    N1: User xem danh sách notifications của mình.
    Given: User đã login và có notifications
    When: GET /api/notifications/
    Then: Trả về danh sách notifications của user đó
    """
    # Tạo notifications cho user
    Notification.objects.create(
        user=user,
        type=NotificationType.REPORT_PROCESSED,
        title='Báo cáo đã được xử lý',
        message='Báo cáo của bạn đã được xử lý',
    )
    Notification.objects.create(
        user=user,
        type=NotificationType.WARNING,
        title='Bạn đã nhận cảnh báo',
        message='Nội dung bạn đăng đã bị báo cáo',
    )
    # Notification của user khác (không được hiển thị)
    other_user = User.objects.create_user(
        username='other',
        email='other@example.com',
        password='testpass123'
    )
    Notification.objects.create(
        user=other_user,
        type=NotificationType.WARNING,
        title='Other warning',
        message='Other message',
    )

    response = auth_client.get('/api/notifications/')

    assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.json()}"

    json_data = response.json()
    assert json_data.get('success') is True
    results = json_data.get('data', {}).get('results', json_data.get('data', []))

    # Chỉ có 2 notifications của user hiện tại
    assert len(results) == 2

    # Verify fields
    for notif in results:
        assert 'id' in notif
        assert 'type' in notif
        assert 'title' in notif
        assert 'message' in notif
        assert 'is_read' in notif
        assert 'created_at' in notif


@pytest.mark.django_db
def test_list_notifications_filter_unread(auth_client, user):
    """
    N1 variant: Lọc notifications chưa đọc.
    Given: User có read và unread notifications
    When: GET /api/notifications/?is_read=false
    Then: Chỉ trả về notifications chưa đọc
    """
    Notification.objects.create(
        user=user,
        type=NotificationType.REPORT_PROCESSED,
        title='Read notification',
        message='Message',
        is_read=True
    )
    Notification.objects.create(
        user=user,
        type=NotificationType.WARNING,
        title='Unread notification',
        message='Message',
        is_read=False
    )

    response = auth_client.get('/api/notifications/?is_read=false')

    assert response.status_code == 200
    json_data = response.json()
    results = json_data.get('data', {}).get('results', json_data.get('data', []))

    assert len(results) == 1
    assert results[0]['is_read'] is False


@pytest.mark.django_db
def test_list_notifications_unauthenticated(api_client):
    """
    Security: Unauthenticated user không thể xem notifications.
    """
    response = api_client.get('/api/notifications/')

    assert response.status_code == 401, f"Expected 401, got {response.status_code}"


# ==============================================================================
# MARK AS READ TESTS
# ==============================================================================

@pytest.mark.django_db
def test_mark_notification_as_read_success(auth_client, user):
    """
    N2: User đánh dấu notification đã đọc.
    Given: User đã login và có notification chưa đọc
    When: PATCH /api/notifications/{id}/read/
    Then: Notification is_read=True
    """
    notification = Notification.objects.create(
        user=user,
        type=NotificationType.REPORT_PROCESSED,
        title='Test notification',
        message='Test message',
        is_read=False
    )

    response = auth_client.patch(f'/api/notifications/{notification.id}/read/')

    assert response.status_code == 200, f"Expected 200, got {response.status.json()}"

    json_data = response.json()
    assert json_data.get('success') is True

    # Verify database
    notification.refresh_from_db()
    assert notification.is_read is True


@pytest.mark.django_db
def test_mark_notification_as_read_not_found(auth_client, user):
    """
    N2: Mark notification không tồn tại.
    Given: Notification ID không tồn tại
    When: PATCH /api/notifications/{invalid_id}/read/
    Then: Trả về 404
    """
    from uuid import uuid4

    response = auth_client.patch(f'/api/notifications/{uuid4()}/read/')

    assert response.status_code == 404, f"Expected 404, got {response.status_code}"


@pytest.mark.django_db
def test_mark_notification_as_read_other_user(auth_client, user):
    """
    Security: User không thể đánh dấu notification của user khác.
    Given: Notification thuộc user khác
    When: PATCH /api/notifications/{id}/read/
    Then: Trả về 404 (không trả về 403 để tránh leak thông tin)
    """
    other_user = User.objects.create_user(
        username='other2',
        email='other2@example.com',
        password='testpass123'
    )
    notification = Notification.objects.create(
        user=other_user,
        type=NotificationType.WARNING,
        title='Other notification',
        message='Other message',
    )

    response = auth_client.patch(f'/api/notifications/{notification.id}/read/')

    assert response.status_code == 404, f"Expected 404, got {response.status_code}"


@pytest.mark.django_db
def test_mark_notification_as_read_unauthenticated(api_client):
    """
    Security: Unauthenticated user không thể mark read.
    """
    from uuid import uuid4

    response = api_client.patch(f'/api/notifications/{uuid4()}/read/')

    assert response.status_code == 401, f"Expected 401, got {response.status_code}"


# ==============================================================================
# MARK ALL AS READ TESTS
# ==============================================================================

@pytest.mark.django_db
def test_mark_all_notifications_as_read_success(auth_client, user):
    """
    N3: User đánh dấu tất cả notifications đã đọc.
    Given: User đã login và có nhiều notifications chưa đọc
    When: POST /api/notifications/mark-all-read/
    Then: Tất cả notifications của user is_read=True
    """
    Notification.objects.create(
        user=user,
        type=NotificationType.REPORT_PROCESSED,
        title='Notification 1',
        message='Message 1',
        is_read=False
    )
    Notification.objects.create(
        user=user,
        type=NotificationType.WARNING,
        title='Notification 2',
        message='Message 2',
        is_read=False
    )
    Notification.objects.create(
        user=user,
        type=NotificationType.WARNING,
        title='Notification 3',
        message='Message 3',
        is_read=True  # Already read
    )

    response = auth_client.post('/api/notifications/mark-all-read/')

    assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.json()}"

    json_data = response.json()
    assert json_data.get('success') is True

    # Verify all unread notifications are now read
    unread_count = Notification.objects.filter(user=user, is_read=False).count()
    assert unread_count == 0


@pytest.mark.django_db
def test_mark_all_notifications_as_read_unauthenticated(api_client):
    """
    Security: Unauthenticated user không thể mark all read.
    """
    response = api_client.post('/api/notifications/mark-all-read/')

    assert response.status_code == 401, f"Expected 401, got {response.status_code}"


# ==============================================================================
# UNREAD COUNT TESTS
# ==============================================================================

@pytest.mark.django_db
def test_get_unread_count_success(auth_client, user):
    """
    N4: User lấy số lượng notifications chưa đọc.
    Given: User đã login và có notifications
    When: GET /api/notifications/unread-count/
    Then: Trả về số lượng unread notifications
    """
    Notification.objects.create(
        user=user,
        type=NotificationType.REPORT_PROCESSED,
        title='Unread 1',
        message='Message',
        is_read=False
    )
    Notification.objects.create(
        user=user,
        type=NotificationType.REPORT_PROCESSED,
        title='Unread 2',
        message='Message',
        is_read=False
    )
    Notification.objects.create(
        user=user,
        type=NotificationType.WARNING,
        title='Read 1',
        message='Message',
        is_read=True
    )

    response = auth_client.get('/api/notifications/unread-count/')

    assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.json()}"

    json_data = response.json()
    assert json_data.get('success') is True
    assert json_data.get('data', {}).get('unread_count') == 2


@pytest.mark.django_db
def test_get_unread_count_unauthenticated(api_client):
    """
    Security: Unauthenticated user không thể lấy unread count.
    """
    response = api_client.get('/api/notifications/unread-count/')

    assert response.status_code == 401, f"Expected 401, got {response.status_code}"
