import pytest
from django.contrib.auth import get_user_model
from unittest.mock import patch

from apps.recipes.models import Recipe, RecipeStep
from core.services.ai_moderator import ModerationServiceError
from core.services.recipe_moderation_task import (
    MODERATION_ERROR_REASON,
    NO_CONTENT_REASON,
    run_ai_moderation,
    trigger_async_moderation,
)

User = get_user_model()


@pytest.fixture
def recipe_pending(db):
    user = User.objects.create_user(
        username='moderation-user',
        email='moderation@example.com',
        password='testpass123',
        full_name='Moderation User',
    )
    recipe = Recipe.objects.create(
        user=user,
        title='Canh rau',
        description='Canh rau nha lam',
        visibility='PENDING',
        ai_moderation_status='PENDING',
    )
    RecipeStep.objects.create(recipe=recipe, step_number=1, instruction='Rua rau')
    return recipe


@pytest.mark.django_db
def test_run_ai_moderation_rejects_with_rejection_reason(recipe_pending):
    with patch('core.services.recipe_moderation_task.moderate_text', return_value='NO'):
        run_ai_moderation(recipe_pending.id)

    recipe_pending.refresh_from_db()
    assert recipe_pending.visibility == 'PRIVATE'
    assert recipe_pending.ai_moderation_status == 'REJECTED'
    assert recipe_pending.ai_moderation_attempted is True
    assert recipe_pending.rejection_reason == NO_CONTENT_REASON


@pytest.mark.django_db
def test_run_ai_moderation_service_error_keeps_pending_with_rejection_reason(recipe_pending):
    with (
        patch(
            'core.services.recipe_moderation_task.moderate_text',
            side_effect=ModerationServiceError('Ollama down'),
        ),
        patch('core.services.recipe_moderation_task.threading.Thread') as thread_class,
    ):
        run_ai_moderation(recipe_pending.id)

    recipe_pending.refresh_from_db()
    assert recipe_pending.visibility == 'PENDING'
    assert recipe_pending.ai_moderation_status == 'PENDING'
    assert recipe_pending.ai_moderation_attempted is True
    assert recipe_pending.rejection_reason == MODERATION_ERROR_REASON
    thread_class.assert_not_called()


@pytest.mark.django_db
def test_run_ai_moderation_skips_already_attempted_pending_recipe(recipe_pending):
    recipe_pending.ai_moderation_attempted = True
    recipe_pending.save(update_fields=['ai_moderation_attempted'])

    with patch('core.services.recipe_moderation_task.moderate_text') as moderate_text:
        run_ai_moderation(recipe_pending.id)

    moderate_text.assert_not_called()


@pytest.mark.django_db
def test_trigger_async_moderation_resets_attempt_marker_and_reason(recipe_pending):
    recipe_pending.visibility = 'PRIVATE'
    recipe_pending.ai_moderation_status = 'REJECTED'
    recipe_pending.ai_moderation_attempted = True
    recipe_pending.rejection_reason = 'Ly do cu'
    recipe_pending.save(update_fields=[
        'visibility',
        'ai_moderation_status',
        'ai_moderation_attempted',
        'rejection_reason',
    ])

    with patch('core.services.recipe_moderation_task.threading.Thread') as thread_class:
        trigger_async_moderation(recipe_pending.id)

    recipe_pending.refresh_from_db()
    assert recipe_pending.visibility == 'PENDING'
    assert recipe_pending.ai_moderation_status == 'PENDING'
    assert recipe_pending.ai_moderation_attempted is False
    assert recipe_pending.rejection_reason is None
    thread_class.assert_called_once()
    thread_class.return_value.start.assert_called_once()
