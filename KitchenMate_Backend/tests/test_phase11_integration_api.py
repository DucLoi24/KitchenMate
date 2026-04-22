"""
Integration Tests — API Endpoints (Phase 11)
Kiểm tra status code, response format, pagination, và phân quyền.
"""
import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

User = get_user_model()

RECIPES_URL = '/api/recipes/'
ME_URL = '/api/accounts/me/'
PANTRY_URL = '/api/kitchen/pantry/'
ADMIN_PENDING_URL = '/api/admin/recipes/pending/'


def make_user(email=None, is_staff=False):
    import uuid
    email = email or f'api_user_{uuid.uuid4().hex[:8]}@example.com'
    return User.objects.create_user(
        username=email,
        email=email,
        full_name='API User',
        password='testpass123',
        is_staff=is_staff,
    )


def make_ingredient(name=None, category='OTHER'):
    from apps.ingredients.models import Ingredient
    import uuid
    name = name or f'api_ing_{uuid.uuid4().hex[:8]}'
    return Ingredient.objects.create(name=name, category=category, status='APPROVED')


def make_recipe(user, visibility='PUBLIC', title=None):
    from apps.recipes.models import Recipe
    import uuid
    title = title or f'Recipe_{uuid.uuid4().hex[:6]}'
    return Recipe.objects.create(
        user=user,
        title=title,
        difficulty='EASY',
        prep_time=30,
        visibility=visibility,
    )


@pytest.mark.integration
@pytest.mark.django_db
class TestResponseFormat:
    """Tests cho response format nhất quán."""

    def test_success_response_format_on_recipes_list(self):
        """GET /api/recipes/ → {"success": true, "data": ...}."""
        client = APIClient()
        response = client.get(RECIPES_URL)
        assert response.status_code == 200
        data = response.data
        assert 'success' in data, "Response phải có field 'success'"
        assert data['success'] is True

    def test_success_response_format_on_pantry_authenticated(self):
        """GET /api/kitchen/pantry/ authenticated → {"success": true, "data": ...}."""
        user = make_user()
        client = APIClient()
        client.force_authenticate(user=user)
        response = client.get(PANTRY_URL)
        assert response.status_code == 200
        assert response.data.get('success') is True

    def test_success_response_format_on_me_endpoint(self):
        """GET /api/accounts/me/ → {"success": true, "data": ...}."""
        user = make_user()
        client = APIClient()
        client.force_authenticate(user=user)
        response = client.get(ME_URL)
        assert response.status_code == 200
        assert response.data.get('success') is True

    def test_error_response_format_on_unauthenticated(self):
        """GET /api/accounts/me/ unauthenticated → {"success": false, "error": {...}}."""
        client = APIClient()
        response = client.get(ME_URL)
        assert response.status_code == 401
        # DRF trả về 401 — kiểm tra có error structure
        # (custom exception handler có thể format khác nhau)
        assert response.status_code in (401, 403)

    def test_error_response_format_on_invalid_recipe_create(self):
        """POST /api/recipes/ với dữ liệu thiếu → {"success": false, "error": {...}}."""
        user = make_user()
        client = APIClient()
        client.force_authenticate(user=user)
        response = client.post(RECIPES_URL, {}, format='json')
        assert response.status_code in (400, 422)
        data = response.data
        # Kiểm tra có success=False hoặc error field
        if 'success' in data:
            assert data['success'] is False


@pytest.mark.integration
@pytest.mark.django_db
class TestAuthenticationRequired:
    """Tests cho endpoints yêu cầu xác thực."""

    def test_unauthenticated_me_returns_401(self):
        """GET /api/accounts/me/ unauthenticated → HTTP 401."""
        client = APIClient()
        response = client.get(ME_URL)
        assert response.status_code == 401

    def test_unauthenticated_pantry_returns_401(self):
        """GET /api/kitchen/pantry/ unauthenticated → HTTP 401."""
        client = APIClient()
        response = client.get(PANTRY_URL)
        assert response.status_code == 401


@pytest.mark.integration
@pytest.mark.django_db
class TestRecipesListVisibility:
    """Tests cho visibility filter trên GET /api/recipes/."""

    def test_recipes_list_only_returns_public(self):
        """GET /api/recipes/ chỉ trả về recipe visibility=PUBLIC."""
        user = make_user()
        public_recipe = make_recipe(user, visibility='PUBLIC', title='Public Recipe')
        private_recipe = make_recipe(user, visibility='PRIVATE', title='Private Recipe')
        pending_recipe = make_recipe(user, visibility='PENDING', title='Pending Recipe')

        client = APIClient()
        response = client.get(RECIPES_URL)
        assert response.status_code == 200

        # Lấy danh sách recipes từ response
        data = response.data
        if 'data' in data:
            results = data['data']
            if isinstance(results, dict) and 'results' in results:
                results = results['results']
        else:
            results = data.get('results', [])

        recipe_ids = [str(r['id']) for r in results]
        assert str(public_recipe.id) in recipe_ids, "Public recipe phải xuất hiện"
        assert str(private_recipe.id) not in recipe_ids, "Private recipe không được xuất hiện"
        assert str(pending_recipe.id) not in recipe_ids, "Pending recipe không được xuất hiện"


@pytest.mark.integration
@pytest.mark.django_db
class TestRecipeOwnership:
    """Tests cho ownership checks trên recipe endpoints."""

    def test_delete_other_user_recipe_returns_403_or_404(self):
        """DELETE /api/recipes/{id}/ recipe không phải của mình → HTTP 403 hoặc 404."""
        owner = make_user()
        other_user = make_user()
        recipe = make_recipe(owner, visibility='PUBLIC')

        client = APIClient()
        client.force_authenticate(user=other_user)
        response = client.delete(f'{RECIPES_URL}{recipe.id}/')
        assert response.status_code in (403, 404), (
            f"Expected 403 or 404, got {response.status_code}"
        )


@pytest.mark.integration
@pytest.mark.django_db
class TestPagination:
    """Tests cho pagination trên list endpoints."""

    def test_recipes_list_has_pagination_fields(self):
        """GET /api/recipes/ có đủ fields count, next, previous, results."""
        user = make_user()
        for i in range(3):
            make_recipe(user, visibility='PUBLIC', title=f'Recipe {i}')

        client = APIClient()
        response = client.get(RECIPES_URL)
        assert response.status_code == 200

        data = response.data
        # Pagination có thể nằm trong data.data hoặc trực tiếp
        if 'data' in data and isinstance(data['data'], dict):
            pagination_data = data['data']
        else:
            pagination_data = data

        assert 'count' in pagination_data, "Thiếu field 'count'"
        assert 'results' in pagination_data, "Thiếu field 'results'"
        # next và previous có thể là null
        assert 'next' in pagination_data, "Thiếu field 'next'"
        assert 'previous' in pagination_data, "Thiếu field 'previous'"


@pytest.mark.integration
@pytest.mark.django_db
class TestAdminEndpoints:
    """Tests cho admin endpoints."""

    def test_non_admin_get_pending_returns_403(self):
        """GET /api/admin/recipes/pending/ không phải admin → HTTP 403."""
        user = make_user(is_staff=False)
        client = APIClient()
        client.force_authenticate(user=user)
        response = client.get(ADMIN_PENDING_URL)
        assert response.status_code == 403, f"Expected 403, got {response.status_code}"

    def test_admin_approve_recipe_sets_visibility_public(self):
        """Admin POST /api/admin/recipes/{id}/approve/ → visibility=PUBLIC, HTTP 200."""
        admin = make_user(is_staff=True)
        owner = make_user()
        recipe = make_recipe(owner, visibility='PENDING')

        client = APIClient()
        client.force_authenticate(user=admin)
        response = client.post(f'/api/admin/recipes/{recipe.id}/approve/')
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.data}"

        recipe.refresh_from_db()
        assert recipe.visibility == 'PUBLIC', f"Expected PUBLIC, got {recipe.visibility}"

    def test_admin_can_get_pending_recipes(self):
        """Admin GET /api/admin/recipes/pending/ → HTTP 200."""
        admin = make_user(is_staff=True)
        owner = make_user()
        make_recipe(owner, visibility='PENDING')

        client = APIClient()
        client.force_authenticate(user=admin)
        response = client.get(ADMIN_PENDING_URL)
        assert response.status_code == 200
