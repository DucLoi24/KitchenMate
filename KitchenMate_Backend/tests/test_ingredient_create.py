"""
Test suite cho IngredientViewSet.create() với AI moderation.
Bao gồm: unit tests (example-based) và property tests (Hypothesis).
"""
import pytest
import uuid as uuid_lib
from unittest.mock import patch
from hypothesis import given, settings as h_settings, HealthCheck
from hypothesis import strategies as st
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model

from apps.ingredients.models import Ingredient
from core.services.ai_moderator import ModerationTimeoutError, ModerationServiceError

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
        username='inguser',
        email='inguser@example.com',
        password='testpass123',
        full_name='Ingredient User'
    )


@pytest.fixture
def auth_client(api_client, user):
    api_client.force_authenticate(user=user)
    return api_client


# ==============================================================================
# UNIT TESTS — Example-based
# ==============================================================================

@pytest.mark.django_db
def test_create_ingredient_invalid_data(auth_client):
    """Dữ liệu không hợp lệ (thiếu name) → 400, không gọi AI."""
    with patch('apps.ingredients.views.moderate_text') as mock_moderate:
        response = auth_client.post('/api/ingredients/', {'category': 'OTHER'})
    assert response.status_code == 400
    mock_moderate.assert_not_called()


@pytest.mark.django_db
def test_create_ingredient_unauthenticated(api_client):
    """User chưa đăng nhập → 401."""
    response = api_client.post('/api/ingredients/', {'name': 'Cà chua', 'category': 'VEG'})
    assert response.status_code == 401


# ==============================================================================
# PROPERTY TESTS — Hypothesis
# ==============================================================================

@pytest.mark.django_db(transaction=True)
@given(moderation_result=st.sampled_from(['YES', 'NO', 'SUSPECT']))
@h_settings(max_examples=100, suppress_health_check=[HealthCheck.function_scoped_fixture], deadline=None)
def test_ingredient_create_status(moderation_result, db):
    """
    # Feature: phase-5-ai-moderation, Property 8: Ingredient create status đúng theo result
    Với bất kỳ moderation result nào, status và status code phải đúng theo bảng mapping.
    Validates: Requirements 5.2, 5.3, 5.4
    """
    test_user, _ = User.objects.get_or_create(
        email='prop8@example.com',
        defaults={'username': 'prop8user', 'full_name': 'Prop8 User'}
    )
    test_user.set_password('testpass123')
    test_user.save()

    client = APIClient()
    client.force_authenticate(user=test_user)

    # Dùng unique name để tránh unique constraint conflict
    unique_name = f'Nguyên liệu {uuid_lib.uuid4().hex[:8]}'

    expected_status_code = {'YES': 201, 'NO': 400, 'SUSPECT': 201}
    expected_ing_status = {'YES': 'PENDING', 'NO': None, 'SUSPECT': 'PENDING'}

    with patch('apps.ingredients.views.moderate_text', return_value=moderation_result):
        response = client.post('/api/ingredients/', {'name': unique_name, 'category': 'OTHER'})

    assert response.status_code == expected_status_code[moderation_result]

    if moderation_result != 'NO':
        ing = Ingredient.objects.get(name=unique_name)
        assert ing.status == expected_ing_status[moderation_result]
        # Cleanup
        ing.delete()


@pytest.mark.django_db(transaction=True)
@given(exc_class=st.sampled_from([ModerationTimeoutError, ModerationServiceError]))
@h_settings(max_examples=100, suppress_health_check=[HealthCheck.function_scoped_fixture], deadline=None)
def test_ingredient_create_ai_error(exc_class, db):
    """
    # Feature: phase-5-ai-moderation, Property 9: Ingredient create AI lỗi vẫn lưu PENDING
    Khi AI service lỗi, ingredient vẫn được lưu với status=PENDING và response là 201.
    Validates: Requirements 5.5
    """
    test_user, _ = User.objects.get_or_create(
        email='prop9@example.com',
        defaults={'username': 'prop9user', 'full_name': 'Prop9 User'}
    )
    test_user.set_password('testpass123')
    test_user.save()

    client = APIClient()
    client.force_authenticate(user=test_user)

    unique_name = f'Nguyên liệu lỗi {uuid_lib.uuid4().hex[:8]}'

    with patch('apps.ingredients.views.moderate_text', side_effect=exc_class('error')):
        response = client.post('/api/ingredients/', {'name': unique_name, 'category': 'OTHER'})

    assert response.status_code == 201
    ing = Ingredient.objects.get(name=unique_name)
    assert ing.status == 'PENDING'

    # Cleanup
    ing.delete()
