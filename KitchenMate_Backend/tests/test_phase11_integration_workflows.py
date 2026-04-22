"""
Integration Tests — Complex Workflows (Phase 11)
Kiểm tra các luồng end-to-end phức tạp với mock AI.
"""
import pytest
from unittest.mock import patch
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

User = get_user_model()

RECIPES_URL = '/api/recipes/'
SHOPPING_LIST_URL = '/api/kitchen/shopping-list/'
PANTRY_URL = '/api/kitchen/pantry/'
RECOMMENDATIONS_URL = '/api/recommendations/suggest/'
ADMIN_APPROVE_URL = '/api/admin/recipes/{id}/approve/'


def make_user(email=None, is_staff=False):
    import uuid
    email = email or f'wf_user_{uuid.uuid4().hex[:8]}@example.com'
    return User.objects.create_user(
        username=email,
        email=email,
        full_name='Workflow User',
        password='testpass123',
        is_staff=is_staff,
    )


def make_ingredient(name=None, category='OTHER'):
    from apps.ingredients.models import Ingredient
    import uuid
    name = name or f'wf_ing_{uuid.uuid4().hex[:8]}'
    return Ingredient.objects.create(name=name, category=category, status='APPROVED')


def make_recipe(user, visibility='PRIVATE', title=None):
    from apps.recipes.models import Recipe
    import uuid
    title = title or f'WF Recipe {uuid.uuid4().hex[:6]}'
    return Recipe.objects.create(
        user=user,
        title=title,
        description='Mô tả workflow test',
        difficulty='EASY',
        prep_time=30,
        visibility=visibility,
    )


@pytest.mark.integration
@pytest.mark.django_db
class TestRecipeLifecycleAIYes:
    """Workflow 11.2: Recipe Lifecycle — AI=YES → PUBLIC."""

    def test_publish_with_ai_yes_sets_visibility_public(self):
        """POST /api/recipes/ → tạo PRIVATE → publish (AI=YES) → visibility=PUBLIC."""
        user = make_user()
        client = APIClient()
        client.force_authenticate(user=user)

        # Tạo recipe PRIVATE
        create_resp = client.post(RECIPES_URL, {
            'title': 'Phở bò đặc biệt',
            'description': 'Công thức phở bò truyền thống',
            'difficulty': 'MEDIUM',
            'prep_time': 60,
        }, format='json')
        assert create_resp.status_code == 201, f"Create failed: {create_resp.data}"
        recipe_id = create_resp.data['data']['id']

        # Publish với mock AI=YES
        with patch('apps.recipes.views.moderate_text', return_value='YES'):
            publish_resp = client.post(f'{RECIPES_URL}{recipe_id}/publish/')
        assert publish_resp.status_code == 200, f"Publish failed: {publish_resp.data}"

        # Xác nhận visibility=PUBLIC
        from apps.recipes.models import Recipe
        recipe = Recipe.objects.get(pk=recipe_id)
        assert recipe.visibility == 'PUBLIC', f"Expected PUBLIC, got {recipe.visibility}"


@pytest.mark.integration
@pytest.mark.django_db
class TestRecipeLifecycleAISuspect:
    """Workflow 11.3: Recipe Lifecycle — AI=SUSPECT → PENDING → Admin approve → PUBLIC."""

    def test_publish_with_ai_suspect_sets_pending_then_admin_approves(self):
        """AI=SUSPECT → visibility=PENDING → Admin approve → visibility=PUBLIC."""
        user = make_user()
        admin = make_user(is_staff=True)
        client = APIClient()
        client.force_authenticate(user=user)

        # Tạo recipe PRIVATE
        create_resp = client.post(RECIPES_URL, {
            'title': 'Món ăn mơ hồ',
            'description': 'Mô tả mơ hồ',
            'difficulty': 'EASY',
            'prep_time': 30,
        }, format='json')
        assert create_resp.status_code == 201
        recipe_id = create_resp.data['data']['id']

        # Publish với mock AI=SUSPECT
        with patch('apps.recipes.views.moderate_text', return_value='SUSPECT'):
            publish_resp = client.post(f'{RECIPES_URL}{recipe_id}/publish/')
        assert publish_resp.status_code == 200, f"Publish failed: {publish_resp.data}"

        from apps.recipes.models import Recipe
        recipe = Recipe.objects.get(pk=recipe_id)
        assert recipe.visibility == 'PENDING', f"Expected PENDING, got {recipe.visibility}"

        # Admin approve
        admin_client = APIClient()
        admin_client.force_authenticate(user=admin)
        approve_resp = admin_client.post(f'/api/admin/recipes/{recipe_id}/approve/')
        assert approve_resp.status_code == 200, f"Approve failed: {approve_resp.data}"

        recipe.refresh_from_db()
        assert recipe.visibility == 'PUBLIC', f"Expected PUBLIC after approve, got {recipe.visibility}"


@pytest.mark.integration
@pytest.mark.django_db
class TestRecipeLifecycleAINo:
    """Workflow 11.4: Recipe Lifecycle — AI=NO → PRIVATE + HTTP 400."""

    def test_publish_with_ai_no_returns_400_and_stays_private(self):
        """AI=NO → visibility=PRIVATE, HTTP 400."""
        user = make_user()
        client = APIClient()
        client.force_authenticate(user=user)

        create_resp = client.post(RECIPES_URL, {
            'title': 'Nội dung xấu',
            'description': 'Mô tả không phù hợp',
            'difficulty': 'EASY',
            'prep_time': 30,
        }, format='json')
        assert create_resp.status_code == 201
        recipe_id = create_resp.data['data']['id']

        with patch('apps.recipes.views.moderate_text', return_value='NO'):
            publish_resp = client.post(f'{RECIPES_URL}{recipe_id}/publish/')
        assert publish_resp.status_code == 400, f"Expected 400, got {publish_resp.status_code}"

        from apps.recipes.models import Recipe
        recipe = Recipe.objects.get(pk=recipe_id)
        assert recipe.visibility == 'PRIVATE', f"Expected PRIVATE, got {recipe.visibility}"


@pytest.mark.integration
@pytest.mark.django_db
class TestCheckToPantryWorkflow:
    """Workflow 11.5: Check-to-Pantry."""

    def test_mark_purchased_updates_pantry(self):
        """POST shopping-list → mark-purchased → is_purchased=True + Pantry cập nhật."""
        user = make_user()
        ingredient = make_ingredient(name='Thịt bò workflow', category='PROTEIN')
        client = APIClient()
        client.force_authenticate(user=user)

        # Thêm item vào shopping list
        create_resp = client.post(SHOPPING_LIST_URL, {
            'ingredient': ingredient.id,
            'quantity': 500,
            'unit': 'gram',
        }, format='json')
        assert create_resp.status_code == 201, f"Create shopping list failed: {create_resp.data}"
        item_id = create_resp.data['data']['id']

        # Mark purchased
        mark_resp = client.post(f'{SHOPPING_LIST_URL}{item_id}/mark-purchased/')
        assert mark_resp.status_code == 200, f"Mark purchased failed: {mark_resp.data}"

        # Xác nhận is_purchased=True
        from apps.kitchen.models import ShoppingList, Pantry
        item = ShoppingList.objects.get(pk=item_id)
        assert item.is_purchased is True

        # Xác nhận Pantry được cập nhật
        pantry = Pantry.objects.get(user=user, ingredient=ingredient)
        assert pantry.quantity == 500, f"Expected 500, got {pantry.quantity}"


@pytest.mark.integration
@pytest.mark.django_db
class TestRecommendationWorkflow:
    """Workflow 11.6: Recommendation."""

    def test_recommendation_returns_recipe_with_matching_ingredients(self):
        """Thêm ingredient vào Pantry → POST suggest COOK_NOW → recipe xuất hiện với missing_count=0."""
        user = make_user()
        ingredient = make_ingredient(name='Gà workflow', category='PROTEIN')
        client = APIClient()
        client.force_authenticate(user=user)

        # Tạo recipe PUBLIC với ingredient đó
        from apps.recipes.models import Recipe, RecipeIngredient
        recipe = Recipe.objects.create(
            user=user,
            title='Gà nướng workflow',
            difficulty='EASY',
            prep_time=30,
            visibility='PUBLIC',
        )
        RecipeIngredient.objects.create(recipe=recipe, ingredient=ingredient, quantity=300, unit='gram')

        # Thêm ingredient vào Pantry
        from apps.kitchen.models import Pantry
        Pantry.objects.create(user=user, ingredient=ingredient, quantity=500, unit='gram')

        # Gọi recommendations
        resp = client.post(RECOMMENDATIONS_URL, {'mode': 'COOK_NOW'}, format='json')
        assert resp.status_code == 200, f"Recommendations failed: {resp.data}"

        results = resp.data['data']
        recipe_ids = [str(item['recipe']['id']) for item in results]
        assert str(recipe.id) in recipe_ids, "Recipe phải xuất hiện trong kết quả COOK_NOW"

        # Xác nhận missing_count == 0
        for item in results:
            if str(item['recipe']['id']) == str(recipe.id):
                assert len(item['missing_ingredients']) == 0, "COOK_NOW: missing_count phải là 0"


@pytest.mark.integration
@pytest.mark.django_db
class TestSocialReviewStatsWorkflow:
    """Workflow 11.7: Social — Review & Stats."""

    def test_review_and_stats_workflow(self):
        """Tạo recipe PUBLIC → tạo review → GET stats → review_count=1, average_rating=4.0."""
        owner = make_user()
        reviewer = make_user()

        # Tạo recipe PUBLIC
        from apps.recipes.models import Recipe
        recipe = Recipe.objects.create(
            user=owner,
            title='Recipe for review',
            difficulty='EASY',
            prep_time=30,
            visibility='PUBLIC',
        )

        # Tạo review
        client = APIClient()
        client.force_authenticate(user=reviewer)
        review_resp = client.post(
            f'/api/social/recipes/{recipe.id}/reviews/',
            {'rating': 4, 'comment': 'Ngon lắm!', 'recipe': str(recipe.id)},
            format='json'
        )
        assert review_resp.status_code == 201, f"Review failed: {review_resp.data}"

        # GET stats
        stats_resp = client.get(f'/api/recipes/{recipe.id}/stats/')
        assert stats_resp.status_code == 200, f"Stats failed: {stats_resp.data}"

        stats_data = stats_resp.data
        if 'data' in stats_data:
            stats = stats_data['data']
        else:
            stats = stats_data

        assert stats.get('review_count') == 1, f"Expected review_count=1, got {stats.get('review_count')}"
        assert stats.get('average_rating') == 4.0, f"Expected average_rating=4.0, got {stats.get('average_rating')}"


@pytest.mark.integration
@pytest.mark.django_db
class TestAIUnavailableGracefulDegradation:
    """Workflow 11.8: AI unavailable → Graceful degradation."""

    def test_publish_when_ai_unavailable_returns_503_and_stays_private(self):
        """Mock AI raise ModerationServiceError → HTTP 503, recipe giữ nguyên PRIVATE."""
        from core.services.ai_moderator import ModerationServiceError
        user = make_user()
        client = APIClient()
        client.force_authenticate(user=user)

        create_resp = client.post(RECIPES_URL, {
            'title': 'Recipe khi AI lỗi',
            'description': 'Test graceful degradation',
            'difficulty': 'EASY',
            'prep_time': 30,
        }, format='json')
        assert create_resp.status_code == 201
        recipe_id = create_resp.data['data']['id']

        with patch('apps.recipes.views.moderate_text', side_effect=ModerationServiceError('AI down')):
            publish_resp = client.post(f'{RECIPES_URL}{recipe_id}/publish/')
        assert publish_resp.status_code == 503, f"Expected 503, got {publish_resp.status_code}: {publish_resp.data}"

        from apps.recipes.models import Recipe
        recipe = Recipe.objects.get(pk=recipe_id)
        assert recipe.visibility == 'PRIVATE', f"Expected PRIVATE, got {recipe.visibility}"
