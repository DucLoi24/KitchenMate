"""
Test suite cho RecipeViewSet.publish() với AI moderation.
Bao gồm: unit tests (example-based) và property tests (Hypothesis).
"""
import pytest
from unittest.mock import patch
from hypothesis import given, settings as h_settings, HealthCheck
from hypothesis import strategies as st
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model

from apps.recipes.models import Recipe, RecipeStep
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
        username='testuser',
        email='test@example.com',
        password='testpass123',
        full_name='Test User'
    )


@pytest.fixture
def other_user(db):
    return User.objects.create_user(
        username='otheruser',
        email='other@example.com',
        password='testpass123',
        full_name='Other User'
    )


@pytest.fixture
def private_recipe(db, user):
    """Tạo recipe PRIVATE với 2 steps."""
    recipe = Recipe.objects.create(
        user=user,
        title='Phở bò',
        description='Món phở truyền thống',
        visibility='PRIVATE'
    )
    RecipeStep.objects.create(recipe=recipe, step_number=1, instruction='Nấu nước dùng')
    RecipeStep.objects.create(recipe=recipe, step_number=2, instruction='Trụng bánh phở')
    return recipe


@pytest.fixture
def auth_client(api_client, user):
    """APIClient đã authenticate."""
    api_client.force_authenticate(user=user)
    return api_client


# ==============================================================================
# UNIT TESTS — Example-based
# ==============================================================================

@pytest.mark.django_db
def test_publish_recipe_not_found(auth_client):
    """Recipe không tồn tại → 404."""
    import uuid
    fake_id = uuid.uuid4()
    response = auth_client.post(f'/api/recipes/{fake_id}/publish/')
    assert response.status_code == 404


@pytest.mark.django_db
def test_publish_recipe_not_owner(api_client, other_user, private_recipe):
    """User không phải owner → 403."""
    api_client.force_authenticate(user=other_user)
    response = api_client.post(f'/api/recipes/{private_recipe.id}/publish/')
    assert response.status_code == 403


@pytest.mark.django_db
def test_publish_recipe_not_private(auth_client, user, db):
    """Recipe không phải PRIVATE → 400 (không gọi AI)."""
    recipe = Recipe.objects.create(
        user=user,
        title='Bún bò',
        description='Bún bò Huế',
        visibility='PENDING'
    )
    with patch('apps.recipes.views.moderate_text') as mock_moderate:
        response = auth_client.post(f'/api/recipes/{recipe.id}/publish/')
    assert response.status_code == 400
    mock_moderate.assert_not_called()


# ==============================================================================
# PROPERTY TESTS — Hypothesis
# ==============================================================================

@pytest.mark.django_db(transaction=True)
@given(moderation_result=st.sampled_from(['YES', 'NO', 'SUSPECT']))
@h_settings(max_examples=100, suppress_health_check=[HealthCheck.function_scoped_fixture], deadline=None)
def test_recipe_publish_visibility(moderation_result, db):
    """
    # Feature: phase-5-ai-moderation, Property 5: Recipe publish visibility đúng theo result
    Với bất kỳ moderation result nào, visibility và status code phải đúng theo bảng mapping.
    Validates: Requirements 4.2, 4.3, 4.4
    """
    test_user, _ = User.objects.get_or_create(
        email='prop5@example.com',
        defaults={'username': 'prop5user', 'full_name': 'Prop5 User'}
    )
    test_user.set_password('testpass123')
    test_user.save()

    recipe = Recipe.objects.create(
        user=test_user,
        title='Test Recipe',
        description='Test description',
        visibility='PRIVATE'
    )
    client = APIClient()
    client.force_authenticate(user=test_user)

    expected_visibility = {'YES': 'PUBLIC', 'NO': 'PRIVATE', 'SUSPECT': 'PENDING'}
    expected_status = {'YES': 200, 'NO': 400, 'SUSPECT': 200}

    with patch('apps.recipes.views.moderate_text', return_value=moderation_result):
        response = client.post(f'/api/recipes/{recipe.id}/publish/')

    recipe.refresh_from_db()
    assert response.status_code == expected_status[moderation_result]
    assert recipe.visibility == expected_visibility[moderation_result]

    # Cleanup để tránh conflict giữa các iterations
    recipe.delete()


@pytest.mark.django_db(transaction=True)
@given(instructions=st.lists(
    st.text(min_size=1, max_size=50, alphabet=st.characters(blacklist_categories=('Cs',), blacklist_characters='\x00')).filter(lambda t: t.strip() and t == t.strip()),
    min_size=0, max_size=5
))
@h_settings(max_examples=50, suppress_health_check=[HealthCheck.function_scoped_fixture], deadline=None)
def test_recipe_text_format(instructions, db):
    """
    # Feature: phase-5-ai-moderation, Property 6: Recipe text ghép đúng format
    Text truyền vào moderate_text phải chứa title, description, và tất cả instructions.
    Validates: Requirements 4.1, 4.6
    """
    test_user, _ = User.objects.get_or_create(
        email='prop6@example.com',
        defaults={'username': 'prop6user', 'full_name': 'Prop6 User'}
    )
    test_user.set_password('testpass123')
    test_user.save()

    recipe = Recipe.objects.create(
        user=test_user,
        title='Cơm tấm',
        description='Cơm tấm sườn bì chả',
        visibility='PRIVATE'
    )
    for i, instruction in enumerate(instructions, start=1):
        RecipeStep.objects.create(recipe=recipe, step_number=i, instruction=instruction)

    client = APIClient()
    client.force_authenticate(user=test_user)
    captured_texts = []

    def capture_text(text):
        captured_texts.append(text)
        return 'YES'

    with patch('apps.recipes.views.moderate_text', side_effect=capture_text):
        client.post(f'/api/recipes/{recipe.id}/publish/')

    assert len(captured_texts) == 1
    text = captured_texts[0]
    assert recipe.title in text
    assert recipe.description in text
    for instruction in instructions:
        assert instruction in text

    # Cleanup
    recipe.delete()


@pytest.mark.django_db(transaction=True)
@given(exc_class=st.sampled_from([ModerationTimeoutError, ModerationServiceError]))
@h_settings(max_examples=100, suppress_health_check=[HealthCheck.function_scoped_fixture], deadline=None)
def test_recipe_publish_ai_error(exc_class, db):
    """
    # Feature: phase-5-ai-moderation, Property 7: AI service lỗi không thay đổi trạng thái
    Khi AI service lỗi, recipe.visibility phải giữ nguyên PRIVATE và response là 503.
    Validates: Requirements 4.5
    """
    test_user, _ = User.objects.get_or_create(
        email='prop7@example.com',
        defaults={'username': 'prop7user', 'full_name': 'Prop7 User'}
    )
    test_user.set_password('testpass123')
    test_user.save()

    recipe = Recipe.objects.create(
        user=test_user,
        title='Bánh mì',
        description='Bánh mì Việt Nam',
        visibility='PRIVATE'
    )
    client = APIClient()
    client.force_authenticate(user=test_user)

    with patch('apps.recipes.views.moderate_text', side_effect=exc_class('error')):
        response = client.post(f'/api/recipes/{recipe.id}/publish/')

    recipe.refresh_from_db()
    assert response.status_code == 503
    assert recipe.visibility == 'PRIVATE'

    # Cleanup
    recipe.delete()
