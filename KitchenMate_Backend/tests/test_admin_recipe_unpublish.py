import uuid

import pytest
from django.contrib.auth import get_user_model

from apps.recipes.models import Recipe
from apps.reports.models import Notification, NotificationType


User = get_user_model()


@pytest.mark.django_db
def test_superuser_unpublish_recipe_saves_reason_and_notifies_owner(api_client):
    owner = User.objects.create_user(
        username=f'owner_{uuid.uuid4().hex[:8]}@example.com',
        email=f'owner_{uuid.uuid4().hex[:8]}@example.com',
        full_name='Recipe Owner',
        password='testpass123',
    )
    superuser = User.objects.create_user(
        username=f'admin_{uuid.uuid4().hex[:8]}@example.com',
        email=f'admin_{uuid.uuid4().hex[:8]}@example.com',
        full_name='Admin User',
        password='testpass123',
        is_staff=True,
        is_superuser=True,
    )
    recipe = Recipe.objects.create(
        user=owner,
        title='Bún bò test dynamic',
        description='Công thức dùng dữ liệu động để kiểm tra thông báo.',
        difficulty='MEDIUM',
        prep_time=45,
        visibility='PUBLIC',
        ai_moderation_status='APPROVED',
    )
    reason = 'Thiếu nguồn ảnh và mô tả có nội dung cần chỉnh sửa.'

    api_client.force_authenticate(user=superuser)
    response = api_client.post(
        f'/api/admin/recipes/{recipe.id}/unpublish/',
        {'reason': reason},
        format='json',
    )

    assert response.status_code == 200
    recipe.refresh_from_db()
    assert recipe.visibility == 'PRIVATE'
    assert recipe.ai_moderation_status == 'REJECTED'
    assert recipe.rejection_reason == reason

    notification = Notification.objects.get(user=owner)
    assert notification.type == NotificationType.WARNING
    assert notification.title == 'Công thức đã được chuyển về riêng tư'
    assert recipe.title in notification.message
    assert reason in notification.message
    assert notification.data == {
        'recipe_id': str(recipe.id),
        'reason': reason,
        'action': 'recipe_unpublish',
    }


@pytest.mark.django_db
def test_admin_reject_pending_recipe_saves_reason_and_notifies_owner(api_client):
    owner = User.objects.create_user(
        username=f'owner_{uuid.uuid4().hex[:8]}@example.com',
        email=f'owner_{uuid.uuid4().hex[:8]}@example.com',
        full_name='Recipe Owner',
        password='testpass123',
    )
    admin = User.objects.create_user(
        username=f'admin_{uuid.uuid4().hex[:8]}@example.com',
        email=f'admin_{uuid.uuid4().hex[:8]}@example.com',
        full_name='Admin User',
        password='testpass123',
        is_staff=True,
    )
    recipe = Recipe.objects.create(
        user=owner,
        title='Canh chua kiểm duyệt',
        description='Công thức đang chờ quản trị viên duyệt.',
        difficulty='EASY',
        prep_time=25,
        visibility='PENDING',
        ai_moderation_status='PENDING',
    )
    reason = 'Cần bổ sung định lượng nguyên liệu chính.'

    api_client.force_authenticate(user=admin)
    response = api_client.post(
        f'/api/admin/recipes/{recipe.id}/reject/',
        {'reason': reason},
        format='json',
    )

    assert response.status_code == 200
    recipe.refresh_from_db()
    assert recipe.visibility == 'PRIVATE'
    assert recipe.ai_moderation_status == 'REJECTED'
    assert recipe.rejection_reason == reason

    notification = Notification.objects.get(user=owner)
    assert notification.type == NotificationType.WARNING
    assert notification.title == 'Công thức không được duyệt'
    assert recipe.title in notification.message
    assert reason in notification.message
    assert notification.data == {
        'recipe_id': str(recipe.id),
        'reason': reason,
        'action': 'recipe_reject',
    }
